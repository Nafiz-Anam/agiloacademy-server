import express from "express";
import auth from "../../../middlewares/auth";
import { studentController } from "../../../controllers";

const router = express.Router();

router
  .route("/")
  .post(auth("createStudent"), studentController.createStudent)
  .get(auth("getStudents"), studentController.getStudents);

router
  .route("/:studentId")
  .get(auth("getStudent"), studentController.getStudent)
  .post(auth("updateStudent"), studentController.updateStudent)
  .delete(auth("deleteStudent"), studentController.deleteStudent);

export default router;
