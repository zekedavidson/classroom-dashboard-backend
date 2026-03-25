import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema/auth.js"

export const auth = betterAuth({
    trustedOrigins: ["chrome-extension://amknoiejhlmhancpahfcfcfhllgkpbld", process.env.FRONTEND_URL as string],
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    emailAndPassword: {
        enabled: true,
    },
    advanced: {
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true, // required for cross-domain cookies
        }
    },
    user: {
        additionalFields: {
            role: {
                type: 'string', required: true, defaultValue: 'student', input: true
            },
            imageCldPubId: {
                type: 'string', required: false, input: true,
            }
        }
    }
}); 