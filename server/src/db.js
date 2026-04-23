import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

let prisma

export function getPrisma() {
    if (prisma) {
        return prisma
    }

    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
        throw new Error('DATABASE_URL is missing. Set it in the deployed environment and redeploy.')
    }

    const pool = new Pool({ connectionString: databaseUrl })
    const adapter = new PrismaNeon(pool)

    prisma = new PrismaClient({
        adapter,
    })

    return prisma
}
