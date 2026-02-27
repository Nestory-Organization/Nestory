# Child Management API - Postman Testing Guide

## Environment Setup

In Postman, create or update your environment with these variables:

| Variable    | Value                                         |
| ----------- | --------------------------------------------- |
| `base_url`  | `http://localhost:5000`                       |
| `token`     | _(auto-set after login — see Step 0)_         |
| `family_id` | _(auto-set after create family — see Step 1)_ |
| `child_id`  | _(auto-set after add child — see Test 1)_     |

---

## Pre-requisites (Must Complete Before Child Tests)

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

**Tests tab script** — auto-saves token:

```javascript
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.data.token);
}
```

**Expected Response:** `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "<your_jwt_token>"
  }
}
```

---

### Step 1 — Create a Family Group (Required Before Adding Children)

**Method:** `POST`
**URL:** `{{base_url}}/api/family`
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (raw JSON):**

```json
{
  "familyName": "Silva Family"
}
```

**Tests tab script** — auto-saves family ID:

```javascript
if (pm.response.code === 201) {
  var jsonData = pm.response.json();
  pm.environment.set("family_id", jsonData.data._id);
}
```

**Expected Response:** `201 Created`

```json
{
  "success": true,
  "message": "Family group created successfully",
  "data": {
    "_id": "664abc...",
    "familyName": "Silva Family",
    "parent": "abc123...",
    "children": [],
    "isActive": true
  }
}
```

> **Note:** If you already have a family, skip this step. Your `family_id` is already set.

---

## Child Management Tests

### Test 1 — Add a Child

**Method:** `POST`
**URL:** `{{base_url}}/api/children`
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (raw JSON):**

```json
{
  "name": "Kavin",
  "age": 8
}
```

**Tests tab script** — auto-saves child ID:

```javascript
if (pm.response.code === 201) {
  var jsonData = pm.response.json();
  pm.environment.set("child_id", jsonData.data._id);
}
```

**Expected Response:** `201 Created`

```json
{
  "success": true,
  "message": "Child added successfully",
  "data": {
    "_id": "665def...",
    "name": "Kavin",
    "age": 8,
    "avatar": "",
    "family": "664abc...",
    "parent": "abc123...",
    "isActive": true,
    "createdAt": "2026-02-24T...",
    "updatedAt": "2026-02-24T..."
  }
}
```

---

### Test 2 — Add a Child with Avatar

**Method:** `POST`
**URL:** `{{base_url}}/api/children`
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (raw JSON):**

```json
{
  "name": "Sahas",
  "age": 6,
  "avatar": "https://example.com/avatars/sahas.png"
}
```

**Expected Response:** `201 Created`

```json
{
  "success": true,
  "message": "Child added successfully",
  "data": {
    "_id": "665ghi...",
    "name": "Sahas",
    "age": 6,
    "avatar": "https://example.com/avatars/sahas.png",
    "family": "664abc...",
    "parent": "abc123...",
    "isActive": true
  }
}
```

---

### Test 3 — Get All Children

**Method:** `GET`
**URL:** `{{base_url}}/api/children`
**Headers:**

```
Authorization: Bearer {{token}}
```

No body needed.

**Expected Response:** `200 OK`

```json
{
  "success": true,
  "message": "Children retrieved successfully",
  "count": 2,
  "data": [
    {
      "_id": "665ghi...",
      "name": "Sahas",
      "age": 6,
      "avatar": "https://example.com/avatars/sahas.png",
      "isActive": true
    },
    {
      "_id": "665def...",
      "name": "Kavin",
      "age": 8,
      "avatar": "",
      "isActive": true
    }
  ]
}
```

---

### Test 4 — Get Single Child by ID

**Method:** `GET`
**URL:** `{{base_url}}/api/children/{{child_id}}`
**Headers:**

```
Authorization: Bearer {{token}}
```

No body needed.

**Expected Response:** `200 OK`

```json
{
  "success": true,
  "message": "Child retrieved successfully",
  "data": {
    "_id": "665def...",
    "name": "Kavin",
    "age": 8,
    "avatar": "",
    "family": {
      "_id": "664abc...",
      "familyName": "Silva Family"
    },
    "parent": "abc123...",
    "isActive": true
  }
}
```

> **Note:** `family` is populated and shows the family name.

---

### Test 5 — Update Child Profile

**Method:** `PUT`
**URL:** `{{base_url}}/api/children/{{child_id}}`
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (raw JSON):**

```json
{
  "name": "Kavin Silva",
  "age": 9
}
```

**Expected Response:** `200 OK`

```json
{
  "success": true,
  "message": "Child profile updated successfully",
  "data": {
    "_id": "665def...",
    "name": "Kavin Silva",
    "age": 9,
    "avatar": "",
    "family": "664abc...",
    "parent": "abc123...",
    "isActive": true
  }
}
```

---

### Test 6 — Update Avatar Only (Partial Update)

**Method:** `PUT`
**URL:** `{{base_url}}/api/children/{{child_id}}`
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (raw JSON):**

```json
{
  "avatar": "https://example.com/avatars/kavin-new.png"
}
```

**Expected Response:** `200 OK` — only avatar changes, name and age stay the same.

---

