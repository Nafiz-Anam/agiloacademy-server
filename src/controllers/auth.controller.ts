import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import {
  authService,
  userService,
  tokenService,
  emailService,
} from "../services";
import { User } from "@prisma/client";
import sendResponse from "../utils/responseHandler";
import ApiError from "../utils/ApiError";

const register = catchAsync(async (req, res) => {
  const { email, name, phone } = req.body;

  const user = await userService.createUser(name, email, phone);

  // Generate OTP and token
  const { otp, token } = await authService.generateAndSaveOTP(user);
  await emailService.sendVerificationEmail(email, otp);

  sendResponse(
    res,
    httpStatus.CREATED,
    true,
    { user, token },
    "Check email for OTP verification."
  );
});

const createPassword = catchAsync(async (req, res) => {
  const user = req.user as User;
  const userId = user.id;
  const { password } = req.body;
  await userService.updateUserPasswordAndStatus(userId, password);
  const tokens = await tokenService.generateAuthTokens(user);

  await emailService.sendAccountCreationEmail(user.email, user.name);

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { tokens },
    "Password created successfully"
  );
});

const login = catchAsync(async (req, res) => {
  const clientType = req.headers["x-client-type"];
  const { email, password } = req.body;

  try {
    const { user, tokens, errorMessage, errorCode } =
      await authService.loginUserWithEmailAndPassword(email, password);

    if (errorMessage && errorCode) {
      if (clientType === "web") {
        res.cookie("refreshToken", tokens?.refresh?.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // Only use secure in production
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // None requires secure true
          expires: new Date(tokens?.refresh?.expires as Date),
        });
        return sendResponse(
          res,
          errorCode,
          false,
          { user, accessToken: tokens.access.token },
          errorMessage
        );
      } else if (clientType === "mobile") {
        return sendResponse(
          res,
          errorCode,
          false,
          { user, tokens },
          errorMessage
        );
      } else {
        return sendResponse(
          res,
          httpStatus.BAD_REQUEST,
          false,
          null,
          "Invalid or missing client type header"
        );
      }
    }

    if (!tokens.refresh) {
      return sendResponse(
        res,
        httpStatus.INTERNAL_SERVER_ERROR,
        false,
        null,
        "Error generating tokens"
      );
    }

    if (clientType === "web") {
      res.cookie("refreshToken", tokens.refresh.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Only use secure in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // None requires secure true
        expires: new Date(tokens.refresh.expires),
      });
      // Send only the access token in the response body for web clients
      sendResponse(
        res,
        httpStatus.OK,
        true,
        { user, accessToken: tokens.access.token },
        "User logged in successfully"
      );
    } else if (clientType === "mobile") {
      sendResponse(
        res,
        httpStatus.OK,
        true,
        { user, tokens },
        "User logged in successfully"
      );
    } else {
      sendResponse(
        res,
        httpStatus.BAD_REQUEST,
        false,
        null,
        "Invalid or missing client type header"
      );
    }
  } catch (error) {
    // Log the error internally if needed
    console.error("Login Error:", error);

    if (error instanceof ApiError) {
      // Use the status code from the ApiError instance if available
      sendResponse(
        res,
        error.statusCode, // Use the specific status code from the ApiError
        false,
        null,
        error.message // Use the specific message from the ApiError
      );
    } else {
      // Handle unexpected errors
      sendResponse(
        res,
        httpStatus.INTERNAL_SERVER_ERROR,
        false,
        null,
        "Failed to log in due to server error."
      );
    }
  }
});

const logout = catchAsync(async (req, res) => {
  // Try to get the refresh token from cookies first
  let refreshToken = req.cookies["refreshToken"];

  // If not found in cookies, try to get it from the request body
  if (!refreshToken) {
    refreshToken = req.body.refreshToken;
  }

  // Proceed only if a refresh token is found either in cookies or the body
  if (!refreshToken) {
    return sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      "No refresh token provided"
    );
  }

  // Call the authService logout function with the refresh token
  await authService.logout(refreshToken);

  // Optionally clear the refresh token cookie for web clients
  if (req.cookies["refreshToken"]) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
  }

  // Send a success response
  sendResponse(res, httpStatus.OK, true, null, "User logged out successfully");
});

const refreshTokens = catchAsync(async (req, res) => {
  // Extract the refresh token from cookies
  const refreshToken = req.cookies["refreshToken"];
  console.log("refreshToken", refreshToken);

  if (!refreshToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "No refresh token provided");
  }

  // Call the authService to refresh tokens
  const tokens = await authService.refreshAuth(refreshToken);

  // Set the new refreshToken in a cookie

  res.cookie("refreshToken", tokens?.refresh?.token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    expires: new Date(tokens?.refresh?.expires as Date),
  });

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { accessToken: tokens.access.token },
    "AccessToken revalidated successfully!"
  );
});

const forgotPassword = catchAsync(async (req, res) => {
  try {
    const user = await userService.getUserByEmail(req.body.email);
    const { otp, token } = await authService.generateAndSaveOTP(user as User);

    await emailService.sendResetPasswordEmail(req.body.email, otp);

    sendResponse(
      res,
      httpStatus.OK,
      true,
      { token },
      "Please check your email to reset your password."
    );
  } catch (error) {
    console.log(error);
  }
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token as string, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const user = req.user as User;
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
  await emailService.sendVerificationEmail(user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token as string);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyOTP = catchAsync(async (req, res) => {
  const { otp, token } = req.body;

  try {
    const user = await authService.verifyOTPService(otp, token);

    const tokens = await tokenService.generateAuthTokens(user);

    if (!tokens.refresh) {
      return sendResponse(
        res,
        httpStatus.INTERNAL_SERVER_ERROR,
        false,
        null,
        "Error generating tokens"
      );
    }

    sendResponse(
      res,
      httpStatus.OK,
      true,
      {
        tokens: {
          accessToken: tokens.access.token,
          refreshToken: tokens.refresh.token,
        },
      },
      "OTP verified successfully."
    );
  } catch (error) {
    sendResponse(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      false,
      null,
      "OTP verification failed. Try again!"
    );
  }
});

export default {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  createPassword,
  verifyOTP,
};
