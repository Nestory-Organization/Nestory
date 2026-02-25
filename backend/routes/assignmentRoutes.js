const express = require("express");
const router = express.Router();
const {
  createAssignment,
  getAssignmentsByChild,
  getFamilyDashboard,
  getAssignmentById,
  updateAssignmentStatus,
  deleteAssignment,
} = require("../controllers/assignmentController");
const { protect } = require("../middleware/authMiddleware");
const {
  handleValidationErrors,
} = require("../middleware/validationMiddleware");
const {
  createAssignmentValidation,
  updateStatusValidation,
} = require("../validators/assignmentValidator");

// All routes are protected (must be logged in)
router.post(
  "/",
  protect,
  createAssignmentValidation,
  handleValidationErrors,
  createAssignment,
);
router.get("/family", protect, getFamilyDashboard);
router.get("/child/:childId", protect, getAssignmentsByChild);
router.get("/:id", protect, getAssignmentById);
router.put(
  "/:id/status",
  protect,
  updateStatusValidation,
  handleValidationErrors,
  updateAssignmentStatus,
);
router.delete("/:id", protect, deleteAssignment);

module.exports = router;
