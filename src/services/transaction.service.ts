import { Transaction, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";

/**
 * Create a new transaction
 * @param {Object} transactionData - The transaction data
 * @param {number} transactionData.amount - Transaction amount
 * @param {string} transactionData.type - Type of transaction (EARNING or EXPENSE)
 * @param {string} [transactionData.description] - Optional transaction description
 * @param {string} [transactionData.documentLink] - Optional link to supporting document
 * @param {string} transactionData.userId - ID of the user recording the transaction
 * @returns {Promise<Transaction>}
 */
const createTransaction = async (
  transactionData: Prisma.TransactionCreateInput
): Promise<Transaction> => {
  return prisma.transaction.create({
    data: transactionData,
  });
};

/**
 * Query for transactions with filters and options
 * @param {Object} filter - Prisma filter conditions
 * @param {Object} options - Pagination and sorting options
 * @param {string} [searchTerm] - Optional search term for filtering by description or documentLink
 * @returns {Promise<Transaction[]>}
 */
const queryTransactions = async <Key extends keyof Transaction>(
  filter: Partial<Prisma.TransactionWhereInput>,
  options: {
    sortBy?: string;
    limit?: number;
    page?: number;
    sortType?: "asc" | "desc";
  },
  searchTerm?: string,
  excludeTransactionId?: string,
  keys: Key[] = [
    "id",
    "amount",
    "type",
    "description",
    "documentLink",
    "userId",
    "createdAt",
  ] as Key[]
): Promise<Pick<Transaction, Key>[]> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? "createdAt";
  const sortType = options.sortType ?? "desc";

  const whereData: Partial<Prisma.TransactionWhereInput> = {
    ...filter,
  };

  // Add search term filtering for relevant fields
  if (searchTerm) {
    whereData.OR = [
      { description: { contains: searchTerm } },
      { documentLink: { contains: searchTerm } },
    ];
  }

  // Exclude a specific transaction by ID, if provided
  if (excludeTransactionId) {
    whereData.id = {
      not: excludeTransactionId,
    };
  }

  // Fetch the transactions
  const transactions = await prisma.transaction.findMany({
    where: whereData,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sortBy]: sortType },
  });

  return transactions as Pick<Transaction, Key>[];
};

/**
 * Get transaction by ID
 * @param {string} id - Transaction ID
 * @returns {Promise<Transaction | null>}
 */
const getTransactionById = async (id: string): Promise<Transaction | null> => {
  return prisma.transaction.findUnique({
    where: { id },
  });
};

/**
 * Update transaction by ID
 * @param {string} id - Transaction ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Transaction>}
 */
const updateTransactionById = async (
  id: string,
  updateData: Prisma.TransactionUpdateInput
): Promise<Transaction> => {
  const transaction = await prisma.transaction.findUnique({ where: { id } });

  if (!transaction) {
    throw new ApiError(httpStatus.NOT_FOUND, "Transaction not found");
  }

  return prisma.transaction.update({
    where: { id },
    data: updateData,
  });
};

export default {
  createTransaction,
  queryTransactions,
  getTransactionById,
  updateTransactionById,
};
