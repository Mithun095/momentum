'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
    title: string
    description?: string
    backHref?: string
    backLabel?: string
    children?: React.ReactNode
}

export function PageHeader({
    title,
    description,
    backHref = '/dashboard',
    backLabel = 'Back to Dashboard',
    children,
}: PageHeaderProps) {
    return (
        <div className="mb-8">
            <Link
                href={backHref}
                className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4 transition-colors"
            >
                <ChevronLeft className="h-4 w-4" />
                {backLabel}
            </Link>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {description}
                        </p>
                    )}
                </div>
                {children && (
                    <div className="flex items-center gap-2">
                        {children}
                    </div>
                )}
            </div>
        </div>
    )
}
