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
exports.deleteInviteDeveloper = exports.getAllInvitedDeveloper = exports.resendInvitation = exports.inviteDeveloper = void 0;
const database_1 = __importDefault(require("../config/database"));
const library_1 = require("@prisma/client/runtime/library");
const sendEmail_1 = require("../utils/sendEmail");
const crypto_1 = __importDefault(require("crypto"));
/**
 * invited developer
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const inviteDeveloper = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { emails } = req.body;
        console.log(emails, "sending email ===============================>");
        // Validate email input
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            res.status(400).json({ success: false, message: "Emails are required." });
            return;
        }
        const { id: userId } = req.body.user;
        // Check existing invites or users in the database
        const existingInvites = yield database_1.default.inviteUser.findMany({
            where: {
                email: { in: emails },
            },
            select: { email: true },
        });
        const existingEmails = existingInvites.map((invite) => invite.email);
        // Filter out emails already invited
        const newEmails = emails.filter((email) => !existingEmails.includes(email));
        if (newEmails.length === 0) {
            res.status(400).json({
                success: false,
                message: "All provided emails have already been invited.",
            });
            return;
        }
        // Insert invitations with unique tokens for each email
        const createdInvites = [];
        for (const email of newEmails) {
            try {
                const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
                const hashedToken = crypto_1.default
                    .createHash("sha256")
                    .update(verificationToken)
                    .digest("hex");
                const expiry = new Date(Date.now() + 10 * 60 * 1000);
                const invite = yield database_1.default.inviteUser.create({
                    data: {
                        email,
                        user_id: userId,
                        invitation_token: hashedToken,
                        invitation_expiry: expiry,
                    },
                });
                createdInvites.push({
                    email: invite.email,
                    inviteLink: `${process.env.CLIENT_URL}/signup?selectedRole=developer&token=${verificationToken}`,
                });
            }
            catch (err) {
                console.error(`Failed to invite ${email}:`, err);
            }
        }
        // Send emails to the new invitees
        const emailPromises = createdInvites.map(({ email, inviteLink }) => {
            const message = `
        Hello,

        You've been invited to join the Intelli Dev website. Please click the link below to sign up and become part of our developer community.

        Sign up here: ${inviteLink}

        Best regards,
        The Intelli Dev Team
      `;
            return (0, sendEmail_1.sendEmail)({
                email,
                subject: "Invitation to Join the Intelli Dev Community",
                message,
            });
        });
        yield Promise.all(emailPromises);
        // Respond with success
        res.status(201).json({
            success: true,
            message: "Developers invited successfully.",
            invitedEmails: createdInvites.map((invite) => invite.email),
            alreadyInvitedEmails: existingEmails,
        });
    }
    catch (error) {
        if (error instanceof library_1.PrismaClientUnknownRequestError) {
            // Handle known errors, e.g., unique constraint violations
            res
                .status(400)
                .json({ success: false, message: "A database error occurred." });
        }
        else {
            console.error(error);
            res
                .status(500)
                .json({ success: false, message: "Internal server error." });
        }
    }
});
exports.inviteDeveloper = inviteDeveloper;
//resend invite
/**
 * Resend invitation to a single developer
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const resendInvitation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        // Validate email input
        if (!email) {
            res.status(400).json({ success: false, message: "Email is required." });
            return;
        }
        // Check if the email exists in the database
        const existingInvite = yield database_1.default.inviteUser.findUnique({
            where: { email },
        });
        if (!existingInvite) {
            res
                .status(404)
                .json({ success: false, message: "Email not found in invitations." });
            return;
        }
        // Generate a new invitation token
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        const hashedToken = crypto_1.default
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10-minute expiry
        // Update the invitation token and expiry
        yield database_1.default.inviteUser.update({
            where: { email },
            data: {
                invitation_token: hashedToken,
                invitation_expiry: expiry,
            },
        });
        // Create the new invitation link
        const inviteLink = `${process.env.CLIENT_URL}/signup?selectedRole=developer&token=${verificationToken}`;
        // Send the email
        const message = `
      Hello,

      Your invitation to join the Intelli Dev website has been re-sent. Please click the link below to sign up and become part of our developer community.

      Sign up here: ${inviteLink}

      Best regards,
      The Intelli Dev Team
    `;
        yield (0, sendEmail_1.sendEmail)({
            email,
            subject: "Resend: Invitation to Join the Intelli Dev Community",
            message,
        });
        // Respond with success
        res.status(200).json({
            success: true,
            message: "Invitation resent successfully.",
            email,
        });
    }
    catch (error) {
        if (error instanceof library_1.PrismaClientUnknownRequestError) {
            res
                .status(400)
                .json({ success: false, message: "A database error occurred." });
        }
        else {
            console.error(error);
            res
                .status(500)
                .json({ success: false, message: "Internal server error." });
        }
    }
});
exports.resendInvitation = resendInvitation;
/**
 * Get All Invited Developers
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const getAllInvitedDeveloper = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.body.user;
        const invitedDevelopers = yield database_1.default.inviteUser.findMany({
            where: {
                user_id: id,
            },
            select: {
                id: true,
                email: true,
                created_at: true,
                updated_at: true,
            },
        });
        res.status(200).json({
            success: true,
            message: "Invited developers retrieved successfully.",
            developers: invitedDevelopers,
        });
    }
    catch (error) {
        if (error instanceof library_1.PrismaClientUnknownRequestError) {
            // Handle known errors, e.g., unique constraint violations
            res
                .status(400)
                .json({ success: false, message: "A database error occurred." });
        }
        else {
            console.error(error);
            res
                .status(500)
                .json({ success: false, message: "Internal server error." });
        }
    }
});
exports.getAllInvitedDeveloper = getAllInvitedDeveloper;
/**
 * delete Invited Developers
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const deleteInviteDeveloper = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: loggedInUserId } = req.body.user;
        const { devId } = req.params;
        if (!loggedInUserId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const existingDevMember = yield database_1.default.inviteUser.findMany({
            where: {
                id: Number(devId),
            },
        });
        if (!existingDevMember) {
            res.status(404).json({
                success: false,
                message: "Developer not found.",
            });
            return;
        }
        if (existingDevMember[0].user_id !== loggedInUserId) {
            res.status(403).json({
                success: false,
                message: "You are not authorized to delete this developer.",
            });
            return;
        }
        yield database_1.default.inviteUser.delete({
            where: {
                id: Number(devId),
            },
        });
        res.status(200).json({
            success: true,
            message: "Developer deleted successfully.",
        });
    }
    catch (error) {
        if (error instanceof library_1.PrismaClientUnknownRequestError) {
            // Handle known errors, e.g., unique constraint violations
            res
                .status(400)
                .json({ success: false, message: "A database error occurred." });
        }
        else {
            console.error(error);
            res
                .status(500)
                .json({ success: false, message: "Internal server error." });
        }
    }
});
exports.deleteInviteDeveloper = deleteInviteDeveloper;
