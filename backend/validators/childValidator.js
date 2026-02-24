const { body } = require("express-validator");

// Validation rules for adding a child
exports.addChildValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Child name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Child name must be between 2 and 50 characters"),

  body("age")
    .notEmpty()
    .withMessage("Child age is required")
    .isInt({ min: 1, max: 17 })
    .withMessage("Age must be a whole number between 1 and 17"),

  body("avatar")
    .optional()
    .trim()
    .isURL()
    .withMessage("Avatar must be a valid URL"),
];

// Validation rules for updating a child
exports.updateChildValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Child name cannot be empty")
    .isLength({ min: 2, max: 50 })
    .withMessage("Child name must be between 2 and 50 characters"),

  body("age")
    .optional()
    .isInt({ min: 1, max: 17 })
    .withMessage("Age must be a whole number between 1 and 17"),

  body("avatar")
    .optional()
    .trim()
    .isURL()
    .withMessage("Avatar must be a valid URL"),
];
