import { DailyRecord } from "@prisma/client";

export const generateColumns = (
  data: DailyRecord[]
): { header: string; key: string; width: number }[] => {
  if (data.length === 0) {
    return [];
  }

  const firstItem = data[0];
  const columns = Object.keys(firstItem).map((key) => {
    return {
      header:
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"), // Capitalize header
      key: key,
      width: 30, // Default width
    };
  });

  return columns;
};
