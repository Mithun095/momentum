
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const user = await prisma.user.findFirst()
    if (user) {
        console.log(`Email: ${user.email}`)
        console.log(`Name: ${user.name}`)
        // We can't show the password as it is hashed, but we can tell them the email.
    } else {
        console.log("No user found.")
    }
}

main().finally(() => prisma.$disconnect())
