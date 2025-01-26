import express from "express";
import { validate } from "../../../middlewares/validate";
import authValidation from "../../../validations/auth.validation";
import { authController } from "../../../controllers";

const router = express.Router();

router.post(
  "/register",
  validate(authValidation.register),
  authController.register
);
router.post("/verify-otp", authController.verifyOTP);
router.post("/login", validate(authValidation.login), authController.login);
router.post("/logout", authController.logout);
router.post("/refresh-tokens", authController.refreshTokens);
router.post(
  "/forgot-password",
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  validate(authValidation.resetPassword),
  authController.resetPassword
);

export default router;
