# Assignment Management API - Postman Testing Guide

## Environment Setup

In Postman, create or update your environment with these variables:

| Variable        | Value                                             |
| --------------- | ------------------------------------------------- |
| `base_url`      | `http://localhost:5000`                           |
| `token`         | _(auto-set after login — see Step 0)_             |
| `child_id`      | _(from child management — see Step 1)_            |
| `story_id`      | _(from story library — see Step 2)_               |
| `assignment_id` | _(auto-set after create assignment — see Test 1)_ |

---

## Pre-requisites (Must Complete Before Assignment Tests)

### Step 0 — Login to Get Token

**Method:** `POST`
**URL:** `{{base_url}}/api/auth/login`
**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Tests tab script:**

```javascript
if (pm.response.code === 200) {
  pm.environment.set("token", pm.response.json().data.token);
}
```

---

### Step 1 — Get a Child ID

If you haven't added children yet, do so first.

**Method:** `GET`
**URL:** `{{base_url}}/api/children`
**Headers:**

```
Authorization: Bearer {{token}}
```

**Tests tab script:**

```javascript
if (pm.response.code === 200) {
  var data = pm.response.json().data; // data is a flat array
  if (data && data.length > 0) {
    pm.environment.set("child_id", data[0]._id);
    console.log("✅ child_id saved:", data[0]._id);
  }
}
```

---

### Step 2 — Get a Story ID

Use Member 1's story library to pick a story.

**Method:** `GET`
**URL:** `{{base_url}}/api/stories`
**Headers:**

```
Authorization: Bearer {{token}}
```

**Tests tab script:**

```javascript
if (pm.response.code === 200) {
  var stories = pm.response.json().data.stories; // data.stories — not data directly
  if (stories && stories.length > 0) {
    pm.environment.set("story_id", stories[0]._id);
    pm.environment.set("story_id_2", stories[1]._id); // save second story for Test 2
    console.log("✅ story_id saved:", stories[0]._id);
    console.log("✅ story_id_2 saved:", stories[1]._id);
  }
}
```

---

## Assignment Tests

### Test 1 — Assign a Story to a Child

**Method:** `POST`
**URL:** `{{base_url}}/api/assignments`
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (raw JSON):**

```json
{
  "childId": "{{child_id}}",
  "storyId": "{{story_id}}"
}
```

**Tests tab script** — auto-saves assignment ID:

```javascript
if (pm.response.code === 201) {
  pm.environment.set("assignment_id", pm.response.json().data._id);
}
```

**Expected Response:** `201 Created`

```json
{
  "success": true,
  "message": "Story assigned successfully",
  "data": {
    "_id": "667xyz...",
    "child": { "_id": "...", "name": "Kavin", "age": 8 },
    "story": {
      "_id": "...",
      "title": "The Magic Tree",
      "author": "...",
      "ageGroup": "early-reader"
    },
    "assignedBy": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "family": "664abc...",
    "status": "assigned",
    "dueDate": null,
    "completedAt": null,
    "notes": ""
  }
}
```

---

### Test 2 — Assign a Story with Due Date and Notes

**Method:** `POST`
**URL:** `{{base_url}}/api/assignments`
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (raw JSON):**

```json
{
  "childId": "{{child_id}}",
  "storyId": "{{story_id_2}}",
  "dueDate": "2026-03-15",
  "notes": "Please read this before the weekend."
}
```

**Expected Response:** `201 Created` — assignment with `dueDate` and `notes` populated.

---

### Test 3 — Get All Assignments for a Child

**Method:** `GET`
**URL:** `{{base_url}}/api/assignments/child/{{child_id}}`
**Headers:**

```
Authorization: Bearer {{token}}
```

**Expected Response:** `200 OK`

```json
{
  "success": true,
  "message": "Assignments retrieved successfully",
  "count": 2,
  "data": [
    {
      "_id": "667xyz...",
      "story": {
        "title": "The Magic Tree",
        "author": "...",
        "ageGroup": "early-reader",
        "coverImage": "..."
      },
      "status": "assigned",
      "dueDate": null,
      "completedAt": null,
      "notes": ""
    }
  ]
}
```

---

### Test 4 — Get Family Reading Dashboard

This shows all children and their assignment stats in one view.

**Method:** `GET`
**URL:** `{{base_url}}/api/assignments/family`
**Headers:**

```
Authorization: Bearer {{token}}
```

**Expected Response:** `200 OK`

```json
{
  "success": true,
  "message": "Family dashboard retrieved successfully",
  "data": {
    "family": {
      "familyId": "664abc...",
      "familyName": "Silva Family",
      "totalChildren": 2
    },
    "children": [
      {
        "childId": "665def...",
        "name": "Kavin",
        "age": 8,
        "avatar": "",
        "assignments": {
          "total": 2,
          "assigned": 1,
          "in_progress": 1,
          "completed": 0
        }
      },
      {
        "childId": "665ghi...",
        "name": "Sahas",
        "age": 6,
        "avatar": "",
        "assignments": {
          "total": 0,
          "assigned": 0,
          "in_progress": 0,
          "completed": 0
        }
      }
    ]
  }
}
```

---

### Test 5 — Get Single Assignment by ID

**Method:** `GET`
**URL:** `{{base_url}}/api/assignments/{{assignment_id}}`
**Headers:**

```
Authorization: Bearer {{token}}
```

**Expected Response:** `200 OK` — full assignment with child, story, and assignedBy populated.

---

### Test 6 — Update Status to "in_progress"

**Method:** `PUT`
**URL:** `{{base_url}}/api/assignments/{{assignment_id}}/status`
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (raw JSON):**

```json
{
  "status": "in_progress"
}
```

**Expected Response:** `200 OK`

