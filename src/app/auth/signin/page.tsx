'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SignInPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid email or password')
            } else {
                router.push('/dashboard')
            }
        } catch (error) {
            setError('Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl: '/dashboard' })
    }

    return (
        <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
            {/* Aurora Background */}
            <div className="absolute inset-0 aurora-bg" />

            {/* Floating orbs */}
            <div className="orb orb-primary w-[400px] h-[400px] -top-20 -right-20" />
            <div className="orb orb-accent w-[300px] h-[300px] bottom-20 -left-20" />
            <div className="orb orb-glow w-[250px] h-[250px] top-1/2 right-1/3" />

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                <div className="w-full max-w-md relative">
                    {/* Back Arrow */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Link
                            href="/"
                            className="md:absolute md:top-0 md:-left-16 mb-6 md:mb-0 inline-flex items-center justify-center w-10 h-10 rounded-full glass-card text-muted-foreground hover:text-foreground transition-all hover:scale-105"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </motion.div>

                    {/* Logo and Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-center mb-8"
                    >
                        <h1
                            className="text-4xl font-bold gradient-text"
                            style={{ fontFamily: 'var(--font-heading)' }}
                        >
                            Momentum
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Track your life, amplify your progress
                        </p>
                    </motion.div>

                    {/* Sign In Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                        className="glass-card rounded-2xl p-8"
                    >
                        <h2
                            className="text-2xl font-semibold text-foreground mb-6"
                            style={{ fontFamily: 'var(--font-heading)' }}
                        >
                            Sign In
                        </h2>

                        {/* Google Sign In */}
                        <Button
                            onClick={handleGoogleSignIn}
                            variant="outline"
                            className="w-full mb-4 h-12 text-base glass hover:bg-white/20 dark:hover:bg-white/10 border-border/50 rounded-xl transition-all duration-300"
                            type="button"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border/50"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-card/80 backdrop-blur-sm text-muted-foreground rounded-full">
                                    Or continue with email
                                </span>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 glass border-border/50 rounded-xl focus:ring-2 focus:ring-amber-500/30 transition-all"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                                    Password
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 glass border-border/50 rounded-xl focus:ring-2 focus:ring-amber-500/30 transition-all"
                                />
                                <div className="mt-2 text-right">
                                    <Link
                                        href="/auth/forgot-password"
                                        className="text-sm text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm border border-red-500/20"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 text-base bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-300 rounded-xl btn-shine"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Signing in...
                                    </div>
                                ) : 'Sign In'}
                            </Button>
                        </form>

                        <p className="mt-6 text-center text-sm text-muted-foreground">
                            Don&apos;t have an account?{' '}
                            <Link
                                href="/auth/signup"
                                className="font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                            >
                                Sign up
                            </Link>
                        </p>
                    </motion.div>

                    {/* Footer */}
                    <p className="mt-8 text-center text-sm text-muted-foreground/70">
                        By continuing, you agree to our{' '}
                        <Link href="/terms" className="underline hover:text-foreground transition-colors">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
