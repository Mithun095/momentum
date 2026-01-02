'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'

interface MobileNavProps {
    userName?: string | null
    userEmail?: string | null
}

export function MobileNav({ userName, userEmail }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false)

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
        { href: '/dashboard/habits', label: 'Habits', icon: '✅' },
        { href: '/dashboard/journal', label: 'Journal', icon: '📔' },
        { href: '/dashboard/tasks', label: 'Tasks', icon: '📋' },
        { href: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
        { href: '/dashboard/workspace', label: 'Workspaces', icon: '👥' },
        { href: '/dashboard/ai', label: 'AI Assistant', icon: '🤖' },
    ]

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Open navigation menu"
                aria-expanded={isOpen}
            >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Drawer */}
            <div
                className={`
                    fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-gray-800 z-50 
                    transform transition-transform duration-300 ease-in-out md:hidden
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Momentum
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close navigation menu"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* User Info */}
                {(userName || userEmail) && (
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                                {userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                {userName && (
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {userName}
                                    </p>
                                )}
                                {userEmail && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {userEmail}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Links */}
                <nav className="p-4" role="navigation">
                    <ul className="space-y-1">
                        {navLinks.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <span className="text-xl">{link.icon}</span>
                                    <span>{link.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Theme Toggle */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Theme</span>
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </>
    )
}
