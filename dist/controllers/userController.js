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
exports.deleteActiveUser = exports.signupWithGithub = exports.loginWithGithub = exports.signupWithGoogle = exports.loginWithGoogle = exports.resetPassword = exports.forgotPassword = exports.updateUserPassword = exports.updateUserDetails = exports.getAllClientsforDeveloper = exports.getAllDeveloperforClient = exports.getUserDetails = exports.refreshAccessToken = exports.logout = exports.login = exports.verifyEmail = exports.register = void 0;
const database_1 = __importDefault(require("../config/database"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const sendEmail_1 = require("../utils/sendEmail");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ms_1 = __importDefault(require("ms"));
const crypto_1 = __importDefault(require("crypto"));
const sendToken_1 = require("../utils/sendToken");
const generateColor_1 = require("../utils/generateColor");
/**
 * register
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { first_name, last_name, email, password, user_type, auth_type, country, invitationToken, } = req.body;
        if (!first_name ||
            !last_name ||
            !email ||
            !password ||
            !user_type ||
            !auth_type ||
            !country) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }
        // Check if it's an invitation-based signup
        let isInvited = false;
        let clientId = null;
        if (invitationToken) {
            const hashedToken = crypto_1.default
                .createHash("sha256")
                .update(invitationToken)
                .digest("hex");
            const invite = yield database_1.default.inviteUser.findUnique({
                where: {
                    invitation_token: hashedToken,
                    invitation_expiry: {
                        gte: new Date(),
                    },
                },
            });
            if (!invite ||
                !invite.invitation_expiry ||
                invite.invitation_expiry < new Date()) {
                res
                    .status(400)
                    .json({ message: "Invalid or expired invitation token." });
                return;
            }
            if (invite.email !== email) {
                res
                    .status(400)
                    .json({ message: "Email does not match the invitation." });
                return;
            }
            isInvited = true;
            clientId = invite === null || invite === void 0 ? void 0 : invite.user_id;
            // Remove the used invitation token
            yield database_1.default.inviteUser.delete({
                where: { invitation_token: hashedToken },
            });
        }
        const existingUser = yield database_1.default.user.findUnique({
            where: { email: email },
        });
        if (existingUser) {
            res.status(400).json({ message: "Email already exists" });
            return;
        }
        // Hashed password for email authentication
        let password_hash = null;
        if (auth_type === "email" && password) {
            const salt = yield bcrypt_1.default.genSalt(10);
            password_hash = yield bcrypt_1.default.hash(password, salt);
        }
        else {
            password_hash = null;
        }
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        const hashedToken = crypto_1.default
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        const newUser = yield database_1.default.user.create({
            data: {
                first_name,
                last_name,
                email,
                password: password_hash,
                country,
                verification_token: !isInvited ? hashedToken : null,
                is_verified: isInvited ? true : false,
                verification_token_expiry: !isInvited ? expiry : null,
                user_type: user_type,
                auth_type: auth_type,
                status: isInvited ? "active" : "inactive",
                color: (0, generateColor_1.generateRandomColor)(),
            },
        });
        if (isInvited && clientId) {
            yield database_1.default.clientDeveloper.create({
                data: {
                    client_id: Number(clientId),
                    developer_id: newUser.id,
                },
            });
        }
        //Here i am going to generate verification token
        if (newUser) {
            const verificationUrl = `${process.env.CLIENT_URL}/verify/email/${verificationToken}`;
            if (!isInvited) {
                const htmlMessage = `
   
        Hello ${first_name} ${last_name},
        
        Welcome to our platform! Please verify your email by clicking the link below:
        
       ${verificationUrl} Verify Email
        
        If you did not create an account, please ignore this email.
        
        Best regards,
        The IntelliDev Team
       `;
                yield (0, sendEmail_1.sendEmail)({
                    email,
                    subject: "Verify your email address",
                    message: htmlMessage,
                });
            }
            const WelcomeMessage = `
          Hello ${first_name} ${last_name},

          Welcome to the IntelliDev Platform! We're excited to have you on board. You've successfully registered, and your account is now ready to use.

          If you have any questions or need assistance, feel free to reach out to our support team.

          We look forward to helping you achieve great things on our platform!

          Best regards,
          The IntelliDev Team
       `;
            yield (0, sendEmail_1.sendEmail)({
                email,
                subject: "Welcome to the IntelliDev Platform",
                message: WelcomeMessage,
            });
        }
        res.status(201).json({
            success: true,
            message: isInvited
                ? "Welcome! Your account has been activated. You can now log in."
                : "User created successfully. Please verify your email.",
            user: newUser,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});
exports.register = register;
/**
 * Verify email after user clicks verification link
 * @param {Request} req
 * @param {Response} res
 */
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.params;
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const user = yield database_1.default.user.findFirst({
            where: {
                verification_token: hashedToken,
                verification_token_expiry: {
                    gte: new Date(),
                },
            },
        });
        if (!user) {
            res.status(400).json({ message: "Invalid or expired verification link" });
            return;
        }
        yield database_1.default.user.update({
            where: {
                id: user.id,
            },
            data: {
                is_verified: true,
                verification_token: null,
                verification_token_expiry: null,
            },
        });
        res
            .status(200)
            .json({ message: "Email verified successfully, you can now log in." });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.verifyEmail = verifyEmail;
/**
 * login
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }
        const user = yield database_1.default.user.findUnique({
            where: { email: email },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (user.auth_type !== "email") {
            res.status(400).json({
                message: `This account is registered via ${user.auth_type}. Please log in using ${user.auth_type}.`,
            });
            return;
        }
        //if user is still not verified
        if (!user.is_verified) {
            const currentTime = new Date();
            if (user.auth_type === "email") {
                if (!user.verification_token_expiry ||
                    currentTime > user.verification_token_expiry) {
                    const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
                    const hashedToken = crypto_1.default
                        .createHash("sha256")
                        .update(verificationToken)
                        .digest("hex");
                    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
                    yield database_1.default.user.update({
                        where: { email: email },
                        data: {
                            verification_token: hashedToken,
                            verification_token_expiry: expiryTime,
                        },
                    });
                    const verificationUrl = `${process.env.CLIENT_URL}/verify/email/${verificationToken}`;
                    const message = `
          Hello ${user.first_name} ${user.last_name},

          Your previous verification link has expired. Please verify your email by clicking the link below:

          ${verificationUrl}

          If you did not request this, please ignore this email.

          Best regards,
          The Team
        `;
                    yield (0, sendEmail_1.sendEmail)({
                        email,
                        subject: "Resend: Verify your email address",
                        message,
                    });
                    res.status(400).json({
                        message: "Verification link expired. A new link has been sent to your email.",
                    });
                    return;
                }
                else {
                    res.status(400).json({
                        message: `Email not verified. Please check your inbox.`,
                    });
                    return;
                }
            }
            return;
        }
        if (!user.password) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        yield database_1.default.user.update({
            where: {
                email: email,
            },
            data: {
                last_login_at: new Date(),
            },
        });
        const { accessToken, refreshToken } = yield (0, sendToken_1.generateAccessAndRefreshTokens)(user.id);
        const accessTokenExpire = process.env.ACCESS_TOKEN_EXPIRE || "30m";
        const refreshTokenExpire = process.env.REFRESH_TOKEN_EXPIRE || "1d";
        if (!accessTokenExpire || !refreshTokenExpire) {
            throw new Error("Environment variables for token expiration are not defined.");
        }
        const optionsForAccessToken = {
            expires: new Date(Date.now() + ((0, ms_1.default)(accessTokenExpire) || 0)), // Ensure it's a valid number
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "strict",
        };
        const optionsForRefreshToken = {
            expires: new Date(Date.now() + ((0, ms_1.default)(refreshTokenExpire) || 0)), // Ensure it's a valid number
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "none",
        };
        res
            .status(200)
            .cookie("accessToken", accessToken, optionsForAccessToken)
            .cookie("refreshToken", refreshToken, optionsForRefreshToken)
            .json({
            success: true,
            message: "Logged in successfully",
            user,
            refreshToken,
            accessToken,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.login = login;
/**
 * logout
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.body.user;
        const user = yield database_1.default.user.findUnique({
            where: {
                id: id,
            },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Set refreshToken to NULL
        yield database_1.default.user.update({
            where: {
                id: user.id,
            },
            data: {
                refreshtoken: null,
            },
        });
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
        };
        res
            .status(200)
            .clearCookie("accessToken", Object.assign(Object.assign({}, options), { maxAge: 0, sameSite: "strict" }))
            .clearCookie("refreshToken", Object.assign(Object.assign({}, options), { maxAge: 0, sameSite: "strict" }))
            .json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.logout = logout;
/**
 * Refresh Access Token
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const refreshAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, process.env.REFRESH_TOKEN_SECRET);
        }
        catch (err) {
            res.status(401).json({ message: "Invalid or expired refresh token" });
            return;
        }
        const userId = decodedToken.id;
        const user = yield database_1.default.user.findUnique({
            where: {
                id: userId,
            },
        });
        if (!user) {
            res.status(401).json({ message: "Invalid refresh token" });
            return;
        }
        if (token !== (user === null || user === void 0 ? void 0 : user.refreshtoken)) {
            res.status(401).json({ message: "Refresh token expired or used" });
            return;
        }
        const { accessToken, refreshToken } = yield (0, sendToken_1.generateAccessAndRefreshTokens)(user.id);
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Secure only in production
            sameSite: "Strict",
        };
        res
            .status(200)
            .cookie("accessToken", accessToken, Object.assign(Object.assign({}, options), { maxAge: 30 * 60 * 1000, sameSite: "strict" })) // 30 minutes
            .cookie("refreshToken", refreshToken, Object.assign(Object.assign({}, options), { maxAge: 24 * 60 * 60 * 1000, sameSite: "strict" })) // 1 days
            .json({
            success: true,
            message: "Access token refreshed",
            accessToken,
        });
    }
    catch (error) {
        console.error("Error refreshing token:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.refreshAccessToken = refreshAccessToken;
/**
 * Get user details
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const getUserDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.body.user;
        const user = yield database_1.default.user.findUnique({
            where: {
                id: id,
            },
        });
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getUserDetails = getUserDetails;
// Fetch Developers for a Client
// Retrieve all developers associated with a client.
/**
 * Get all active users (these are coming from invitation)
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const getAllDeveloperforClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.body.user;
        const developers = yield database_1.default.clientDeveloper.findMany({
            where: {
                client_id: id,
            },
            include: {
                developer: {
                    select: {
                        id: true,
                        email: true,
                        first_name: true,
                        last_name: true,
                        created_at: true,
                        color: true,
                    },
                },
            },
        });
        res.status(200).json({
            success: true,
            message: "Data fetched successfully",
            developers,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getAllDeveloperforClient = getAllDeveloperforClient;
// Fetch Client for a developer
// Retrieve all Client associated with a developer.
/**
 * Get all active users (these are coming from invitation)
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const getAllClientsforDeveloper = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.body.user;
        const developers = yield database_1.default.clientDeveloper.findMany({
            where: {
                developer_id: id,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        email: true,
                        first_name: true,
                        last_name: true,
                        created_at: true,
                        color: true,
                    },
                },
            },
        });
        res.status(200).json({
            success: true,
            message: "Data fetched successfully",
            developers,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getAllClientsforDeveloper = getAllClientsforDeveloper;
/**
 * Update user details
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const updateUserDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.body.user;
        const { first_name, last_name, email, password, user_type, auth_type, country, } = req.body;
        let password_hash = password;
        if (password) {
            password_hash = yield bcrypt_1.default.hash(password, 10);
        }
        const updatedUser = yield database_1.default.user.update({
            where: { id },
            data: {
                first_name,
                last_name,
                email,
                password: password_hash,
                user_type: user_type,
                auth_type: auth_type,
                country,
            },
        });
        res.status(200).json({
            success: true,
            updatedUser,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateUserDetails = updateUserDetails;
/**
 * Update user password
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const updateUserPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.body.user;
        const { currentPassword, newPassword, confirmPassword, } = req.body;
        const user = yield database_1.default.user.findUnique({
            where: {
                id: id,
            },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (!user.password) {
            res.status(400).json({ message: "Password is required" });
            return;
        }
        const isValidatePassword = yield bcrypt_1.default.compare(currentPassword, user.password);
        if (!isValidatePassword) {
            res.status(400).json({ message: "Invalid current password" });
            return;
        }
        if (newPassword !== confirmPassword) {
            res
                .status(400)
                .json({ message: "New password and confirm password do not match" });
            return;
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const password_hash = yield bcrypt_1.default.hash(newPassword, salt);
        yield database_1.default.user.update({
            where: { id },
            data: { password: password_hash },
        });
        res
            .status(200)
            .json({ success: true, message: "Password updated successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateUserPassword = updateUserPassword;
/**
 * // //forgot password
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }
        const validateEmail = (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        };
        if (!validateEmail(email)) {
            res.status(400).json({ message: "Invalid email format" });
            return;
        }
        const user = yield database_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (user.auth_type !== "email") {
            res.status(400).json({
                message: "Password cannot be changed for Google or GitHub provider. Please use email-based authentication.",
            });
            return;
        }
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        const hashedToken = crypto_1.default
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        const tokenExpiration = new Date(Date.now() + 10 * 60 * 1000);
        yield database_1.default.user.update({
            where: { email },
            data: {
                reset_password_token: hashedToken,
                reset_password_token_expires: tokenExpiration,
            },
        });
        if (!process.env.CLIENT_URL) {
            console.error("CLIENT_URL environment variable is not defined.");
            res.status(500).json({ message: "Server configuration error." });
            return;
        }
        const resetPasswordUrl = `${process.env.CLIENT_URL}/reset/password/${resetToken}`;
        const message = `You Password reset token is :-\n\n ${resetPasswordUrl} \n\n
  If you have not requested this email then, please ignore it `;
        yield (0, sendEmail_1.sendEmail)({
            email: user.email,
            subject: `Password Recovery`,
            message,
        });
        res.status(200).json({
            success: true,
            message: `Password reset email sent to ${user.email}. Please check your inbox.`,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.forgotPassword = forgotPassword;
/**
 * Reset user password after clicking on reset password link
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;
        if (!password || !confirmPassword) {
            res
                .status(400)
                .json({ message: "Password and confirm password are required" });
            return;
        }
        if (password !== confirmPassword) {
            res.status(400).json({ message: "Passwords do not match" });
            return;
        }
        const resetPasswordToken = crypto_1.default
            .createHash("sha256")
            .update(token)
            .digest("hex");
        const user = yield database_1.default.user.findFirst({
            where: {
                reset_password_token: resetPasswordToken,
                reset_password_token_expires: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            res.status(404).json({ message: "Invalid or expired token" });
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        yield database_1.default.user.update({
            where: {
                id: user.id,
            },
            data: {
                password: hashedPassword,
                reset_password_token: null,
                reset_password_token_expires: null,
            },
        });
        res.status(200).json({ message: "Password updated successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.resetPassword = resetPassword;
//login with google
const loginWithGoogle = (profile) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = profile.emails[0].value;
        // Check if the user exists by email
        const userObj = yield database_1.default.user.findUnique({
            where: { email },
        });
        if (!userObj) {
            throw new Error("No user found with this email. Please sign up using your Google account.");
        }
        const oauth = yield database_1.default.userOAuth.findFirst({
            where: { user_id: userObj.id, provider: "google" },
        });
        if (!oauth) {
            // If no Google OAuth details found, this could be an issue
            throw new Error("Google OAuth not linked. Please log in with your Google account to link it.");
        }
        const user = userObj;
        return user;
    }
    catch (error) {
        console.error("Error in loginWithGoogle:", error.message);
        throw error;
    }
});
exports.loginWithGoogle = loginWithGoogle;
// sign up with google
const signupWithGoogle = (profile, userType, inviteToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = profile.emails[0].value;
        const firstName = profile.name.givenName;
        const lastName = profile.name.familyName || "";
        const providerUserId = profile.id;
        let clientId = null;
        let isInvited = false;
        if (inviteToken) {
            const hashedToken = crypto_1.default
                .createHash("sha256")
                .update(inviteToken)
                .digest("hex");
            const invite = yield database_1.default.inviteUser.findUnique({
                where: {
                    invitation_token: hashedToken,
                    invitation_expiry: {
                        gte: new Date(),
                    },
                },
            });
            if (!invite ||
                !invite.invitation_expiry ||
                invite.invitation_expiry < new Date()) {
                throw new Error("Invalid or expired invitation token.");
            }
            if (invite.email !== email) {
                throw new Error("Email does not match the invitation.");
            }
            isInvited = true;
            clientId = invite.user_id;
            yield database_1.default.inviteUser.delete({
                where: { invitation_token: hashedToken },
            });
        }
        const userObj = yield database_1.default.user.findUnique({ where: { email } });
        let user;
        if (userObj) {
            if (userObj.auth_type === "email") {
                throw new Error("This email is already registered using email and password. Please log in with your email and password.");
            }
            const oauth = yield database_1.default.userOAuth.findFirst({
                where: { user_id: userObj.id, provider: "google" },
            });
            if (oauth) {
                throw new Error("This email is already registered using Google. Please log in with your Google account.");
            }
            yield database_1.default.userOAuth.create({
                data: {
                    user_id: userObj.id,
                    provider: "google",
                    provider_user_id: providerUserId,
                },
            });
            user = userObj;
        }
        else {
            user = yield database_1.default.user.create({
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    is_verified: true,
                    status: isInvited ? "active" : "inactive",
                    user_type: userType,
                    auth_type: "google",
                    color: (0, generateColor_1.generateRandomColor)(),
                },
            });
            yield database_1.default.userOAuth.create({
                data: {
                    user_id: user.id,
                    provider: "google",
                    provider_user_id: providerUserId,
                },
            });
            if (isInvited && clientId) {
                yield database_1.default.clientDeveloper.create({
                    data: {
                        client_id: Number(clientId),
                        developer_id: user.id,
                    },
                });
            }
            yield (0, sendEmail_1.sendEmail)({
                email,
                subject: "Welcome to the IntelliDev Platform",
                message: `Hello ${firstName} ${lastName}, Welcome to IntelliDev!`,
            });
        }
        return user;
    }
    catch (error) {
        console.error(error);
        throw new Error("Error during signup with Google: " + error.message);
    }
});
exports.signupWithGoogle = signupWithGoogle;
//login with github
const loginWithGithub = (profile) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = profile.emails[0].value;
        // Check if the user exists by their email
        const userObj = yield database_1.default.user.findUnique({
            where: { email: email },
        });
        if (!userObj) {
            throw new Error("No user found with this email. Please sign up using your GitHub account.");
        }
        // Check if the user has linked their GitHub OAuth details
        const oauth = yield database_1.default.userOAuth.findFirst({
            where: { user_id: userObj.id, provider: "github" },
        });
        if (!oauth) {
            // If no GitHub OAuth details found, this could be an issue
            throw new Error("GitHub OAuth not linked. Please log in with your GitHub account to link it.");
        }
        // If the user exists and has linked GitHub OAuth, return the user
        const user = userObj;
        return user;
    }
    catch (error) {
        console.error(error);
        throw new Error("Error during login with GitHub: " + error.message);
    }
});
exports.loginWithGithub = loginWithGithub;
//sign up with github
const signupWithGithub = (profile, inviteToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = profile.emails[0].value;
        const firstName = profile.displayName;
        const lastName = (profile === null || profile === void 0 ? void 0 : profile.familyName) || "";
        const providerUserId = profile.id;
        // Check if the user already exists by their email
        let clientId = null;
        let isInvited = false;
        if (inviteToken) {
            const hashedToken = crypto_1.default
                .createHash("sha256")
                .update(inviteToken)
                .digest("hex");
            const invite = yield database_1.default.inviteUser.findUnique({
                where: {
                    invitation_token: hashedToken,
                    invitation_expiry: {
                        gte: new Date(),
                    },
                },
            });
            if (!invite ||
                !invite.invitation_expiry ||
                invite.invitation_expiry < new Date()) {
                throw new Error("Invalid or expired invitation token.");
            }
            if (invite.email !== email) {
                throw new Error("Email does not match the invitation.");
            }
            isInvited = true;
            clientId = invite.user_id;
            yield database_1.default.inviteUser.delete({
                where: { invitation_token: hashedToken },
            });
        }
        const userObj = yield database_1.default.user.findUnique({
            where: { email: email },
        });
        let user;
        if (userObj) {
            if (userObj.auth_type === "email") {
                throw new Error("This email is already registered using email and password. Please log in with your email and password.");
            }
            // Check if the user already has github OAuth linked
            const oauth = yield database_1.default.userOAuth.findFirst({
                where: { user_id: userObj.id, provider: "github" },
            });
            if (oauth) {
                throw new Error("This email is already registered using github. Please log in with your github account");
            }
            // If the user exists with another provider (like GitHub), link Google OAuth
            // This allows linking multiple providers to the same user
            yield database_1.default.userOAuth.create({
                data: {
                    user_id: userObj.id,
                    provider: "github",
                    provider_user_id: providerUserId,
                },
            });
            user = userObj;
        }
        else {
            // Create a new user if they don't exist
            user = yield database_1.default.user.create({
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    is_verified: true,
                    status: isInvited ? "active" : "inactive",
                    user_type: "developer",
                    auth_type: "github",
                    color: (0, generateColor_1.generateRandomColor)(),
                },
            });
            // Add Google OAuth details for the new user
            yield database_1.default.userOAuth.create({
                data: {
                    user_id: user.id,
                    provider: "github",
                    provider_user_id: providerUserId,
                },
            });
            if (isInvited && clientId) {
                yield database_1.default.clientDeveloper.create({
                    data: {
                        client_id: Number(clientId),
                        developer_id: user.id,
                    },
                });
            }
            yield (0, sendEmail_1.sendEmail)({
                email,
                subject: "Welcome to the IntelliDev Platform",
                message: `
          Hello ${firstName} ${lastName},

          Welcome to the IntelliDev Platform! We're excited to have you on board. You've successfully registered, and your account is now ready to use.

          If you have any questions or need assistance, feel free to reach out to our support team.

          We look forward to helping you achieve great things on our platform!

          Best regards,
          The IntelliDev Team
        `,
            });
        }
        return user;
    }
    catch (error) {
        console.error(error);
        throw new Error("Error during login with Google: " + error.message);
    }
});
exports.signupWithGithub = signupWithGithub;
/**
 * deleted user
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const deleteActiveUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { id: loggedInUser } = req.body.user;
        const existActiveUser = yield database_1.default.user.findUnique({
            where: { id: parseInt(id) },
        });
        if (!existActiveUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (existActiveUser.status !== "active") {
            res.status(400).json({ message: "User is not active" });
            return;
        }
        const clientExist = yield database_1.default.user.findUnique({
            where: { id: parseInt(loggedInUser), user_type: "client" },
        });
        if (!clientExist) {
            res.status(403).json({ error: "Unauthorized to delete this user" });
            return;
        }
        // Delete user (automatically deletes related ClientDeveloper and AssignedPeople records)
        yield database_1.default.user.delete({ where: { id: parseInt(id) } });
        res.status(200).json({ message: "Active user deleted successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteActiveUser = deleteActiveUser;
