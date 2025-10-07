import {Header} from "../../../components";
import type {LoaderFunctionArgs} from "react-router";
import {getAllTrips, getTripById} from "~/appwrite/trips";
import {parseTripData} from "~/libs/utils";
import type {Route} from './+types/trips';

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const limit = 8
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1',  10);
    const offset = (page - 1) * limit;

    const { allTrips, total } = await getAllTrips(limit, offset);

    return {
        trips:allTrips.map(({ $id, tripDetail, imageUrls }: any) => ({
            id: $id,
            ...parseTripData(tripDetail),
            imageUrls: imageUrls || [],
        })),
        total,
    }

}

const Trips = ({ loaderData }: Route.ComponentProps) => {
    const trips = loaderData.trips as Trip[] | [];
    return (
        <main className='all-users wrapper'>
            <Header
                title='Trips'
                description='View and edit AI-generated travel plans'
                ctaText='Create a trip'
                ctaUrl='/trips/create'
            />

            <section>
                <h1 className='p-24-semibold'></h1>
            </section>
        </main>
    )
}
export default Trips
