const express = require('express');
const router = express.Router();
const {
  getUserProgress,
  awardPoints,
  getLeaderboard,
  getAllBadges,
  createBadge,
  awardBadge,
  getAllAchievements,
  createAchievement,
  updateAchievementProgress,
  getTransactionHistory,
  getUserBadges,
  getUserAchievements
} = require('../../controllers/gamification/gamificationController');
const { protect } = require('../../middleware/authMiddleware');

// Progress routes
router.get('/progress/:userId', protect, getUserProgress);

// Points routes
router.post('/points/award', protect, awardPoints);
router.get('/transactions/:userId', protect, getTransactionHistory);

// Leaderboard
router.get('/leaderboard', protect, getLeaderboard);

// Badge routes
router.get('/badges', protect, getAllBadges);
router.post('/badges', protect, createBadge);
router.post('/badges/award', protect, awardBadge);
router.get('/user-badges/:userId', protect, getUserBadges);

// Achievement routes
router.get('/achievements', protect, getAllAchievements);
router.post('/achievements', protect, createAchievement);
router.post('/achievements/progress', protect, updateAchievementProgress);
router.get('/user-achievements/:userId', protect, getUserAchievements);

module.exports = router;
