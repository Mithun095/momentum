'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeProviderContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem('momentum-theme') as Theme | null
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            setTheme(savedTheme)
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark')
        }
    }, [])

    useEffect(() => {
        if (!mounted) return

        const root = document.documentElement
        root.classList.remove('light', 'dark')

        if (theme === 'dark') {
            root.classList.add('dark')
        }

        root.classList.add(theme)
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

export const themes = {
    light: {
        name: 'Light',
        icon: 'sun',
        primary: '#d97706',
        background: '#fffdf7',
    },
    dark: {
        name: 'Dark',
        icon: 'moon',
        primary: '#f59e0b',
        background: '#0c0a09',
    },
}
