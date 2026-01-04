import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPage() {
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
                        Privacy Policy
                    </h1>

                    <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-300">
                        <p>Last updated: {new Date().toLocaleDateString()}</p>

                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Information We Collect</h2>
                        <p>
                            We collect information you provide directly to us, such as when you create an account, track a habit, or write a journal entry. This includes your name, email address, and usage data.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. How We Use Your Information</h2>
                        <p>
                            We use your information to provide, maintain, and improve our services, including providing personalized insights and productivity analytics.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. Data Security</h2>
                        <p>
                            We implement appropriate security measures to protect your personal information against unauthorized access or disclosure.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Your Rights</h2>
                        <p>
                            You have the right to access, correct, or delete your personal information at any time through your account settings.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at support@momentum.app.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
