'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
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
    Palette,
    Check,
    Sun,
    Moon,
    Stars
} from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { format } from 'date-fns'
import { useTheme, themes } from '@/components/theme/ThemeProvider'

const themeIcons = {
    light: Sun,
    dark: Moon,
    midnight: Stars,
}

export function Navbar() {
    const { data: session, status } = useSession()
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isThemeOpen, setIsThemeOpen] = useState(false)
    const activityRecorded = useRef(false)

    // Theme - with fallback for when ThemeProvider isn't ready
    let theme: keyof typeof themes = 'light'
    let setTheme: (t: keyof typeof themes) => void = () => { }
    try {
        const themeContext = useTheme()
        theme = themeContext.theme
        setTheme = themeContext.setTheme
    } catch {
        // ThemeProvider not ready yet
    }

    const ThemeIcon = themeIcons[theme] || Sun

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 60000)
        return () => clearInterval(timer)
    }, [])

    // Get and update streak
    const { data: streakData } = api.streak.getStreak.useQuery(undefined, {
        enabled: status === 'authenticated',
    })

    const recordActivity = api.streak.recordActivity.useMutation()

    // Record activity on mount when authenticated (only once)
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
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left: Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">M</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                            Momentum
                        </span>
                    </Link>

                    {/* Center: Date/Time */}
                    <div className="hidden md:flex flex-col items-center text-sm">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formattedDate}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                            {formattedTime}
                        </span>
                    </div>

                    {/* Right: Streak + Auth */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Streak Badge */}
                        {status === 'authenticated' && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-full border border-orange-200 dark:border-orange-800">
                                <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                    {streak}
                                </span>
                            </div>
                        )}

                        {/* Mobile menu toggle */}
                        <button
                            className="md:hidden p-2 text-gray-500 hover:text-gray-700"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>

                        {/* Auth Section */}
                        {status === 'loading' ? (
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        ) : status === 'authenticated' ? (
                            <div className="relative hidden md:block">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                        {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                {session?.user?.name}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {session?.user?.email}
                                            </p>
                                        </div>

                                        <Link
                                            href="/dashboard/goals"
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <Target className="h-4 w-4" />
                                            Goals
                                        </Link>
                                        <Link
                                            href="/dashboard/analytics"
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <BarChart3 className="h-4 w-4" />
                                            Analytics
                                        </Link>
                                        <Link
                                            href="/dashboard/workspace"
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <Users className="h-4 w-4" />
                                            Workspace
                                        </Link>
                                        <Link
                                            href="/dashboard/settings"
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <Settings className="h-4 w-4" />
                                            Settings
                                        </Link>

                                        {/* Theme Submenu */}
                                        <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setIsThemeOpen(!isThemeOpen)}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                                                >
                                                    <Palette className="h-4 w-4" />
                                                    <span className="flex-1 text-left">Theme</span>
                                                    <ThemeIcon className="h-4 w-4" />
                                                </button>

                                                {isThemeOpen && (
                                                    <div className="absolute right-full top-0 mr-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                                                        {(Object.keys(themes) as Array<keyof typeof themes>).map((key) => {
                                                            const Icon = themeIcons[key]
                                                            return (
                                                                <button
                                                                    key={key}
                                                                    onClick={() => {
                                                                        setTheme(key)
                                                                        setIsThemeOpen(false)
                                                                    }}
                                                                    className={`
                                                                        w-full flex items-center gap-3 px-3 py-2 text-sm
                                                                        ${theme === key
                                                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                                        }
                                                                    `}
                                                                >
                                                                    <Icon className="h-4 w-4" />
                                                                    <span className="flex-1 text-left">{themes[key].name}</span>
                                                                    {theme === key && <Check className="h-4 w-4" />}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                                            <button
                                                onClick={() => signOut({ callbackUrl: '/' })}
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
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
                                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                                    Sign In
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && status === 'authenticated' && (
                    <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center mb-4 text-sm text-gray-600 dark:text-gray-400">
                            {formattedDate} • {formattedTime}
                        </div>
                        <div className="space-y-1">
                            <Link
                                href="/dashboard/goals"
                                className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            >
                                <Target className="h-4 w-4" />
                                Goals
                            </Link>
                            <Link
                                href="/dashboard/analytics"
                                className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            >
                                <BarChart3 className="h-4 w-4" />
                                Analytics
                            </Link>
                            <Link
                                href="/dashboard/workspace"
                                className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            >
                                <Users className="h-4 w-4" />
                                Workspace
                            </Link>
                            <Link
                                href="/dashboard/settings"
                                className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            >
                                <Settings className="h-4 w-4" />
                                Settings
                            </Link>

                            {/* Mobile Theme Selector */}
                            <div className="px-4 py-2">
                                <div className="text-xs text-gray-500 mb-2">Theme</div>
                                <div className="flex gap-2">
                                    {(Object.keys(themes) as Array<keyof typeof themes>).map((key) => {
                                        const Icon = themeIcons[key]
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setTheme(key)}
                                                className={`
                                                    px-3 py-2 rounded-lg text-sm flex items-center gap-2
                                                    ${theme === key
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                                    }
                                                `}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span>{themes[key].name}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
