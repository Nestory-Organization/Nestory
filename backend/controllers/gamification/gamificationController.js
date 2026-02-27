const UserProgress = require('../../models/gamification/UserProgress');
const Badge = require('../../models/gamification/Badge');
const Achievement = require('../../models/gamification/Achievement');
const PointTransaction = require('../../models/gamification/PointTransaction');

// @desc    Get user progress/stats
// @route   GET /api/gamification/progress/:userId
// @access  Private
exports.getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { childId } = req.query;

    const query = { user: userId };
    if (childId) {
      query.child = childId;
    }

    let progress = await UserProgress.findOne(query)
      .populate('badges.badge')
      .populate('achievements.achievement');

    if (!progress) {
      // Create initial progress for user
      progress = await UserProgress.create({
        user: userId,
        child: childId || null
      });
    }

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user progress',
      error: error.message
    });
  }
};

// @desc    Award points to user
// @route   POST /api/gamification/points/award
// @access  Private
exports.awardPoints = async (req, res) => {
  try {
    const { userId, childId, points, source, description, reference } = req.body;

    // Validation
    if (!userId || !points || !source) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, points, and source'
      });
    }

    if (points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Points must be greater than 0'
      });
    }

    // Find or create user progress
    const query = { user: userId };
    if (childId) {
      query.child = childId;
    }

    let progress = await UserProgress.findOne(query);
    if (!progress) {
      progress = await UserProgress.create({
        user: userId,
        child: childId || null
      });
    }

    const balanceBefore = progress.totalPoints;
    progress.totalPoints += points;
    progress.calculateLevel();
    progress.updateStreak();

    // Update stats based on source
    if (source === 'story_read') {
      progress.stats.storiesRead += 1;
    } else if (source === 'assignment_completed') {
      progress.stats.assignmentsCompleted += 1;
    }

    await progress.save();

    // Create transaction record
    const transaction = await PointTransaction.create({
      user: userId,
      child: childId || null,
      points,
      type: 'earn',
      source,
      description: description || `Earned ${points} points from ${source}`,
      reference: reference || { model: 'None', id: null },
      balanceBefore,
      balanceAfter: progress.totalPoints
    });

    // Check for badge eligibility
    await checkAndAwardBadges(progress);

    res.status(200).json({
      success: true,
      message: `${points} points awarded successfully`,
      data: {
        transaction,
        currentBalance: progress.totalPoints,
        level: progress.level,
        streak: progress.currentStreak
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error awarding points',
      error: error.message
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 10, childSpecific = false } = req.query;

    const query = childSpecific === 'true' ? { child: { $ne: null } } : {};

    const leaderboard = await UserProgress.find(query)
      .sort({ totalPoints: -1 })
      .limit(parseInt(limit))
      .populate('user', 'name email profilePicture')
      .populate('child', 'name age avatar')
      .select('user child totalPoints level currentStreak longestStreak badges stats');

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: leaderboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
};

// @desc    Get all badges
// @route   GET /api/gamification/badges
// @access  Private
exports.getAllBadges = async (req, res) => {
  try {
    const { category, tier, isActive } = req.query;

    const query = {};
    if (category) query.category = category;
    if (tier) query.tier = tier;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const badges = await Badge.find(query).sort({ tier: 1, points: 1 });

    res.status(200).json({
      success: true,
      count: badges.length,
      data: badges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching badges',
      error: error.message
    });
  }
};

// @desc    Create new badge
// @route   POST /api/gamification/badges
// @access  Private/Admin
exports.createBadge = async (req, res) => {
  try {
    const badge = await Badge.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Badge created successfully',
      data: badge
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Badge with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating badge',
      error: error.message
    });
  }
};

// @desc    Award badge to user
// @route   POST /api/gamification/badges/award
// @access  Private
exports.awardBadge = async (req, res) => {
  try {
    const { userId, childId, badgeId } = req.body;

    if (!userId || !badgeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId and badgeId'
      });
    }

    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }

    const query = { user: userId };
    if (childId) query.child = childId;

    let progress = await UserProgress.findOne(query);
    if (!progress) {
      progress = await UserProgress.create({
        user: userId,
        child: childId || null
      });
    }

    // Check if badge already earned
    const alreadyEarned = progress.badges.some(
      b => b.badge.toString() === badgeId
    );

    if (alreadyEarned) {
      return res.status(400).json({
        success: false,
        message: 'Badge already earned'
      });
    }

    // Add badge
    progress.badges.push({
      badge: badgeId,
      earnedAt: new Date()
    });

    // Award badge points
    progress.totalPoints += badge.points;
    progress.calculateLevel();

    await progress.save();

    // Create point transaction
    await PointTransaction.create({
      user: userId,
      child: childId || null,
      points: badge.points,
      type: 'earn',
      source: 'badge_earned',
      description: `Earned badge: ${badge.name}`,
      reference: { model: 'Badge', id: badgeId },
      balanceBefore: progress.totalPoints - badge.points,
      balanceAfter: progress.totalPoints
    });

    res.status(200).json({
      success: true,
      message: 'Badge awarded successfully',
      data: {
        badge,
        totalPoints: progress.totalPoints,
        level: progress.level
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error awarding badge',
      error: error.message
    });
  }
};

