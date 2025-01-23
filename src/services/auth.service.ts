import httpStatus from "http-status";
import tokenService from "./token.service";
import userService from "./user.service";
import ApiError from "../utils/ApiError";
import { TokenType, User } from "@prisma/client";
import prisma from "../client";
import { encryptPassword, isPasswordMatch } from "../utils/encryption";
import { AuthTokensResponse } from "../types/response";
import exclude from "../utils/exclude";

import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Omit<User, 'password'>, tokens: AuthTokens, errorMessage?: string, errorCode?: number }>}
 */
const loginUserWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<{
  user: Omit<User, "password">;
  tokens: AuthTokensResponse;
  errorMessage?: string;
  errorCode?: number;
}> => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }

  // Check if user's status is true
  if (!user.status) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User account is inactive");
  }

  // Check if user is deleted
  if (user.deleted) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User account is deleted");
  }

  // Check if password matches
  if (!user.password || !(await isPasswordMatch(password, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }

  // Generate tokens regardless of company registration status
  const tokens = await tokenService.generateAuthTokens(user);

  return {
    user: exclude(user, ["password"]),
    tokens,
  };
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
const logout = async (refreshToken: string): Promise<void> => {
  const refreshTokenData = await prisma.token.findFirst({
    where: {
      token: refreshToken,
      type: TokenType.REFRESH,
      blacklisted: false,
    },
  });
  if (!refreshTokenData) {
    throw new ApiError(httpStatus.NOT_FOUND, "Refresh token not found");
  }
  await prisma.token.delete({ where: { id: refreshTokenData.id } });
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<AuthTokensResponse>}
 */
const refreshAuth = async (
  refreshToken: string
): Promise<AuthTokensResponse> => {
  try {
    const refreshTokenData = await tokenService.verifyToken(
      refreshToken,
      TokenType.REFRESH
    );
    const { userId } = refreshTokenData;
    await prisma.token.delete({ where: { id: refreshTokenData.id } });
    return tokenService.generateAuthTokens({ id: userId });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const resetPassword = async (
  resetPasswordToken: string,
  newPassword: string
): Promise<void> => {
  try {
    const resetPasswordTokenData = await tokenService.verifyToken(
      resetPasswordToken,
      TokenType.RESET_PASSWORD
    );
    const user = await userService.getUserById(resetPasswordTokenData.userId);
    if (!user) {
      throw new Error();
    }
    const encryptedPassword = await encryptPassword(newPassword);
    await userService.updateUserById(user.id, { password: encryptedPassword });
    await prisma.token.deleteMany({
      where: { userId: user.id, type: TokenType.RESET_PASSWORD },
    });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password reset failed");
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<void>}
 */
const verifyEmail = async (verifyEmailToken: string): Promise<void> => {
  try {
    const verifyEmailTokenData = await tokenService.verifyToken(
      verifyEmailToken,
      TokenType.VERIFY_EMAIL
    );
    await prisma.token.deleteMany({
      where: {
        userId: verifyEmailTokenData.userId,
        type: TokenType.VERIFY_EMAIL,
      },
    });
    await userService.updateUserById(verifyEmailTokenData.userId, {
      isEmailVerified: true,
    });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Email verification failed");
  }
};

const generateAndSaveOTP = async (user: User) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const token = uuidv4();
  const expiresAt = dayjs().add(10, "minutes").toDate(); // Expires in 10 minutes

  await prisma.oTP.create({
    data: {
      otp,
      token,
      expiresAt,
      userId: user.id,
    },
  });

  return { otp, token };
};

const verifyOTPService = async (otp: string, token: string) => {
  const otpEntry = await prisma.oTP.findUnique({
    where: { token },
  });

  if (!otpEntry || otpEntry.expiresAt < new Date()) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired OTP.");
  }

  if (otpEntry.otp !== otp) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect OTP.");
  }

  // Mark email as verified and remove the OTP entry
  await prisma.user.update({
    where: { id: otpEntry.userId },
    data: { isEmailVerified: true },
  });

  await prisma.oTP.delete({
    where: { token },
  });

  const user = await userService.getUserById(otpEntry.userId, [
    "id",
    "email",
    "name",
    "status",
    "role",
    "isEmailVerified",
    "createdAt",
    "updatedAt",
  ]);

  return user as User;
};

export default {
  loginUserWithEmailAndPassword,
  isPasswordMatch,
  encryptPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  generateAndSaveOTP,
  verifyOTPService,
};
