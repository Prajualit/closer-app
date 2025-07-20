// @ts-ignore
import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { uploadMedia } from "../controllers/create.controller.js";

const router = Router();

router.route("/create").post(verifyJWT, upload.single("file"), uploadMedia);

export default router;