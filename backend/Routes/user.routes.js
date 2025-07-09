import { Router } from "express";
import {
  registerUser,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  editUser,
  verifyPassword,
  changePassword,
  deleteUserAccount,
  searchUsers,
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowStatus,
  getUserPhotos,
  getUserFilms,
} from "../controllers/user.controllers.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(upload.single("avatarUrl"), registerUser);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);


router.route("/logout").post(verifyJWT, logoutUser);
router.route("/getUser").get(verifyJWT, getCurrentUser);
router.route("/search").get(verifyJWT, searchUsers);
router.route("/profile/:userId").get(verifyJWT, getUserProfile);
router.route("/follow").post(verifyJWT, followUser);
router.route("/unfollow").post(verifyJWT, unfollowUser);
router.route("/follow-status/:userId").get(verifyJWT, getFollowStatus);
router.route("/photos/:userId").get(verifyJWT, getUserPhotos);
router.route("/films/:userId").get(verifyJWT, getUserFilms);
router
  .route("/update-profile")
  .post(verifyJWT, upload.single("avatarUrl"), editUser);
router.route("/verify-password").post(verifyJWT, verifyPassword);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/delete-account").delete(verifyJWT, deleteUserAccount);

export default router;
