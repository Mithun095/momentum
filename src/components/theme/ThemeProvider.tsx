'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'midnight'

interface ThemeProviderContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light')
    const [mounted, setMounted] = useState(false)

    // Load theme from localStorage on mount
    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem('momentum-theme') as Theme | null
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'midnight')) {
            setTheme(savedTheme)
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark')
        }
    }, [])

    // Apply theme class to document
    useEffect(() => {
        if (!mounted) return

        const root = document.documentElement

        // Remove all theme classes
        root.classList.remove('light', 'dark', 'midnight')

        // Add base dark class for non-light themes
        if (theme !== 'light') {
            root.classList.add('dark')
        }

        // Add specific theme class
        root.classList.add(theme)

        // Save to localStorage
        localStorage.setItem('momentum-theme', theme)
    }, [theme, mounted])

    if (!mounted) {
        return <>{children}</>
    }

    return (
        <ThemeProviderContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeProviderContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

// Theme definitions - simplified to 3 themes
export const themes = {
    light: {
        name: 'Light',
        icon: 'sun',
        primary: '#6366f1',
        background: '#ffffff',
    },
    dark: {
        name: 'Dark',
        icon: 'moon',
        primary: '#818cf8',
        background: '#0f172a',
    },
    midnight: {
        name: 'Midnight',
        icon: 'stars',
        primary: '#a78bfa',
        background: '#0a0a1a',
    },
}
