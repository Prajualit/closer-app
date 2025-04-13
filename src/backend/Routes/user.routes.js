import { Router } from "express";
import { registerUser, getUser } from "../controllers/registerUser.controllers.js";
import { upload } from "../middleware/multer.middleware.js";
import { loginUser, logoutUser } from "../controllers/loginUser.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

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

// secured routes

router.route("/logout").post(
  verifyJWT,
  logoutUser
)
router.route("/getUser").post(
  verifyJWT,
  getUser
)

export default router;