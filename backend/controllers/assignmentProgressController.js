const Assignment = require("../models/Assignment");
const Child = require("../models/Child");
const {
  enrichAssignmentsWithSessions,
  summarize,
} = require("../services/assignmentProgressService");

/**
 * @desc Progress analytics for parent's family (optional ?childId=)
 * @route GET /api/assignments/progress
 * @access Private (parent)
 */
exports.getParentProgressOverview = async (req, res) => {
  try {
    const { childId } = req.query;

    if (childId) {
      const child = await Child.findById(childId);
      if (!child) {
        return res.status(404).json({ success: false, message: "Child not found" });
      }
      if (child.parent.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    }

    const filter = { assignedBy: req.user._id };
    if (childId) filter.child = childId;

    const assignments = await Assignment.find(filter)
      .populate("child", "name age")
      .populate("story", "title author pageCount coverImage")
      .sort({ updatedAt: -1 });

    const rows = await enrichAssignmentsWithSessions(assignments);
    const summary = summarize(rows);

    return res.status(200).json({
      success: true,
      message: "Progress overview",
      data: {
        generatedAt: new Date().toISOString(),
        summary,
        assignments: rows,
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

/**
 * @desc Progress analytics for logged-in child
 * @route GET /api/assignments/me/progress
 * @access Private (child)
 */
exports.getMyProgressOverview = async (req, res) => {
  try {
    if (req.user.normalizedRole !== "child") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }
    if (!req.user.childProfile) {
      return res.status(400).json({
        success: false,
        message: "Child profile is not linked to this account",
      });
    }

    const assignments = await Assignment.find({ child: req.user.childProfile })
      .populate("child", "name age")
      .populate("story", "title author pageCount coverImage")
      .sort({ updatedAt: -1 });

    const rows = await enrichAssignmentsWithSessions(assignments);
    const summary = summarize(rows);

    return res.status(200).json({
      success: true,
      message: "Your reading progress",
      data: {
        generatedAt: new Date().toISOString(),
        summary,
        assignments: rows,
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
