/**
 * Gamification Integration Helper
 * 
 * Use these helper functions to integrate gamification into your existing controllers
 */

const UserProgress = require('../models/gamification/UserProgress');
const PointTransaction = require('../models/gamification/PointTransaction');
const GamificationService = require('../services/gamification/gamificationService');

/**
 * Award points when a story is read
 * Call this in your story controller after a story is successfully read
 */
async function awardPointsForStoryRead(userId, storyId, childId = null) {
  try {
    const result = await GamificationService.awardPointsToUser(
      userId,
      20, // Points for reading a story
      'story_read',
      'Completed reading a story',
      childId,
      { model: 'Story', id: storyId }
    );
    
    return {
      success: true,
      pointsEarned: 20,
      newBalance: result.progress.totalPoints,
      level: result.progress.level,
      streak: result.progress.currentStreak
    };
  } catch (error) {
    console.error('Error awarding points for story read:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Award points when an assignment is completed
 * Call this in your assignment controller after successful completion
 */
async function awardPointsForAssignmentCompletion(userId, assignmentId, childId = null) {
  try {
    const result = await GamificationService.awardPointsToUser(
      userId,
      30, // Points for completing an assignment
      'assignment_completed',
      'Completed an assignment',
      childId,
      { model: 'Assignment', id: assignmentId }
    );
    
    return {
      success: true,
      pointsEarned: 30,
      newBalance: result.progress.totalPoints,
      level: result.progress.level,
      streak: result.progress.currentStreak
    };
  } catch (error) {
    console.error('Error awarding points for assignment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Award daily login bonus
 * Call this in your auth controller after successful login
 */
async function awardDailyLoginBonus(userId) {
  try {
    // Check if user already got daily bonus today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransaction = await PointTransaction.findOne({
      user: userId,
      source: 'daily_login',
      createdAt: { $gte: today }
    });
    
    if (todayTransaction) {
      return { success: false, message: 'Daily bonus already claimed today' };
    }
    
    const result = await GamificationService.awardPointsToUser(
      userId,
      5, // Daily login bonus
      'daily_login',
      'Daily login bonus'
    );
    
    return {
      success: true,
      pointsEarned: 5,
      newBalance: result.progress.totalPoints,
      message: 'Daily login bonus awarded!'
    };
  } catch (error) {
    console.error('Error awarding daily bonus:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check and update user streak
 * Call this whenever user performs a reading activity
 */
async function updateUserStreak(userId, childId = null) {
  try {
    const query = { user: userId };
    if (childId) query.child = childId;
    
    let progress = await UserProgress.findOne(query);
    if (!progress) {
      progress = await UserProgress.create({ user: userId, child: childId });
    }
    
    const previousStreak = progress.currentStreak;
    progress.updateStreak();
    await progress.save();
    
    // Award bonus points for streak milestones
    if (progress.currentStreak === 7 && previousStreak < 7) {
      await GamificationService.awardPointsToUser(
        userId,
        50,
        'streak_bonus',
        '7-day streak bonus!',
        childId
      );
    } else if (progress.currentStreak === 30 && previousStreak < 30) {
      await GamificationService.awardPointsToUser(
        userId,
        200,
        'streak_bonus',
        '30-day streak bonus!',
        childId
      );
    }
    
    return {
      success: true,
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak
    };
  } catch (error) {
    console.error('Error updating streak:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's gamification summary
 * Use this to display user stats in UI
 */
async function getUserGamificationSummary(userId, childId = null) {
  try {
    const query = { user: userId };
    if (childId) query.child = childId;
    
    const progress = await UserProgress.findOne(query)
      .populate('badges.badge')
      .populate('achievements.achievement');
    
    if (!progress) {
      return {
        totalPoints: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        badges: [],
        achievements: [],
        stats: {
          storiesRead: 0,
          assignmentsCompleted: 0
        }
      };
    }
    
    // Calculate rank
    const rank = await GamificationService.getUserRank(userId, childId);
    
    return {
      totalPoints: progress.totalPoints,
      level: progress.level,
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
      rank,
      badges: progress.badges.length,
      achievements: progress.achievements.filter(a => a.completed).length,
      stats: progress.stats
    };
  } catch (error) {
    console.error('Error getting gamification summary:', error);
    return null;
  }
}

module.exports = {
  awardPointsForStoryRead,
  awardPointsForAssignmentCompletion,
  awardDailyLoginBonus,
  updateUserStreak,
  getUserGamificationSummary
};
