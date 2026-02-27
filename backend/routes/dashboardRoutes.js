const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getFamilyDashboard,
  getChildDashboard,
  getFamilySummary
} = require('../controllers/dashboardController');

// GET /api/dashboard/family  — full family dashboard
router.get('/family', protect, getFamilyDashboard);

// GET /api/dashboard/child/:childId  — single child detailed view
router.get('/child/:childId', protect, getChildDashboard);

// GET /api/dashboard/summary  — quick totals summary
router.get('/summary', protect, getFamilySummary);

module.exports = router;
