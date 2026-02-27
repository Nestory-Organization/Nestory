const mongoose = require('mongoose');
const ReadingSession = require('../models/ReadingSession');
const Story = require('../models/storyLibrary/Story');

// Normalize date to start of day (for streak: unique days with reading)
const getDateKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// @desc    Start a new reading session
// @route   POST /api/sessions/start
// @access  Private (uses auth; ties to logged-in user by default)
exports.startSession = async (req, res) => {
  try {
    const { childId, bookId, totalPages } = req.body;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'bookId is required'
      });
    }

    // If childId is not provided, default to the authenticated user
    // This will later be replaced by an actual child profile ID once that model exists
    const effectiveChildId = childId || req.user?._id;

    if (!effectiveChildId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to determine reader (child/user). Make sure you are authenticated.'
      });
    }

    // Prefer total pages from the Story document; fall back to body.totalPages for backward compatibility
    let effectiveTotalPages = null;

    const story = await Story.findById(bookId);

    if (story && typeof story.pageCount === 'number' && story.pageCount > 0) {
      effectiveTotalPages = story.pageCount;
    } else if (totalPages) {
      effectiveTotalPages = Number(totalPages);
    }

    if (!effectiveTotalPages || Number.isNaN(effectiveTotalPages)) {
      return res.status(400).json({
        success: false,
        message: 'Total pages could not be determined. Provide totalPages in the request or set pageCount on the Story.'
      });
    }

    const session = await ReadingSession.create({
      childId: new mongoose.Types.ObjectId(effectiveChildId),
      bookId: new mongoose.Types.ObjectId(bookId),
      totalPages: effectiveTotalPages,
      pagesRead: 0,
      timeSpent: 0,
      completed: false
    });

    return res.status(201).json({
      success: true,
      message: 'Reading session started',
      data: session
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

// @desc    Get weekly reading time (last 7 days) for a child
// @route   GET /api/sessions/weekly/:childId
// @access  Public (TODO: protect with auth, ensure childId belongs to user)
exports.getWeeklyReadingTime = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: 'childId is required'
      });
    }

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const sessions = await ReadingSession.find({
      childId: new mongoose.Types.ObjectId(childId),
      startedAt: { $gte: sevenDaysAgo, $lte: now }
    });

    const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);

    return res.status(200).json({
      success: true,
      message: 'Weekly reading time fetched',
      data: {
        totalTimeSpent, // minutes
        sessionCount: sessions.length
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

// @desc    Get current reading streak (consecutive days with any reading)
// @route   GET /api/sessions/streak/:childId
// @access  Public (TODO: protect with auth, ensure childId belongs to user)
exports.getReadingStreak = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: 'childId is required'
      });
    }

    const sessions = await ReadingSession.find({
      childId: new mongoose.Types.ObjectId(childId)
    }).sort({ startedAt: 1 });

    if (!sessions.length) {
      return res.status(200).json({
        success: true,
        message: 'Reading streak fetched',
        data: { currentStreak: 0 }
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
      message: 'Reading streak fetched',
      data: { currentStreak }
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

// @desc    Update reading session (pages + time), return progress, mark completion
// @route   POST /api/sessions/update
// @access  Public (TODO: protect with auth)
exports.updateSession = async (req, res) => {
  try {
    const { sessionId, pagesRead, timeSpent } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }

    const session = await ReadingSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
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
      message: 'Session updated',
      data: {
        session,
        progress: Number(progress.toFixed(2))
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
