import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing. Set it in the deployed environment and redeploy.')
}

const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaNeon(pool)

export const prisma = new PrismaClient({
    adapter,
})
