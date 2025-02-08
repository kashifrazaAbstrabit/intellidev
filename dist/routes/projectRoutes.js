"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const projectController_1 = require("../controllers/projectController");
const router = express_1.default.Router();
router.route("/create/projects").post(auth_1.isAuthenticatedUser, projectController_1.createProject);
router
    .route("/clients/projects")
    .get(auth_1.isAuthenticatedUser, projectController_1.fetchProjectsForClient);
router
    .route("/client/project/:projectId")
    .get(auth_1.isAuthenticatedUser, projectController_1.fetchSingleProjectsForClient);
router
    .route("/developers/projects")
    .get(auth_1.isAuthenticatedUser, projectController_1.fetchProjectsForDeveloper);
router
    .route("/client/project/:projectId")
    .delete(auth_1.isAuthenticatedUser, projectController_1.deleteProject);
router
    .route("/client/project/:projectId")
    .put(auth_1.isAuthenticatedUser, projectController_1.updateProject);
exports.default = router;
