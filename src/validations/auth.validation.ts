import Joi from "joi";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\^$*.\\[\]{}()?\-"!@#%&/,><':;|_~`])\S{10,}$/;

const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
    }),
    name: Joi.string().required().messages({
      "any.required": "Name is required",
      "string.empty": "Name cannot be empty",
    }),
    phone: Joi.string().required().messages({
      "any.required": "Phone number is required",
      "string.empty": "Phone number cannot be empty",
    }),
    // company_name: Joi.string().required().messages({
    //   "any.required": "Company Name is required",
    //   "string.empty": "Company Name cannot be empty",
    // }),
    // company_type: Joi.string()
    //   .valid(
    //     "HOSPITALITY",
    //     "MANUFACTURING",
    //     "REAL_ESTATE",
    //     "TRADING_OR_SERVICES",
    //     "INFRASTRUCTURE"
    //   )
    //   .required()
    //   .messages({
    //     "any.required": "Company type is required",
    //     "any.only":
    //       "Invalid company type, must be one of HOSPITALITY, MANUFACTURING, REAL_ESTATE, TRADING_OR_SERVICES, or INFRASTRUCTURE",
    //     "string.empty": "Company type cannot be empty",
    //   }),
  }),

  createPassword: Joi.object({
    password: Joi.string().pattern(passwordRegex).required().messages({
      "string.pattern.base":
        "Password must be at least 10 characters long, with at least one uppercase letter, one lowercase letter, one digit, and one special character, without spaces",
      "any.required": "Password is required",
      "string.empty": "Password cannot be empty",
    }),
    confirm_password: Joi.any().valid(Joi.ref("password")).required().messages({
      "any.only": "Confirm password does not match",
      "any.required": "Confirm password is required",
      "string.empty": "Confirm password cannot be empty",
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
      "string.empty": "Password cannot be empty",
    }),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
    }),
  }),
};

export default authValidation;
