import { Role } from "@prisma/client";

const allRoles = {
  [Role.ADMIN]: [
    "createPassword",
    "createUser",
    "getUsers",
    "getUser",
    "updateUser",
    "deleteUser",
    "changeStatus",
    "getCompanies",
    "getCompany",
    "updateCompany",
    "deleteCompany",
    "createPlan",
    "updatePlan",
    "deletePlan",
    "createSubscription",
    "getSubscriptions",
    "getSubscription",
    "updateSubscription",
    "deleteSubscription",
    "getPaymentRequests",
    "updatePaymentRequest",
    "confirmPaymentRequest",
  ],
  [Role.PARTNER]: [
    "createPassword",
    "createUser",
    "getUsers",
    "getUser",
    "updateUser",
    "deleteUser",
    "createCompany",
    "getCompanies",
    "getCompany",
    "updateCompany",
    "deleteCompany",
    "createPaymentRequest",
    "createDailyRecord",
    "getDailyRecords",
    "getDailyRecord",
    "updateDailyRecord",
    "deleteDailyRecord",
    "barChart",
  ],
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
