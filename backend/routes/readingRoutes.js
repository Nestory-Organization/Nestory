const express = require('express');
const router = express.Router();
const {
  startSession,
  updateSession,
  getWeeklyReadingTime,
  getReadingStreak
} = require('../controllers/readingController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/sessions — quick check that sessions router is mounted
router.get('/', (req, res) => res.json({ success: true, message: 'Reading sessions API' }));

// POST /api/sessions/start — start a reading session for the authenticated user (or specified child)
router.post('/start', protect, startSession);

// POST /api/sessions/update — update pages read, time spent; returns progress %, marks completion
router.post('/update', protect, updateSession);

// GET /api/sessions/weekly/:childId — total reading time in last 7 days
router.get('/weekly/:childId', protect, getWeeklyReadingTime);

// GET /api/sessions/streak/:childId — consecutive days with reading
router.get('/streak/:childId', protect, getReadingStreak);

module.exports = router;
