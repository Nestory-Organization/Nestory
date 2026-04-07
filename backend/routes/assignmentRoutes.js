const express = require("express");
const router = express.Router();
const {
  createAssignment,
  listAssignments,
  bulkUpdateAssignmentStatus,
  getAssignmentsByChild,
  getFamilyDashboard,
  getAssignmentById,
  updateAssignmentDetails,
  updateAssignmentStatus,
  deleteAssignment,
} = require("../controllers/assignmentController");
const { protect, parentOnly } = require("../middleware/authMiddleware");
const {
  handleValidationErrors,
} = require("../middleware/validationMiddleware");
const {
  createAssignmentValidation,
  listAssignmentsQueryValidation,
  updateStatusValidation,
  bulkUpdateStatusValidation,
  updateAssignmentDetailsValidation,
  assignmentIdParamValidation,
  childIdParamValidation,
} = require("../validators/assignmentValidator");

// All routes are protected (must be logged in)
router.post(
  "/",
  protect,
  parentOnly,
  createAssignmentValidation,
  handleValidationErrors,
  createAssignment,
);
router.get(
  "/",
  protect,
  parentOnly,
  listAssignmentsQueryValidation,
  handleValidationErrors,
  listAssignments,
);
router.put(
  "/bulk/status",
  protect,
  parentOnly,
  bulkUpdateStatusValidation,
  handleValidationErrors,
  bulkUpdateAssignmentStatus,
);
router.get("/family", protect, parentOnly, getFamilyDashboard);
router.get(
  "/child/:childId",
  protect,
  parentOnly,
  childIdParamValidation,
  handleValidationErrors,
  getAssignmentsByChild,
);
router.get(
  "/:id",
  protect,
  parentOnly,
  assignmentIdParamValidation,
  handleValidationErrors,
  getAssignmentById,
);
router.put(
  "/:id",
  protect,
  parentOnly,
  assignmentIdParamValidation,
  updateAssignmentDetailsValidation,
  handleValidationErrors,
  updateAssignmentDetails,
);
router.put(
  "/:id/status",
  protect,
  parentOnly,
  assignmentIdParamValidation,
  updateStatusValidation,
  handleValidationErrors,
  updateAssignmentStatus,
);
router.delete(
  "/:id",
  protect,
  parentOnly,
  assignmentIdParamValidation,
  handleValidationErrors,
  deleteAssignment,
);

module.exports = router;
