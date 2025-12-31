import * as React from 'react'
import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ className, value = 0, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'relative h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800',
            className
        )}
        {...props}
    >
        <div
            className="h-full w-full flex-1 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 ease-in-out dark:from-blue-500 dark:to-purple-500"
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    </div>
))
Progress.displayName = 'Progress'

export { Progress }