// @desc    Get all achievements
// @route   GET /api/gamification/achievements
// @access  Private
exports.getAllAchievements = async (req, res) => {
  try {
    const { category, difficulty, isActive } = req.query;

    const query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const achievements = await Achievement.find(query)
      .populate('reward.badge')
      .sort({ difficulty: 1 });

    res.status(200).json({
      success: true,
      count: achievements.length,
      data: achievements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching achievements',
      error: error.message
    });
  }
};

// @desc    Create new achievement
// @route   POST /api/gamification/achievements
// @access  Private/Admin
exports.createAchievement = async (req, res) => {
  try {
    const achievement = await Achievement.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Achievement created successfully',
      data: achievement
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Achievement with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating achievement',
      error: error.message
    });
  }
};

// @desc    Update achievement progress
// @route   POST /api/gamification/achievements/progress
// @access  Private
exports.updateAchievementProgress = async (req, res) => {
  try {
    const { userId, childId, achievementId, progressIncrement } = req.body;

    if (!userId || !achievementId || progressIncrement === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, achievementId, and progressIncrement'
      });
    }

    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    const query = { user: userId };
    if (childId) query.child = childId;

    let progress = await UserProgress.findOne(query);
    if (!progress) {
      progress = await UserProgress.create({
        user: userId,
        child: childId || null
      });
    }

    // Find or create achievement progress
    let achievementProgress = progress.achievements.find(
      a => a.achievement.toString() === achievementId
    );

    if (!achievementProgress) {
      achievementProgress = {
        achievement: achievementId,
        progress: 0,
        completed: false,
        completedAt: null
      };
      progress.achievements.push(achievementProgress);
    }

    // Update progress
    achievementProgress.progress += progressIncrement;

    // Check if completed
    if (achievementProgress.progress >= achievement.targetValue && !achievementProgress.completed) {
      achievementProgress.completed = true;
      achievementProgress.completedAt = new Date();

      // Award points
      progress.totalPoints += achievement.reward.points;
      progress.calculateLevel();

      // Award badge if any
      if (achievement.reward.badge) {
        const badgeExists = progress.badges.some(
          b => b.badge.toString() === achievement.reward.badge.toString()
        );
        if (!badgeExists) {
          progress.badges.push({
            badge: achievement.reward.badge,
            earnedAt: new Date()
          });
        }
      }

      await progress.save();

      // Create point transaction
      await PointTransaction.create({
        user: userId,
        child: childId || null,
        points: achievement.reward.points,
        type: 'earn',
        source: 'achievement',
        description: `Completed achievement: ${achievement.name}`,
        reference: { model: 'Achievement', id: achievementId },
        balanceBefore: progress.totalPoints - achievement.reward.points,
        balanceAfter: progress.totalPoints
      });

      return res.status(200).json({
        success: true,
        message: 'Achievement completed!',
        data: {
          achievement,
          progress: achievementProgress,
          totalPoints: progress.totalPoints,
          level: progress.level
        }
      });
    }

    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Achievement progress updated',
      data: {
        achievement,
        progress: achievementProgress
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating achievement progress',
      error: error.message
    });
  }
};

// @desc    Get point transaction history
// @route   GET /api/gamification/transactions/:userId
// @access  Private
exports.getTransactionHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { childId, limit = 50, type, source } = req.query;

    const query = { user: userId };
    if (childId) query.child = childId;
    if (type) query.type = type;
    if (source) query.source = source;

    const transactions = await PointTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction history',
      error: error.message
    });
  }
};

// @desc    Get user badges
// @route   GET /api/gamification/user-badges/:userId
// @access  Private
exports.getUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    const { childId } = req.query;

    const query = { user: userId };
    if (childId) query.child = childId;

    const progress = await UserProgress.findOne(query)
      .populate('badges.badge');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'User progress not found'
      });
    }

    res.status(200).json({
      success: true,
      count: progress.badges.length,
      data: progress.badges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user badges',
      error: error.message
    });
  }
};

// @desc    Get user achievements
// @route   GET /api/gamification/user-achievements/:userId
// @access  Private
exports.getUserAchievements = async (req, res) => {
  try {
    const { userId } = req.params;
    const { childId } = req.query;

    const query = { user: userId };
    if (childId) query.child = childId;

    const progress = await UserProgress.findOne(query)
      .populate('achievements.achievement');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'User progress not found'
      });
    }

    res.status(200).json({
      success: true,
      count: progress.achievements.length,
      data: progress.achievements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user achievements',
      error: error.message
    });
  }
};

// Helper function to check and award badges
async function checkAndAwardBadges(progress) {
  try {
    const badges = await Badge.find({ isActive: true });

    for (const badge of badges) {
      // Check if already earned
      const alreadyEarned = progress.badges.some(
        b => b.badge.toString() === badge._id.toString()
      );

      if (alreadyEarned) continue;

      let shouldAward = false;

      // Check criteria
      switch (badge.criteria.type) {
        case 'story_count':
          shouldAward = progress.stats.storiesRead >= badge.criteria.threshold;
          break;
        case 'days_streak':
          shouldAward = progress.currentStreak >= badge.criteria.threshold;
          break;
        case 'total_points':
          shouldAward = progress.totalPoints >= badge.criteria.threshold;
          break;
        case 'assignments_completed':
          shouldAward = progress.stats.assignmentsCompleted >= badge.criteria.threshold;
          break;
      }

      if (shouldAward) {
        progress.badges.push({
          badge: badge._id,
          earnedAt: new Date()
        });
        progress.totalPoints += badge.points;
      }
    }

    await progress.save();
  } catch (error) {
    console.error('Error checking badges:', error);
  }
}
