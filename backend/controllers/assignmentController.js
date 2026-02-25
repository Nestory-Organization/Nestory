const Assignment = require("../models/Assignment");
const Child = require("../models/Child");
const Family = require("../models/Family");
require("../models/storyLibrary/Story"); // Register Story model for populate

// @desc    Assign a story to a child
// @route   POST /api/assignments
// @access  Private

exports.createAssignment = async (req, res) => {
  try {
    const { childId, storyId, dueDate, notes } = req.body;

    // Verify the child exists and belongs to the logged-in parent
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }
    if (child.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "Not authorized. You can only assign stories to your own children.",
      });
    }

    // Check for duplicate assignment (same story to same child)
    const existing = await Assignment.findOne({
      child: childId,
      story: storyId,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This story is already assigned to this child",
      });
    }

    const assignment = await Assignment.create({
      child: childId,
      story: storyId,
      assignedBy: req.user._id,
      family: child.family,
      dueDate: dueDate || null,
      notes: notes || "",
    });

    // Populate for a rich response
    await assignment.populate([
      { path: "child", select: "name age" },
      { path: "story", select: "title author ageGroup coverImage" },
      { path: "assignedBy", select: "name email" },
    ]);

    res.status(201).json({
      success: true,
      message: "Story assigned successfully",
      data: assignment,
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

// @desc    Get all assignments for a specific child
// @route   GET /api/assignments/child/:childId
// @access  Private
exports.getAssignmentsByChild = async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }
    if (child.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this child's assignments",
      });
    }

    const assignments = await Assignment.find({ child: req.params.childId })
      .populate("story", "title author ageGroup coverImage readingLevel")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Assignments retrieved successfully",
      count: assignments.length,
      data: assignments,
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

// @desc    Get family reading dashboard (all children + their assignment stats)
// @route   GET /api/assignments/family
// @access  Private
exports.getFamilyDashboard = async (req, res) => {
  try {
    const family = await Family.findOne({ parent: req.user._id });
    if (!family) {
      return res.status(404).json({
        success: false,
        message: "No family group found. Please create a family group first.",
      });
    }

    const children = await Child.find({ parent: req.user._id, isActive: true });

    // Build per-child stats using aggregation
    const childStats = await Promise.all(
      children.map(async (child) => {
        const assignments = await Assignment.find({ child: child._id });
        const total = assignments.length;
        const assigned = assignments.filter(
          (a) => a.status === "assigned",
        ).length;
        const inProgress = assignments.filter(
          (a) => a.status === "in_progress",
        ).length;
        const completed = assignments.filter(
          (a) => a.status === "completed",
        ).length;

        return {
          childId: child._id,
          name: child.name,
          age: child.age,
          avatar: child.avatar,
          assignments: {
            total,
            assigned,
            in_progress: inProgress,
            completed,
          },
        };
      }),
    );

    res.status(200).json({
      success: true,
      message: "Family dashboard retrieved successfully",
      data: {
        family: {
          familyId: family._id,
          familyName: family.familyName,
          totalChildren: children.length,
        },
        children: childStats,
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

// @desc    Get a single assignment by ID
// @route   GET /api/assignments/:id
// @access  Private
exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("child", "name age")
      .populate("story", "title author ageGroup coverImage readingLevel")
      .populate("assignedBy", "name email");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (assignment.assignedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this assignment",
      });
    }

    res.status(200).json({
      success: true,
      message: "Assignment retrieved successfully",
      data: assignment,
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

// @desc    Update assignment status
// @route   PUT /api/assignments/:id/status
// @access  Private
exports.updateAssignmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (assignment.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this assignment",
      });
    }

    assignment.status = status;
    // Auto-set completedAt when marked completed
    if (status === "completed") {
      assignment.completedAt = new Date();
    } else {
      assignment.completedAt = null;
    }
    await assignment.save();

    await assignment.populate([
      { path: "child", select: "name age" },
      { path: "story", select: "title author" },
    ]);

    res.status(200).json({
      success: true,
      message: "Assignment status updated successfully",
      data: assignment,
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

// @desc    Delete an assignment
// @route   DELETE /api/assignments/:id
// @access  Private
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (assignment.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this assignment",
      });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Assignment removed successfully",
      data: {},
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
