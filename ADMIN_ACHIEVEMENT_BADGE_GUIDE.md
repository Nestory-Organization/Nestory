# Admin Achievement & Badge Creation Guide

## Overview

The gamification system now has improved admin endpoints for creating achievements and badges. These endpoints include:
- ✅ Admin authorization checks
- ✅ Proper validation
- ✅ Sensible defaults
- ✅ Useful error messages
- ✅ Prerequisites validation

---

## Create Badge Endpoint

### **Endpoint**
```
POST /api/gamification/badges
```

### **Requirements**
- **Authorization**: Admin user only
- **Content-Type**: application/json
- **Auth Header**: Bearer token (from admin login)

### **Request Body**

```json
{
  "name": "Speed Reader",
  "description": "Complete a story in less than 5 minutes",
  "icon": "⚡",
  "category": "reading",
  "tier": "silver",
  "points": 25,
  "criteria": {
    "type": "story_count",
    "threshold": 10
  },
  "rarity": "epic",
  "isActive": true
}
```

### **Field Descriptions**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| **name** | String | ✅ | - | Badge name (3-50 chars) |
| **description** | String | ✅ | - | Badge description (10-200 chars) |
| **icon** | String | ❌ | 🏆 | Emoji icon |
| **category** | String | ❌ | achievement | reading, streak, achievement, social, special |
| **tier** | String | ❌ | bronze | bronze, silver, gold, platinum, diamond |
| **points** | Number | ❌ | 10 | Reward points (≥0) |
| **criteria.type** | String | ✅ | - | story_count, days_streak, total_points, assignments_completed, custom |
| **criteria.threshold** | Number | ✅ | - | Target number (≥1) |
| **rarity** | String | ❌ | common | common, rare, epic, legendary |
| **isActive** | Boolean | ❌ | true | Activate/deactivate badge |

### **Success Response** (201)

```json
{
  "success": true,
  "message": "Badge created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Speed Reader",
    "description": "Complete a story in less than 5 minutes",
    "icon": "⚡",
    "category": "reading",
    "tier": "silver",
    "points": 25,
    "criteria": {
      "type": "story_count",
      "threshold": 10
    },
    "rarity": "epic",
    "isActive": true,
    "createdAt": "2026-04-11T10:30:00.000Z",
    "updatedAt": "2026-04-11T10:30:00.000Z"
  }
}
```

### **Error Responses**

**403 Unauthorized** - User is not admin
```json
{
  "success": false,
  "message": "Only admin users can create badges"
}
```

**400 Bad Request** - Missing required fields
```json
{
  "success": false,
  "message": "Name and description are required"
}
```

**400 Bad Request** - Missing criteria
```json
{
  "success": false,
  "message": "Criteria with type and threshold are required"
}
```

**400 Bad Request** - Duplicate name
```json
{
  "success": false,
  "message": "Badge with this name already exists"
}
```

**400 Bad Request** - Validation error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Badge name must be between 3 and 50 characters",
    "Description must be between 10 and 200 characters"
  ]
}
```

---

## Create Achievement Endpoint

### **Endpoint**
```
POST /api/gamification/achievements
```

### **Requirements**
- **Authorization**: Admin user only
- **Content-Type**: application/json
- **Auth Header**: Bearer token (from admin login)

### **Request Body**

```json
{
  "name": "Story Explorer",
  "description": "Read 5 different stories",
  "icon": "🧭",
  "category": "reading",
  "type": "one_time",
  "targetValue": 5,
  "reward": {
    "points": 50,
    "badge": "507f1f77bcf86cd799439011"
  },
  "difficulty": "easy",
  "prerequisites": ["First Steps"],
  "order": 2,
  "isActive": true
}
```

### **Field Descriptions**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| **name** | String | ✅ | - | Achievement name (3-50 chars) |
| **description** | String | ✅ | - | Achievement description (10-200 chars) |
| **icon** | String | ❌ | ⭐ | Emoji icon |
| **category** | String | ❌ | milestone | reading, consistency, milestone, social, exploration |
| **type** | String | ❌ | one_time | one_time, repeatable, progressive |
| **targetValue** | Number | ✅ | - | Target to unlock (≥1) |
| **reward.points** | Number | ❌ | 50 | Reward points (≥0) |
| **reward.badge** | String | ❌ | null | Badge ID to award |
| **difficulty** | String | ❌ | medium | easy, medium, hard, expert |
| **prerequisites** | Array | ❌ | [] | Achievement names needed first |
| **order** | Number | ❌ | 0 | Sort order (≥0) |
| **isActive** | Boolean | ❌ | true | Activate/deactivate |

### **Success Response** (201)

```json
{
  "success": true,
  "message": "Achievement created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Story Explorer",
    "description": "Read 5 different stories",
    "icon": "🧭",
    "category": "reading",
    "type": "one_time",
    "targetValue": 5,
    "currentProgress": 0,
    "reward": {
      "points": 50,
      "badge": "507f1f77bcf86cd799439011"
    },
    "difficulty": "easy",
    "prerequisites": ["First Steps"],
    "order": 2,
    "isActive": true,
    "createdAt": "2026-04-11T10:35:00.000Z",
    "updatedAt": "2026-04-11T10:35:00.000Z"
  }
}
```

### **Error Responses**

**403 Unauthorized** - User is not admin
```json
{
  "success": false,
  "message": "Only admin users can create achievements"
}
```

**400 Bad Request** - Missing required fields
```json
{
  "success": false,
  "message": "Name and description are required"
}
```

**400 Bad Request** - Invalid target value
```json
{
  "success": false,
  "message": "Target value is required and must be at least 1"
}
```

**400 Bad Request** - Invalid prerequisites
```json
{
  "success": false,
  "message": "One or more prerequisite achievements do not exist"
}
```

**400 Bad Request** - Duplicate name
```json
{
  "success": false,
  "message": "Achievement with this name already exists"
}
```

---

## Example: Creating Complete Achievement Chain

### **Step 1: Create First Achievement (No Prerequisites)**

```bash
curl -X POST http://localhost:5000/api/gamification/achievements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "First Steps",
    "description": "Read your very first story",
    "icon": "👶",
    "category": "reading",
    "type": "one_time",
    "targetValue": 1,
    "reward": { "points": 25 },
    "difficulty": "easy",
    "order": 1
  }'
