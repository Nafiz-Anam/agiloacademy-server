import express from "express";
import auth from "../../../middlewares/auth";
import { userController } from "../../../controllers";

const router = express.Router();

router
  .route("/")
  .post(auth("createUser"), userController.createUser)
  .get(auth("getUsers"), userController.getUsers);

router
  .route("/:userId")
  .get(auth("getUser"), userController.getUser)
  .post(auth("updateUser"), userController.updateUser)
  .delete(auth("deleteUser"), userController.deleteUser);

router.post(
  "/change-status/:userId",
  auth("changeStatus"),
  userController.updateUserStatus
);

export default router;
