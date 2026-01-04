import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function LandingNavbar() {
    return (
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="relative w-8 h-8 flex items-center justify-center">
                        <Image
                            src="/logo.png"
                            alt="Momentum Logo"
                            width={32}
                            height={32}
                            className="rounded-lg object-contain dark:invert"
                        />
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Momentum</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/auth/signin">
                        <Button variant="ghost" size="sm">Sign In</Button>
                    </Link>
                    <Link href="/auth/signup">
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
