'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Flame,
    LogOut,
    Settings,
    BarChart3,
    Target,
    Users,
    ChevronDown,
    Menu,
    X,
    Sun,
    Moon,
    Check,
    Home,
    CheckSquare,
    Book,
    ClipboardList,
    Bot,
    Calendar,
} from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { format } from 'date-fns'
import { useTheme, themes } from '@/components/theme/ThemeProvider'

const themeIcons = {
    light: Sun,
    dark: Moon,
}

const navLinks = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/dashboard/habits', label: 'Habits', icon: CheckSquare },
    { href: '/dashboard/tasks', label: 'Tasks', icon: ClipboardList },
    { href: '/dashboard/journal', label: 'Journal', icon: Book },
    { href: '/dashboard/events', label: 'Events', icon: Calendar },
    { href: '/dashboard/goals', label: 'Goals', icon: Target },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
]

export function Navbar() {
    const { data: session, status } = useSession()
    const pathname = usePathname()
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const activityRecorded = useRef(false)

    let theme: keyof typeof themes = 'light'
    let setTheme: (t: keyof typeof themes) => void = () => { }
    try {
        const themeContext = useTheme()
        theme = themeContext.theme
        setTheme = themeContext.setTheme
    } catch { }

    const ThemeIcon = themeIcons[theme] || Sun
    const nextTheme = theme === 'light' ? 'dark' : 'light'

    const navRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
                setIsProfileOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const { data: streakData } = api.streak.getStreak.useQuery(undefined, {
        enabled: status === 'authenticated',
    })

    const recordActivity = api.streak.recordActivity.useMutation()

    useEffect(() => {
        if (status === 'authenticated' && !activityRecorded.current) {
            activityRecorded.current = true
            recordActivity.mutate()
        }
    }, [status])

    const formattedDate = format(currentTime, 'EEEE, MMMM d, yyyy')
    const formattedTime = format(currentTime, 'h:mm a')
    const streak = streakData?.currentStreak ?? 0

    return (
        <nav ref={navRef} className="sticky top-0 z-50 glass-nav">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left: Logo */}
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm border border-border/50 group-hover:shadow-lg group-hover:shadow-amber-500/15 transition-all duration-300">
                            <Image
                                src="/logo.png"
                                alt="Momentum Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <span
                            className="text-xl font-bold text-foreground hidden sm:block tracking-tight"
                            style={{ fontFamily: 'var(--font-heading)' }}
                        >
                            Momentum
                        </span>
                    </Link>

                    {/* Center: Date/Time */}
                    <div className="hidden md:flex flex-col items-center text-sm">
                        <span className="font-medium text-foreground">
                            {formattedDate}
                        </span>
                        <span className="text-muted-foreground text-xs">
                            {formattedTime}
                        </span>
                    </div>

                    {/* Right: Streak + Auth */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Streak Badge */}
                        {status === 'authenticated' && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 glass-card rounded-full">
                                <Flame className="h-4 w-4 text-amber-500 animate-fire-pulse" />
                                <span className="text-sm font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                                    {streak}
                                </span>
                            </div>
                        )}

                        {/* Theme toggle */}
                        <button
                            onClick={() => setTheme(nextTheme)}
                            className="hidden md:flex p-2 rounded-xl hover:bg-accent/50 transition-colors"
                            title={`Switch to ${nextTheme} mode`}
                        >
                            <ThemeIcon className="h-5 w-5 text-muted-foreground" />
                        </button>

                        {/* Mobile menu toggle */}
                        <button
                            className="md:hidden p-2 rounded-xl hover:bg-accent/50 transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen
                                ? <X className="h-5 w-5 text-muted-foreground" />
                                : <Menu className="h-5 w-5 text-muted-foreground" />
                            }
                        </button>

                        {/* Desktop Auth Section */}
                        {status === 'loading' ? (
                            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                        ) : status === 'authenticated' ? (
                            <div className="relative hidden md:block">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-accent/50 transition-all duration-200"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
                                        {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Profile Dropdown */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl py-2 z-50 animate-scale-in">
                                        <div className="px-4 py-3 border-b border-border/50">
                                            <p className="font-medium text-foreground truncate">
                                                {session?.user?.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {session?.user?.email}
                                            </p>
                                        </div>

                                        <div className="py-1">
                                            {[
                                                { href: '/dashboard/goals', icon: Target, label: 'Goals' },
                                                { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
                                                { href: '/dashboard/workspace', icon: Users, label: 'Workspace' },
                                                { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
                                            ].map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-colors"
                                                    onClick={() => setIsProfileOpen(false)}
                                                >
                                                    <item.icon className="h-4 w-4" />
                                                    {item.label}
                                                </Link>
                                            ))}
                                        </div>

                                        <div className="border-t border-border/50 pt-1">
                                            <button
                                                onClick={() => signOut({ callbackUrl: '/' })}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 w-full transition-colors"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/auth/signin">
                                <Button className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white shadow-lg shadow-amber-500/20 btn-shine">
                                    Sign In
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && status === 'authenticated' && (
                    <div className="md:hidden py-4 border-t border-border/30 animate-fade-in-up">
                        <div className="text-center mb-4 text-sm text-muted-foreground">
                            {formattedDate} &middot; {formattedTime}
                        </div>

                        {/* Navigation Links */}
                        <div className="space-y-0.5 mb-4">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200
                                            ${isActive
                                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium'
                                                : 'text-foreground/70 hover:text-foreground hover:bg-accent/50'
                                            }
                                        `}
                                    >
                                        <link.icon className="h-4 w-4" />
                                        {link.label}
                                    </Link>
                                )
                            })}
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-0.5 border-t border-border/30 pt-3 mb-3">
                            {[
                                { href: '/dashboard/workspace', icon: Users, label: 'Workspace' },
                                { href: '/dashboard/ai', icon: Bot, label: 'AI Assistant' },
                                { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
                            ].map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-foreground/70 hover:text-foreground hover:bg-accent/50 rounded-xl text-sm transition-colors"
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Theme Toggle */}
                        <div className="px-4 py-3 border-t border-border/30">
                            <button
                                onClick={() => setTheme(nextTheme)}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-foreground/70 hover:text-foreground hover:bg-accent/50 transition-colors w-full"
                            >
                                <ThemeIcon className="h-4 w-4" />
                                <span>Switch to {themes[nextTheme].name} mode</span>
                            </button>
                        </div>

                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-500/10 rounded-xl w-full text-sm transition-colors mt-2"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </nav>
    )
}
