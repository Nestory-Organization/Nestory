const express = require("express");
const router = express.Router();
const {
  getMyChatGroup,
  getMyMessages,
  sendMessage,
  markRead,
  getUnread,
} = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

router.get("/my-group", protect, getMyChatGroup);
router.get("/messages", protect, getMyMessages);
router.post("/messages", protect, sendMessage);
router.patch("/messages/read", protect, markRead);
router.get("/unread", protect, getUnread);

module.exports = router;
