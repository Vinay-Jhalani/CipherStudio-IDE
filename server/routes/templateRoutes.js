import express from "express";
import { initializeProjectTemplate } from "../controllers/templateController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/initialize/:projectId", protect, initializeProjectTemplate);

export default router;
