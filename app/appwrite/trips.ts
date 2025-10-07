import { appwriteConfig, tablesDB } from "~/appwrite/client";
import { Query } from "appwrite";

export const getAllTrips = async (limit: number, offset: number) => {
  const allTrips = await tablesDB.listRows({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.tripTableId,
    queries: [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc("createdAt"),
    ],
  });

  if (allTrips.total === 0) {
      console.log('No trips found');
      return { allTrips: [], total: 0 };
  }

  return {
      allTrips: allTrips.rows,
      total: allTrips.total,
  };
};

export const getTripById = async (tripId: string) => {
    const trip = await tablesDB.getRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.tripTableId,
      rowId: tripId,
    });

    if (!trip.$id) {
        console.log('Trip not found')
        return null;
    }

    return trip;

}