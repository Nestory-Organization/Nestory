const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ type: "*/*" })); // Accept JSON regardless of Content-Type header
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
// Story Library Routes
app.use("/api/stories", require("./routes/storyLibrary/storyRoutes"));
// Family Management Routes
app.use("/api/family", require("./routes/familyRoutes"));
// Child Management Routes
app.use("/api/children", require("./routes/childRoutes"));
// Assignment Management Routes
app.use("/api/assignments", require("./routes/assignmentRoutes"));
// Welcome Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Nestory API",
    version: "1.0.0",
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
