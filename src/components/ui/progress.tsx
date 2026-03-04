import * as React from 'react'
import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ className, value = 0, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value || 0))

    return (
        <div
            ref={ref}
            className={cn(
                'relative h-4 w-full overflow-hidden rounded-full bg-muted/60',
                className
            )}
            role="progressbar"
            aria-valuenow={clampedValue}
            aria-valuemin={0}
            aria-valuemax={100}
            {...props}
        >
            <div
                data-slot="progress-indicator"
                className="h-full w-full flex-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 relative overflow-hidden"
                style={{
                    transform: `translateX(-${100 - clampedValue}%)`,
                    transition: 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform',
                }}
            />
        </div>
    )
})
Progress.displayName = 'Progress'

export { Progress }
