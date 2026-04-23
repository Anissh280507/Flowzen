import 'dotenv/config'

export const config = {
    port: process.env.PORT || 4000,
    databaseUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    clerkSecretKey: process.env.CLERK_SECRET_KEY,
    clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET,
}
