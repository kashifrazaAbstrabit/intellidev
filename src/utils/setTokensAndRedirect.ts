import { Request, Response } from "express";
import { generateAccessAndRefreshTokens } from "./sendToken";
import { User } from "../types/user";
import ms from "ms";

export async function setTokensAndRedirect(
  req: Request,
  res: Response,
  user: User | null
) {
  if (!user) {
    res.status(400).json({ message: "User not found" });
    return;
  }

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
    ),
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "none",
  };

  const optionsForRefreshToken: {
    expires: Date;
    secure: boolean;
    httpOnly: boolean;
    sameSite: "strict" | "lax" | "none";
  } = {
    expires: new Date(
      Date.now() + (ms(refreshTokenExpire as ms.StringValue) || 0)
    ),
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "none",
  };

  res
    .cookie("accessToken", accessToken, optionsForAccessToken)
    .cookie("refreshToken", refreshToken, optionsForRefreshToken);

  res.redirect(`${process.env.CLIENT_URL}/success?token=${accessToken}`);
}
