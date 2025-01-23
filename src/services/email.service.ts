import nodemailer from "nodemailer";
import config from "../config/config";
import logger from "../config/logger";

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== "test") {
  transport
    .verify()
    .then(() => logger.info("Connected to email server"))
    .catch(() =>
      logger.warn(
        "Unable to connect to email server. Make sure you have configured the SMTP options in .env"
      )
    );
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to: string, subject: string, text: string) => {
  const msg = { from: config.email.from, to, subject, text };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to: string, otp: string) => {
  const subject = "Reset password";
  // replace this url with the link to the reset password page of your front-end app
  // const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
  const text = `Dear user,
Use this OTP: ${otp} to reset your password.
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} otp
 * @returns {Promise}
 */
const sendVerificationEmail = async (to: string, otp: string) => {
  const subject = "Email Verification";
  // replace this url with the link to the email verification page of your front-end app
  // const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Your OTP for registration is ${otp}. Please enter this to verify your email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send new user email with login credentials
 * @param {string} to
 * @param {string} username
 * @param {string} password
 * @returns {Promise}
 */
const sendNewUserEmail = async (
  to: string,
  username: string,
  password: string
) => {
  const subject = "Welcome to Ank.Biz!";
  const text = `Dear ${username},
Welcome to Ank.Biz! Here are your login credentials:

Username: ${to}
Password: ${password}

Please keep this information secure and do not share it with anyone. You can log in to your account at: ${process.env.FRONTEND_URL}/account/login

Best regards,
The Ank.Biz Team`;
  await sendEmail(to, subject, text);
};

/**
 * Send account activation email
 * @param {string} to
 * @param {string} username
 * @returns {Promise}
 */
const sendAccountActivationEmail = async (to: string, username: string) => {
  const subject = "Your Ank.Biz Account is Activated!";
  const text = `Dear ${username},

We are pleased to inform you that your Ank.Biz account has been activated by the admin. You can now log in to your account using the following link:

${process.env.FRONTEND_URL}/account/login

Please keep your login credentials secure and do not share them with anyone.

If you have any questions or need assistance, feel free to contact our support team.

Best regards,
The Ank.Biz Team`;
  await sendEmail(to, subject, text);
};

/**
 * Send account deactivation email
 * @param {string} to
 * @param {string} username
 * @returns {Promise}
 */
const sendAccountDeactivationEmail = async (to: string, username: string) => {
  const subject = "Your Ank.Biz Account is Deactivated";
  const text = `Dear ${username},

We regret to inform you that your Ank.Biz account has been deactivated by the admin. You will no longer be able to access your account.

If you believe this is a mistake or if you have any questions, please contact our support team for further assistance.

Best regards,
The Ank.Biz Team`;
  await sendEmail(to, subject, text);
};

/**
 * Send account creation confirmation email
 * @param {string} to
 * @param {string} username
 * @returns {Promise}
 */
const sendAccountCreationEmail = async (to: string, username: string) => {
  const subject = "Your Ank.Biz Account is Created!";
  const text = `Dear ${username},

Welcome to Ank.Biz! Your account has been successfully created. Our admin team will review your account and activate it shortly.

Once your account is activated, you will receive another email with the activation confirmation.


If you have any questions or need assistance, feel free to contact our support team.

Best regards,
The Ank.Biz Team`;
  await sendEmail(to, subject, text);
};

export default {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendNewUserEmail,
  sendAccountActivationEmail,
  sendAccountCreationEmail,
  sendAccountDeactivationEmail,
};
