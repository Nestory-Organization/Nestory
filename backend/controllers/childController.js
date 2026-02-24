const Child = require("../models/Child");
const Family = require("../models/Family");

// @desc    Add a child to the parent's family
// @route   POST /api/children
// @access  Private
exports.addChild = async (req, res) => {
  try {
    const { name, age, avatar } = req.body;

    // Parent must have a family group first
    const family = await Family.findOne({ parent: req.user._id });
    if (!family) {
      return res.status(404).json({
        success: false,
        message: "No family group found. Please create a family group first.",
      });
    }

    // Create the child
    const child = await Child.create({
      name,
      age,
      avatar: avatar || "",
      family: family._id,
      parent: req.user._id,
    });

    // Add child reference to the family's children array
    family.children.push(child._id);
    await family.save();

    res.status(201).json({
      success: true,
      message: "Child added successfully",
      data: child,
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

// @desc    Get all children in the parent's family
// @route   GET /api/children
// @access  Private
exports.getChildren = async (req, res) => {
  try {
    const family = await Family.findOne({ parent: req.user._id });
    if (!family) {
      return res.status(404).json({
        success: false,
        message: "No family group found. Please create a family group first.",
      });
    }

    const children = await Child.find({
      parent: req.user._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Children retrieved successfully",
      count: children.length,
      data: children,
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

// @desc    Get a single child by ID
// @route   GET /api/children/:id
// @access  Private
exports.getChildById = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id).populate(
      "family",
      "familyName",
    );

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Only the parent who owns this child can view it
    if (child.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this child profile",
      });
    }

    res.status(200).json({
      success: true,
      message: "Child retrieved successfully",
      data: child,
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

// @desc    Update a child profile
// @route   PUT /api/children/:id
// @access  Private
exports.updateChild = async (req, res) => {
  try {
    const { name, age, avatar } = req.body;

    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Only the parent who owns this child can update it
    if (child.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this child profile",
      });
    }

    child.name = name || child.name;
    child.age = age !== undefined ? age : child.age;
    child.avatar = avatar !== undefined ? avatar : child.avatar;
    await child.save();

    res.status(200).json({
      success: true,
      message: "Child profile updated successfully",
      data: child,
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

// @desc    Delete a child (remove from family)
// @route   DELETE /api/children/:id
// @access  Private
exports.deleteChild = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Only the parent who owns this child can delete it
    if (child.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this child profile",
      });
    }

    // Remove child reference from the family's children array
    await Family.findByIdAndUpdate(child.family, {
      $pull: { children: child._id },
    });

    await Child.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Child removed successfully",
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
