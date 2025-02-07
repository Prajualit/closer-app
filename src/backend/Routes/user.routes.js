import { Router } from "express";
import { registerUser } from "../controllers/registerUser.controllers.js";
import { upload } from "../middleware/multer.middleware.js";
import { loginUser } from "../controllers/loginUser.controllers.js";

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
router.route("/login").post(
  loginUser
);

export default router;