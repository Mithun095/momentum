'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LandingNavbar } from '@/components/layout/LandingNavbar'
import { LandingFooter } from '@/components/layout/LandingFooter'
import {
  CheckCircle,
  Calendar,
  BarChart3,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Clock
} from 'lucide-react'

export default function HomePage() {
  const { status } = useSession()
  const router = useRouter()

  // Auto-redirect if logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Only show landing page to unauthenticated users
  if (status === 'authenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navigation */}
      <LandingNavbar />

      {/* Hero Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Build better habits.
            <br />
            <span className="text-indigo-600">Achieve your goals.</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            A simple, focused platform to track habits, plan your days,
            journal your thoughts, and stay on track with your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="h-12 px-8 text-base bg-indigo-600 hover:bg-indigo-700">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Everything you need to stay productive
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto">
            Simple tools designed to help you focus on what matters most.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={CheckCircle}
              title="Habit Tracking"
              description="Build consistent routines with visual progress tracking and streak analytics."
            />
            <FeatureCard
              icon={Calendar}
              title="Task Planning"
              description="Plan your days and weeks with an intuitive calendar and task management."
            />
            <FeatureCard
              icon={BarChart3}
              title="Progress Analytics"
              description="Visualize your growth with comprehensive charts and insights."
            />
            <FeatureCard
              icon={Sparkles}
              title="AI Assistant"
              description="Get personalized suggestions and manage your data with natural language."
            />
            <FeatureCard
              icon={Clock}
              title="Daily Journal"
              description="Reflect on your day with structured journaling and voice notes."
            />
            <FeatureCard
              icon={Zap}
              title="Goal Setting"
              description="Set meaningful goals with milestones and track your progress."
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure & Private</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your data is encrypted and never shared with third parties.</p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast & Reliable</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Built for speed with instant sync across all devices.</p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Free Forever</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Core features are free. No credit card required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to build momentum?
          </h2>
          <p className="text-indigo-100 mb-8 text-lg">
            Join and start building better habits today.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="h-12 px-8 text-base">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}



function FeatureCard({ icon: Icon, title, description }: {
  icon: React.ComponentType<{ className?: string }>,
  title: string,
  description: string
}) {
  return (
    <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
      <div className="w-10 h-10 mb-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
        <Icon className="h-5 w-5 text-indigo-600" />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}
