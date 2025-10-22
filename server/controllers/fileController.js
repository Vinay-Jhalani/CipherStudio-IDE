import File from "../models/File.js";
import Project from "../models/Project.js";
import {
  uploadToS3,
  getFromS3,
  deleteFromS3,
  updateInS3,
} from "../utils/s3Operations.js";

// @desc    Create new file or folder
// @route   POST /api/files
// @access  Private
export const createFile = async (req, res) => {
  try {
    const { projectId, parentId, name, type, content, language } = req.body;

    // Verify project exists and user owns it
    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }

    if (project.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized");
    }

    // Check if file/folder with same name exists in the same parent
    const existingFile = await File.findOne({
      projectId,
      parentId: parentId || null,
      name,
    });

    if (existingFile) {
      res.status(400);
      throw new Error("File or folder with this name already exists");
    }

    let s3Key = null;
    let sizeInBytes = 0;

    // If it's a file, upload content to S3
    if (type === "file" && content !== undefined) {
      s3Key = `projects/${projectId}/files/${Date.now()}-${name}`;
      const contentType = getContentType(language || "javascript");
      await uploadToS3(content, s3Key, contentType);
      sizeInBytes = Buffer.byteLength(content, "utf8");
    }

    const file = await File.create({
      projectId,
      parentId: parentId || null,
      name,
      type,
      s3Key,
      language: language || "javascript",
      sizeInBytes,
    });

    res.status(201).json(file);
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Get file/folder by ID
// @route   GET /api/files/:id
// @access  Private
export const getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).populate("projectId");

    if (!file) {
      res.status(404);
      throw new Error("File not found");
    }

    // Check if user owns the project
    const project = await Project.findById(file.projectId);
    if (project.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized");
    }

    // If it's a file, get content from S3
    let content = null;
    if (file.type === "file" && file.s3Key) {
      content = await getFromS3(file.s3Key);
    }

    res.json({
      ...file.toObject(),
      content,
    });
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Get all files/folders in a project
// @route   GET /api/files/project/:projectId
// @access  Private
export const getProjectFiles = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and user owns it
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }

    if (project.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized");
    }

    const files = await File.find({ projectId }).sort({ type: 1, name: 1 });

    // Fetch content from R2 for all files
    const filesWithContent = await Promise.all(
      files.map(async (file) => {
        const fileObj = file.toObject();

        // If it's a file (not folder), fetch content from R2
        if (file.type === "file" && file.s3Key) {
          try {
            fileObj.content = await getFromS3(file.s3Key);
          } catch (error) {
            console.error(
              `❌ Error fetching content for file ${file.name}:`,
              error
            );
            fileObj.content = ""; // Fallback to empty string if fetch fails
          }
        }

        return fileObj;
      })
    );

    res.json(filesWithContent);
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Get children of a folder
// @route   GET /api/files/folder/:folderId
// @access  Private
export const getFolderChildren = async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await File.findById(folderId);
    if (!folder) {
      res.status(404);
      throw new Error("Folder not found");
    }

    // Verify user owns the project
    const project = await Project.findById(folder.projectId);
    if (project.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized");
    }

    const children = await File.find({ parentId: folderId }).sort({
      type: 1,
      name: 1,
    });

    res.json(children);
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Update file content or rename
// @route   PUT /api/files/:id
// @access  Private
export const updateFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      res.status(404);
      throw new Error("File not found");
    }

    // Verify user owns the project
    const project = await Project.findById(file.projectId);
    if (project.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized");
    }

    // Update name if provided
    if (req.body.name) {
      file.name = req.body.name;
    }

    // Update language if provided
    if (req.body.language) {
      file.language = req.body.language;
    }

    // Update parentId if provided (for moving files/folders)
    if (req.body.parentId !== undefined) {
      // Validate that new parent is a folder (if not null)
      if (req.body.parentId !== null) {
        const parentFolder = await File.findById(req.body.parentId);
        if (!parentFolder) {
          res.status(404);
          throw new Error("Parent folder not found");
        }
        if (parentFolder.type !== "folder") {
          res.status(400);
          throw new Error("Parent must be a folder");
        }
        if (parentFolder.projectId.toString() !== file.projectId.toString()) {
          res.status(400);
          throw new Error("Cannot move to a different project");
        }
      }

      file.parentId = req.body.parentId;
    }

    // Update content if it's a file and content is provided
    if (file.type === "file" && req.body.content !== undefined) {
      if (!file.s3Key) {
        // Create new S3 key if doesn't exist
        file.s3Key = `projects/${file.projectId}/files/${Date.now()}-${
          file.name
        }`;
      }

      const contentType = getContentType(file.language);
      await updateInS3(req.body.content, file.s3Key, contentType);
      file.sizeInBytes = Buffer.byteLength(req.body.content, "utf8");

      // Update project's updatedAt timestamp
      await Project.findByIdAndUpdate(file.projectId, {
        updatedAt: new Date(),
      });
    }

    const updatedFile = await file.save();
    res.json(updatedFile);
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Delete file or folder
// @route   DELETE /api/files/:id
// @access  Private
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      res.status(404);
      throw new Error("File not found");
    }

    // Verify user owns the project
    const project = await Project.findById(file.projectId);
    if (project.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized");
    }

    // If it's a folder, delete all children recursively
    if (file.type === "folder") {
      await deleteFolder(file._id);
    } else {
      // If it's a file, delete from S3
      if (file.s3Key) {
        await deleteFromS3(file.s3Key);
      }
    }

    // Delete the file/folder
    await File.deleteOne({ _id: file._id });

    res.json({ message: "File removed" });
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// Helper function to delete folder and all its children recursively
const deleteFolder = async (folderId) => {
  const children = await File.find({ parentId: folderId });

  for (const child of children) {
    if (child.type === "folder") {
      await deleteFolder(child._id);
    } else {
      // Delete file from S3
      if (child.s3Key) {
        await deleteFromS3(child.s3Key);
      }
    }
    await File.deleteOne({ _id: child._id });
  }
};

// Helper function to get content type based on language
const getContentType = (language) => {
  const contentTypes = {
    javascript: "application/javascript",
    jsx: "application/javascript",
    typescript: "application/typescript",
    tsx: "application/typescript",
    html: "text/html",
    css: "text/css",
    json: "application/json",
    markdown: "text/markdown",
    python: "text/x-python",
    java: "text/x-java",
  };

  return contentTypes[language] || "text/plain";
};
