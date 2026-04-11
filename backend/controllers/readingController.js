const mongoose = require("mongoose");
const ReadingSession = require("../models/ReadingSession");
const ReadingActivity = require("../models/ReadingActivity");
const Story = require("../models/storyLibrary/Story");
const Child = require("../models/Child");
const Assignment = require("../models/Assignment");
const {
  getDateKey,
  readingProgressPercentRounded,
  currentStreakFromSortedDayKeys,
  MS_PER_DAY,
} = require("../utils/readingAnalytics");

const ensureOwnedChild = async (childId, userId) => {
  const child = await Child.findById(childId).select("parent isActive");
  if (!child) {
    return { ok: false, status: 404, message: "Child not found" };
  }

  if (!child.isActive) {
    return { ok: false, status: 400, message: "Child profile is inactive" };
  }

  if (child.parent.toString() !== userId.toString()) {
    return {
      ok: false,
      status: 403,
      message: "Not authorized to access this child",
    };
  }

  return { ok: true, child };
};

/** Child may read only stories with an active assignment (assigned or in_progress). */
const childHasActiveAssignmentToStory = async (childId, storyId) => {
  if (!childId || !storyId || !mongoose.Types.ObjectId.isValid(storyId)) {
    return false;
  }
  const doc = await Assignment.findOne({
    child: new mongoose.Types.ObjectId(childId),
    story: new mongoose.Types.ObjectId(storyId),
    status: { $in: ["assigned", "in_progress"] },
  })
    .select("_id")
    .lean();
  return !!doc;
};

/** Full UTC day list for charts from a map of YYYY-MM-DD → aggregates. */
const buildReadingActivityByDay = (start, end, dayMap) => {
  const byDay = [];
  let t = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
  );
  const endDayUtc = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  );
  while (t <= endDayUtc) {
    const key = new Date(t).toISOString().slice(0, 10);
    const d = dayMap[key] || { pages: 0, minutes: 0, saves: 0 };
    byDay.push({
      date: key,
      pages: d.pages,
      minutes: d.minutes,
      progressSaveCount: d.saves,
    });
    t += MS_PER_DAY;
  }
  return byDay;
};

/** Sessions use Child document id; child users have it on user.childProfile */
const resolveReadingChildId = (user) => {
  if (user.role === "child") {
    return user.childProfile || null;
  }
  return user._id;
};

