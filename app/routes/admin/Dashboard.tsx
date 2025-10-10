import {Header, StatsCard, TripCard} from "../../../components";
import { getUser, getAllUsers } from "~/appwrite/auth";
import type { Route } from './+types/Dashboard'
import { getUsersAndTripsStats, getUserGrowthPerDay, getTripsByTravelStyle } from "~/appwrite/dashboard";
import { getAllTrips } from "~/appwrite/trips";
import { parseTripData } from "~/libs/utils";
import {
    Category,
    ChartComponent,
    ColumnSeries,
    Inject,
    SeriesCollectionDirective, SeriesDirective,
    SplineAreaSeries,
    Tooltip
} from "@syncfusion/ej2-react-charts";
import {DataLabel} from "@syncfusion/ej2-maps";
import {tripXAxis, tripyAxis, userXAxis, useryAxis} from "~/constants";
import {ColumnDirective, ColumnsDirective, GridComponent} from "@syncfusion/ej2-react-grids";
import React from "react";


export const clientLoader = async () => {
    const [
        userRes,
        dashboardStats,
        trips,
        userGrowth,
        tripsByTravelStyle,
        allUsers,
    ] = await Promise.all([
        getUser().catch(() => null),
        getUsersAndTripsStats().catch(() => null),
        getAllTrips(4, 0).catch(() => ({ allTrips: [], total: 0 } as GetAllTripsResponse)),
        getUserGrowthPerDay().catch(() => []),
        getTripsByTravelStyle().catch(() => []),
        getAllUsers(4, 0).catch(() => [] as User[]),
    ]);

    let user: User | null = null;
    if (userRes && Array.isArray((userRes as any).rows) && (userRes as any).rows.length > 0) {
        const row = (userRes as any).rows[0] as any;
        const data = row.data || row;
        user = {
            id: data.accountId || row.$id || "",
            name: data.name || "",
            email: data.email || "",
            dateJoined: data.joinedAt || data.dateJoined || "",
            imageUrl: data.imageUrl || "",
        };
    }

    const allTrips = (trips as GetAllTripsResponse).allTrips.map(({ $id, tripDetail, imageUrls }: any) => ({
        id: $id,
        ...(parseTripData(tripDetail) || {}),
        imageUrls: imageUrls ?? [],
    }));

    const mappedUsers: UsersItineraryCount[] = (allUsers as User[]).slice(0, 4).map((u: User) => ({
        imageUrl: u.imageUrl,
        name: u.name,
        count: (u as any).itineraryCreated ?? Math.floor(Math.random() * 10),
    }));

    return {
        user,
        dashboardStats: dashboardStats as DashboardStats | null,
        allTrips,
        userGrowth,
        tripsByTravelStyle,
        allUsers: mappedUsers,
    };
};

const Dashboard = ({ loaderData }: Route.ComponentProps) => {
    const { user, dashboardStats, allTrips, userGrowth, tripsByTravelStyle, allUsers } = (loaderData as { user: User | null; dashboardStats: DashboardStats | null; allTrips: Trip[]; userGrowth?: any; tripsByTravelStyle?: any; allUsers?: UsersItineraryCount[] }) || { user: null, dashboardStats: null, allTrips: [], userGrowth: [], tripsByTravelStyle: [], allUsers: [] };

    const trips = allTrips.map((trip) => ({
        imageUrl: trip.imageUrls[0],
        name: trip.name,
        country: trip.country
    }))

    const usersAndTrips = [
        {
            title: 'Latest users signup',
            dataSource: allUsers,
            field: 'count',
            headerText: 'Trips created',
        },
        {
            title: 'Trips based on country',
            dataSource: trips,
            field: 'country',
            headerText: 'Country',
        }
    ]

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
                    {allTrips.map((trip) => (
                        <TripCard
                            key={trip.id}
                            id={trip.id.toString()}
                            name={trip.name!}
                            imageUrls={trip.imageUrls[0]}
                            location={trip.itinerary?.[0]?.location ?? ''}
                            tags={[trip.interests!, trip.travelStyle!]}
                            price={trip.estimatedPrice}
                        />
                    ))}
                </div>
            </section>

            <section className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
                <ChartComponent
                    id='chart-1'
                    primaryXAxis={userXAxis}
                    primaryYAxis={useryAxis}
                    title='User Growth'
                    tooltip={{ enable: true }}
                >
                    <SeriesCollectionDirective>
                        <SeriesDirective
                            dataSource={userGrowth}
                            xName='day'
                            yName='count'
                            type="Column"
                            name='Column'
                            columnWidth={0.3}
                            cornerRadius={{ topLeft: 10, topRight: 10 }}
                        />

                        <SeriesDirective
                            dataSource={userGrowth}
                            xName='day'
                            yName='count'
                            type="SplineArea"
                            name='Wave'
                            fill='rgba(71, 132, 238, 0.3)'
                            border={{ color: '#4784EE', width: 2 }}
                        />
                    </SeriesCollectionDirective>

                    <Inject services={[Category, ColumnSeries, SplineAreaSeries, DataLabel, Tooltip]} />
                </ChartComponent>

                <ChartComponent
                    id='chart-2'
                    primaryXAxis={tripXAxis}
                    primaryYAxis={tripyAxis}
                    title='Trip Trends'
                    tooltip={{ enable: true }}
                >
                    <Inject services={[Category, ColumnSeries, SplineAreaSeries, DataLabel, Tooltip]} />

                    <SeriesCollectionDirective>
                        <SeriesDirective
                            dataSource={tripsByTravelStyle}
                            xName='travelStyle'
                            yName='count'
                            type="Column"
                            name='day'
                            columnWidth={0.3}
                            cornerRadius={{ topLeft: 10, topRight: 10 }}
                        />
                    </SeriesCollectionDirective>
                </ChartComponent>
            </section>

            <section className='user-trip wrapper'>
                {usersAndTrips.map(({ title, dataSource, field, headerText }, index) => (
                    <div key={index} className='flex flex-col gap-4'>
                        <h3 className='p-20-semibold text-dark-100'>{title}</h3>

                        <GridComponent dataSource={dataSource} gridLines='None'>
                            <ColumnsDirective>
                                <ColumnDirective
                                    field='name'
                                    headerText='Name'
                                    width='200'
                                    textAlign='Left'
                                    template={(props: UserData) => (
                                        <div className='flex items-center gap-1.5 px-4'>
                                            <img src={props.imageUrl} alt='user' className='size-8 rounded-full aspect-square' referrerPolicy='no-referrer'/>
                                            <span>{props.name}</span>
                                        </div>
                                    )}
                                />

                                <ColumnDirective
                                    field={field}
                                    headerText={headerText}
                                    width='150'
                                    textAlign='Left'
                                />

                            </ColumnsDirective>
                        </GridComponent>
                    </div>
                ))}
            </section>

        </main>
    )
}
export default Dashboard
