import Link from 'next/link'
import Image from 'next/image'

export function LandingFooter() {
    return (
        <footer className="py-8 px-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 flex items-center justify-center">
                        <Image
                            src="/logo.png"
                            alt="Momentum Logo"
                            width={24}
                            height={24}
                            className="rounded object-contain dark:invert"
                        />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Momentum</span>
                </div>
                <p className="text-sm text-gray-500">
                    Build better habits. Achieve your goals.
                </p>
            </div>
        </footer>
    )
}