// @desc    Start or resume a reading session (logged-in child; uses linked Child profile)
// @route   POST /api/sessions/start-me
// @access  Private (Child only)
exports.startMySession = async (req, res) => {
  try {
    const childId = resolveReadingChildId(req.user);
    if (!childId) {
      return res.status(400).json({
        success: false,
        message: "Child profile is not linked to this account",
      });
    }

    const child = await Child.findById(childId).select("isActive");
    if (!child || !child.isActive) {
      return res.status(400).json({
        success: false,
        message: "Child profile is missing or inactive",
      });
    }

    const { storyId, bookId, totalPages } = req.body;
    const effectiveStoryId = storyId || bookId;

    if (!effectiveStoryId) {
      return res.status(400).json({
        success: false,
        message: "storyId or bookId is required",
      });
    }

    let effectiveTotalPages = null;
    const story = await Story.findById(effectiveStoryId).select("pageCount");

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    if (story && typeof story.pageCount === "number" && story.pageCount > 0) {
      effectiveTotalPages = story.pageCount;
    } else if (totalPages) {
      effectiveTotalPages = Number(totalPages);
    }

    if (!effectiveTotalPages || Number.isNaN(effectiveTotalPages)) {
      return res.status(400).json({
        success: false,
        message:
          "Total pages could not be determined. Provide totalPages in the request or set pageCount on the Story.",
      });
    }

    const assigned = await childHasActiveAssignmentToStory(
      childId,
      effectiveStoryId,
    );
    if (!assigned) {
      return res.status(403).json({
        success: false,
        message:
          "This book is not on your assignments. Ask a parent to assign it before reading.",
      });
    }

    let existing = await ReadingSession.findOne({
      childId,
      bookId: effectiveStoryId,
      completed: false,
    }).sort({ lastUpdatedAt: -1 });

    if (!existing) {
      existing = await ReadingSession.findOne({
        childId,
        bookId: effectiveStoryId,
      }).sort({ lastUpdatedAt: -1 });
    }

    if (existing) {
      return res.status(200).json({
        success: true,
        message: existing.completed ? "Reading session loaded" : "Reading session resumed",
        data: existing,
      });
    }

    const session = await ReadingSession.create({
      childId: new mongoose.Types.ObjectId(childId),
      bookId: new mongoose.Types.ObjectId(effectiveStoryId),
      totalPages: effectiveTotalPages,
      pagesRead: 0,
      timeSpent: 0,
      completed: false,
    });

    return res.status(201).json({
      success: true,
      message: "Reading session started",
      data: session,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Start a new reading session
// @route   POST /api/sessions/start
// @access  Private (parent: childId + story; child: story only)
exports.startSession = async (req, res) => {
  try {
    const { childId, storyId, bookId, totalPages } = req.body;
    const effectiveStoryId = storyId || bookId;

    if (!effectiveStoryId) {
      return res.status(400).json({
        success: false,
        message: "storyId or bookId is required",
      });
    }

    let effectiveChildId;

    if (req.user.role === "child") {
      if (!req.user.childProfile) {
        return res.status(400).json({
          success: false,
          message: "Your account is not linked to a child profile",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(req.user.childProfile)) {
        return res.status(400).json({
          success: false,
          message: "Invalid child profile on account",
        });
      }
      const childRow = await Child.findById(req.user.childProfile).select(
        "isActive",
      );
      if (!childRow) {
        return res.status(404).json({
          success: false,
          message: "Child profile not found",
        });
      }
      if (!childRow.isActive) {
        return res.status(400).json({
          success: false,
          message: "Child profile is inactive",
        });
      }
      effectiveChildId = req.user.childProfile;
    } else {
      if (!childId || !mongoose.Types.ObjectId.isValid(childId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid or missing childId",
        });
      }
      const childAccess = await ensureOwnedChild(childId, req.user._id);
      if (!childAccess.ok) {
        return res.status(childAccess.status).json({
          success: false,
          message: childAccess.message,
        });
      }
      effectiveChildId = childId;
    }

    // Prefer total pages from the Story document; fall back to body.totalPages for backward compatibility
    let effectiveTotalPages = null;

    const story = await Story.findById(effectiveStoryId).select("pageCount");

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    if (story && typeof story.pageCount === "number" && story.pageCount > 0) {
      effectiveTotalPages = story.pageCount;
    } else if (totalPages) {
      effectiveTotalPages = Number(totalPages);
    }

    if (!effectiveTotalPages || Number.isNaN(effectiveTotalPages)) {
      return res.status(400).json({
        success: false,
        message:
          "Total pages could not be determined. Provide totalPages in the request or set pageCount on the Story.",
      });
    }

    const assigned = await childHasActiveAssignmentToStory(
      effectiveChildId,
      effectiveStoryId,
    );
    if (!assigned) {
      return res.status(403).json({
        success: false,
        message:
          "This story must be assigned to the child before starting a reading session.",
      });
    }

    const session = await ReadingSession.create({
      childId: new mongoose.Types.ObjectId(effectiveChildId),
      bookId: new mongoose.Types.ObjectId(effectiveStoryId),
      totalPages: effectiveTotalPages,
      pagesRead: 0,
      timeSpent: 0,
      completed: false,
    });

    return res.status(201).json({
      success: true,
      message: "Reading session started",
      data: session,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get weekly reading time (last 7 days) for a child
// @route   GET /api/sessions/weekly/:childId
// @access  Private (Parent only)
exports.getWeeklyReadingTime = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: "childId is required",
      });
    }

    const childAccess = await ensureOwnedChild(childId, req.user._id);
    if (!childAccess.ok) {
      return res.status(childAccess.status).json({
        success: false,
        message: childAccess.message,
      });
    }

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const sessions = await ReadingSession.find({
      childId: new mongoose.Types.ObjectId(childId),
      startedAt: { $gte: sevenDaysAgo, $lte: now },
    });

    const totalTimeSpent = sessions.reduce(
      (sum, s) => sum + (s.timeSpent || 0),
      0,
    );

    return res.status(200).json({
      success: true,
      message: "Weekly reading time fetched",
      data: {
        totalTimeSpent, // minutes
        totalTime: totalTimeSpent,
        unit: "minutes",
        sessionCount: sessions.length,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get current reading streak (consecutive days with any reading)
// @route   GET /api/sessions/streak/:childId
// @access  Private (Parent only)
exports.getReadingStreak = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: "childId is required",
      });
    }

    const childAccess = await ensureOwnedChild(childId, req.user._id);
    if (!childAccess.ok) {
      return res.status(childAccess.status).json({
        success: false,
        message: childAccess.message,
      });
    }

    const sessions = await ReadingSession.find({
      childId: new mongoose.Types.ObjectId(childId),
    }).sort({ startedAt: 1 });

    if (!sessions.length) {
      return res.status(200).json({
        success: true,
        message: "Reading streak fetched",
        data: { currentStreak: 0, streak: 0, longestStreak: 0 },
      });
    }

    const daySet = new Set();
    sessions.forEach((s) => daySet.add(getDateKey(s.startedAt)));
    const days = Array.from(daySet).sort((a, b) => a - b);

    const currentStreak = currentStreakFromSortedDayKeys(days);

    return res.status(200).json({
      success: true,
      message: "Reading streak fetched",
      data: {
        currentStreak,
        streak: currentStreak,
        longestStreak: currentStreak,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update reading session (pages + time), return progress, mark completion
// @route   POST /api/sessions/update
// @access  Private (parent: own children; child: own sessions)
exports.updateSession = async (req, res) => {
  try {
    const { sessionId, pagesRead, timeSpent } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required",
      });
    }

    const session = await ReadingSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (req.user.role === "child") {
      if (
        !req.user.childProfile ||
        session.childId.toString() !== req.user.childProfile.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Not allowed to update this session",
        });
      }
      const storyIdForPolicy = session.bookId?.toString?.() ?? String(session.bookId);
      const allowed = await childHasActiveAssignmentToStory(
        req.user.childProfile,
        storyIdForPolicy,
      );
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            "This book is not on your assignments. You cannot update this session.",
        });
      }
    } else {
      const childAccess = await ensureOwnedChild(session.childId, req.user._id);
      if (!childAccess.ok) {
        return res.status(childAccess.status).json({
          success: false,
          message: childAccess.message,
        });
      }
    }

    const pagesToAdd = Number(pagesRead) || 0;
    const timeToAdd = Number(timeSpent) || 0;

    session.pagesRead += pagesToAdd;
    session.timeSpent += timeToAdd;

    if (session.pagesRead >= session.totalPages) {
      session.pagesRead = session.totalPages;
      session.completed = true;
    }

    session.lastUpdatedAt = new Date();
    await session.save();

    if (pagesToAdd > 0 || timeToAdd > 0) {
      try {
        await ReadingActivity.create({
          childId: session.childId,
          sessionId: session._id,
          bookId: session.bookId,
          pagesAdded: pagesToAdd,
          minutesAdded: timeToAdd,
        });
      } catch (logErr) {
        console.error("ReadingActivity log failed", logErr);
      }
    }

    const progress = readingProgressPercentRounded(
      session.pagesRead,
      session.totalPages,
    );

    return res.status(200).json({
      success: true,
      message: "Session updated",
      data: {
        session,
        progress,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Pages/minutes logged in rolling window (from progress saves)
// @route   GET /api/sessions/me/activity-summary
// @access  Private (child)
exports.getMyActivitySummary = async (req, res) => {
  try {
    if (req.user.role !== "child" || !req.user.childProfile) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - days);
    start.setHours(0, 0, 0, 0);

    const childId = req.user.childProfile;
    const rows = await ReadingActivity.aggregate([
      {
        $match: {
          childId: new mongoose.Types.ObjectId(childId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          pages: { $sum: "$pagesAdded" },
          minutes: { $sum: "$minutesAdded" },
          entries: { $sum: 1 },
        },
      },
    ]);

    const row = rows[0] || { pages: 0, minutes: 0, entries: 0 };

    const dailyRows = await ReadingActivity.aggregate([
      {
        $match: {
          childId: new mongoose.Types.ObjectId(childId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          pages: { $sum: "$pagesAdded" },
          minutes: { $sum: "$minutesAdded" },
          saves: { $sum: 1 },
        },
      },
    ]);

    const dayMap = Object.fromEntries(
      dailyRows.map((r) => [
        r._id,
        { pages: r.pages, minutes: r.minutes, saves: r.saves },
      ]),
    );

    const byDay = buildReadingActivityByDay(start, end, dayMap);

    return res.status(200).json({
      success: true,
      message: "Activity summary",
      data: {
        days,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        totalPagesLogged: row.pages,
        totalMinutesLogged: row.minutes,
        progressSaveCount: row.entries,
        byDay,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Family-wide activity summary (all parent's children)
// @route   GET /api/sessions/activity-summary/family
// @access  Private (parent)
exports.getFamilyActivitySummary = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - days);
    start.setHours(0, 0, 0, 0);

    const children = await Child.find({ parent: req.user._id, isActive: true }).select("name");
    if (!children.length) {
      return res.status(200).json({
        success: true,
        message: "Activity summary",
        data: {
          days,
          periodStart: start.toISOString(),
          periodEnd: end.toISOString(),
          totalPagesLogged: 0,
          totalMinutesLogged: 0,
          progressSaveCount: 0,
          byChild: [],
          byDay: [],
        },
      });
    }

    const childIds = children.map((c) => c._id);
    const nameById = Object.fromEntries(
      children.map((c) => [c._id.toString(), c.name || "Reader"])
    );

    const agg = await ReadingActivity.aggregate([
      {
        $match: {
          childId: { $in: childIds },
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$childId",
          pages: { $sum: "$pagesAdded" },
          minutes: { $sum: "$minutesAdded" },
          entries: { $sum: 1 },
        },
      },
    ]);

    const byChild = agg.map((a) => ({
      childId: a._id.toString(),
      childName: nameById[a._id.toString()] || "Reader",
      pages: a.pages,
      minutes: a.minutes,
      progressSaveCount: a.entries,
    }));

    const totals = byChild.reduce(
      (acc, c) => ({
        pages: acc.pages + c.pages,
        minutes: acc.minutes + c.minutes,
        entries: acc.entries + c.progressSaveCount,
      }),
      { pages: 0, minutes: 0, entries: 0 }
    );

    const familyDailyRows = await ReadingActivity.aggregate([
      {
        $match: {
          childId: { $in: childIds },
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          pages: { $sum: "$pagesAdded" },
          minutes: { $sum: "$minutesAdded" },
          saves: { $sum: 1 },
        },
      },
    ]);

    const familyDayMap = Object.fromEntries(
      familyDailyRows.map((r) => [
        r._id,
        { pages: r.pages, minutes: r.minutes, saves: r.saves },
      ]),
    );
    const byDay = buildReadingActivityByDay(start, end, familyDayMap);

    return res.status(200).json({
      success: true,
      message: "Activity summary",
      data: {
        days,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        totalPagesLogged: totals.pages,
        totalMinutesLogged: totals.minutes,
        progressSaveCount: totals.entries,
        byChild,
        byDay,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get all sessions for the logged-in user (dashboard: current + history)
// @route   GET /api/sessions/my-sessions
// @access  Private
exports.getMySessions = async (req, res) => {
  try {
    if (req.user.role !== "child" || !req.user.childProfile) {
      return res.status(200).json({
        success: true,
        message: "My sessions fetched",
        data: [],
      });
    }

    const readerChildId = req.user.childProfile;
    const { status } = req.query; // optional: 'active' | 'completed'

    const filter = { childId: readerChildId };
    if (status === 'active') filter.completed = false;
    if (status === 'completed') filter.completed = true;

    const sessions = await ReadingSession.find(filter)
      .populate('bookId', 'title author coverImage pageCount')
      .sort({ lastUpdatedAt: -1 })
      .lean();

    const activeAssignments = await Assignment.find({
      child: readerChildId,
      status: { $in: ["assigned", "in_progress"] },
    })
      .select("story")
      .lean();

    const allowedStoryIds = new Set(
      activeAssignments.map((a) => a.story.toString()),
    );

    const filtered = sessions.filter((s) => {
      const bid =
        s.bookId && typeof s.bookId === "object" && s.bookId._id != null
          ? s.bookId._id.toString()
          : s.bookId != null
            ? String(s.bookId)
            : "";
      return bid && allowedStoryIds.has(bid);
    });

    const data = filtered.map((s) => ({
      _id: s._id,
      bookId: s.bookId,
      pagesRead: s.pagesRead,
      totalPages: s.totalPages,
      progress: readingProgressPercentRounded(s.pagesRead, s.totalPages),
      timeSpent: s.timeSpent,
      completed: s.completed,
      startedAt: s.startedAt,
      lastUpdatedAt: s.lastUpdatedAt
    }));

    return res.status(200).json({
      success: true,
      message: 'My sessions fetched',
      data
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get progress for a specific book (resume reading)
// @route   GET /api/sessions/progress/:bookId
// @access  Private
exports.getProgressByBook = async (req, res) => {
  try {
    if (req.user.role !== "child" || !req.user.childProfile) {
      return res.status(200).json({
        success: true,
        message: "No session found for this book",
        data: { session: null, progress: 0, pagesRead: 0, totalPages: null },
      });
    }

    const readerChildId = req.user.childProfile;
    const { bookId } = req.params;

    const session = await ReadingSession.findOne({
      childId: readerChildId,
      bookId,
    })
      .sort({ lastUpdatedAt: -1 })
      .populate('bookId', 'title author coverImage pageCount')
      .lean();

    if (!session) {
      return res.status(200).json({
        success: true,
        message: 'No session found for this book',
        data: { session: null, progress: 0, pagesRead: 0, totalPages: null }
      });
    }

    const storyKey =
      session.bookId && typeof session.bookId === "object" && session.bookId._id
        ? session.bookId._id.toString()
        : String(session.bookId);
    const allowed = await childHasActiveAssignmentToStory(
      readerChildId,
      storyKey,
    );
    if (!allowed) {
      return res.status(200).json({
        success: true,
        message: "No session found for this book",
        data: { session: null, progress: 0, pagesRead: 0, totalPages: null },
      });
    }

    const progress = readingProgressPercentRounded(
      session.pagesRead,
      session.totalPages,
    );

    return res.status(200).json({
      success: true,
      message: 'Progress fetched',
      data: {
        session: session._id,
        bookId: session.bookId,
        pagesRead: session.pagesRead,
        totalPages: session.totalPages,
        progress,
        completed: session.completed,
        lastUpdatedAt: session.lastUpdatedAt
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete / reset a session
// @route   DELETE /api/sessions/:sessionId
// @access  Private
exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ReadingSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (req.user.role === "child") {
      if (
        !req.user.childProfile ||
        session.childId.toString() !== req.user.childProfile.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Not allowed to delete this session",
        });
      }
    } else {
      const childAccess = await ensureOwnedChild(session.childId, req.user._id);
      if (!childAccess.ok) {
        return res.status(childAccess.status).json({
          success: false,
          message: childAccess.message,
        });
      }
    }

    await ReadingSession.findByIdAndDelete(sessionId);

    return res.status(200).json({
      success: true,
      message: 'Session deleted'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Monthly reading analytics for a child
// @route   GET /api/sessions/monthly/:childId
// @access  Private
exports.getMonthlyAnalytics = async (req, res) => {
  try {
    const { childId } = req.params;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const sessions = await ReadingSession.find({
      childId: new mongoose.Types.ObjectId(childId),
      startedAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalMinutes = sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
    const booksCompleted = sessions.filter((s) => s.completed).length;

    return res.status(200).json({
      success: true,
      message: 'Monthly analytics fetched',
      data: {
        totalMinutes,
        sessionCount: sessions.length,
        booksCompleted
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Top 5 most read books for a child (by time spent)
// @route   GET /api/sessions/top-books/:childId
// @access  Private
exports.getTopBooks = async (req, res) => {
  try {
    const { childId } = req.params;

    const sessions = await ReadingSession.find({
      childId: new mongoose.Types.ObjectId(childId)
    })
      .populate('bookId', 'title author coverImage')
      .lean();

    const byBook = {};
    sessions.forEach((s) => {
      const id = s.bookId?._id?.toString() || s.bookId?.toString();
      if (!id) return;
      if (!byBook[id]) {
        byBook[id] = { bookId: s.bookId, totalTimeSpent: 0, completed: false };
      }
      byBook[id].totalTimeSpent += s.timeSpent || 0;
      if (s.completed) byBook[id].completed = true;
    });

    const top = Object.entries(byBook)
      .map(([_, v]) => v)
      .sort((a, b) => b.totalTimeSpent - a.totalTimeSpent)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      message: 'Top books fetched',
      data: top
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Achievements for a child (gamification)
// @route   GET /api/sessions/achievements/:childId
// @access  Private
exports.getAchievements = async (req, res) => {
  try {
    const { childId } = req.params;

    const sessions = await ReadingSession.find({
      childId: new mongoose.Types.ObjectId(childId)
    }).sort({ startedAt: 1 });

    const completedCount = sessions.filter((s) => s.completed).length;
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
    const daySet = new Set();
    sessions.forEach((s) => daySet.add(getDateKey(s.startedAt)));
    const days = Array.from(daySet).sort((a, b) => a - b);

    const currentStreak = currentStreakFromSortedDayKeys(days);

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const weeklyMinutes = sessions
      .filter((s) => s.startedAt >= sevenDaysAgo)
      .reduce((sum, s) => sum + (s.timeSpent || 0), 0);

    const achievements = [
      {
        id: 'first_book',
        name: 'First Book',
        description: 'Complete your first book',
        unlocked: completedCount >= 1,
        unlockedAt: completedCount >= 1 ? sessions.find((s) => s.completed)?.lastUpdatedAt : null
      },
      {
        id: 'five_books',
        name: 'Bookworm',
        description: 'Complete 5 books',
        unlocked: completedCount >= 5,
        unlockedAt: null
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Read 7 days in a row',
        unlocked: currentStreak >= 7,
        unlockedAt: null
      },
      {
        id: 'weekly_30',
        name: 'Dedicated Reader',
        description: 'Read 30 minutes in a week',
        unlocked: weeklyMinutes >= 30,
        unlockedAt: null
      },
      {
        id: 'total_60',
        name: 'Hour Reader',
        description: 'Read 60 minutes total',
        unlocked: totalMinutes >= 60,
        unlockedAt: null
      }
    ];

    return res.status(200).json({
      success: true,
      message: 'Achievements fetched',
      data: achievements
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
