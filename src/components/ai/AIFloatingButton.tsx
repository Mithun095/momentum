'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'

export function AIFloatingButton() {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <Link
            href="/dashboard/ai"
            className="fixed bottom-6 right-6 z-50 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`
                flex items-center gap-2 px-4 py-3 
                bg-primary
                hover:bg-primary/90
                text-primary-foreground font-medium rounded-full shadow-lg
                transition-all duration-300 ease-out
                hover:shadow-xl hover:shadow-primary/25
                ${isHovered ? 'pr-5' : 'pr-3'}
            `}>
                <div className="relative">
                    <Sparkles className="h-5 w-5" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
                <span className={`
                    overflow-hidden transition-all duration-300
                    ${isHovered ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'}
                `}>
                    Ask AI
                </span>
            </div>

            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity -z-10" />
        </Link>
    )
}
