import { Router } from "express";
import { body, validationResult } from "express-validator";
import { registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middleware/multer.middleware.js";


const router = Router();

router.route("/register").post(
  upload.single("avatarUrl"),
  registerUser
);

export default router;