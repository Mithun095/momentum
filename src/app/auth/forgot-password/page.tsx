'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
    const { toast } = useToast()
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter your email address',
                variant: 'destructive',
            })
            return
        }

        setIsLoading(true)

        // Simulate sending reset email (in production, you'd call an API)
        await new Promise(resolve => setTimeout(resolve, 1500))

        setIsSent(true)
        setIsLoading(false)

        toast({
            title: 'Reset email sent!',
            description: 'Check your inbox for password reset instructions.',
        })
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <Link
                        href="/auth/signin"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Sign In
                    </Link>
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">Forgot Password?</CardTitle>
                    <CardDescription>
                        No worries! Enter your email and we'll send you reset instructions.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {isSent ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Check your email
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                We've sent password reset instructions to <strong>{email}</strong>
                            </p>
                            <div className="space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setIsSent(false)
                                        setEmail('')
                                    }}
                                >
                                    Try another email
                                </Button>
                                <Link href="/auth/signin">
                                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                                        Return to Sign In
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    disabled={isLoading}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Remember your password?{' '}
                                <Link href="/auth/signin" className="text-primary hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
