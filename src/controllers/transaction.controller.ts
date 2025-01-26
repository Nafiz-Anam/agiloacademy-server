import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { transactionService } from "../services";
import sendResponse from "../utils/responseHandler";
import { Prisma, Transaction, User } from "@prisma/client";

/**
 * Create a transaction
 */
const createTransaction = catchAsync(async (req, res) => {
  const user = req.user as User;
  const userId = user.id;

  const { amount, type, description, documentLink } = req.body;

  try {
    await transactionService.createTransaction({
      amount,
      type,
      description,
      documentLink,
      user: {
        connect: { id: userId }, // Properly link the user to the transaction
      },
    });

    return sendResponse(
      res,
      httpStatus.CREATED,
      true,
      null,
      "Transaction created successfully."
    );
  } catch (error) {
    console.error("Unexpected Error:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ message: "Internal Server Error" });
  }
});

/**
 * Get all transactions with optional filters and pagination
 */
const getTransactions = catchAsync(async (req, res) => {
  const { searchTerm, ...filter } = pick(req.query, [
    "searchTerm",
    "type",
    "userId",
  ]);
  const options = pick(req.query, ["sortBy", "limit", "page", "sortType"]);

  const filterData: Partial<Prisma.TransactionWhereInput> = {
    ...filter,
  };

  const Transaction = req.user as Transaction;
  const transactionId = Transaction.id;

  const result = await transactionService.queryTransactions(
    filterData,
    options,
    searchTerm as string,
    transactionId
  );
  res.send(result);
});

/**
 * Get a single transaction by ID
 */
const getTransaction = catchAsync(async (req, res) => {
  const transaction = await transactionService.getTransactionById(
    req.params.transactionId
  );
  if (!transaction) {
    throw new ApiError(httpStatus.NOT_FOUND, "Transaction not found");
  }
  return sendResponse(
    res,
    httpStatus.OK,
    true,
    transaction,
    "Transaction details fetched successfully!"
  );
});

/**
 * Update a transaction by ID
 */
const updateTransaction = catchAsync(async (req, res) => {
  const { amount, type, description, documentLink } = req.body;

  await transactionService.updateTransactionById(req.params.transactionId, {
    amount,
    type,
    description,
    documentLink,
  });

  return sendResponse(
    res,
    httpStatus.OK,
    true,
    null,
    "Transaction updated successfully!"
  );
});

export default {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
};
