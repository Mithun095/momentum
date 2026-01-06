import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Parse database URL to check if it's Supabase
const databaseUrl = process.env.DATABASE_URL || ''
const isSupabase = databaseUrl.includes('supabase.co')

const pool = new Pool({
    connectionString: databaseUrl,
    // SSL required for Supabase
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    // Connection settings for serverless
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
})

const adapter = new PrismaPg(pool)

export const db =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

