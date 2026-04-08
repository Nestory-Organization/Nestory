const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      default: null
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    level: {
      type: Number,
      default: 1,
      min: 1
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActivityDate: {
      type: Date,
      default: null
    },
    badges: [
      {
        badge: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Badge'
        },
        earnedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    achievements: [
      {
        achievement: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Achievement'
        },
        progress: {
          type: Number,
          default: 0
        },
        completed: {
          type: Boolean,
          default: false
        },
        completedAt: {
          type: Date,
          default: null
        }
      }
    ],
    stats: {
      storiesRead: {
        type: Number,
        default: 0
      },
      assignmentsCompleted: {
        type: Number,
        default: 0
      },
      totalReadingTime: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
userProgressSchema.index({ user: 1, child: 1 });
userProgressSchema.index({ totalPoints: -1 });

// Calculate level based on points
userProgressSchema.methods.calculateLevel = function() {
  // Level formula: Level = floor(sqrt(totalPoints / 100)) + 1
  this.level = Math.floor(Math.sqrt(this.totalPoints / 100)) + 1;
  return this.level;
};

// Check and update streak
userProgressSchema.methods.updateStreak = function() {
  const now = new Date();
  const lastActivity = this.lastActivityDate;

  if (!lastActivity) {
    this.currentStreak = 1;
    this.longestStreak = 1;
  } else {
    const daysDiff = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      this.currentStreak += 1;
      if (this.currentStreak > this.longestStreak) {
        this.longestStreak = this.currentStreak;
      }
    } else if (daysDiff > 1) {
      // Streak broken
      this.currentStreak = 1;
    }
    // If daysDiff === 0, same day activity, don't change streak
  }

  this.lastActivityDate = now;
  return this.currentStreak;
};

module.exports = mongoose.model('UserProgress', userProgressSchema);
