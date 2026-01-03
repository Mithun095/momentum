'use client'

import { useState } from 'react'
import { useTheme, themes } from './ThemeProvider'
import { Palette, ChevronDown, Check } from 'lucide-react'

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Change theme"
            >
                <span className="text-lg">{themes[theme].icon}</span>
                <ChevronDown className="h-3 w-3 text-gray-500" />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Theme
                        </div>
                        {(Object.keys(themes) as Array<keyof typeof themes>).map((key) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setTheme(key)
                                    setIsOpen(false)
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2 text-sm
                                    ${theme === key
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }
                                `}
                            >
                                <span className="text-lg">{themes[key].icon}</span>
                                <span className="flex-1 text-left">{themes[key].name}</span>
                                {theme === key && (
                                    <Check className="h-4 w-4" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
