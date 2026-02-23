# Family Management API - Postman Testing Guide

## Environment Setup

In Postman, create or update your environment with these variables:

| Variable    | Value                                         |
| ----------- | --------------------------------------------- |
| `base_url`  | `http://localhost:5000`                       |
| `token`     | _(auto-set after login — see Step 0)_         |
| `family_id` | _(auto-set after create family — see Test 1)_ |

---

## Step 0 — Get Auth Token (Required Before All Tests)

You must be logged in before testing any family endpoint.

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

**Test Script** — paste this in the Postman **Tests** tab to auto-save the token:

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

## Test 1 — Create Family Group

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

**Test Script** — auto-save family ID:

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
    "isActive": true,
    "createdAt": "2026-02-23T...",
    "updatedAt": "2026-02-23T..."
  }
}
```

---

## Test 2 — Get My Family

**Method:** `GET`  
**URL:** `{{base_url}}/api/family/my`  
**Headers:**

```
Authorization: Bearer {{token}}
```

No body needed.

**Expected Response:** `200 OK`

```json
{
  "success": true,
  "message": "Family group retrieved successfully",
  "data": {
    "_id": "664abc...",
    "familyName": "Silva Family",
    "parent": "abc123...",
    "children": [],
    "isActive": true
  }
}
```

---

## Test 3 — Get Family by ID

**Method:** `GET`  
**URL:** `{{base_url}}/api/family/{{family_id}}`  
**Headers:**

```
Authorization: Bearer {{token}}
```

No body needed.

**Expected Response:** `200 OK`

```json
{
  "success": true,
  "message": "Family retrieved successfully",
  "data": {
    "_id": "664abc...",
    "familyName": "Silva Family",
    "parent": "abc123...",
    "children": [],
    "isActive": true
  }
}
```

---

## Test 4 — Update Family Name

**Method:** `PUT`  
**URL:** `{{base_url}}/api/family/{{family_id}}`  
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (raw JSON):**

```json
{
  "familyName": "Silva Family Updated"
}
```

**Expected Response:** `200 OK`

```json
{
  "success": true,
  "message": "Family updated successfully",
  "data": {
    "_id": "664abc...",
    "familyName": "Silva Family Updated",
    "parent": "abc123...",
    "children": [],
    "isActive": true
  }
}
```

---

## Test 5 — Delete Family

**Method:** `DELETE`  
**URL:** `{{base_url}}/api/family/{{family_id}}`  
**Headers:**

```
Authorization: Bearer {{token}}
```

No body needed.

**Expected Response:** `200 OK`

```json
{
  "success": true,
  "message": "Family group deleted successfully",
  "data": {}
}
```

---

## Negative / Validation Tests

### Test 6 — Create Without Token (Unauthorized)

**Method:** `POST`  
**URL:** `{{base_url}}/api/family`  
**Headers:** _(no Authorization header)_  
**Body:**

```json
{
  "familyName": "Test Family"
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

### Test 7 — Create with Empty Family Name (Validation Error)

**Method:** `POST`  
**URL:** `{{base_url}}/api/family`  
**Headers:**

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body:**

```json
{
  "familyName": ""
}
```

**Expected Response:** `400 Bad Request`

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "familyName",
      "message": "Family name is required"
    }
  ]
}
```

---

### Test 8 — Create Duplicate Family (Same Parent)

Run **Test 1** again using the same token.

**Expected Response:** `400 Bad Request`

```json
{
  "success": false,
  "message": "You already have a family group. Only one family group is allowed per parent."
}
```

---

### Test 9 — Access Another User's Family

Login as a **different user** and try to access the first user's family ID.

**Method:** `GET`  
**URL:** `{{base_url}}/api/family/{{family_id}}`  
**Headers:**

```
Authorization: Bearer {{other_users_token}}
```

**Expected Response:** `403 Forbidden`

```json
{
  "success": false,
  "message": "Not authorized to access this family"
}
```

---

## Recommended Test Order

| Order | Test              | What It Verifies          |
| ----- | ----------------- | ------------------------- |
| 1     | Login → get token | Auth works                |
| 2     | Create Family     | Family created, ID saved  |
| 3     | Get My Family     | Ownership-based retrieval |
| 4     | Get Family by ID  | Direct ID retrieval       |
| 5     | Update Family     | Name update persists      |
| 6     | Duplicate Family  | Business rule enforced    |
| 7     | Empty Name        | Validation works          |
| 8     | No Token          | Auth guard works          |
| 9     | Other User Access | Ownership guard works     |
| 10    | Delete Family     | Cleanup + delete works    |

---

## Summary of Endpoints

| Method   | Endpoint          | Description         | Auth     |
| -------- | ----------------- | ------------------- | -------- |
| `POST`   | `/api/family`     | Create family group | Required |
| `GET`    | `/api/family/my`  | Get my family       | Required |
| `GET`    | `/api/family/:id` | Get family by ID    | Required |
| `PUT`    | `/api/family/:id` | Update family name  | Required |
| `DELETE` | `/api/family/:id` | Delete family       | Required |
