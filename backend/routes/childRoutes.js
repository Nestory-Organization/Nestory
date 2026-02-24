const express = require("express");
const router = express.Router();
const {
  addChild,
  getChildren,
  getChildById,
  updateChild,
  deleteChild,
} = require("../controllers/childController");
const { protect } = require("../middleware/authMiddleware");
const {
  handleValidationErrors,
} = require("../middleware/validationMiddleware");
const {
  addChildValidation,
  updateChildValidation,
} = require("../validators/childValidator");

// All routes are protected (must be logged in)
router.post("/", protect, addChildValidation, handleValidationErrors, addChild);
router.get("/", protect, getChildren);
router.get("/:id", protect, getChildById);
router.put(
  "/:id",
  protect,
  updateChildValidation,
  handleValidationErrors,
  updateChild,
);
router.delete("/:id", protect, deleteChild);

module.exports = router;
