import express from "express";
import {} from "../controllers/userController";
import { isAuthenticatedUser } from "../middleware/auth";
import {
  deleteInviteDeveloper,
  getAllInvitedDeveloper,
  inviteDeveloper,
  resendInvitation,
} from "../controllers/inviteUserController";

declare module "express-session" {
  interface Session {
    userType?: string;
  }
}

const router = express.Router();

router.route("/developers/invite").post(isAuthenticatedUser, inviteDeveloper);
router.route("/resend-invitation").post(isAuthenticatedUser, resendInvitation);
router
  .route("/developers/invite")
  .get(isAuthenticatedUser, getAllInvitedDeveloper);

router
  .route("/developers/invite/:devId")
  .delete(isAuthenticatedUser, deleteInviteDeveloper);

export default router;
