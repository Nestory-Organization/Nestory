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
/**
 * Award points when a story is read
 * Call this in your story controller after a story is successfully read
 */
async function awardPointsForStoryRead(userId, storyId, childId = null, storyCategory = null, readingTime = 0) {
  try {
    const query = { user: userId };
    if (childId) query.child = childId;

    let progress = await UserProgress.findOne(query);
    if (!progress) {
      progress = await UserProgress.create({
        user: userId,
        child: childId
      });
    }

    // Update reading stats
    progress.updateReadingStats(storyCategory, readingTime);
    await progress.save();

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
 * Update achievement progress while reading (mid-session)
 * Call this as user reads pages to show real-time progress
 * Does NOT award points - just updates progress tracking
 */
async function updateReadingProgressMidSession(userId, childId = null, currentProgress = 0) {
  try {
    const query = { user: userId };
    if (childId) query.child = childId;
    
    let userProgress = await UserProgress.findOne(query);
    if (!userProgress) {
      userProgress = await UserProgress.create({ user: userId, child: childId });
    }

    // Get all achievements and update progress for reading-related ones
    const Achievement = require('../models/gamification/Achievement');
    const achievements = await Achievement.find({ isActive: true }).sort({ order: 1 });

    for (const achievement of achievements) {
      // Only update progress for reading-related achievements during mid-session
      const readingAchievements = [
        'First Steps', 'Story Explorer', 'Bookworm Beginner', 
        'Avid Reader', 'Reading Champion', 'Legendary Reader'
      ];

      if (!readingAchievements.includes(achievement.name)) continue;

      let existingProgress = userProgress.achievements.find(
        a => a.achievement.toString() === achievement._id.toString()
      );

      if (!existingProgress) {
        existingProgress = { 
          achievement: achievement._id, 
          progress: 0, 
          completed: false, 
          completedAt: null 
        };
        userProgress.achievements.push(existingProgress);
      }

      // Skip if already completed
      if (existingProgress.completed) continue;

      // For reading achievements, show partial progress during session
      // Show progress as a fraction based on completed stories + current reading
      const totalStoriesEffective = userProgress.stats.storiesRead + (currentProgress / 100);
      existingProgress.progress = Math.min(
        Math.floor(totalStoriesEffective * 100) / 100,
        achievement.targetValue
      );
    }

    await userProgress.save();
    return { success: true };
  } catch (error) {
    console.error('Error updating reading progress:', error);
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
  updateReadingProgressMidSession,
  getUserGamificationSummary
};
