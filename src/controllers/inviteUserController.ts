import { Request, Response } from "express";
import prisma from "../config/database";
import { PrismaClientUnknownRequestError } from "@prisma/client/runtime/library";
import { sendEmail } from "../utils/sendEmail";
import crypto from "crypto";

/**
 * invited developer
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */

export const inviteDeveloper = async (
  req: Request,
  res: Response
): Promise<void> => {
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
    const existingInvites = await prisma.inviteUser.findMany({
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
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
          .createHash("sha256")
          .update(verificationToken)
          .digest("hex");
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        const invite = await prisma.inviteUser.create({
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
      } catch (err) {
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
      return sendEmail({
        email,
        subject: "Invitation to Join the Intelli Dev Community",
        message,
      });
    });

    await Promise.all(emailPromises);

    // Respond with success
    res.status(201).json({
      success: true,
      message: "Developers invited successfully.",
      invitedEmails: createdInvites.map((invite) => invite.email),
      alreadyInvitedEmails: existingEmails,
    });
  } catch (error: any) {
    if (error instanceof PrismaClientUnknownRequestError) {
      // Handle known errors, e.g., unique constraint violations
      res
        .status(400)
        .json({ success: false, message: "A database error occurred." });
    } else {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
};

//resend invite
/**
 * Resend invitation to a single developer
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const resendInvitation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    // Validate email input
    if (!email) {
      res.status(400).json({ success: false, message: "Email is required." });
      return;
    }

    // Check if the email exists in the database
    const existingInvite = await prisma.inviteUser.findUnique({
      where: { email },
    });

    if (!existingInvite) {
      res
        .status(404)
        .json({ success: false, message: "Email not found in invitations." });
      return;
    }

    // Generate a new invitation token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10-minute expiry

    // Update the invitation token and expiry
    await prisma.inviteUser.update({
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
    await sendEmail({
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
  } catch (error: any) {
    if (error instanceof PrismaClientUnknownRequestError) {
      res
        .status(400)
        .json({ success: false, message: "A database error occurred." });
    } else {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
};

/**
 * Get All Invited Developers
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getAllInvitedDeveloper = async (req: Request, res: Response) => {
  try {
    const { id } = req.body.user;
    const invitedDevelopers = await prisma.inviteUser.findMany({
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
  } catch (error: any) {
    if (error instanceof PrismaClientUnknownRequestError) {
      // Handle known errors, e.g., unique constraint violations
      res
        .status(400)
        .json({ success: false, message: "A database error occurred." });
    } else {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
};

/**
 * delete Invited Developers
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const deleteInviteDeveloper = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: loggedInUserId } = req.body.user;
    const { devId } = req.params;

    if (!loggedInUserId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const existingDevMember = await prisma.inviteUser.findMany({
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

    await prisma.inviteUser.delete({
      where: {
        id: Number(devId),
      },
    });

    res.status(200).json({
      success: true,
      message: "Developer deleted successfully.",
    });
  } catch (error: any) {
    if (error instanceof PrismaClientUnknownRequestError) {
      // Handle known errors, e.g., unique constraint violations
      res
        .status(400)
        .json({ success: false, message: "A database error occurred." });
    } else {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
};
