import { Client, Account, Storage } from "appwrite";
import * as sdk from "appwrite";

// Validate environment variables
const endpoint = import.meta.env.VITE_APPWRITE_API_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
    throw new Error(
        `[Appwrite] Missing configuration: endpoint="${endpoint}", projectId="${projectId}"`
    );
}

export const appwriteConfig = {
    endpointUrl: endpoint,
    projectId: projectId,
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    apiKey: import.meta.env.VITE_APPWRITE_API_KEY,
    userTableId: import.meta.env.VITE_APPWRITE_USERS_TABLE_ID,
    tripTableId: import.meta.env.VITE_APPWRITE_TRIPS_TABLE_ID,
};

// Client setup
const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);

// Services
const account = new Account(client);
const storage = new Storage(client);
const tablesDB = new sdk.TablesDB(client);

export { client, account, storage, tablesDB };