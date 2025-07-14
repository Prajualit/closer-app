import { Router } from "express";
import { fixCloudinaryUrls } from "../controllers/fix-urls.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Add this route temporarily to fix existing URLs
router.route("/fix-cloudinary-urls").post(verifyJWT, fixCloudinaryUrls);

export default router;
