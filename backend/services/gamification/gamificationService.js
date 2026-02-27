const UserProgress = require('../../models/gamification/UserProgress');
const Badge = require('../../models/gamification/Badge');
const Achievement = require('../../models/gamification/Achievement');
const PointTransaction = require('../../models/gamification/PointTransaction');

/**
 * Service for handling gamification logic
 */
class GamificationService {
  /**
   * Initialize default badges in the system
   */
  static async initializeDefaultBadges() {
    try {
      const defaultBadges = [
        {
          name: 'First Steps',
          description: 'Read your first story',
          icon: '👶',
          category: 'reading',
          tier: 'bronze',
          points: 10,
          criteria: { type: 'story_count', threshold: 1 },
          rarity: 'common'
        },
        {
          name: 'Bookworm',
          description: 'Read 10 stories',
          icon: '📚',
          category: 'reading',
          tier: 'silver',
          points: 50,
          criteria: { type: 'story_count', threshold: 10 },
          rarity: 'common'
        },
        {
          name: 'Story Master',
          description: 'Read 50 stories',
          icon: '🎓',
          category: 'reading',
          tier: 'gold',
          points: 200,
          criteria: { type: 'story_count', threshold: 50 },
          rarity: 'rare'
        },
        {
          name: 'Library Legend',
          description: 'Read 100 stories',
          icon: '👑',
          category: 'reading',
          tier: 'platinum',
          points: 500,
          criteria: { type: 'story_count', threshold: 100 },
          rarity: 'epic'
        },
        {
          name: 'Day Streak',
          description: 'Maintain a 3-day reading streak',
          icon: '🔥',
          category: 'streak',
          tier: 'bronze',
          points: 30,
          criteria: { type: 'days_streak', threshold: 3 },
          rarity: 'common'
        },
        {
          name: 'Week Warrior',
          description: 'Maintain a 7-day reading streak',
          icon: '⚡',
          category: 'streak',
          tier: 'silver',
          points: 100,
          criteria: { type: 'days_streak', threshold: 7 },
          rarity: 'rare'
        },
        {
          name: 'Dedication Master',
          description: 'Maintain a 30-day reading streak',
          icon: '💎',
          category: 'streak',
          tier: 'gold',
          points: 500,
          criteria: { type: 'days_streak', threshold: 30 },
          rarity: 'legendary'
        },
        {
          name: 'Points Collector',
          description: 'Earn 500 total points',
          icon: '💰',
          category: 'achievement',
          tier: 'silver',
          points: 50,
          criteria: { type: 'total_points', threshold: 500 },
          rarity: 'common'
        },
        {
          name: 'Points Champion',
          description: 'Earn 2000 total points',
          icon: '🏆',
          category: 'achievement',
          tier: 'gold',
          points: 200,
          criteria: { type: 'total_points', threshold: 2000 },
          rarity: 'rare'
        },
        {
          name: 'Task Completer',
          description: 'Complete 5 assignments',
          icon: '✅',
          category: 'achievement',
          tier: 'bronze',
          points: 40,
          criteria: { type: 'assignments_completed', threshold: 5 },
          rarity: 'common'
        }
      ];

      for (const badgeData of defaultBadges) {
        const exists = await Badge.findOne({ name: badgeData.name });
        if (!exists) {
          await Badge.create(badgeData);
          console.log(`Created badge: ${badgeData.name}`);
        }
      }

      console.log('Default badges initialization completed');
    } catch (error) {
      console.error('Error initializing badges:', error);
    }
  }

