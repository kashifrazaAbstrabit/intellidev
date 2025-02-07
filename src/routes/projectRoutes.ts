import express from "express";
import {} from "../controllers/userController";
import { isAuthenticatedUser } from "../middleware/auth";
import { inviteDeveloper } from "../controllers/inviteUserController";
import {
  createProject,
  deleteProject,
  fetchProjectsForClient,
  fetchProjectsForDeveloper,
  fetchSingleProjectsForClient,
  updateProject,
} from "../controllers/projectController";

declare module "express-session" {
  interface Session {
    userType?: string;
  }
}

const router = express.Router();

router.route("/create/projects").post(isAuthenticatedUser, createProject);
router
  .route("/clients/projects")
  .get(isAuthenticatedUser, fetchProjectsForClient);
router
  .route("/client/project/:projectId")
  .get(isAuthenticatedUser, fetchSingleProjectsForClient);
router
  .route("/developers/projects")
  .get(isAuthenticatedUser, fetchProjectsForDeveloper);

router
  .route("/client/project/:projectId")
  .delete(isAuthenticatedUser, deleteProject);
router
  .route("/client/project/:projectId")
  .put(isAuthenticatedUser, updateProject);
export default router;
