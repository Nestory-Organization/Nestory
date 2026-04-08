const express = require("express");
const router = express.Router();
const {
  startSession,
  updateSession,
  getWeeklyReadingTime,
  getReadingStreak,
  getMySessions,
  getProgressByBook,
  deleteSession,
  getMonthlyAnalytics,
  getTopBooks,
  getAchievements,
} = require("../controllers/readingController");
const { protect, parentOnly } = require("../middleware/authMiddleware");
const {
  handleValidationErrors,
} = require("../middleware/validationMiddleware");
const {
  startSessionValidation,
  updateSessionValidation,
  childIdParamValidation,
} = require("../validators/readingValidator");

// GET /api/sessions — quick check that sessions router is mounted
router.get("/", (req, res) =>
  res.json({ success: true, message: "Reading sessions API" }),
);

// POST /api/sessions/start — start a reading session for the authenticated user (or specified child)
router.post(
  "/start",
  protect,
  parentOnly,
  startSessionValidation,
  handleValidationErrors,
  startSession,
);

// POST /api/sessions/update — update pages read, time spent; returns progress %, marks completion
router.post(
  "/update",
  protect,
  parentOnly,
  updateSessionValidation,
  handleValidationErrors,
  updateSession,
);

// GET /api/sessions/weekly/:childId — total reading time in last 7 days
router.get(
  "/weekly/:childId",
  protect,
  parentOnly,
  childIdParamValidation,
  handleValidationErrors,
  getWeeklyReadingTime,
);

// GET /api/sessions/streak/:childId — consecutive days with reading
router.get(
  "/streak/:childId",
  protect,
  parentOnly,
  childIdParamValidation,
  handleValidationErrors,
  getReadingStreak,
);

// GET /api/sessions/my-sessions — all sessions for logged-in user (?status=active|completed)
router.get('/my-sessions', protect, getMySessions);

// GET /api/sessions/progress/:bookId — progress for a specific book (resume reading)
router.get('/progress/:bookId', protect, getProgressByBook);

// DELETE /api/sessions/:sessionId — delete / reset a session
router.delete('/:sessionId', protect, deleteSession);

// GET /api/sessions/monthly/:childId — monthly reading analytics
router.get('/monthly/:childId', protect, getMonthlyAnalytics);

// GET /api/sessions/top-books/:childId — top 5 most read books by time
router.get('/top-books/:childId', protect, getTopBooks);


module.exports = router;
