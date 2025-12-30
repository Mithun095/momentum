import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
            Momentum
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-4">
            Track your life. Amplify your progress.
          </p>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            The all-in-one platform to build better habits, journal your thoughts,
            plan your days, and achieve your goals with AI-powered insights.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 text-lg"
              >
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
            {/* Feature 1: Habit Tracking */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Habit Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Build better habits with visual calendar tracking and streak analytics
              </p>
            </div>

            {/* Feature 2: Smart Journal */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">📔</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Smart Journal
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Write or speak your thoughts with voice-to-text and structured sections
              </p>
            </div>

            {/* Feature 3: Task Planning */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Task Planning
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Plan your tomorrow today with auto-converting planners to tasks
              </p>
            </div>

            {/* Feature 4: AI Assistant */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                AI Assistant
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get personalized insights and manage your data with natural language
              </p>
            </div>

            {/* Feature 5: Team Collaboration */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Team Workspaces
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track team habits and productivity for HR and company wellness
              </p>
            </div>

            {/* Feature 6: Analytics */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Advanced Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Visualize your progress with charts, heatmaps, and insights
              </p>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-20 p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white">
            <h2 className="text-3xl font-bold mb-4">
              Start Building Momentum Today
            </h2>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of people improving their lives, one day at a time.
            </p>
            <Link href="/auth/signup">
              <Button
                size="lg"
                variant="secondary"
                className="h-14 px-8 text-lg"
              >
                Get Started - It's Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
