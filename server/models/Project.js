import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    projectSlug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please add a project name"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    rootFolderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
    },
    settings: {
      template: {
        type: String,
        default: "react",
        enum: [
          "react",
          "react-ts",
          "vanilla",
          "vanilla-ts",
          "vue",
          "vue-ts",
          "angular",
          "svelte",
          "node",
        ],
      },
      framework: {
        type: String,
        default: "react",
        enum: ["react", "vue", "angular", "vanilla"],
      },
      autoSave: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
projectSchema.index({ userId: 1, createdAt: -1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
