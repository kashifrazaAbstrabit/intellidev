"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const inviteUserController_1 = require("../controllers/inviteUserController");
const router = express_1.default.Router();
router.route("/developers/invite").post(auth_1.isAuthenticatedUser, inviteUserController_1.inviteDeveloper);
router.route("/resend-invitation").post(auth_1.isAuthenticatedUser, inviteUserController_1.resendInvitation);
router
    .route("/developers/invite")
    .get(auth_1.isAuthenticatedUser, inviteUserController_1.getAllInvitedDeveloper);
router
    .route("/developers/invite/:devId")
    .delete(auth_1.isAuthenticatedUser, inviteUserController_1.deleteInviteDeveloper);
exports.default = router;
