import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Please add a file/folder name"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["folder", "file"],
      required: true,
    },
    // Only for files
    s3Key: {
      type: String,
      default: null,
    },
    language: {
      type: String,
      default: "javascript",
    },
    sizeInBytes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better performance
fileSchema.index({ projectId: 1, parentId: 1 });
fileSchema.index({ projectId: 1, type: 1 });

const File = mongoose.model("File", fileSchema);

export default File;
