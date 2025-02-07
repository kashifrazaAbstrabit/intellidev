import jwt from "jsonwebtoken";
import prisma from "../config/database";

export const generateAccessToken = async (user: { id: number }) => {
  const jwtSecret = process.env.ACCESS_TOKEN_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "ACCESS_TOKEN_SECRET is not defined in the environment variables."
    );
  }

  return new Promise<string>((resolve, reject) => {
    jwt.sign(
      {
        id: user.id,
      },
      jwtSecret,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "15m" },
      (err, token) => {
        if (err) return reject(err);
        resolve(token as string);
      }
    );
  });
};

const generateRefreshToken = async (user: { id: number }) => {
  const jwtSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "REFRESH_TOKEN_SECRET is not defined in the environment variables."
    );
  }

  const expiresIn = process.env.REFRESH_TOKEN_EXPIRE || "1d"; 

  return new Promise<string>((resolve, reject) => {
    jwt.sign({ id: user.id }, jwtSecret, { expiresIn }, (err, token) => {
      if (err) return reject(err);
      resolve(token as string);
    });
  });
};

/**
 * Generating access and refresh tokens for a user
 * @param {number} id - User ID
 * @returns {Promise<{ accessToken: string; refreshToken: string }>}
 */
export const generateAccessAndRefreshTokens = async (id: number) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const accessToken = await generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    await prisma.user.update({
      where: { id },
      data: {
        refreshtoken: refreshToken as string,
      },
    });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new Error("Failed to generate tokens");
  }
};
