import express from "express";
import {
  getAuthenticatedUser,
  updateMembership,
  updateNextMembership,
  // addProjectJoined,
  // addProjectOwned,
  // removeProjectJoined,
  // removeProjectOwned,
  updateUserPassword,
  updateUserSettings,
  userActivate,
  userDeactivate,
  userDelete,
  userSignIn,
  userSignUp,
  verifyAndUpdateMembership,
} from "../controllers/user/userController";
import { authenticateUser } from "../middleware/authenticateUser";
const userRouter = express.Router();

userRouter.get("/", authenticateUser, getAuthenticatedUser);
userRouter.post("/signin", userSignIn);
userRouter.post("/signup", userSignUp);
userRouter.patch("/update-password/:token", updateUserPassword);
userRouter.patch("/update-settings", authenticateUser, updateUserSettings);
userRouter.patch("/activate/:token", authenticateUser, userActivate);
userRouter.patch("/deactivate/:token", authenticateUser, userDeactivate);
userRouter.get(
  "/verify-membership",
  authenticateUser,
  verifyAndUpdateMembership
);
userRouter.patch("/update-membership", authenticateUser, updateMembership);
userRouter.patch(
  "/update-next-membership",
  authenticateUser,
  updateNextMembership
);
userRouter.post("/delete/:token", authenticateUser, userDelete);

export default userRouter;
