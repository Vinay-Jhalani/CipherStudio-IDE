import express from "express";
import {
  createFile,
  getFileById,
  getProjectFiles,
  getFolderChildren,
  updateFile,
  deleteFile,
} from "../controllers/fileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, createFile);
router.route("/project/:projectId").get(protect, getProjectFiles);
router.route("/folder/:folderId").get(protect, getFolderChildren);
router
  .route("/:id")
  .get(protect, getFileById)
  .put(protect, updateFile)
  .delete(protect, deleteFile);

export default router;
