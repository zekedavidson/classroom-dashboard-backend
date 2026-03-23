import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema/auth"

export const auth = betterAuth({
    trustedOrigins: ["chrome-extension://amknoiejhlmhancpahfcfcfhllgkpbld"],
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    emailAndPassword: {
        enabled: true,
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