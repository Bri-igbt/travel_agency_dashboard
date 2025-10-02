import {account, appwriteConfig, client, tablesDB} from "~/appwrite/client";
import {OAuthProvider, Query, ID} from "appwrite";
import {redirect} from "react-router";

export const loginWithGoogle = async () => {
    try {
        account.createOAuth2Session({
            provider: OAuthProvider.Google,
            success: 'https://example.com/success', // redirect here on success
            failure: 'https://example.com/failed', // redirect here on failure
            // Request Google scopes needed to read basic profile (includes profile photo)
            scopes: ['openid', 'email', 'profile']
        });
    } catch (error) {
        console.log('loginWithUsingGoogle', error);
    }
};

export const getUser = async () => {
    try {
        const user = await account.get();
        if (!user) return redirect("/sign-in");

        // Fetch the row(s) from your Users table
            return await tablesDB.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.userTableId,
            queries: [
                Query.equal("accountId", user.$id),
                Query.select(["name", "email", "imageUrl", "joinedAt", "accountId"]),
            ],
        });
    } catch (error) {
        console.error("getUser error:", error);
        return null;
    }
};

export const logoutUser = async (): Promise<boolean> => {
    try {
        // Delete the *current* session
        await account.deleteSession({ sessionId: "current" });
        return true;
    } catch (error) {
        console.error("logoutUser error:", error);
        return false;
    }
};

export const getGooglePicture = async (): Promise<string | null> => {
    try {
        // Get the current OAuth2 session to access the Google access token
        const session: any = await account.getSession({ sessionId: "current" });
        const accessToken: string | undefined = session?.providerAccessToken;
        if (!accessToken) {
            console.warn('No provider access token found for the current session.');
            return null;
        }

        // 1) Prefer the OpenID UserInfo endpoint (returns a public picture URL)
        try {
            const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (userInfoRes.ok) {
                const userInfo = await userInfoRes.json();
                if (userInfo?.picture && typeof userInfo.picture === 'string') {
                    return userInfo.picture;
                }
            }
        } catch (e) {
            console.log(e)
        }

        try {
            const peopleRes = await fetch('https://people.googleapis.com/v1/people/me?personFields=photos', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (peopleRes.ok) {
                const data = await peopleRes.json();
                const photos = Array.isArray(data?.photos) ? data.photos : [];
                const primary = photos.find((p: any) => p?.metadata?.primary) || photos[0];
                const url = primary?.url;
                if (typeof url === 'string' && url.length > 0) {
                    return url;
                }
            }
        } catch (e) {
            console.log(e)
        }

        return null;
    } catch (error) {
        console.log(error);
        return null;
    }
};

export const storeUserData = async () => {
    try {
        // Get current Appwrite account details
        const user = await account.get();
        if (!user) return null;

        // Check if user already exists in Users table
        const existing = await tablesDB.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.userTableId,
            queries: [Query.equal("accountId", user.$id)],
        });
        // If a row already exists, return the first one
        // @ts-ignore - SDK returns a RowList shape with `rows`
        if (existing && Array.isArray((existing as any).rows) && (existing as any).rows.length > 0) {
            // @ts-ignore
            return (existing as any).rows[0];
        }

        // Otherwise, build data and create a new row
        let imageUrl: string | null = null;
        try {
            imageUrl = await getGooglePicture();
        } catch {}

        const data: Record<string, any> = {
            name: user.name || (user.email ? user.email.split("@")[0] : ""),
            email: user.email,
            imageUrl: imageUrl || "",
            joinedAt: new Date().toISOString(),
            accountId: user.$id,
        };

        const created = await tablesDB.createRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.userTableId,
            rowId: ID.unique(),
            data,
        });
        return created;
    } catch (error) {
        console.log(error);
        return null;
    }
};

export const getExistingUser = async () => {
    try {
        const user = await account.get();
        if (!user) return null;

        const rows = await tablesDB.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.userTableId,
            queries: [
                Query.equal("accountId", user.$id),
                Query.limit(1),
            ],
        });
        // @ts-ignore - RowList shape with `rows`
        if (rows && Array.isArray((rows as any).rows) && (rows as any).rows.length > 0) {
            // @ts-ignore
            return (rows as any).rows[0];
        }
        return null;
    } catch (error) {
        console.log(error);
        return null;
    }
};