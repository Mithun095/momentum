'use client'

import { Navbar } from '@/components/layout/Navbar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            {children}
        </div>
    )
}
