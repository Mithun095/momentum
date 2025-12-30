import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/encryption'

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(db),
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                console.log('[AUTH] Authorize called with email:', credentials?.email)

                if (!credentials?.email || !credentials?.password) {
                    console.log('[AUTH] Missing credentials')
                    return null
                }

                console.log('[AUTH] Querying database for user...')
                const user = await db.user.findUnique({
                    where: { email: credentials.email as string },
                })

                console.log('[AUTH] User found:', user ? 'yes' : 'no')
                if (!user || !user.password) {
                    console.log('[AUTH] User not found or no password set')
                    return null
                }

                console.log('[AUTH] Verifying password...')
                const isValid = await verifyPassword(
                    credentials.password as string,
                    user.password
                )

                console.log('[AUTH] Password valid:', isValid)
                if (!isValid) {
                    console.log('[AUTH] Password verification failed')
                    return null
                }

                console.log('[AUTH] Authentication successful for:', user.email)
                return {
                    id: user.id,
                    email: user.email!,
                    name: user.name,
                    image: user.image,
                }
            },
        }),
    ],
    callbacks: {
        async session({ token, session }) {
            if (token && session.user) {
                session.user.id = token.sub as string
                session.user.name = token.name
                session.user.email = token.email as string
                session.user.image = token.picture
            }

            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
    },
})

export const { GET, POST } = handlers
