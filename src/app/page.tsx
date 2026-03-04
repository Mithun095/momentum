'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LandingNavbar } from '@/components/layout/LandingNavbar'
import { LandingFooter } from '@/components/layout/LandingFooter'
import { motion, useScroll, useTransform } from 'framer-motion'
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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } }
}

export default function HomePage() {
  const { status } = useSession()
  const router = useRouter()
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95])
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 80])

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="w-10 h-10 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 w-10 h-10 border-2 border-amber-400/30 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <LandingNavbar />

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* 3D Perspective Grid */}
        <div className="perspective-grid" />

        {/* Floating Orbs */}
        <div className="orb orb-primary w-[500px] h-[500px] -top-20 -left-40" />
        <div className="orb orb-accent w-[400px] h-[400px] top-1/3 -right-20" />
        <div className="orb orb-glow w-[350px] h-[350px] bottom-0 left-1/3" />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 max-w-5xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-sm font-medium text-amber-700 dark:text-amber-400 mb-8"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Life Management
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-8"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Build better habits.
            <br />
            <span className="gradient-text">Achieve your goals.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            A beautifully designed platform to track habits, plan your days,
            journal your thoughts, and stay on track — powered by AI.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="h-13 px-8 text-base bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white shadow-xl shadow-amber-500/20 hover:shadow-amber-500/35 hover:scale-[1.02] transition-all duration-300 btn-shine rounded-xl"
              >
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button
                size="lg"
                variant="outline"
                className="h-13 px-8 text-base glass-card hover:bg-white/80 dark:hover:bg-white/10 border-0 hover:scale-[1.02] transition-all duration-300 rounded-xl"
              >
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* 3D Floating preview card */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="mt-20 mx-auto max-w-3xl"
          >
            <div className="glass-card rounded-2xl p-6 sm:p-8 card-3d">
              <div className="card-3d-inner">
                <div className="grid grid-cols-3 gap-4 sm:gap-6">
                  <PreviewStat label="Habits" value="12/15" />
                  <PreviewStat label="Streak" value="28 days" />
                  <PreviewStat label="Goals" value="4 active" />
                </div>
                <div className="mt-6 h-2 rounded-full bg-gray-200 dark:bg-gray-700/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                    style={{ width: '72%' }}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground text-center">Daily Progress — 72% Complete</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="relative py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Everything you need to{' '}
              <span className="gradient-text">stay productive</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Simple, powerful tools designed to help you focus on what matters most.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-50px' }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
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
          </motion.div>
        </div>
      </section>

      {/* ===== TRUST SECTION ===== */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-50px' }}
            className="grid md:grid-cols-3 gap-8"
          >
            <TrustBadge
              icon={Shield}
              title="Secure & Private"
              description="Your data is encrypted and never shared with third parties."
            />
            <TrustBadge
              icon={Zap}
              title="Fast & Reliable"
              description="Built for speed with instant sync across all devices."
            />
            <TrustBadge
              icon={Clock}
              title="Free Forever"
              description="Core features are free. No credit card required."
            />
          </motion.div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="relative py-28 px-6 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-700 dark:from-amber-800 dark:via-yellow-900 dark:to-amber-900" />

        {/* Mesh overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Floating orbs */}
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-float-slow" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-yellow-300/10 blur-3xl animate-float" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Ready to build momentum?
          </h2>
          <p className="text-amber-100 mb-10 text-lg sm:text-xl leading-relaxed">
            Join and start building better habits today. Your future self will thank you.
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="h-14 px-10 text-base bg-white text-amber-800 hover:bg-gray-100 shadow-2xl shadow-black/20 hover:shadow-black/30 hover:scale-[1.03] transition-all duration-300 rounded-xl font-semibold btn-shine"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      <LandingFooter />
    </div>
  )
}


/* ===== SUB-COMPONENTS ===== */

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <motion.div variants={item}>
      <div className="group relative p-6 rounded-2xl glass-card glow-border hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-400 cursor-default">
        {/* Gradient overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/5 to-yellow-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

        <div className="relative">
          <div className="w-12 h-12 mb-5 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-6 w-6 text-amber-700 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold text-foreground mb-2 text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function TrustBadge({
  icon: Icon,
  title,
  description
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <motion.div variants={item} className="text-center group">
      <div className="w-14 h-14 mx-auto mb-4 glass-card rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-6 w-6 text-amber-700 dark:text-amber-400" />
      </div>
      <h3 className="font-semibold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 text-center">
      <p className="text-lg sm:text-xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
