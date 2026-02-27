const express = require("express");
const router = express.Router();
const {
  createFamily,
  getMyFamily,
  getFamilyById,
  updateFamily,
  deleteFamily,
} = require("../controllers/familyController");
const { protect } = require("../middleware/authMiddleware");
const {
  handleValidationErrors,
} = require("../middleware/validationMiddleware");
const {
  createFamilyValidation,
  updateFamilyValidation,
} = require("../validators/familyValidator");

// All routes are protected (must be logged in)
router.post(
  "/",
  protect,
  createFamilyValidation,
  handleValidationErrors,
  createFamily,
);
router.get("/my", protect, getMyFamily);
router.get("/:id", protect, getFamilyById);
router.put(
  "/:id",
  protect,
  updateFamilyValidation,
  handleValidationErrors,
  updateFamily,
);
router.delete("/:id", protect, deleteFamily);

module.exports = router;
