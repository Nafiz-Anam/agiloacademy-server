import express from "express";
import auth from "../../../middlewares/auth";
import { transactionController } from "../../../controllers";

const router = express.Router();

router
  .route("/")
  .post(auth("createTransaction"), transactionController.createTransaction)
  .get(auth("getTransactions"), transactionController.getTransactions);

router
  .route("/:transactionId")
  .get(auth("getTransaction"), transactionController.getTransaction)
  .post(auth("updateTransaction"), transactionController.updateTransaction);

export default router;
