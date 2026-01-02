'use client'

import { useState } from 'react'

interface ExportButtonProps {
    onExport: (format: 'json' | 'csv', type: 'habits' | 'tasks' | 'journals' | 'all') => void
    isLoading?: boolean
}

export function ExportButton({ onExport, isLoading }: ExportButtonProps) {
    const [showMenu, setShowMenu] = useState(false)

    const exportOptions = [
        { label: 'All Data (JSON)', format: 'json' as const, type: 'all' as const },
        { label: 'All Data (CSV)', format: 'csv' as const, type: 'all' as const },
        { label: 'Habits Only', format: 'csv' as const, type: 'habits' as const },
        { label: 'Tasks Only', format: 'csv' as const, type: 'tasks' as const },
        { label: 'Journals Only', format: 'csv' as const, type: 'journals' as const },
    ]

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
                {isLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                )}
                Export Data
            </button>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                        {exportOptions.map((option) => (
                            <button
                                key={`${option.format}-${option.type}`}
                                onClick={() => {
                                    onExport(option.format, option.type)
                                    setShowMenu(false)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
