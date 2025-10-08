import { Header, StatsCard, TripCard } from "../../../components";
import { allTrips } from "~/constants";
import { getAllUsers, getUser } from "~/appwrite/auth";
import type { Route } from './+types/Dashboard'
import { getTripsByTravelStyle, getUserGrowthPerDay, getUsersAndTripsStats } from "~/appwrite/dashboard";
import { getAllTrips } from "~/appwrite/trips";
import { parseTripData } from "~/libs/utils";

export const clientLoader = async () => {
    const [userRes, dashboardStats, tripsRes, userGrowth, tripsByTravelStyle, allUsersRes] = await Promise.all([
        getUser(),
        getUsersAndTripsStats(),
        getAllTrips(4, 0),
        getUserGrowthPerDay(),
        getTripsByTravelStyle(),
        getAllUsers(4, 0),
    ]);

    // Normalize user from tables rows -> User shape
    let user: User | null = null;
    if (userRes && Array.isArray((userRes as any).rows) && (userRes as any).rows.length > 0) {
        const row = (userRes as any).rows[0] as any;
        const data = row?.data ?? row;
        user = {
            id: data.accountId || row.$id || "",
            name: data.name || "",
            email: data.email || "",
            dateJoined: data.joinedAt || data.dateJoined || "",
            imageUrl: data.imageUrl || "",
        };
    } else if (userRes && typeof userRes === 'object') {
        // In case getUser ever returns the already-mapped user
        const u = userRes as any;
        user = {
            id: u.id || u.accountId || u.$id || "",
            name: u.name || "",
            email: u.email || "",
            dateJoined: u.joinedAt || u.dateJoined || "",
            imageUrl: u.imageUrl || "",
        };
    }

    // Map trips using parseTripData and handle row.data fallback
    const allTrips = (tripsRes?.allTrips ?? []).map((row: any) => {
        const data = row?.data ?? row;
        const details = data?.tripDetails ?? row?.tripDetails;
        const parsed = parseTripData ? parseTripData(details) : {};
        return {
            id: row.$id,
            ...parsed,
            imageUrls: data?.imageUrls ?? row?.imageUrls ?? [],
        };
    });

    // Normalize users result (supports array or { users })
    const usersArray: any[] = Array.isArray((allUsersRes as any)?.users)
        ? (allUsersRes as any).users
        : Array.isArray(allUsersRes)
            ? (allUsersRes as any)
            : [];

    const mappedUsers: UsersItineraryCount[] = usersArray.map((u: any) => ({
        imageUrl: u.imageUrl,
        name: u.name,
        count: u.itineraryCount ?? Math.floor(Math.random() * 10),
    }));

    return {
        user,
        dashboardStats: dashboardStats ?? null,
        allTrips,
        userGrowth: userGrowth ?? [],
        tripsByTravelStyle: tripsByTravelStyle ?? [],
        allUsers: mappedUsers,
    };
};

const Dashboard = ({ loaderData }: Route.ComponentProps) => {
    const { user, dashboardStats } = (loaderData as { user: User | null; dashboardStats: DashboardStats | null }) || { user: null, dashboardStats: null };

    return (
        <main className='dashboard wrapper'>
            <Header
                title={`Welcome ${user?.name ?? 'Guest'} 👋`}
                description='Track activity, trends and popular destination in real time'
            />

            <section className='flex flex-col gap-6'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 w-full'>
                    <StatsCard
                        headerTitle='Total Users'
                        total={dashboardStats?.totalUsers ?? 0}
                        currentMonthCount={dashboardStats?.usersJoined.currentMonth ?? 0}
                        lastMonthCount={dashboardStats?.usersJoined.lastMonth ?? 0}
                    />

                    <StatsCard
                        headerTitle='Total Trips'
                        total={dashboardStats?.totalTrips ?? 0}
                        currentMonthCount={dashboardStats?.tripsCreated.currentMonth ?? 0}
                        lastMonthCount={dashboardStats?.tripsCreated.lastMonth ?? 0}
                    />

                    <StatsCard
                        headerTitle='Active Users'
                        total={dashboardStats?.userRole.total ?? 0}
                        currentMonthCount={dashboardStats?.userRole.currentMonth ?? 0}
                        lastMonthCount={dashboardStats?.userRole.lastMonth ?? 0}
                    />
                </div>
            </section>

            <section className='container'>
                <h2 className='text-xl font-semibold text-dark-100'>Created Trips</h2>

                <div className='trip-grid'>
                    {allTrips.slice(0, 4).map(({ id, name, itinerary, imageUrls, tags, estimatedPrice}) => (
                        <TripCard
                            key={id}
                            id={id.toString()}
                            name={name}
                            imageUrls={imageUrls[0]}
                            location={itinerary?.[0]?.location ?? ''}
                            tags={tags}
                            price={estimatedPrice}
                        />
                    ))}
                </div>
            </section>

        </main>
    )
}
export default Dashboard
