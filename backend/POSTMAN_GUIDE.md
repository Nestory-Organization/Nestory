# Postman Collection for Testing Nestory API

## Setting up Postman Environment

Create a new environment in Postman with the following variables:
- `base_url`: http://localhost:5000
- `token`: (will be set automatically after login/register)

## API Endpoints

### 1. Register User

**Method:** POST  
**URL:** `{{base_url}}/api/auth/register`  
**Headers:**
```
Content-Type: application/json
```
**Body (raw JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Test Script (Optional):**
```javascript
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.data.token);
}
```

---

### 2. Login User

**Method:** POST  
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

**Test Script (Optional):**
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.data.token);
}
```

---

### 3. Get Current User Profile

**Method:** GET  
**URL:** `{{base_url}}/api/auth/me`  
**Headers:**
```
Authorization: Bearer {{token}}
```

---

### 4. Update User Profile

**Method:** PUT  
**URL:** `{{base_url}}/api/auth/profile`  
**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```
**Body (raw JSON):**
```json
{
  "name": "John Updated",
  "phoneNumber": "1234567890",
  "profilePicture": "https://example.com/picture.jpg"
}
```

---

### 5. Get All Users (Admin Only)

**Method:** GET  
**URL:** `{{base_url}}/api/auth/users`  
**Headers:**
```
Authorization: Bearer {{token}}
```

**Note:** User must have admin role

---

### 6. Delete User (Admin Only)

**Method:** DELETE  
**URL:** `{{base_url}}/api/auth/users/:id`  
**Headers:**
```
Authorization: Bearer {{token}}
```

**URL Parameters:**
- `id`: User ID to delete

**Note:** User must have admin role

---

## Creating an Admin User

To create an admin user, you can either:

1. **Manually update in MongoDB:**
   - Register a normal user first
   - Use MongoDB Compass or mongo shell to update the user's role to 'admin'
   ```javascript
   db.users.updateOne(
     { email: "admin@example.com" },
     { $set: { role: "admin" } }
   )
   ```

2. **Or modify the register endpoint temporarily** to accept role in request body

---

## Testing Workflow

1. **Register** a new user (saves token automatically)
2. **Login** with the registered user (updates token)
3. **Get Profile** to verify authentication
4. **Update Profile** to test profile modification
5. Create an admin user and test admin endpoints

---

## Expected Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```
