import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'
import { config } from './config.js'

const pool = new Pool({ connectionString: config.databaseUrl })
const adapter = new PrismaNeon(pool)

export const prisma = new PrismaClient({
    adapter,
})
