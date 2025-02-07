import express from "express";
import {
  deleteActiveUser,
  forgotPassword,
  getAllClientsforDeveloper,
  getAllDeveloperforClient,
  getUserDetails,
  login,
  logout,
  refreshAccessToken,
  register,
  resetPassword,
  updateUserDetails,
  updateUserPassword,
  verifyEmail,
} from "../controllers/userController";
import { isAuthenticatedUser } from "../middleware/auth";

import { PasspORt } from "../utils/passport";
import { setTokensAndRedirect } from "../utils/setTokensAndRedirect";
import { User } from "../types/user";

declare module "express-session" {
  interface Session {
    userType?: string;
    inviteToken?: string;
  }
}

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(isAuthenticatedUser, logout);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/verify/email/:token").get(verifyEmail);
router.route("/forgot/password").post(forgotPassword);
router.route("/reset/password/:token").put(resetPassword);
router.route("/me").get(isAuthenticatedUser, getUserDetails);
router.route("/me/update").put(isAuthenticatedUser, updateUserDetails);
router
  .route("/active/delete/:id")
  .delete(isAuthenticatedUser, deleteActiveUser);
router.route("/password/update").put(isAuthenticatedUser, updateUserPassword);
router
  .route("/users/active")
  .get(isAuthenticatedUser, getAllDeveloperforClient);
router
  .route("/users/developers")
  .get(isAuthenticatedUser, getAllClientsforDeveloper);

// // Google Authentication Routes

//routes for sign up with google  --------------------------------------------------------------->
router.get(
  "/auth/signup-with-google",
  (req, res, next) => {
    const userType = req.query.user_type as string;
    const inviteToken = req.query.invite_token; // Get inviteToken from query params
    req.session.userType = userType;
    req.session.inviteToken =
      typeof inviteToken === "string" ? inviteToken : undefined;

    next();
  },
  PasspORt.authenticate("google-signup", { scope: ["profile", "email"] })
);

router.get("/auth/signup-with-google/callback", (req, res, next) => {
  PasspORt.authenticate("google-signup", (err: any, user: User, info: any) => {
    if (err || !user) {
      const errorMessage = info?.message || "Signup failed. Please try again.";
      return res.redirect(
        `${process.env.CLIENT_URL}/signup?error=${encodeURIComponent(
          errorMessage
        )}`
      );
    }

    req.logIn(user, async (loginErr) => {
      if (loginErr) {
        const errorMessage = "Signup process failed. Please try again.";
        return res.redirect(
          `${process.env.CLIENT_URL}/signup?error=${encodeURIComponent(
            errorMessage
          )}`
        );
      }

      // If signup and login are successful
      try {
        await setTokensAndRedirect(req, res, user);
      } catch (error: any) {
        console.error("Error in signup callback:", error.message || error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });
  })(req, res, next);
});

//routes for sign in with google ----------------------------------------------------------------->
router.get(
  "/auth/login-with-google",
  PasspORt.authenticate("google-login", { scope: ["profile", "email"] })
);

// Callback route for Google login
router.get("/auth/login-with-google/callback", (req, res, next) => {
  PasspORt.authenticate("google-login", (err: any, user: User, info: any) => {
    if (err || !user) {
      const errorMessage = info?.message || "Authentication failed";
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=${encodeURIComponent(
          errorMessage
        )}`
      );
    }

    req.logIn(user, async (loginErr) => {
      if (loginErr) {
        const errorMessage = "Login failed. Please try again.";
        return res.redirect(
          `${process.env.CLIENT_URL}/login?error=${encodeURIComponent(
            errorMessage
          )}`
        );
      }

      // If authentication and login are successful
      try {
        await setTokensAndRedirect(req, res, user);
      } catch (error: any) {
        console.error("Error in callback:", error.message || error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });
  })(req, res, next);
});

// Failure route if Google authentication fails
router.get("/auth/failed", (req, res) => {
  res.status(401).json({ message: " authentication failed." });
});

// //Github authentication -------------------------------------------------------------------------------->

//routes for sign up with github  --------------------------------------------------------------->
router.get(
  "/auth/signup-with-github",
  (req, res, next) => {
    const inviteToken = req.query.invite_token; // Get inviteToken from query params
    req.session.inviteToken =
      typeof inviteToken === "string" ? inviteToken : undefined;

    next();
  },
  PasspORt.authenticate("github-signup", { scope: ["user:email"] })
);

router.get("/auth/signup-with-github/callback", (req, res, next) => {
  PasspORt.authenticate("github-signup", (err: any, user: User, info: any) => {
    if (err || !user) {
      const errorMessage = info?.message || "Signup failed. Please try again.";
      return res.redirect(
        `${process.env.CLIENT_URL}/signup?error=${encodeURIComponent(
          errorMessage
        )}`
      );
    }

    req.logIn(user, async (loginErr) => {
      if (loginErr) {
        const errorMessage = "Signup process failed. Please try again.";
        return res.redirect(
          `${process.env.CLIENT_URL}/signup?error=${encodeURIComponent(
            errorMessage
          )}`
        );
      }

      // If signup and login are successful
      try {
        await setTokensAndRedirect(req, res, user);
      } catch (error: any) {
        console.error(
          "Error in GitHub signup callback:",
          error.message || error
        );
        res.status(500).json({ message: "Internal Server Error" });
      }
    });
  })(req, res, next);
});

//routes for sign in with github  --------------------------------------------------------------->
router.get(
  "/auth/login-with-github",
  PasspORt.authenticate("github-login", { scope: ["user:email"] })
);

// Callback route for Github login
router.get("/auth/login-with-github/callback", (req, res, next) => {
  PasspORt.authenticate("github-login", (err: any, user: User, info: any) => {
    if (err || !user) {
      const errorMessage = info?.message || "Authentication failed";
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=${encodeURIComponent(
          errorMessage
        )}`
      );
    }

    req.logIn(user, async (loginErr) => {
      if (loginErr) {
        const errorMessage = "Login failed. Please try again.";
        return res.redirect(
          `${process.env.CLIENT_URL}/login?error=${encodeURIComponent(
            errorMessage
          )}`
        );
      }

      // If authentication and login are successful
      try {
        await setTokensAndRedirect(req, res, user);
      } catch (error: any) {
        console.error("Error in callback:", error.message || error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });
  })(req, res, next);
});

export default router;
