import {Header, StatsCard, TripCard} from "../../../components";
import { dashboardStats, users, allTrips } from "~/constants";
import {getUser} from "~/appwrite/auth";
import type { Route } from './+types/Dashboard'

export const clientLoader = async () => {
    const res: any = await getUser();
    if (res && Array.isArray(res.rows) && res.rows.length > 0) {
        const row = res.rows[0] as any;
        const mappedUser: User = {
            id: row.accountId || row.$id || "",
            name: row.name || "",
            email: row.email || "",
            dateJoined: row.joinedAt || row.dateJoined || "",
            imageUrl: row.imageUrl || "",
        };
        return mappedUser;
    }
    return null;
};

const Dashboard = ({ loaderData }: Route.ComponentProps) => {
    const user = loaderData as unknown as User || null;

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
                        total={dashboardStats?.totalUsers}
                        currentMonthCount={dashboardStats.usersJoined.currentMonth}
                        lastMonthCount={dashboardStats.usersJoined.lastMonth}
                    />

                    <StatsCard
                        headerTitle='Total Trips'
                        total={dashboardStats?.totalTrips}
                        currentMonthCount={dashboardStats.tripsCreated.currentMonth}
                        lastMonthCount={dashboardStats.tripsCreated.lastMonth}
                    />

                    <StatsCard
                        headerTitle='Active Users'
                        total={dashboardStats?.userRole.total}
                        currentMonthCount={dashboardStats.userRole.currentMonth}
                        lastMonthCount={dashboardStats.userRole.lastMonth}
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
