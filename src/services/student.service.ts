import { Student, Prisma } from "@prisma/client";
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
 * @returns {Promise<Student>}
 */
const createStudent = async (
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<Student> => {
  if (await getStudentByEmail(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken!");
  }

  // Assign a default password if none is provided
  const defaultPassword = "Agilo123";
  const hashedPassword = await encryptPassword(password || defaultPassword);

  // Prepare user data including optional company linkage
  const userData = {
    name,
    email,
    phone,
    password: hashedPassword,
  };

  const student = await prisma.student.create({
    data: userData,
  });

  return student;
};

/**
 * Query for users
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [searchTerm] - Optional search term for filtering
 * @param {string} [excludeStudentId] - Student ID to exclude from the results
 * @returns {Promise<Student[]>}
 */
const queryStudents = async <Key extends keyof Student>(
  filter: Partial<Prisma.StudentWhereInput>,
  options: {
    sortBy?: string;
    limit?: number;
    page?: number;
    sortType?: "asc" | "desc";
  },
  searchTerm?: string,
  excludeStudentId?: string,
  keys: Key[] = [
    "id",
    "email",
    "name",
    "phone",
    "deleted",
    "createdAt",
    "updatedAt",
  ] as Key[]
): Promise<Pick<Student, Key>[]> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy;
  const sortType = options.sortType ?? "desc";

  const whereData: Partial<Prisma.StudentWhereInput> = {
    ...filter,
  };

  if (searchTerm) {
    whereData.OR = [
      { name: { contains: searchTerm } },
      { email: { contains: searchTerm } },
    ];
  }

  if (excludeStudentId) {
    whereData.id = {
      not: excludeStudentId,
    };
  }

  // Ensure password is never included in the select keys
  const selectedKeys = keys.filter((key) => key !== "password");

  const students = await prisma.student.findMany({
    where: whereData,
    select: selectedKeys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
  });

  return students as Pick<Student, Key>[];
};

/**
 * Get student by id
 * @param {ObjectId} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<Student, Key> | null>}
 */
const getStudentById = async <Key extends keyof Student>(
  id: string,
  keys: Key[] = [
    "id",
    "email",
    "name",
    "phone",
    "deleted",
    "createdAt",
    "updatedAt",
  ] as Key[]
): Promise<Pick<Student, Key> | null> => {
  const selectedFields = keys.reduce(
    (obj, key) => ({ ...obj, [key]: true }),
    {}
  );
  return prisma.student.findUnique({
    where: { id },
    select: {
      ...selectedFields,
    },
  }) as Promise<Pick<Student, Key> | null>;
};

/**
 * Get student by email
 * @param {string} email
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<Student, Key> | null>}
 */
const getStudentByEmail = async <Key extends keyof Student>(
  email: string,
  keys: Key[] = [
    "id",
    "email",
    "name",
    "phone",
    "password",
    "deleted",
    "createdAt",
    "updatedAt",
  ] as Key[]
): Promise<Pick<Student, Key> | null> => {
  return prisma.student.findUnique({
    where: { email },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  }) as Promise<Pick<Student, Key> | null>;
};

/**
 * Update student by id
 * @param {ObjectId} studentId
 * @param {Object} updateBody
 * @returns {Promise<Student>}
 */
const updateStudentById = async <Key extends keyof Student>(
  studentId: string,
  updateBody: Prisma.StudentUpdateInput,
  keys: Key[] = ["id", "email", "name"] as Key[]
): Promise<Pick<Student, Key> | null> => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, email: true, name: true },
  });

  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
  }

  // Check if email is being updated and if it's new
  if (
    updateBody.email &&
    updateBody.email !== student.email &&
    (await getStudentByEmail(updateBody.email as string))
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  // Update the student with the provided updateBody, skipping email check if it hasn't changed
  const updatedStudent = await prisma.student.update({
    where: { id: studentId },
    data: updateBody,
    select: keys.reduce((obj, key) => ({ ...obj, [key]: true }), {}),
  });

  return updatedStudent as Pick<Student, Key> | null;
};

/**
 * Soft delete user by id (set status to inactive)
 * @param {string} studentId - The ID of the user to soft delete
 * @returns {Promise<Student>} - Returns the updated user data
 */
const deleteStudentById = async (studentId: string): Promise<Student> => {
  const user = await prisma.student.findUnique({ where: { id: studentId } });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
  }

  // Set the user's status to false instead of deleting the record
  const updatedStudent = await prisma.student.update({
    where: { id: studentId },
    data: { deleted: true },
  });

  return updatedStudent;
};

export default {
  createStudent,
  queryStudents,
  getStudentById,
  getStudentByEmail,
  updateStudentById,
  deleteStudentById,
};
