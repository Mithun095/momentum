import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <Link href="/auth/signup">
                        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Sign Up
                        </Button>
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                        Terms of Service
                    </h1>

                    <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-300">
                        <p>Last updated: {new Date().toLocaleDateString()}</p>

                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using Momentum, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Use of Service</h2>
                        <p>
                            Momentum provides productivity and habit tracking tools. You are responsible for all activity that occurs under your account.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. User Accounts</h2>
                        <p>
                            You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your password.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Data Privacy</h2>
                        <p>
                            Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use your information.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Modifications</h2>
                        <p>
                            We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of updated terms.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