```json
{
  "success": true,
  "message": "Assignment status updated successfully",
  "data": {
    "_id": "667xyz...",
    "status": "in_progress",
    "completedAt": null
  }
}
```

---

### Test 7 — Update Status to "completed"

**Method:** `PUT`
**URL:** `{{base_url}}/api/assignments/{{assignment_id}}/status`
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (raw JSON):**

```json
{
  "status": "completed"
}
```

**Expected Response:** `200 OK` — `completedAt` is now auto-set to current timestamp.

```json
{
  "success": true,
  "message": "Assignment status updated successfully",
  "data": {
    "status": "completed",
    "completedAt": "2026-02-25T..."
  }
}
```

---

### Test 8 — Revert Status back to "assigned"

**Method:** `PUT`
**URL:** `{{base_url}}/api/assignments/{{assignment_id}}/status`
**Body:**

```json
{
  "status": "assigned"
}
```

**Expected Response:** `200 OK` — `completedAt` is reset to `null`.

---

### Test 9 — Check Dashboard After Status Changes

Re-run Test 4 (GET `/api/assignments/family`) to confirm stats reflect the updated statuses.

---

### Test 10 — Delete Assignment

**Method:** `DELETE`
**URL:** `{{base_url}}/api/assignments/{{assignment_id}}`
**Headers:**

```
Authorization: Bearer {{token}}
```

**Expected Response:** `200 OK`

```json
{
  "success": true,
  "message": "Assignment removed successfully",
  "data": {}
}
```

---

## Negative / Validation Tests

### Test 11 — Duplicate Assignment (Same Story to Same Child)

Run **Test 1 again** with the exact same `childId` and `storyId`.

**Expected Response:** `400 Bad Request`

```json
{
  "success": false,
  "message": "This story is already assigned to this child"
}
```

---

### Test 12 — Assign to Another User's Child

Login as a different user and try to assign using the first user's `child_id`.

**Expected Response:** `403 Forbidden`

```json
{
  "success": false,
  "message": "Not authorized. You can only assign stories to your own children."
}
```

---

### Test 13 — Missing Child ID

**Method:** `POST`
**URL:** `{{base_url}}/api/assignments`
**Body:**

```json
{
  "storyId": "{{story_id}}"
}
```

**Expected Response:** `400 Bad Request`

```json
{
  "success": false,
  "errors": [{ "field": "childId", "message": "Child ID is required" }]
}
```

---

### Test 14 — Invalid Mongo ID Format

**Body:**

```json
{
  "childId": "not-a-valid-id",
  "storyId": "{{story_id}}"
}
```

**Expected Response:** `400 Bad Request`

```json
{
  "success": false,
  "errors": [{ "field": "childId", "message": "Invalid Child ID format" }]
}
```

---

### Test 15 — Past Due Date

**Body:**

```json
{
  "childId": "{{child_id}}",
  "storyId": "{{story_id}}",
  "dueDate": "2020-01-01"
}
```

**Expected Response:** `400 Bad Request`

```json
{
  "success": false,
  "errors": [
    { "field": "dueDate", "message": "Due date cannot be in the past" }
  ]
}
```

---

### Test 16 — Invalid Status Value

**Method:** `PUT`
**URL:** `{{base_url}}/api/assignments/{{assignment_id}}/status`
**Body:**

```json
{
  "status": "done"
}
```

**Expected Response:** `400 Bad Request`

```json
{
  "success": false,
  "errors": [
    {
      "field": "status",
      "message": "Status must be one of: assigned, in_progress, completed"
    }
  ]
}
```

---

### Test 17 — No Token

Remove the `Authorization` header on any request.

**Expected Response:** `401 Unauthorized`

```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

---

## Recommended Test Order

| #   | Test                                    | What It Verifies                          |
| --- | --------------------------------------- | ----------------------------------------- |
| 1   | Login                                   | Token obtained                            |
| 2   | Get children list                       | `child_id` saved                          |
| 3   | Get stories list                        | `story_id` saved                          |
| 4   | Create assignment (basic)               | Assignment created, `assignment_id` saved |
| 5   | Create assignment with due date & notes | Optional fields work                      |
| 6   | Get assignments for child               | Child's story list returned               |
| 7   | Get family dashboard                    | All children stats shown                  |
| 8   | Get single assignment                   | Populated data returned                   |
| 9   | Update status → `in_progress`           | Status changes, `completedAt` null        |
| 10  | Update status → `completed`             | `completedAt` auto-set                    |
| 11  | Re-check dashboard                      | Stats reflect completion                  |
| 12  | Delete assignment                       | Removed successfully                      |
| 13  | Duplicate assignment                    | `400` business rule                       |
| 14  | Other user's child                      | `403` ownership guard                     |
| 15  | Missing child ID                        | `400` validation                          |
| 16  | Invalid Mongo ID                        | `400` validation                          |
| 17  | Past due date                           | `400` validation                          |
| 18  | Invalid status                          | `400` validation                          |
| 19  | No token                                | `401` auth guard                          |

---

## Summary of Endpoints

| Method   | Endpoint                          | Description                 | Auth     |
| -------- | --------------------------------- | --------------------------- | -------- |
| `POST`   | `/api/assignments`                | Assign story to child       | Required |
| `GET`    | `/api/assignments/family`         | Family reading dashboard    | Required |
| `GET`    | `/api/assignments/child/:childId` | All assignments for a child | Required |
| `GET`    | `/api/assignments/:id`            | Get single assignment       | Required |
| `PUT`    | `/api/assignments/:id/status`     | Update assignment status    | Required |
| `DELETE` | `/api/assignments/:id`            | Remove assignment           | Required |

---

## Status Flow

```
assigned  →  in_progress  →  completed
              ↑                  ↓
              └──────────────────┘  (can revert back)
```
