"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const passport_1 = require("../utils/passport");
const setTokensAndRedirect_1 = require("../utils/setTokensAndRedirect");
const router = express_1.default.Router();
router.route("/register").post(userController_1.register);
router.route("/login").post(userController_1.login);
router.route("/logout").post(auth_1.isAuthenticatedUser, userController_1.logout);
router.route("/refresh-token").post(userController_1.refreshAccessToken);
router.route("/verify/email/:token").get(userController_1.verifyEmail);
router.route("/forgot/password").post(userController_1.forgotPassword);
router.route("/reset/password/:token").put(userController_1.resetPassword);
router.route("/me").get(auth_1.isAuthenticatedUser, userController_1.getUserDetails);
router.route("/me/update").put(auth_1.isAuthenticatedUser, userController_1.updateUserDetails);
router
    .route("/active/delete/:id")
    .delete(auth_1.isAuthenticatedUser, userController_1.deleteActiveUser);
router.route("/password/update").put(auth_1.isAuthenticatedUser, userController_1.updateUserPassword);
router
    .route("/users/active")
    .get(auth_1.isAuthenticatedUser, userController_1.getAllDeveloperforClient);
router
    .route("/users/developers")
    .get(auth_1.isAuthenticatedUser, userController_1.getAllClientsforDeveloper);
// // Google Authentication Routes
//routes for sign up with google  --------------------------------------------------------------->
router.get("/auth/signup-with-google", (req, res, next) => {
    const userType = req.query.user_type;
    const inviteToken = req.query.invite_token; // Get inviteToken from query params
    req.session.userType = userType;
    req.session.inviteToken =
        typeof inviteToken === "string" ? inviteToken : undefined;
    next();
}, passport_1.PasspORt.authenticate("google-signup", { scope: ["profile", "email"] }));
router.get("/auth/signup-with-google/callback", (req, res, next) => {
    passport_1.PasspORt.authenticate("google-signup", (err, user, info) => {
        if (err || !user) {
            const errorMessage = (info === null || info === void 0 ? void 0 : info.message) || "Signup failed. Please try again.";
            return res.redirect(`${process.env.CLIENT_URL}/signup?error=${encodeURIComponent(errorMessage)}`);
        }
        req.logIn(user, (loginErr) => __awaiter(void 0, void 0, void 0, function* () {
            if (loginErr) {
                const errorMessage = "Signup process failed. Please try again.";
                return res.redirect(`${process.env.CLIENT_URL}/signup?error=${encodeURIComponent(errorMessage)}`);
            }
            // If signup and login are successful
            try {
                yield (0, setTokensAndRedirect_1.setTokensAndRedirect)(req, res, user);
            }
            catch (error) {
                console.error("Error in signup callback:", error.message || error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        }));
    })(req, res, next);
});
//routes for sign in with google ----------------------------------------------------------------->
router.get("/auth/login-with-google", passport_1.PasspORt.authenticate("google-login", { scope: ["profile", "email"] }));
// Callback route for Google login
router.get("/auth/login-with-google/callback", (req, res, next) => {
    passport_1.PasspORt.authenticate("google-login", (err, user, info) => {
        if (err || !user) {
            const errorMessage = (info === null || info === void 0 ? void 0 : info.message) || "Authentication failed";
            return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent(errorMessage)}`);
        }
        req.logIn(user, (loginErr) => __awaiter(void 0, void 0, void 0, function* () {
            if (loginErr) {
                const errorMessage = "Login failed. Please try again.";
                return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent(errorMessage)}`);
            }
            // If authentication and login are successful
            try {
                yield (0, setTokensAndRedirect_1.setTokensAndRedirect)(req, res, user);
            }
            catch (error) {
                console.error("Error in callback:", error.message || error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        }));
    })(req, res, next);
});
// Failure route if Google authentication fails
router.get("/auth/failed", (req, res) => {
    res.status(401).json({ message: " authentication failed." });
});
// //Github authentication -------------------------------------------------------------------------------->
//routes for sign up with github  --------------------------------------------------------------->
router.get("/auth/signup-with-github", (req, res, next) => {
    const inviteToken = req.query.invite_token; // Get inviteToken from query params
    req.session.inviteToken =
        typeof inviteToken === "string" ? inviteToken : undefined;
    next();
}, passport_1.PasspORt.authenticate("github-signup", { scope: ["user:email"] }));
router.get("/auth/signup-with-github/callback", (req, res, next) => {
    passport_1.PasspORt.authenticate("github-signup", (err, user, info) => {
        if (err || !user) {
            const errorMessage = (info === null || info === void 0 ? void 0 : info.message) || "Signup failed. Please try again.";
            return res.redirect(`${process.env.CLIENT_URL}/signup?error=${encodeURIComponent(errorMessage)}`);
        }
        req.logIn(user, (loginErr) => __awaiter(void 0, void 0, void 0, function* () {
            if (loginErr) {
                const errorMessage = "Signup process failed. Please try again.";
                return res.redirect(`${process.env.CLIENT_URL}/signup?error=${encodeURIComponent(errorMessage)}`);
            }
            // If signup and login are successful
            try {
                yield (0, setTokensAndRedirect_1.setTokensAndRedirect)(req, res, user);
            }
            catch (error) {
                console.error("Error in GitHub signup callback:", error.message || error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        }));
    })(req, res, next);
});
//routes for sign in with github  --------------------------------------------------------------->
router.get("/auth/login-with-github", passport_1.PasspORt.authenticate("github-login", { scope: ["user:email"] }));
// Callback route for Github login
router.get("/auth/login-with-github/callback", (req, res, next) => {
    passport_1.PasspORt.authenticate("github-login", (err, user, info) => {
        if (err || !user) {
            const errorMessage = (info === null || info === void 0 ? void 0 : info.message) || "Authentication failed";
            return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent(errorMessage)}`);
        }
        req.logIn(user, (loginErr) => __awaiter(void 0, void 0, void 0, function* () {
            if (loginErr) {
                const errorMessage = "Login failed. Please try again.";
                return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent(errorMessage)}`);
            }
            // If authentication and login are successful
            try {
                yield (0, setTokensAndRedirect_1.setTokensAndRedirect)(req, res, user);
            }
            catch (error) {
                console.error("Error in callback:", error.message || error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        }));
    })(req, res, next);
});
exports.default = router;