### Test 7 — Verify Family Has Children (Cross-check)

After adding children, verify the family document reflects them.

**Method:** `GET`
**URL:** `{{base_url}}/api/family/my`
**Headers:**

```
Authorization: Bearer {{token}}
```

**Expected Response:** `200 OK`

```json
{
  "success": true,
  "message": "Family group retrieved successfully",
  "data": {
    "_id": "664abc...",
    "familyName": "Silva Family",
    "parent": "abc123...",
    "children": [
      {
        "_id": "665def...",
        "name": "Kavin Silva",
        "age": 9,
        "avatar": "https://example.com/avatars/kavin-new.png",
        "isActive": true
      },
      {
        "_id": "665ghi...",
        "name": "Sahas",
        "age": 6,
        "avatar": "https://example.com/avatars/sahas.png",
        "isActive": true
      }
    ]
  }
}
```

---

### Test 8 — Delete a Child

**Method:** `DELETE`
**URL:** `{{base_url}}/api/children/{{child_id}}`
**Headers:**

```
Authorization: Bearer {{token}}
```

No body needed.

**Expected Response:** `200 OK`

```json
{
  "success": true,
  "message": "Child removed successfully",
  "data": {}
}
```

> **Note:** The child is also automatically removed from the family's `children` array. Verify with Test 7.

---

## Negative / Validation Tests

### Test 9 — Add Child Without Token

**Method:** `POST`
**URL:** `{{base_url}}/api/children`
**Headers:** _(no Authorization header)_
**Body:**

```json
{
  "name": "TestKid",
  "age": 5
}
```

**Expected Response:** `401 Unauthorized`

```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

---

### Test 10 — Add Child Without a Family

Use a **freshly registered user** who has no family, then try adding a child.

**Method:** `POST`
**URL:** `{{base_url}}/api/children`
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{new_user_token}}
```

**Body:**

```json
{
  "name": "Orphan",
  "age": 5
}
```

**Expected Response:** `404 Not Found`

```json
{
  "success": false,
  "message": "No family group found. Please create a family group first."
}
```

---

### Test 11 — Invalid Age (Over 17)

**Method:** `POST`
**URL:** `{{base_url}}/api/children`
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body:**

```json
{
  "name": "OldKid",
  "age": 20
}
```

**Expected Response:** `400 Bad Request`

```json
{
  "success": false,
  "errors": [
    {
      "field": "age",
      "message": "Age must be a whole number between 1 and 17"
    }
  ]
}
```

---

### Test 12 — Missing Required Name

**Method:** `POST`
**URL:** `{{base_url}}/api/children`
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body:**

```json
{
  "age": 7
}
```

**Expected Response:** `400 Bad Request`

```json
{
  "success": false,
  "errors": [
    {
      "field": "name",
      "message": "Child name is required"
    }
  ]
}
```

---

### Test 13 — Invalid Avatar URL

**Method:** `POST`
**URL:** `{{base_url}}/api/children`
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body:**

```json
{
  "name": "TestKid",
  "age": 5,
  "avatar": "not-a-valid-url"
}
```

**Expected Response:** `400 Bad Request`

```json
{
  "success": false,
  "errors": [
    {
      "field": "avatar",
      "message": "Avatar must be a valid URL"
    }
  ]
}
```

---

### Test 14 — Access Another User's Child

Login as a **different user** and try to access `{{child_id}}` owned by the first user.

**Method:** `GET`
**URL:** `{{base_url}}/api/children/{{child_id}}`
**Headers:**

```
Authorization: Bearer {{other_user_token}}
```

**Expected Response:** `403 Forbidden`

```json
{
  "success": false,
  "message": "Not authorized to access this child profile"
}
```

---

## Recommended Test Order

| #   | Test                             | What It Verifies                     |
| --- | -------------------------------- | ------------------------------------ |
| 1   | Login                            | Token obtained                       |
| 2   | Create Family                    | Family exists before adding children |
| 3   | Add Child (Kavin, 8)             | Child created, `child_id` saved      |
| 4   | Add Child with Avatar (Sahas, 6) | Multiple children + avatar URL       |
| 5   | Get All Children                 | Returns both children                |
| 6   | Get Single Child                 | Family name populated in response    |
| 7   | Update Child                     | Partial update works correctly       |
| 8   | Get My Family                    | Children array auto-updated          |
| 9   | Delete Child                     | Removed from DB and family array     |
| 10  | No Token                         | `401` guard works                    |
| 11  | No Family                        | `404` guard works                    |
| 12  | Age > 17                         | Validation rejects invalid age       |
| 13  | Missing Name                     | Validation rejects missing field     |
| 14  | Invalid Avatar URL               | Validation rejects bad URL           |
| 15  | Other User's Child               | `403` ownership guard works          |

---

## Summary of Endpoints

| Method   | Endpoint            | Description          | Auth     |
| -------- | ------------------- | -------------------- | -------- |
| `POST`   | `/api/children`     | Add child to family  | Required |
| `GET`    | `/api/children`     | Get all my children  | Required |
| `GET`    | `/api/children/:id` | Get single child     | Required |
| `PUT`    | `/api/children/:id` | Update child profile | Required |
| `DELETE` | `/api/children/:id` | Remove child         | Required |
