const mongoose = require("mongoose");
const ReadingSession = require("../models/ReadingSession");
const Story = require("../models/storyLibrary/Story");
const Child = require("../models/Child");

// Normalize date to start of day (for streak: unique days with reading)
const getDateKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

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

// @desc    Start a new reading session
// @route   POST /api/sessions/start
// @access  Private (Parent only)
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

    if (!mongoose.Types.ObjectId.isValid(childId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid childId format",
      });
    }

    const childAccess = await ensureOwnedChild(childId, req.user._id);
    if (!childAccess.ok) {
      return res.status(childAccess.status).json({
        success: false,
        message: childAccess.message,
      });
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

    let currentStreak = 1;
    for (let i = days.length - 2; i >= 0; i--) {
      const diffInDays = (days[i + 1] - days[i]) / (1000 * 60 * 60 * 24);
      if (diffInDays === 1) currentStreak += 1;
      else if (diffInDays > 1) break;
    }

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
// @access  Private (Parent only)
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

    const childAccess = await ensureOwnedChild(session.childId, req.user._id);
    if (!childAccess.ok) {
      return res.status(childAccess.status).json({
        success: false,
        message: childAccess.message,
      });
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

    const progress = (session.pagesRead / session.totalPages) * 100;

    return res.status(200).json({
      success: true,
      message: "Session updated",
      data: {
        session,
        progress: Number(progress.toFixed(2)),
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
