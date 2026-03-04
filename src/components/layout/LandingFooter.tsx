import Link from 'next/link'
import Image from 'next/image'

export function LandingFooter() {
    return (
        <footer className="relative py-12 px-6 border-t border-border/50 bg-card/50">
            {/* Gradient top line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2.5 group">
                        <div className="relative w-7 h-7 flex items-center justify-center">
                            <Image
                                src="/logo.png"
                                alt="Momentum Logo"
                                width={28}
                                height={28}
                                className="rounded-lg object-contain dark:invert"
                            />
                        </div>
                        <span
                            className="text-sm font-bold text-foreground"
                            style={{ fontFamily: 'var(--font-heading)' }}
                        >
                            Momentum
                        </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">
                            Privacy
                        </Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">
                            Terms
                        </Link>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Build better habits. Achieve your goals.
                    </p>
                </div>
            </div>
        </footer>
    )
}
