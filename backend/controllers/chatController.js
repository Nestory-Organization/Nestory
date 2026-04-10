const {
  resolveFamilyForUser,
  ensureChatGroupForFamily,
  createUserTextMessage,
  getMessages,
  getUnreadCount,
  markFamilyMessagesRead,
  getFamilyRoomName,
  serializeMessage,
} = require("../services/chatService");
const { emitFamilyChatEvent } = require("../realtime/socketServer");

const normalizeRole = (role) => (role === "user" ? "parent" : role);

const ensureChatContext = async (req, res) => {
  const userRole = normalizeRole(req.user.role);
  if (!["parent", "child"].includes(userRole)) {
    res.status(403).json({
      success: false,
      message: "Only parent and child accounts can access chat",
    });
    return null;
  }

  const family = await resolveFamilyForUser(req.user);
  if (!family) {
    res.status(404).json({
      success: false,
      message: "No family group found for this account",
    });
    return null;
  }

  const chatGroup = await ensureChatGroupForFamily(family);

  return { family, chatGroup };
};

exports.getMyChatGroup = async (req, res) => {
  try {
    const ctx = await ensureChatContext(req, res);
    if (!ctx) return;

    const { family, chatGroup } = ctx;

    const members = [
      {
        id: String(family.parent),
        displayName: "Parent",
        role: "parent",
      },
      ...(Array.isArray(family.children)
        ? family.children.map((child) => ({
            id: String(child._id || child.id),
            displayName: child.name || "Child",
            role: "child",
            avatar: child.avatar || "",
          }))
        : []),
    ];

    const unreadCount = await getUnreadCount({
      familyId: family._id,
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Chat group retrieved successfully",
      data: {
        id: String(chatGroup._id),
        familyId: String(family._id),
        name: chatGroup.name,
        room: getFamilyRoomName(family._id),
        lastMessageAt: chatGroup.lastMessageAt,
        lastMessagePreview: chatGroup.lastMessagePreview,
        unreadCount,
        members,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getMyMessages = async (req, res) => {
  try {
    const ctx = await ensureChatContext(req, res);
    if (!ctx) return;

    const { family } = ctx;
    const limit = Number(req.query.limit) || 50;
    const before =
      typeof req.query.before === "string" ? req.query.before : undefined;

    const rows = await getMessages({
      familyId: family._id,
      limit,
      before,
    });

    res.status(200).json({
      success: true,
      message: "Chat messages retrieved successfully",
      count: rows.length,
      data: rows.map(serializeMessage),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const ctx = await ensureChatContext(req, res);
    if (!ctx) return;

    const { family } = ctx;
    const content =
      typeof req.body.content === "string" ? req.body.content.trim() : "";

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const message = await createUserTextMessage({
      family,
      user: req.user,
      content,
    });

    const serialized = serializeMessage(message.toObject());

    emitFamilyChatEvent(family._id, "chat:new-message", {
      message: serialized,
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: serialized,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.markRead = async (req, res) => {
  try {
    const ctx = await ensureChatContext(req, res);
    if (!ctx) return;

    const { family } = ctx;
    const messageIds = Array.isArray(req.body.messageIds)
      ? req.body.messageIds
      : [];

    const result = await markFamilyMessagesRead({
      familyId: family._id,
      userId: req.user._id,
      messageIds,
    });

    const unreadCount = await getUnreadCount({
      familyId: family._id,
      userId: req.user._id,
    });

    emitFamilyChatEvent(family._id, "chat:read", {
      readerUserId: String(req.user._id),
      unreadCount,
      modifiedCount: result.modifiedCount || 0,
    });

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
      data: {
        modifiedCount: result.modifiedCount || 0,
        unreadCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getUnread = async (req, res) => {
  try {
    const ctx = await ensureChatContext(req, res);
    if (!ctx) return;

    const { family } = ctx;
    const unreadCount = await getUnreadCount({
      familyId: family._id,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Unread count retrieved successfully",
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