  /**
   * Initialize default achievements in the system
   */
  static async initializeDefaultAchievements() {
    try {
      const defaultAchievements = [
        {
          name: 'Reading Explorer',
          description: 'Read stories from 5 different categories',
          icon: '🧭',
          category: 'exploration',
          type: 'one_time',
          targetValue: 5,
          reward: { points: 100 },
          difficulty: 'medium'
        },
        {
          name: 'Consistent Reader',
          description: 'Read at least one story for 10 consecutive days',
          icon: '📖',
          category: 'consistency',
          type: 'repeatable',
          targetValue: 10,
          reward: { points: 150 },
          difficulty: 'medium'
        },
        {
          name: 'Assignment Pro',
          description: 'Complete 20 assignments',
          icon: '🎯',
          category: 'milestone',
          type: 'progressive',
          targetValue: 20,
          reward: { points: 250 },
          difficulty: 'hard'
        },
        {
          name: 'Early Bird',
          description: 'Read a story before 8 AM for 5 days',
          icon: '🌅',
          category: 'consistency',
          type: 'one_time',
          targetValue: 5,
          reward: { points: 80 },
          difficulty: 'easy'
        },
        {
          name: 'Night Owl',
          description: 'Read a story after 10 PM for 5 days',
          icon: '🦉',
          category: 'consistency',
          type: 'one_time',
          targetValue: 5,
          reward: { points: 80 },
          difficulty: 'easy'
        }
      ];

      for (const achievementData of defaultAchievements) {
        const exists = await Achievement.findOne({ name: achievementData.name });
        if (!exists) {
          await Achievement.create(achievementData);
          console.log(`Created achievement: ${achievementData.name}`);
        }
      }

      console.log('Default achievements initialization completed');
    } catch (error) {
      console.error('Error initializing achievements:', error);
    }
  }

  /**
   * Award points and handle related logic
   */
  static async awardPointsToUser(userId, points, source, description = '', childId = null, reference = null) {
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

      const balanceBefore = progress.totalPoints;
      progress.totalPoints += points;
      progress.calculateLevel();
      progress.updateStreak();

      // Update stats
      if (source === 'story_read') {
        progress.stats.storiesRead += 1;
      } else if (source === 'assignment_completed') {
        progress.stats.assignmentsCompleted += 1;
      }

      await progress.save();

      // Create transaction
      const transaction = await PointTransaction.create({
        user: userId,
        child: childId,
        points,
        type: 'earn',
        source,
        description: description || `Earned ${points} points from ${source}`,
        reference: reference || { model: 'None', id: null },
        balanceBefore,
        balanceAfter: progress.totalPoints
      });

      // Check badges
      await this.checkAndAwardBadges(progress);

      return {
        success: true,
        transaction,
        progress
      };
    } catch (error) {
      throw new Error(`Error awarding points: ${error.message}`);
    }
  }

  /**
   * Check if user is eligible for any badges and award them
   */
  static async checkAndAwardBadges(progress) {
    try {
      const badges = await Badge.find({ isActive: true });

      for (const badge of badges) {
        const alreadyEarned = progress.badges.some(
          b => b.badge.toString() === badge._id.toString()
        );

        if (alreadyEarned) continue;

        let shouldAward = false;

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
          
          // Create transaction for badge points
          await PointTransaction.create({
            user: progress.user,
            child: progress.child,
            points: badge.points,
            type: 'bonus',
            source: 'badge_earned',
            description: `Earned badge: ${badge.name}`,
            reference: { model: 'Badge', id: badge._id },
            balanceBefore: progress.totalPoints - badge.points,
            balanceAfter: progress.totalPoints
          });
        }
      }

      await progress.save();
      return true;
    } catch (error) {
      console.error('Error checking badges:', error);
      return false;
    }
  }

  /**
   * Calculate user rank on leaderboard
   */
  static async getUserRank(userId, childId = null) {
    try {
      const query = { user: userId };
      if (childId) query.child = childId;

      const userProgress = await UserProgress.findOne(query);
      if (!userProgress) return null;

      const rank = await UserProgress.countDocuments({
        totalPoints: { $gt: userProgress.totalPoints }
      });

      return rank + 1;
    } catch (error) {
      throw new Error(`Error calculating rank: ${error.message}`);
    }
  }
}

module.exports = GamificationService;
