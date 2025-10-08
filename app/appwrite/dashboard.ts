import {appwriteConfig, tablesDB} from "~/appwrite/client";

interface Document {
    [key: string]: any;
}

type FilterByDate = (
    items: Document[],
    key: string,
    start: string,
    end: string,
) => number;

export const getUsersAndTripsStats = async (): Promise<DashboardStats> => {
    const now = new Date();
    const startCurrent = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endCurrent = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endPrev = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    const [users, trips] = await Promise.all([
        tablesDB.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.userTableId,
        }),
        tablesDB.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.tripTableId,
        }),
    ]);

    const filterByDate: FilterByDate = (items, key, start, end) =>
        items.filter((item: any) => {
            const value: string | undefined = item?.data?.[key] ?? item?.[key];
            if (!value) return false;
            return value >= start && value <= end;
        }).length;

    const getUserRows = () => (Array.isArray((users as any)?.rows) ? (users as any).rows : []);
    const userData = getUserRows().map((row: any) => row?.data ?? row);

    // Active user detection:
    // Consider users "active" if:
    // - role/userRole/status explicitly equals 'active'
    // - OR role/userRole indicates a regular user (e.g., 'user', 'member', 'basic')
    // - OR a boolean flag `active === true` exists
    const isActive = (u: any) => {
        const flag = (u?.role ?? u?.userRole ?? u?.status ?? "").toString().toLowerCase();
        if (u?.active === true) return true;
        if (flag === "active") return true;
        // Treat common non-admin roles as active users
        if (["user", "member", "basic", "customer"].includes(flag)) return true;
        // Exclude obvious admin/staff roles from being counted as active users
        if (["admin", "superadmin", "staff", "moderator"].includes(flag)) return false;
        // If no role info, default to counting them as active to avoid zeroed stats
        return !flag;
    };

    const activeUsers = userData.filter(isActive);

    return {
        totalUsers: (users as any)?.total ?? userData.length,
        usersJoined: {
            currentMonth: filterByDate(userData, "joinedAt", startCurrent, endCurrent),
            lastMonth: filterByDate(userData, "joinedAt", startPrev, endPrev),
        },

        userRole: {
            total: activeUsers.length,
            currentMonth: filterByDate(activeUsers, "joinedAt", startCurrent, endCurrent),
            lastMonth: filterByDate(activeUsers, "joinedAt", startPrev, endPrev),
        },
        totalTrips: (trips as any)?.total ?? (Array.isArray((trips as any)?.rows) ? (trips as any).rows.length : 0),
        tripsCreated: {
            currentMonth: filterByDate((trips as any).rows ?? [], "createdAt", startCurrent, endCurrent),
            lastMonth: filterByDate((trips as any).rows ?? [], "createdAt", startPrev, endPrev),
        },
    } as any;
}

export const getUserGrowthPerDay = async () => {
    const usersRes = await tablesDB.listRows({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.userTableId,
    });

    const rows: any[] = Array.isArray((usersRes as any)?.rows) ? (usersRes as any).rows : [];

    const userGrowth = rows.reduce(
        (acc: { [key: string]: number }, row: any) => {
            const data = row?.data ?? row;
            const dateStr: string | undefined = data?.joinedAt ?? data?.dateJoined;
            if (!dateStr) return acc;
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return acc;
            const day = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            acc[day] = (acc[day] || 0) + 1;
            return acc;
        },
        {}
    );

    return Object.entries(userGrowth).map(([day, count]) => ({
        count: Number(count),
        day,
    }));
};

export const getTripsCreatedPerDay = async () => {
    const tripsRes = await tablesDB.listRows({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.tripTableId,
    });

    const rows: any[] = Array.isArray((tripsRes as any)?.rows) ? (tripsRes as any).rows : [];

    const tripsGrowth = rows.reduce(
        (acc: { [key: string]: number }, row: any) => {
            const data = row?.data ?? row;
            const dateStr: string | undefined = data?.createdAt;
            if (!dateStr) return acc;
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return acc;
            const day = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            acc[day] = (acc[day] || 0) + 1;
            return acc;
        },
        {}
    );

    return Object.entries(tripsGrowth).map(([day, count]) => ({
        count: Number(count),
        day,
    }));
};

export const getTripsByTravelStyle = async () => {
    const tripsRes = await tablesDB.listRows({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.tripTableId,
    });

    const rows: any[] = Array.isArray((tripsRes as any)?.rows) ? (tripsRes as any).rows : [];

    const travelStyleCounts = rows.reduce(
        (acc: { [key: string]: number }, row: any) => {
            const data = row?.data ?? row;
            let details: any = data?.tripDetails;

            if (typeof details === "string") {
                try { details = JSON.parse(details); } catch { /* ignore */ }
            }

            const style: string | undefined = details?.travelStyle ?? data?.travelStyle;
            if (style) {
                acc[style] = (acc[style] || 0) + 1;
            }
            return acc;
        },
        {}
    );

    return Object.entries(travelStyleCounts).map(([travelStyle, count]) => ({
        count: Number(count),
        travelStyle,
    }));
};