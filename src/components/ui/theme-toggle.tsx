'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>('light')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem('theme') as Theme | null
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            setTheme(savedTheme)
            applyTheme(savedTheme)
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark')
            applyTheme('dark')
        }
    }, [])

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement

        // Remove all theme classes
        root.classList.remove('dark', 'crazy')

        // Apply new theme
        if (newTheme === 'dark') {
            root.classList.add('dark')
        }
    }

    const toggleTheme = () => {
        const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'
        setTheme(nextTheme)
        applyTheme(nextTheme)
        localStorage.setItem('theme', nextTheme)
    }

    if (!mounted) {
        return (
            <button className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Moon className="h-4 w-4 text-muted-foreground" />
            </button>
        )
    }

    return (
        <button
            onClick={toggleTheme}
            className="relative w-10 h-10 rounded-lg flex items-center justify-center bg-muted hover:bg-accent transition-all duration-300"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label={`Current theme: ${theme} mode. Click to switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                <Sun className="h-4 w-4 text-foreground transition-transform duration-300" />
            ) : (
                <Moon className="h-4 w-4 text-foreground transition-transform duration-300" />
            )}
        </button>
    )
}
