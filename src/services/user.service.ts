import { User, Role, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";
import { encryptPassword } from "../utils/encryption";

/**
 * Create a user
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @param {string} password
 * @returns {Promise<User>}
 */
const createUser = async (
  name: string,
  email: string,
  phone: string,
  password: string,
  role: Role = Role.PARTNER
): Promise<User> => {
  if (await getUserByEmail(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken!");
  }

  // Prepare user data including optional company linkage
  const userData = {
    name,
    email,
    phone,
    role,
    password: await encryptPassword(password),
  };

  const user = await prisma.user.create({
    data: userData,
  });

  return user;
};

/**
 * Query for users
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [searchTerm] - Optional search term for filtering
 * @param {string} [excludeUserId] - User ID to exclude from the results
 * @param {string[]} [companyIds] - Company IDs to filter users
 * @returns {Promise<Company[]>}
 */
const queryUsers = async <Key extends keyof User>(
  filter: Partial<Prisma.UserWhereInput>,
  options: {
    sortBy?: string;
    limit?: number;
    page?: number;
    sortType?: "asc" | "desc";
  },
  searchTerm?: string,
  excludeUserId?: string,
  companyIds?: string[],
  keys: Key[] = [
    "id",
    "email",
    "name",
    "phone",
    "role",
    "isEmailVerified",
    "companyRegistered",
    "status",
    "deleted",
    "createdAt",
    "updatedAt",
    "expiryDate",
  ] as Key[]
): Promise<Pick<User, Key>[]> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy;
  const sortType = options.sortType ?? "desc";

  const whereData: Partial<Prisma.UserWhereInput> = {
    ...filter,
  };

  if (searchTerm) {
    whereData.OR = [
      { name: { contains: searchTerm } },
      { email: { contains: searchTerm } },
    ];
  }

  if (excludeUserId) {
    whereData.id = {
      not: excludeUserId,
    };
  }

  // Ensure password is never included in the select keys
  const selectedKeys = keys.filter((key) => key !== "password");

  const users = await prisma.user.findMany({
    where: whereData,
    select: selectedKeys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
  });

  return users as Pick<User, Key>[];
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<User, Key> | null>}
 */
const getUserById = async <Key extends keyof User>(
  id: string,
  keys: Key[] = [
    "id",
    "email",
    "name",
    "phone",
    "role",
    "isEmailVerified",
    "companyRegistered",
    "status",
    "createdAt",
    "updatedAt",
  ] as Key[]
): Promise<Pick<User, Key> | null> => {
  const userFields = keys.reduce((obj, key) => ({ ...obj, [key]: true }), {});
  return prisma.user.findUnique({
    where: { id },
    select: {
      ...userFields,
    },
  }) as Promise<Pick<User, Key> | null>;
};

/**
 * Get user by email
 * @param {string} email
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<User, Key> | null>}
 */
const getUserByEmail = async <Key extends keyof User>(
  email: string,
  keys: Key[] = [
    "id",
    "email",
    "name",
    "phone",
    "password",
    "role",
    "isEmailVerified",
    "status",
    "createdAt",
    "updatedAt",
  ] as Key[]
): Promise<Pick<User, Key> | null> => {
  return prisma.user.findUnique({
    where: { email },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  }) as Promise<Pick<User, Key> | null>;
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async <Key extends keyof User>(
  userId: string,
  updateBody: Prisma.UserUpdateInput,
  keys: Key[] = ["id", "email", "name", "role"] as Key[]
): Promise<Pick<User, Key> | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Check if email is being updated and if it's new
  if (
    updateBody.email &&
    updateBody.email !== user.email &&
    (await getUserByEmail(updateBody.email as string))
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  // Update the user with the provided updateBody, skipping email check if it hasn't changed
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateBody,
    select: keys.reduce((obj, key) => ({ ...obj, [key]: true }), {}),
  });

  return updatedUser as Pick<User, Key> | null;
};

/**
 * Soft delete user by id (set status to inactive)
 * @param {string} userId - The ID of the user to soft delete
 * @returns {Promise<User>} - Returns the updated user data
 */
const deleteUserById = async (userId: string): Promise<User> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Set the user's status to false instead of deleting the record
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: false, deleted: true },
  });

  return updatedUser;
};

export default {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
};
