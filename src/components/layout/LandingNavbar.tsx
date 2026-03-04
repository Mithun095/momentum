'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export function LandingNavbar() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    if (typeof window !== 'undefined') {
        window.addEventListener('scroll', () => setScrolled(window.scrollY > 20), { passive: true })
    }

    return (
        <nav className={`
            fixed top-0 left-0 right-0 z-50 transition-all duration-500
            ${scrolled
                ? 'glass-nav shadow-lg'
                : 'bg-transparent'
            }
        `}>
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm border border-white/20 group-hover:shadow-lg group-hover:shadow-amber-500/15 transition-all duration-300">
                        <Image
                            src="/logo.png"
                            alt="Momentum Logo"
                            width={36}
                            height={36}
                            className="rounded-xl object-contain dark:invert"
                        />
                    </div>
                    <span
                        className="text-xl font-bold text-gray-900 dark:text-white tracking-tight"
                        style={{ fontFamily: 'var(--font-heading)' }}
                    >
                        Momentum
                    </span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-3">
                    <Link href="/auth/signin">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                            Sign In
                        </Button>
                    </Link>
                    <Link href="/auth/signup">
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-300 btn-shine"
                        >
                            Get Started
                        </Button>
                    </Link>
                </div>

                {/* Mobile toggle */}
                <button
                    className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen
                        ? <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        : <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    }
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden glass-card mx-4 mb-4 rounded-2xl p-4 animate-scale-in">
                    <div className="flex flex-col gap-2">
                        <Link href="/auth/signin" onClick={() => setMobileOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
                            <Button className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    )
}
