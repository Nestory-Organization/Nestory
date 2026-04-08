const { body, param } = require("express-validator");

exports.startSessionValidation = [
  body("childId")
    .notEmpty()
    .withMessage("childId is required")
    .isMongoId()
    .withMessage("Invalid childId format"),

  body("storyId").optional().isMongoId().withMessage("Invalid storyId format"),

  body("bookId").optional().isMongoId().withMessage("Invalid bookId format"),

  body().custom((value) => {
    if (!value.storyId && !value.bookId) {
      throw new Error("Either storyId or bookId is required");
    }
    return true;
  }),

  body("totalPages")
    .optional()
    .isInt({ min: 1 })
    .withMessage("totalPages must be a positive integer"),
];

exports.updateSessionValidation = [
  body("sessionId")
    .notEmpty()
    .withMessage("sessionId is required")
    .isMongoId()
    .withMessage("Invalid sessionId format"),

  body("pagesRead")
    .optional()
    .isInt({ min: 0 })
    .withMessage("pagesRead must be a non-negative integer"),

  body("timeSpent")
    .optional()
    .isInt({ min: 0 })
    .withMessage("timeSpent must be a non-negative integer"),
];

exports.childIdParamValidation = [
  param("childId")
    .notEmpty()
    .withMessage("childId is required")
    .isMongoId()
    .withMessage("Invalid childId format"),
];
