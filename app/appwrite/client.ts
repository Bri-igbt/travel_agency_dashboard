import { Client, Account, Storage } from "appwrite";
import * as sdk from "appwrite"; // for TablesDB, ID, Query, etc.

export const appwriteConfig = {
    endpointUrl: import.meta.env.VITE_APPWRITE_API_ENDPOINT,
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
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

// ✅ New tables API
const tablesDB = new sdk.TablesDB(client);

export { client, account, storage, tablesDB };
