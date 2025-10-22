import Project from "../models/Project.js";
import File from "../models/File.js";

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      projectSlug,
      settings,
      template = "react",
    } = req.body;

    // Check if project slug already exists
    const slugExists = await Project.findOne({ projectSlug });
    if (slugExists) {
      res.status(400);
      throw new Error("Project slug already exists");
    }

    // Create project with template setting
    // Sandpack will automatically generate the template files on the frontend
    const projectSettings = { ...settings, template };

    const project = await Project.create({
      userId: req.user._id,
      name,
      description,
      projectSlug: projectSlug || name.toLowerCase().replace(/\s+/g, "-"),
      settings: projectSettings,
    });

    // Don't create root folder automatically - users can create folders as needed
    // This prevents unnecessary folders like "R+J" from cluttering the project

    // Return project - Sandpack will handle template file generation on frontend
    res.status(201).json(project);
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Get all projects of a user
// @route   GET /api/projects/:userId
// @access  Private
export const getUserProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.params.userId })
      .sort({ updatedAt: -1 })
      .populate("userId", "firstName lastName email");

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("userId", "firstName lastName email")
      .populate("rootFolderId");

    if (project) {
      // Check if user owns the project
      if (project.userId._id.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to access this project");
      }

      res.json(project);
    } else {
      res.status(404);
      throw new Error("Project not found");
    }
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      // Check if user owns the project
      if (project.userId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to update this project");
      }

      project.name = req.body.name || project.name;
      project.description =
        req.body.description !== undefined
          ? req.body.description
          : project.description;

      if (req.body.settings) {
        project.settings = { ...project.settings, ...req.body.settings };
      }

      const updatedProject = await project.save();
      res.json(updatedProject);
    } else {
      res.status(404);
      throw new Error("Project not found");
    }
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      // Check if user owns the project
      if (project.userId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to delete this project");
      }

      // Delete all files and folders associated with the project
      await File.deleteMany({ projectId: project._id });

      // Delete the project
      await Project.deleteOne({ _id: project._id });

      res.json({ message: "Project removed" });
    } else {
      res.status(404);
      throw new Error("Project not found");
    }
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};
