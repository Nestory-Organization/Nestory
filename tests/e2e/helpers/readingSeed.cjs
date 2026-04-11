const path = require("path");

const backendRoot = path.join(__dirname, "../../../backend");

function reqBackend(rel) {
  return require(path.join(backendRoot, rel));
}

const mongoose = reqBackend("node_modules/mongoose");
const jwt = reqBackend("node_modules/jsonwebtoken");

try {
  reqBackend("node_modules/dotenv").config({
    path: path.join(backendRoot, ".env"),
    override: true,
  });
} catch {
  /* optional */
}

const User = reqBackend("models/User");
const Family = reqBackend("models/Family");
const Child = reqBackend("models/Child");
const Story = reqBackend("models/storyLibrary/Story");
const ReadingSession = reqBackend("models/ReadingSession");
const Assignment = reqBackend("models/Assignment");

async function connect() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is required for API Playwright tests");
  }
  if (mongoose.connection.readyState === 1) return;

  // Mongoose defaults to serverSelectionTimeoutMS: 30000, which matches Playwright's
  // beforeAll hook timeout — the hook then fails with an unhelpful "hook timeout".
  // Fail fast so tests skip with a clear Mongo message instead.
  // Must match backend/config/db.js — otherwise seeds land in `test` (or default) while the API uses `nestory` → 401 "User not found".
  const opts = {
    dbName: "nestory",
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  };

  try {
    await mongoose.connect(uri, opts);
  } catch (err) {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }
    throw err;
  }
}

async function resetDb() {
  const cols = mongoose.connection.collections;
  for (const key of Object.keys(cols)) {
    await cols[key].deleteMany({});
  }
}

async function seedFamilyWithReader() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required for API Playwright tests");
  }

  const parent = await User.create({
    name: "Parent One",
    email: `parent1-${Date.now()}-${Math.random().toString(36).slice(2)}@nestory.com`,
    password: "secret12",
    role: "user",
  });

  const family = await Family.create({
    familyName: "Readers",
    parent: parent._id,
    children: [],
  });

  const child = await Child.create({
    name: "Alex",
    age: 9,
    family: family._id,
    parent: parent._id,
  });

  family.children.push(child._id);
  await family.save();

  const story = await Story.create({
    title: "Test Chapter Book",
    author: "QA Bot",
    ageGroup: "middle-grade",
    genres: ["adventure"],
    createdBy: parent._id,
    pageCount: 10,
  });

  await Assignment.create({
    child: child._id,
    story: story._id,
    assignedBy: parent._id,
    family: family._id,
    status: "in_progress",
  });

  const childUser = await User.create({
    name: "Alex",
    email: `alex-${Date.now()}-${Math.random().toString(36).slice(2)}@nestory.com`,
    password: "secret12",
    role: "child",
    childProfile: child._id,
  });

  const parentToken = jwt.sign({ id: parent._id.toString() }, secret);
  const childToken = jwt.sign({ id: childUser._id.toString() }, secret);

  return {
    parent,
    child,
    story,
    childUser,
    family,
    parentToken,
    childToken,
  };
}

module.exports = {
  connect,
  resetDb,
  seedFamilyWithReader,
  mongoose,
  ReadingSession,
};
