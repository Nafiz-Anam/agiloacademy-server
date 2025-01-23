import { createTransport, SendMailOptions, Transporter } from "nodemailer";

/**
 * Sends an email using SMTP configuration from environment variables.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} emailBody - The text body of the email.
 * @returns {Promise<boolean>} - Returns true if the email was sent successfully, otherwise false.
 */
const emailService = async (
  toEmail: string,
  emailBody: string
): Promise<boolean> => {
  const transporter: Transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465"), // Default to 465 if SMTP_PORT is not defined
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });

  const message: SendMailOptions = {
    from: process.env.SMTP_EMAIL,
    to: toEmail,
    subject: "Forgot password OTP",
    text: emailBody,
    // html: `<p>${emailBody}</p>`, // Uncomment or modify this line to use HTML content
  };

  return transporter
    .sendMail(message)
    .then(() => true)
    .catch((error) => {
      console.error("Failed to send email:", error);
      return false;
    });
};

export default emailService;
