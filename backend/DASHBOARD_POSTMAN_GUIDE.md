# Family Dashboard - Postman Testing Guide

This guide covers all 3 endpoints for the **Family Dashboard** feature.

---

## Setup - Authentication

All dashboard endpoints require a valid JWT token.

### Step 1 — Login to get token

**POST** `http://localhost:5000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "lithiraransika12@gmail.com",
  "password": "Lithira123"
}
```

**Copy the `token` field from the response**, then add it to all subsequent requests:

**Header for all dashboard requests:**
```
Authorization: Bearer <your_token_here>
```

---

## Endpoint 1 — Full Family Dashboard

`GET /api/dashboard/family`

Returns the complete family reading picture:
- Family info
- Overall totals (assigned / in_progress / completed) with completion rate
- Most active reader (child with most completed books)
- Per-child stats breakdown
- Recent 5 assignments
- Recent 5 completed assignments

### Postman Setup

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `http://localhost:5000/api/dashboard/family` |
| Authorization | Bearer Token (paste token from login) |

No body required.

### Expected Response (200 OK)
```json
{
  "success": true,
  "message": "Family dashboard retrieved successfully",
  "data": {
    "family": {
      "familyId": "699c755f5e2195c002a32ff7",
      "familyName": "Ransika Family",
      "totalChildren": 2
    },
    "overallStats": {
      "total": 3,
      "assigned": 1,
      "in_progress": 1,
      "completed": 1,
      "completionRate": "33%"
    },
    "mostActiveReader": {
      "childId": "699dde13acaaae6ef870d7ca",
      "name": "Sahas Updated",
      "completedStories": 1
    },
    "children": [
      {
        "childId": "699dde13acaaae6ef870d7ca",
        "name": "Sahas Updated",
        "age": 9,
        "avatar": "",
        "assignments": {
          "total": 2,
          "assigned": 1,
          "in_progress": 0,
          "completed": 1,
          "completionRate": "50%"
        }
      },
      {
        "childId": "699dddeeacaaae6ef870d7c5",
        "name": "Kavin",
        "age": 8,
        "avatar": "",
        "assignments": {
          "total": 1,
          "assigned": 0,
          "in_progress": 1,
          "completed": 0,
          "completionRate": "0%"
        }
      }
    ],
    "recentAssignments": [ "...5 assignments with story and child details..." ],
    "recentCompletions": [ "...5 completed assignments with story and child details..." ]
  }
}
```

### Test Script (Postman Tests tab)
```javascript
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Success is true", () => pm.expect(pm.response.json().success).to.be.true);
pm.test("Has overallStats", () => pm.expect(pm.response.json().data.overallStats).to.exist);
pm.test("Has children array", () => pm.expect(pm.response.json().data.children).to.be.an('array'));
pm.test("Has mostActiveReader", () => pm.expect(pm.response.json().data.mostActiveReader).to.exist);
```

---

## Endpoint 2 — Child Detailed Dashboard

`GET /api/dashboard/child/:childId`

Returns a deep-dive for a single child:
- Child info
- Completion stats with percentage
- Upcoming due dates (nearest 3)
- All assignments split by status (assigned / in_progress / completed) with full story details

### Postman Setup

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `http://localhost:5000/api/dashboard/child/699dde13acaaae6ef870d7ca` |
| Authorization | Bearer Token |

Replace `699dde13acaaae6ef870d7ca` with the actual child ID from your DB.

> **Tip:** Use your Children list endpoint first to find child IDs:
> `GET http://localhost:5000/api/children`

### Expected Response (200 OK)
```json
{
  "success": true,
  "message": "Child dashboard retrieved successfully",
  "data": {
    "child": {
      "childId": "699dde13acaaae6ef870d7ca",
      "name": "Sahas Updated",
      "age": 9,
      "avatar": "",
      "family": {
        "_id": "699c755f5e2195c002a32ff7",
        "familyName": "Ransika Family"
      }
    },
    "stats": {
      "total": 2,
      "assigned": 1,
      "in_progress": 0,
      "completed": 1,
      "completionRate": "50%"
    },
    "upcomingDue": [],
    "assignedStories": [
      {
        "_id": "...",
        "story": {
          "title": "Space Explorer",
          "author": "...",
          "coverImage": "...",
          "ageGroup": "6-8"
        },
        "status": "assigned",
        "dueDate": null,
        "notes": ""
      }
    ],
    "inProgressStories": [],
    "completedStories": [
      {
        "_id": "...",
        "story": {
          "title": "The Magic Forest",
          "author": "...",
          "coverImage": "...",
          "ageGroup": "6-8"
        },
        "status": "completed",
        "completedAt": "2025-07-25T10:30:00.000Z"
      }
    ]
  }
}
```

### Test Script (Postman Tests tab)
```javascript
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Has child info", () => pm.expect(pm.response.json().data.child).to.exist);
pm.test("Has stats", () => pm.expect(pm.response.json().data.stats).to.exist);
pm.test("Has completionRate", () => pm.expect(pm.response.json().data.stats.completionRate).to.be.a('string'));
pm.test("Has assignedStories array", () => pm.expect(pm.response.json().data.assignedStories).to.be.an('array'));
pm.test("Has completedStories array", () => pm.expect(pm.response.json().data.completedStories).to.be.an('array'));
```

### Error Cases

**Child not found (404):**
```json
{
  "success": false,
  "message": "Child not found"
}
```

**Wrong parent accessing another user's child (403):**
```json
{
  "success": false,
  "message": "Not authorized to view this child's dashboard"
}
```

---

## Endpoint 3 — Family Summary (Quick Stats)

`GET /api/dashboard/summary`

Returns a compact summary — useful for a header widget or overview card. No population, just numbers.

### Postman Setup

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `http://localhost:5000/api/dashboard/summary` |
| Authorization | Bearer Token |

No body required.

### Expected Response (200 OK)
```json
{
  "success": true,
  "message": "Family summary retrieved successfully",
  "data": {
    "familyName": "Ransika Family",
    "totalChildren": 2,
    "totalAssignments": 3,
    "assigned": 1,
    "in_progress": 1,
    "completed": 1,
    "completionRate": "33%"
  }
}
```

### Test Script (Postman Tests tab)
```javascript
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Has familyName", () => pm.expect(pm.response.json().data.familyName).to.be.a('string'));
pm.test("Has completionRate", () => pm.expect(pm.response.json().data.completionRate).to.be.a('string'));
pm.test("totalChildren is a number", () => pm.expect(pm.response.json().data.totalChildren).to.be.a('number'));
```

---

## Common Errors

| Status | Message | Fix |
|--------|---------|-----|
| 401 | No token / Unauthorized | Add `Authorization: Bearer <token>` header |
| 404 | No family group found | Create a family first via `POST /api/family` |
| 404 | Child not found | Check the child ID exists via `GET /api/children` |
| 403 | Not authorized to view this child's dashboard | You must be the parent who owns that child |
| 500 | Server error | Check the backend console for details |

---

## Quick Test Order

1. **Login** → copy token
2. **GET** `/api/dashboard/summary` → fastest sanity check
3. **GET** `/api/dashboard/family` → full dashboard
4. **GET** `/api/dashboard/child/:childId` → drill into a specific child

---

## Environment Variable Tip

In Postman, create a collection variable `base_url = http://localhost:5000` and `token = <your jwt>`, then use `{{base_url}}/api/dashboard/family` and set `Authorization: Bearer {{token}}` on the collection level so all requests inherit it automatically.
