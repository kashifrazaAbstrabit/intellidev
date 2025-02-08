import prisma from "../config/database";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendEmail";
import jwt from "jsonwebtoken";
import ms from "ms";

import crypto from "crypto";
import { Request, Response } from "express";
import {
  ForgotPasswordBody,
  IUser,
  IUserLogin,
  ResetPasswordBody,
  ResetPasswordParams,
  UpdatePasswordBody,
} from "../types/user";
import { generateAccessAndRefreshTokens } from "../utils/sendToken";
import { JwtPayload } from "../middleware/auth";
import { AuthType, UserType } from "@prisma/client";
import { generateRandomColor } from "../utils/generateColor";

/**
 * register
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const register = async (
  req: Request<{}, {}, IUser>,
  res: Response
): Promise<void> => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      user_type,
      auth_type,
      country,
      invitationToken,
    } = req.body;

    if (
      !first_name ||
      !last_name ||
      !email ||
      !password ||
      !user_type ||
      !auth_type ||
      !country
    ) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Check if it's an invitation-based signup
    let isInvited = false;
    let clientId: Number | null = null;
    if (invitationToken) {
      const hashedToken = crypto
        .createHash("sha256")
        .update(invitationToken)
        .digest("hex");
      const invite = await prisma.inviteUser.findUnique({
        where: {
          invitation_token: hashedToken,
          invitation_expiry: {
            gte: new Date(),
          },
        },
      });

      if (
        !invite ||
        !invite.invitation_expiry ||
        invite.invitation_expiry < new Date()
      ) {
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
      clientId = invite?.user_id;

      // Remove the used invitation token
      await prisma.inviteUser.delete({
        where: { invitation_token: hashedToken },
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      res.status(400).json({ message: "Email already exists" });
      return;
    }

    // Hashed password for email authentication
    let password_hash: string | null = null;
    if (auth_type === "email" && password) {
      const salt = await bcrypt.genSalt(10);
      password_hash = await bcrypt.hash(password, salt);
    } else {
      password_hash = null;
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const newUser = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email,
        password: password_hash,
        country,
        verification_token: !isInvited ? hashedToken : null,
        is_verified: isInvited ? true : false,
        verification_token_expiry: !isInvited ? expiry : null,
        user_type: user_type as UserType,
        auth_type: auth_type as AuthType,
        status: isInvited ? "active" : "inactive",
        color: generateRandomColor(),
      },
    });

    if (isInvited && clientId) {
      await prisma.clientDeveloper.create({
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

        await sendEmail({
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
      await sendEmail({
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
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

/**
 * Verify email after user clicks verification link
 * @param {Request} req
 * @param {Response} res
 */

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
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

    await prisma.user.update({
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
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * login
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const login = async (
  req: Request<{}, {}, IUserLogin>,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
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
        if (
          !user.verification_token_expiry ||
          currentTime > user.verification_token_expiry
        ) {
          const verificationToken = crypto.randomBytes(32).toString("hex");
          const hashedToken = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");
          const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

          await prisma.user.update({
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

          await sendEmail({
            email,
            subject: "Resend: Verify your email address",
            message,
          });

          res.status(400).json({
            message:
              "Verification link expired. A new link has been sent to your email.",
          });
          return;
        } else {
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
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        last_login_at: new Date(),
      },
    });

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user.id
    );

    const accessTokenExpire = process.env.ACCESS_TOKEN_EXPIRE || "30m";
    const refreshTokenExpire = process.env.REFRESH_TOKEN_EXPIRE || "1d";

    if (!accessTokenExpire || !refreshTokenExpire) {
      throw new Error(
        "Environment variables for token expiration are not defined."
      );
    }

    const optionsForAccessToken: {
      expires: Date;
      secure: boolean;
      httpOnly: boolean;
      sameSite: "strict" | "lax" | "none";
    } = {
      expires: new Date(
        Date.now() + (ms(accessTokenExpire as ms.StringValue) || 0)
      ), // Ensure it's a valid number
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
    };

    const optionsForRefreshToken: {
      expires: Date;
      secure: boolean;
      httpOnly: boolean;
      sameSite: "strict" | "lax" | "none";
    } = {
      expires: new Date(
        Date.now() + (ms(refreshTokenExpire as ms.StringValue) || 0)
      ), // Ensure it's a valid number
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
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * logout
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body.user;

    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Set refreshToken to NULL

    await prisma.user.update({
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
      .clearCookie("accessToken", {
        ...options,
        maxAge: 0,
        sameSite: "strict",
      })
      .clearCookie("refreshToken", {
        ...options,
        maxAge: 0,
        sameSite: "strict",
      })
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Refresh Access Token
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const refreshAccessToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    let decodedToken: JwtPayload;

    try {
      decodedToken = jwt.verify(
        token,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as JwtPayload;
    } catch (err) {
      res.status(401).json({ message: "Invalid or expired refresh token" });
      return;
    }

    const userId = decodedToken.id;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    if (token !== user?.refreshtoken) {
      res.status(401).json({ message: "Refresh token expired or used" });
      return;
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user.id
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure only in production
      sameSite: "Strict",
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...options,
        maxAge: 30 * 60 * 1000,
        sameSite: "strict",
      }) // 30 minutes
      .cookie("refreshToken", refreshToken, {
        ...options,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "strict",
      }) // 1 days
      .json({
        success: true,
        message: "Access token refreshed",
        accessToken,
      });
  } catch (error: any) {
    console.error("Error refreshing token:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get user details
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getUserDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.body.user;
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Fetch Developers for a Client
// Retrieve all developers associated with a client.
/**
 * Get all active users (these are coming from invitation)
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getAllDeveloperforClient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.body.user;
    const developers = await prisma.clientDeveloper.findMany({
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
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Fetch Client for a developer
// Retrieve all Client associated with a developer.
/**
 * Get all active users (these are coming from invitation)
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getAllClientsforDeveloper = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.body.user;
    const developers = await prisma.clientDeveloper.findMany({
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
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update user details
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */

export const updateUserDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.body.user;
    const {
      first_name,
      last_name,
      email,
      password,
      user_type,
      auth_type,
      country,
    }: IUser = req.body;

    let password_hash = password;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        first_name,
        last_name,
        email,
        password: password_hash,
        user_type: user_type as UserType,
        auth_type: auth_type as AuthType,
        country,
      },
    });

    res.status(200).json({
      success: true,
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update user password
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const updateUserPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.body.user;
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    }: UpdatePasswordBody = req.body;

    const user = await prisma.user.findUnique({
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

    const isValidatePassword = await bcrypt.compare(
      currentPassword,
      user.password
    );

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

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id },
      data: { password: password_hash },
    });

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * // //forgot password
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */

export const forgotPassword = async (
  req: Request<{}, {}, ForgotPasswordBody>,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    const validateEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    if (!validateEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.auth_type !== "email") {
      res.status(400).json({
        message:
          "Password cannot be changed for Google or GitHub provider. Please use email-based authentication.",
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const tokenExpiration = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
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

    await sendEmail({
      email: user.email,
      subject: `Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Password reset email sent to ${user.email}. Please check your inbox.`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Reset user password after clicking on reset password link
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const resetPassword = async (
  req: Request<ResetPasswordParams, {}, ResetPasswordBody>,
  res: Response
): Promise<void> => {
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

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await prisma.user.findFirst({
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
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
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
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//login with google
export const loginWithGoogle = async (profile: any) => {
  try {
    const email = profile.emails[0].value;

    // Check if the user exists by email
    const userObj = await prisma.user.findUnique({
      where: { email },
    });

    if (!userObj) {
      throw new Error(
        "No user found with this email. Please sign up using your Google account."
      );
    }

    const oauth = await prisma.userOAuth.findFirst({
      where: { user_id: userObj.id, provider: "google" },
    });

    if (!oauth) {
      // If no Google OAuth details found, this could be an issue
      throw new Error(
        "Google OAuth not linked. Please log in with your Google account to link it."
      );
    }
    const user = userObj;

    return user;
  } catch (error: any) {
    console.error("Error in loginWithGoogle:", error.message);
    throw error;
  }
};
// sign up with google
export const signupWithGoogle = async (
  profile: any,
  userType: string,
  inviteToken: string
) => {
  try {
    const email = profile.emails[0].value;
    const firstName = profile.name.givenName;
    const lastName = profile.name.familyName || "";
    const providerUserId = profile.id;

    let clientId: Number | null = null;
    let isInvited = false;

    if (inviteToken) {
      const hashedToken = crypto
        .createHash("sha256")
        .update(inviteToken)
        .digest("hex");

      const invite = await prisma.inviteUser.findUnique({
        where: {
          invitation_token: hashedToken,
          invitation_expiry: {
            gte: new Date(),
          },
        },
      });

      if (
        !invite ||
        !invite.invitation_expiry ||
        invite.invitation_expiry < new Date()
      ) {
        throw new Error("Invalid or expired invitation token.");
      }

      if (invite.email !== email) {
        throw new Error("Email does not match the invitation.");
      }

      isInvited = true;
      clientId = invite.user_id;

      await prisma.inviteUser.delete({
        where: { invitation_token: hashedToken },
      });
    }

    const userObj = await prisma.user.findUnique({ where: { email } });
    let user;

    if (userObj) {
      if (userObj.auth_type === "email") {
        throw new Error(
          "This email is already registered using email and password. Please log in with your email and password."
        );
      }

      const oauth = await prisma.userOAuth.findFirst({
        where: { user_id: userObj.id, provider: "google" },
      });

      if (oauth) {
        throw new Error(
          "This email is already registered using Google. Please log in with your Google account."
        );
      }

      await prisma.userOAuth.create({
        data: {
          user_id: userObj.id,
          provider: "google",
          provider_user_id: providerUserId,
        },
      });

      user = userObj;
    } else {
      user = await prisma.user.create({
        data: {
          first_name: firstName,
          last_name: lastName,
          email,
          is_verified: true,
          status: isInvited ? "active" : "inactive",
          user_type: userType as UserType,
          auth_type: "google",
          color: generateRandomColor(),
        },
      });

      await prisma.userOAuth.create({
        data: {
          user_id: user.id,
          provider: "google",
          provider_user_id: providerUserId,
        },
      });

      if (isInvited && clientId) {
        await prisma.clientDeveloper.create({
          data: {
            client_id: Number(clientId),
            developer_id: user.id,
          },
        });
      }

      await sendEmail({
        email,
        subject: "Welcome to the IntelliDev Platform",
        message: `Hello ${firstName} ${lastName}, Welcome to IntelliDev!`,
      });
    }

    return user;
  } catch (error: any) {
    console.error(error);
    throw new Error("Error during signup with Google: " + error.message);
  }
};

//login with github
export const loginWithGithub = async (profile: any) => {
  try {
    const email = profile.emails[0].value;

    // Check if the user exists by their email
    const userObj = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!userObj) {
      throw new Error(
        "No user found with this email. Please sign up using your GitHub account."
      );
    }

    // Check if the user has linked their GitHub OAuth details
    const oauth = await prisma.userOAuth.findFirst({
      where: { user_id: userObj.id, provider: "github" },
    });

    if (!oauth) {
      // If no GitHub OAuth details found, this could be an issue
      throw new Error(
        "GitHub OAuth not linked. Please log in with your GitHub account to link it."
      );
    }

    // If the user exists and has linked GitHub OAuth, return the user
    const user = userObj;

    return user;
  } catch (error: any) {
    console.error(error);
    throw new Error("Error during login with GitHub: " + error.message);
  }
};

//sign up with github

export const signupWithGithub = async (profile: any, inviteToken: string) => {
  try {
    const email = profile.emails[0].value;
    const firstName = profile.displayName;
    const lastName = profile?.familyName || "";
    const providerUserId = profile.id;
    // Check if the user already exists by their email

    let clientId: Number | null = null;
    let isInvited = false;

    if (inviteToken) {
      const hashedToken = crypto
        .createHash("sha256")
        .update(inviteToken)
        .digest("hex");

      const invite = await prisma.inviteUser.findUnique({
        where: {
          invitation_token: hashedToken,
          invitation_expiry: {
            gte: new Date(),
          },
        },
      });

      if (
        !invite ||
        !invite.invitation_expiry ||
        invite.invitation_expiry < new Date()
      ) {
        throw new Error("Invalid or expired invitation token.");
      }

      if (invite.email !== email) {
        throw new Error("Email does not match the invitation.");
      }

      isInvited = true;
      clientId = invite.user_id;

      await prisma.inviteUser.delete({
        where: { invitation_token: hashedToken },
      });
    }

    const userObj = await prisma.user.findUnique({
      where: { email: email },
    });

    let user;

    if (userObj) {
      if (userObj.auth_type === "email") {
        throw new Error(
          "This email is already registered using email and password. Please log in with your email and password."
        );
      }

      // Check if the user already has github OAuth linked
      const oauth = await prisma.userOAuth.findFirst({
        where: { user_id: userObj.id, provider: "github" },
      });

      if (oauth) {
        throw new Error(
          "This email is already registered using github. Please log in with your github account"
        );
      }

      // If the user exists with another provider (like GitHub), link Google OAuth
      // This allows linking multiple providers to the same user
      await prisma.userOAuth.create({
        data: {
          user_id: userObj.id,
          provider: "github",
          provider_user_id: providerUserId,
        },
      });

      user = userObj;
    } else {
      // Create a new user if they don't exist
      user = await prisma.user.create({
        data: {
          first_name: firstName,
          last_name: lastName,
          email,
          is_verified: true,
          status: isInvited ? "active" : "inactive",
          user_type: "developer",
          auth_type: "github",
          color: generateRandomColor(),
        },
      });

      // Add Google OAuth details for the new user
      await prisma.userOAuth.create({
        data: {
          user_id: user.id,
          provider: "github",
          provider_user_id: providerUserId,
        },
      });

      if (isInvited && clientId) {
        await prisma.clientDeveloper.create({
          data: {
            client_id: Number(clientId),
            developer_id: user.id,
          },
        });
      }

      await sendEmail({
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
  } catch (error: any) {
    console.error(error);
    throw new Error("Error during login with Google: " + error.message);
  }
};

/**
 * deleted user
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const deleteActiveUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { id: loggedInUser } = req.body.user;

    const existActiveUser = await prisma.user.findUnique({
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

    const clientExist = await prisma.user.findUnique({
      where: { id: parseInt(loggedInUser), user_type: "client" },
    });

    if (!clientExist) {
      res.status(403).json({ error: "Unauthorized to delete this user" });
      return;
    }

    // Delete user (automatically deletes related ClientDeveloper and AssignedPeople records)
    await prisma.user.delete({ where: { id: parseInt(id) } });

    res.status(200).json({ message: "Active user deleted successfully" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
