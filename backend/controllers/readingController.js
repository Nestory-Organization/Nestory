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

// @desc    Get all sessions for the logged-in user (dashboard: current + history)
// @route   GET /api/sessions/my-sessions
// @access  Private
exports.getMySessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query; // optional: 'active' | 'completed'

    const filter = { childId: userId };
    if (status === 'active') filter.completed = false;
    if (status === 'completed') filter.completed = true;

    const sessions = await ReadingSession.find(filter)
      .populate('bookId', 'title author coverImage pageCount')
      .sort({ lastUpdatedAt: -1 })
      .lean();

    const data = sessions.map((s) => ({
      _id: s._id,
      bookId: s.bookId,
      pagesRead: s.pagesRead,
      totalPages: s.totalPages,
      progress: s.totalPages ? Number(((s.pagesRead / s.totalPages) * 100).toFixed(2)) : 0,
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
    const userId = req.user._id;
    const { bookId } = req.params;

    const session = await ReadingSession.findOne({
      childId: userId,
      bookId
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

    const progress = session.totalPages
      ? Number(((session.pagesRead / session.totalPages) * 100).toFixed(2))
      : 0;

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
    const userId = req.user._id;
    const { sessionId } = req.params;

    const session = await ReadingSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.childId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not allowed to delete this session'
      });
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

    let currentStreak = 0;
    if (days.length) {
      currentStreak = 1;
      for (let i = days.length - 2; i >= 0; i--) {
        const diffInDays = (days[i + 1] - days[i]) / (1000 * 60 * 60 * 24);
        if (diffInDays === 1) currentStreak += 1;
        else if (diffInDays > 1) break;
      }
    }

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
