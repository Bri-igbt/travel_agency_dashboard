import type {ActionFunctionArgs} from "react-router";

export const action = async ({ request }: ActionFunctionArgs)=> {
    const {
        country,
        numberOfDays,
        travelStyle,
        interests,
        budgets,
        groupType,
        userId
    } = await request.json();
};