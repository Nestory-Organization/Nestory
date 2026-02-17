# Nestory Backend API

A complete backend API built with Node.js, Express, MongoDB, and JWT authentication for user management.

## Features

- ✅ User Registration
- ✅ User Login
- ✅ JWT Authentication
- ✅ Password Hashing with bcrypt
- ✅ Protected Routes
- ✅ User Profile Management
- ✅ Admin Role Management
- ✅ MongoDB Database Integration

## Project Structure

```
backend/
├── config/
│   └── db.js                 # Database configuration
├── controllers/
│   └── authController.js     # Authentication logic
├── middleware/
│   └── authMiddleware.js     # Authentication & authorization middleware
├── models/
│   └── User.js               # User model schema
├── routes/
│   └── authRoutes.js         # Authentication routes
├── utils/
│   └── generateToken.js      # JWT token generator
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore file
├── package.json              # Dependencies and scripts
└── server.js                 # Application entry point
```

## Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Update the values in `.env` file:
     ```
     PORT=5000
     NODE_ENV=development
     MONGO_URI=mongodb://localhost:27017/nestory
     JWT_SECRET=your_jwt_secret_key_here
     JWT_EXPIRE=30d
     CLIENT_URL=http://localhost:3000
     ```

3. **Start MongoDB:**
   - Make sure MongoDB is installed and running on your system
   - Or use MongoDB Atlas (cloud database)

4. **Run the server:**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes

#### Register User
- **POST** `/api/auth/register`
- **Access:** Public
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

#### Login User
- **POST** `/api/auth/login`
- **Access:** Public
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

#### Get Current User Profile
- **GET** `/api/auth/me`
- **Access:** Private (Requires authentication)
- **Headers:**
  ```
  Authorization: Bearer <token>
  ```

#### Update User Profile
- **PUT** `/api/auth/profile`
- **Access:** Private
- **Headers:**
  ```
  Authorization: Bearer <token>
  ```
- **Body:**
  ```json
  {
    "name": "John Updated",
    "email": "johnupdated@example.com",
    "phoneNumber": "1234567890",
    "password": "newpassword123"
  }
  ```

#### Get All Users (Admin)
- **GET** `/api/auth/users`
- **Access:** Private/Admin
- **Headers:**
  ```
  Authorization: Bearer <token>
  ```

#### Delete User (Admin)
- **DELETE** `/api/auth/users/:id`
- **Access:** Private/Admin
- **Headers:**
  ```
  Authorization: Bearer <token>
  ```

## Response Format

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
  "message": "Error message",
  "error": "Error details (in development mode)"
}
```

## Authentication

This API uses JWT (JSON Web Token) for authentication. After successful login or registration, you'll receive a token that should be included in the Authorization header for protected routes:

```
Authorization: Bearer <your_token_here>
```

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **dotenv** - Environment variables
- **cors** - Cross-Origin Resource Sharing

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected routes middleware
- Role-based access control (User/Admin)
- Input validation
- Secure headers

## Development

To contribute or modify:

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

ISC

## Author

Your Name

---

**Note:** Make sure to change the `JWT_SECRET` in the `.env` file to a random, secure string before deploying to production.
