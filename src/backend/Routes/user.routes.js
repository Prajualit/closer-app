import { Router } from "express";
import { body, validationResult } from "express-validator";
import { registerUser } from "../controllers/user.controllers.js";
import multer from "multer";
import { upload } from "../middleware/multer.middleware.js";


const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatarUrl",
      maxCount: 1,
    }
  ]),
  registerUser
);

export default router;