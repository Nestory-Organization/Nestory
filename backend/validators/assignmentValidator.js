const { body } = require("express-validator");

// Validation for creating an assignment
exports.createAssignmentValidation = [
  body("childId")
    .notEmpty()
    .withMessage("Child ID is required")
    .isMongoId()
    .withMessage("Invalid Child ID format"),

  body("storyId")
    .notEmpty()
    .withMessage("Story ID is required")
    .isMongoId()
    .withMessage("Invalid Story ID format"),

  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date (YYYY-MM-DD)")
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Due date cannot be in the past");
      }
      return true;
    }),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Notes cannot exceed 300 characters"),
];

// Validation for updating assignment status
exports.updateStatusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["assigned", "in_progress", "completed"])
    .withMessage("Status must be one of: assigned, in_progress, completed"),
];
