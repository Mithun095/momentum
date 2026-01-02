'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'crazy'

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>('light')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem('theme') as Theme | null
        if (savedTheme) {
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
        } else if (newTheme === 'crazy') {
            root.classList.add('dark', 'crazy')
        }
    }

    const cycleTheme = () => {
        const themes: Theme[] = ['light', 'dark', 'crazy']
        const currentIndex = themes.indexOf(theme)
        const nextTheme = themes[(currentIndex + 1) % themes.length]

        setTheme(nextTheme)
        applyTheme(nextTheme)
        localStorage.setItem('theme', nextTheme)
    }

    if (!mounted) {
        return (
            <button className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-lg">🌙</span>
            </button>
        )
    }

    const themeConfig = {
        light: { icon: '☀️', label: 'Light mode', next: 'Dark mode' },
        dark: { icon: '🌙', label: 'Dark mode', next: 'Crazy mode' },
        crazy: { icon: '🎨', label: 'Crazy mode', next: 'Light mode' }
    }

    const current = themeConfig[theme]

    return (
        <button
            onClick={cycleTheme}
            className={`
                relative w-10 h-10 rounded-lg flex items-center justify-center
                transition-all duration-300 
                ${theme === 'crazy'
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-gradient-x'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
            `}
            title={`${current.label} - Click for ${current.next}`}
            aria-label={`Current theme: ${current.label}. Click to switch to ${current.next}`}
        >
            <span className={`text-lg transition-transform duration-300 ${theme === 'crazy' ? 'animate-bounce' : ''}`}>
                {current.icon}
            </span>
        </button>
    )
}