```

### **Step 2: Create Badge for Achievement**

```bash
curl -X POST http://localhost:5000/api/gamification/badges \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Reading Beginner",
    "description": "Badge earned for reading first story",
    "icon": "📖",
    "category": "reading",
    "tier": "bronze",
    "points": 10,
    "criteria": {
      "type": "story_count",
      "threshold": 1
    }
  }'
```

Save the badge ID, then create the second achievement with this badge ID.

### **Step 3: Create Second Achievement (With Prerequisites & Badge)**

```bash
curl -X POST http://localhost:5000/api/gamification/achievements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Story Explorer",
    "description": "Read 5 different stories",
    "icon": "🧭",
    "category": "reading",
    "type": "one_time",
    "targetValue": 5,
    "reward": {
      "points": 50,
      "badge": "507f1f77bcf86cd799439011"
    },
    "difficulty": "easy",
    "prerequisites": ["First Steps"],
    "order": 2
  }'
```

---

## Default Values Applied

### **If omitted, these values are used:**

**For Badge:**
```javascript
{
  icon: "🏆",
  category: "achievement",
  tier: "bronze",
  points: 10,
  rarity: "common",
  isActive: true
}
```

**For Achievement:**
```javascript
{
  icon: "⭐",
  category: "milestone",
  type: "one_time",
  reward: { points: 50, badge: null },
  difficulty: "medium",
  prerequisites: [],
  order: 0,
  isActive: true
}
```

---

## Valid Values Reference

### **Badge Categories**
- `reading` - Reading-related
- `streak` - Streak achievements
- `achievement` - General achievements
- `social` - Social interactions
- `special` - Special/limited badges

### **Badge Tiers**
- `bronze` - Common tier
- `silver` - Uncommon tier
- `gold` - Rare tier
- `platinum` - Epic tier
- `diamond` - Legendary tier

### **Badge Rarity**
- `common` - 60% probability
- `rare` - 25% probability
- `epic` - 12% probability
- `legendary` - 3% probability

### **Badge Criteria Types**
- `story_count` - Number of stories read
- `days_streak` - Consecutive days
- `total_points` - Total points earned
- `assignments_completed` - Assignments finished
- `custom` - Custom criteria

### **Achievement Categories**
- `reading` - Reading activity
- `consistency` - Consistency/streaks
- `milestone` - Major milestones
- `social` - Social achievements
- `exploration` - Exploration/discovery

### **Achievement Types**
- `one_time` - Unlocked once
- `repeatable` - Can be earned multiple times
- `progressive` - Tracks progress toward target

### **Achievement Difficulties**
- `easy` - 1-10 target value
- `medium` - 10-50 target value
- `hard` - 50-100 target value
- `expert` - 100+ target value

---

## Best Practices

### **Creating Achievements**

✅ **DO:**
- Create prerequisites in order (1 → 2 → 3)
- Use similar target values for same difficulty
- Order achievements by difficulty (`order` field)
- Give each achievement a unique, descriptive name
- Use relevant emojis for visual appeal
- Set sensible point rewards (more points for harder achievements)

❌ **DON'T:**
- Create circular prerequisites (A requires B, B requires A)
- Create achievements with missing prerequisites
- Use non-existent badge IDs
- Set very high target values for easy achievements
- Forget to set order field (makes UI sorting difficult)

### **Creating Badges**

✅ **DO:**
- Use badges to reward achievements
- Set appropriate point values
- Use category and tier to organize
- Set criteria thresholds matched to difficulty

❌ **DON'T:**
- Create badges without clear criteria
- Use unrealistic thresholds (threshold: 1000000)
- Create duplicate badge names
- Mix different rarities for same criteria

---

## Validation Rules

### **Name Field**
- Required
- Length: 3-50 characters
- Unique (no duplicates)

### **Description Field**
- Required
- Length: 10-200 characters
- Should clearly explain achievement/badge

### **Target Value** (Achievement only)
- Required
- Minimum: 1
- Maximum: reasonable (1000+)

### **Threshold** (Badge only)
- Required
- Minimum: 1
- Matched to criteria type

### **Prerequisites** (Achievement only)
- Optional
- Must reference existing achievements
- Can use multiple prerequisites
- Order matters (do easier first)

---

## Status Check

✅ **Implemented Features:**
- Admin authorization on create endpoints
- Default value application
- Prerequisites validation
- Data sanitization (trim, parseInt)
- Detailed error messages
- Badge/Achievement uniqueness check
- Field validation

**Server Status**: Restart your backend to apply changes:
```bash
cd backend
npm start
```

---

## Example cURL Commands

### **Create Badge**
```bash
curl -X POST http://localhost:5000/api/gamification/badges \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Badge",
    "description": "This is my custom badge",
    "criteria": {
      "type": "story_count",
      "threshold": 5
    }
  }'
```

### **Create Achievement**
```bash
curl -X POST http://localhost:5000/api/gamification/achievements \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Achievement",
    "description": "This is my custom achievement",
    "targetValue": 10,
    "difficulty": "easy"
  }'
```

---

**Version**: April 11, 2026
**Status**: ✅ Ready to Use
**Admin Only**: ✅ Protected endpoints
