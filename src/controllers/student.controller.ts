import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { studentService } from "../services";
import sendResponse from "../utils/responseHandler";
import { Prisma, Student } from "@prisma/client";

const createStudent = catchAsync(async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    await studentService.createStudent(name, email, phone, password);

    return sendResponse(
      res,
      httpStatus.CREATED,
      true,
      null,
      "Student created successfully."
    );
  } catch (error) {
    console.error("Unexpected Error:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ message: "Internal Server Error" });
  }
});

const getStudents = catchAsync(async (req, res) => {
  const { searchTerm, ...filter } = pick(req.query, ["searchTerm"]);
  const options = pick(req.query, ["sortBy", "limit", "page", "sortType"]);

  const filterData: Partial<Prisma.StudentWhereInput> = {
    ...filter,
  };

  const Student = req.user as Student;
  const studentId = Student.id;

  const result = await studentService.queryStudents(
    filterData,
    options,
    searchTerm as string,
    studentId
  );
  res.send(result);
});

const getStudent = catchAsync(async (req, res) => {
  const Student = await studentService.getStudentById(req.params.studentId);
  if (!Student) {
    throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
  }
  return sendResponse(
    res,
    httpStatus.OK,
    true,
    Student,
    "Student details fetched successfully!"
  );
});

const updateStudent = catchAsync(async (req, res) => {
  await studentService.updateStudentById(req.params.studentId, req.body);

  return sendResponse(
    res,
    httpStatus.OK,
    true,
    null,
    "Student updated successfully!"
  );
});

const deleteStudent = catchAsync(async (req, res) => {
  await studentService.deleteStudentById(req.params.studentId);

  return sendResponse(
    res,
    httpStatus.OK,
    true,
    null,
    "Student deleted successfully!"
  );
});

export default {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
};
