'use client'

import { useState, useEffect } from 'react'
import { Bot, CheckCircle2, ClipboardList, Book, BarChart2 } from 'lucide-react'

interface ConsentBannerProps {
    onConsent: (granted: boolean) => void
}

export function ConsentBanner({ onConsent }: ConsentBannerProps) {
    const [show, setShow] = useState(false)

    useEffect(() => {
        // Check if consent has been given
        const consent = localStorage.getItem('ai-consent')
        if (consent === null) {
            setShow(true)
        } else {
            onConsent(consent === 'granted')
        }
    }, [onConsent])

    const handleConsent = (granted: boolean) => {
        localStorage.setItem('ai-consent', granted ? 'granted' : 'denied')
        onConsent(granted)
        setShow(false)
    }

    if (!show) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md mx-4 p-6">
                <div className="text-center mb-6">
                    <Bot className="h-12 w-12 text-purple-600 mb-4 mx-auto" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Enable AI Assistant
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        To provide personalized assistance, our AI needs access to your data.
                    </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        What the AI can access:
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Your habits and completion history
                        </li>
                        <li className="flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-blue-500" /> Your tasks and due dates
                        </li>
                        <li className="flex items-center gap-2">
                            <Book className="w-4 h-4 text-purple-500" /> Your journal moods (not full entries)
                        </li>
                        <li className="flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-indigo-500" /> Your productivity statistics
                        </li>
                    </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-6">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Privacy:</strong> The AI can create tasks and habits on your behalf, but all data stays on your account.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => handleConsent(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Not Now
                    </button>
                    <button
                        onClick={() => handleConsent(true)}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Enable AI
                    </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                    You can change this anytime in settings
                </p>
            </div>
        </div>
    )
}
