// Debug script to test password hashing and verification
import { db } from './src/lib/db'
import { verifyPassword } from './src/lib/encryption'

async function testPasswordVerification() {
    try {
        // Get a user from the database
        const user = await db.user.findFirst({
            where: { email: 'testuser2@example.com' }
        })

        if (!user) {
            console.log('User not found')
            return
        }

        console.log('User found:', user.email)
        console.log('Hashed password from DB:', user.password)

        // Test password verification
        const password = 'SecurePass123'
        console.log('Testing password:', password)

        const isValid = await verifyPassword(password, user.password!)
        console.log('Password verification result:', isValid)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await db.$disconnect()
    }
}

testPasswordVerification()
