// @ts-check
const path = require("path");
const { test, expect } = require("@playwright/test");
const {
  connect,
  resetDb,
  seedFamilyWithReader,
  mongoose,
  ReadingSession,
} = require("./helpers/readingSeed.cjs");

const Story = require(path.join(__dirname, "../../backend/models/storyLibrary/Story"));

test.describe.configure({ mode: "serial" });

test.describe("Reading progress API", () => {
  test.beforeAll(async () => {
    test.setTimeout(45_000);
    try {
      await connect();
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      test.skip(
        true,
        `MongoDB not reachable (start Mongo, or set MONGO_URI in backend/.env / env to match playwright.config): ${msg}`,
      );
    }
  });

  test.afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  test.beforeEach(async () => {
    await resetDb();
  });

  test("rejects session update without auth", async ({ playwright }) => {
    const base = (
      test.info().project.use?.baseURL || "http://127.0.0.1:5000"
    ).replace(/\/$/, "");
    const url = `${base}/api/sessions/update`;
    const isolated = await playwright.request.newContext();
    try {
      const res = await isolated.post(url, {
        data: {
          sessionId: new mongoose.Types.ObjectId().toString(),
          pagesRead: 1,
        },
      });
      const body = await res.text();
      expect(
        res.status(),
        `expected 401 without Authorization; got ${res.status()} for ${url} body=${body}`,
      ).toBe(401);
    } finally {
      await isolated.dispose();
    }
  });

  test("starts session, updates progress, weekly time, activity summary", async ({
    request,
  }) => {
    const { parent, child, story, parentToken, childToken } =
      await seedFamilyWithReader();

    const start = await request.post("/api/sessions/start", {
      headers: { Authorization: `Bearer ${parentToken}` },
      data: {
        childId: child._id.toString(),
        storyId: story._id.toString(),
      },
    });
    const startRaw = await start.text();
    expect(
      start.status(),
      `POST /api/sessions/start expected 201, got ${start.status()}: ${startRaw}`,
    ).toBe(201);
    const startBody = JSON.parse(startRaw);
    const sessionId = startBody.data._id;

    const upd = await request.post("/api/sessions/update", {
      headers: { Authorization: `Bearer ${childToken}` },
      data: { sessionId, pagesRead: 10, timeSpent: 25 },
    });
    expect(upd.status()).toBe(200);
    const updBody = await upd.json();
    expect(updBody.data.progress).toBe(100);
    expect(updBody.data.session.completed).toBe(true);

    const weekly = await request.get(`/api/sessions/weekly/${child._id}`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    expect(weekly.status()).toBe(200);
    const weeklyBody = await weekly.json();
    expect(weeklyBody.data.totalTimeSpent).toBe(25);
    expect(weeklyBody.data.unit).toBe("minutes");

    const activity = await request.get("/api/sessions/me/activity-summary?days=7", {
      headers: { Authorization: `Bearer ${childToken}` },
    });
    expect(activity.status()).toBe(200);
    const actBody = await activity.json();
    expect(actBody.data.totalPagesLogged).toBe(10);
    expect(actBody.data.totalMinutesLogged).toBe(25);
    expect(Array.isArray(actBody.data.byDay)).toBe(true);
    const sumMinutes = actBody.data.byDay.reduce((acc, d) => acc + (d.minutes || 0), 0);
    const sumPages = actBody.data.byDay.reduce((acc, d) => acc + (d.pages || 0), 0);
    expect(sumMinutes).toBe(25);
    expect(sumPages).toBe(10);

    const familyAct = await request.get("/api/sessions/activity-summary/family?days=7", {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    expect(familyAct.status()).toBe(200);
    const famBody = await familyAct.json();
    expect(Array.isArray(famBody.data.byDay)).toBe(true);
    expect(famBody.data.totalPagesLogged).toBe(10);
    expect(famBody.data.totalMinutesLogged).toBe(25);
    const famSumMinutes = famBody.data.byDay.reduce((acc, d) => acc + (d.minutes || 0), 0);
    const famSumPages = famBody.data.byDay.reduce((acc, d) => acc + (d.pages || 0), 0);
    expect(famSumMinutes).toBe(25);
    expect(famSumPages).toBe(10);
  });

  test("denies weekly stats for another familys child", async ({ request }) => {
    const a = await seedFamilyWithReader();
    const b = await seedFamilyWithReader();
    const intruderToken = a.parentToken;

    const res = await request.get(`/api/sessions/weekly/${b.child._id}`, {
      headers: { Authorization: `Bearer ${intruderToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test("reading streak from session start dates", async ({ request }) => {
    const { child, story, parentToken } = await seedFamilyWithReader();

    const localDay = (y, monthIndex0, dayOfMonth) =>
      new Date(y, monthIndex0, dayOfMonth, 14, 0, 0, 0);

    await ReadingSession.create({
      childId: child._id,
      bookId: story._id,
      totalPages: 10,
      pagesRead: 2,
      timeSpent: 5,
      completed: false,
      startedAt: localDay(2026, 3, 8),
      lastUpdatedAt: localDay(2026, 3, 8),
    });
    await ReadingSession.create({
      childId: child._id,
      bookId: story._id,
      totalPages: 10,
      pagesRead: 3,
      timeSpent: 4,
      completed: false,
      startedAt: localDay(2026, 3, 9),
      lastUpdatedAt: localDay(2026, 3, 9),
    });
    await ReadingSession.create({
      childId: child._id,
      bookId: story._id,
      totalPages: 10,
      pagesRead: 1,
      timeSpent: 1,
      completed: false,
      startedAt: localDay(2026, 3, 10),
      lastUpdatedAt: localDay(2026, 3, 10),
    });

    const streak = await request.get(`/api/sessions/streak/${child._id}`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    expect(streak.status()).toBe(200);
    const body = await streak.json();
    expect(body.data.currentStreak).toBe(3);
  });

  test("my-sessions returns computed progress", async ({ request }) => {
    const { parent, child, story, parentToken, childToken } =
      await seedFamilyWithReader();

    await request.post("/api/sessions/start", {
      headers: { Authorization: `Bearer ${parentToken}` },
      data: { childId: child._id.toString(), storyId: story._id.toString() },
    });

    const session = await ReadingSession.findOne({ childId: child._id });

    await request.post("/api/sessions/update", {
      headers: { Authorization: `Bearer ${childToken}` },
      data: {
        sessionId: session._id.toString(),
        pagesRead: 4,
        timeSpent: 2,
      },
    });

    const list = await request.get("/api/sessions/my-sessions", {
      headers: { Authorization: `Bearer ${childToken}` },
    });
    expect(list.status()).toBe(200);
    const body = await list.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].progress).toBe(40);
  });

  test("child start-me rejected without assignment", async ({ request }) => {
    const { parent, childToken } = await seedFamilyWithReader();
    const extra = await Story.create({
      title: "Unassigned story",
      author: "QA",
      ageGroup: "middle-grade",
      genres: ["adventure"],
      createdBy: parent._id,
      pageCount: 12,
    });
    const res = await request.post("/api/sessions/start-me", {
      headers: { Authorization: `Bearer ${childToken}` },
      data: { storyId: extra._id.toString() },
    });
    expect(res.status()).toBe(403);
  });

  test("child start-me allowed when story is assigned", async ({ request }) => {
    const { story, childToken } = await seedFamilyWithReader();
    const res = await request.post("/api/sessions/start-me", {
      headers: { Authorization: `Bearer ${childToken}` },
      data: { storyId: story._id.toString() },
    });
    expect([200, 201]).toContain(res.status());
  });
});
