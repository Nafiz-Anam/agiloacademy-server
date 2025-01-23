import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { emailService, userService } from "../services";
import sendResponse from "../utils/responseHandler";
import { Prisma, User } from "@prisma/client";

const createUser = catchAsync(async (req, res) => {
  const { email, password, name, role, companyId, phone } = req.body;

  try {
    const user = await userService.createUser(
      name,
      email,
      phone,
      role,
      companyId,
      password
    );
    res.status(httpStatus.CREATED).send(user);
    await emailService.sendNewUserEmail(email, name, password);

    sendResponse(
      res,
      httpStatus.CREATED,
      true,
      null,
      "User created successfully."
    );
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.statusCode === httpStatus.PAYMENT_REQUIRED) {
        res
          .status(error.statusCode)
          .send({ message: error.message, createUserId: error.createUserId });
      } else {
        res.status(error.statusCode).send({ message: error.message });
      }
    } else {
      console.error("Unexpected Error:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: "Internal Server Error" });
    }
  }
});

const getUsers = catchAsync(async (req, res) => {
  const {
    searchTerm,
    isEmailVerified,
    status,

    ...filter
  } = pick(req.query, [
    "company_type",
    "role",
    "status",
    "isEmailVerified",
    "searchTerm",
    "companyId",
  ]);
  const options = pick(req.query, ["sortBy", "limit", "page", "sortType"]);

  const filterData: Partial<Prisma.UserWhereInput> = {
    ...filter,
  };

  if (isEmailVerified === "true") {
    filterData.isEmailVerified = true;
  } else if (isEmailVerified === "false") {
    filterData.isEmailVerified = false;
  }

  if (status === "true") {
    filterData.status = true;
  } else if (status === "false") {
    filterData.status = false;
  }

  const user = req.user as User;
  const userId = user.id;

  const result = await userService.queryUsers(
    filterData,
    options,
    searchTerm as string,
    userId
  );
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  return sendResponse(
    res,
    httpStatus.OK,
    true,
    user,
    "User details fetched successfully!"
  );
});

const updateUser = catchAsync(async (req, res) => {
  await userService.updateUserById(req.params.userId, req.body);
  return sendResponse(
    res,
    httpStatus.OK,
    true,
    null,
    "User updated successfully!"
  );
});

const updateUserStatus = catchAsync(async (req, res) => {
  const updatedUser = await userService.updateUserById(
    req.params.userId,
    req.body
  );

  if (req.body.status && updatedUser) {
    await emailService.sendAccountActivationEmail(
      updatedUser.email,
      updatedUser.name
    );
  }
  if (!req.body.status && updatedUser) {
    await emailService.sendAccountDeactivationEmail(
      updatedUser.email,
      updatedUser.name
    );
  }

  return sendResponse(
    res,
    httpStatus.OK,
    true,
    null,
    "User status updated successfully!"
  );
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  return sendResponse(
    res,
    httpStatus.OK,
    true,
    null,
    "User deleted successfully!"
  );
});

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserStatus,
};
