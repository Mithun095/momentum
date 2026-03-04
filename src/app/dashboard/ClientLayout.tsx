'use client'

import { Navbar } from '@/components/layout/Navbar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background relative">
            {/* Subtle mesh gradient background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-500/[0.03] dark:bg-indigo-500/[0.02] blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-purple-500/[0.03] dark:bg-purple-500/[0.02] blur-3xl" />
            </div>
            <div className="relative z-10">
                <Navbar />
                {children}
            </div>
        </div>
    )
}
