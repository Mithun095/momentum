'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    TASK_PRIORITIES,
    TASK_CATEGORIES,
    TASK_STATUS
} from '@/lib/constants/taskCategories'
import { cn } from '@/lib/utils'

interface TaskFiltersProps {
    statusFilter: string
    priorityFilter: string
    categoryFilter: string
    onStatusChange: (status: string) => void
    onPriorityChange: (priority: string) => void
    onCategoryChange: (category: string) => void
}

export function TaskFilters({
    statusFilter,
    priorityFilter,
    categoryFilter,
    onStatusChange,
    onPriorityChange,
    onCategoryChange,
}: TaskFiltersProps) {
    return (
        <div className="space-y-4">
            {/* Status Filters */}
            <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onStatusChange('all')}
                        className={cn(
                            statusFilter === 'all' &&
                            "bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                        )}
                    >
                        All
                    </Button>
                    {Object.entries(TASK_STATUS).map(([key, val]) => (
                        <Button
                            key={key}
                            variant={statusFilter === key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onStatusChange(key)}
                            className={cn(
                                statusFilter === key &&
                                "bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                            )}
                        >
                            {val.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Priority Filters */}
            <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</p>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={priorityFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onPriorityChange('all')}
                        className={cn(
                            priorityFilter === 'all' &&
                            "bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                        )}
                    >
                        All
                    </Button>
                    {Object.entries(TASK_PRIORITIES).map(([key, val]) => (
                        <Button
                            key={key}
                            variant={priorityFilter === key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onPriorityChange(key)}
                            className={cn(
                                priorityFilter === key &&
                                "bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                            )}
                        >
                            <span className={`h-2 w-2 rounded-full ${val.dotColor} mr-2`} />
                            {val.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Category Filters */}
            <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={categoryFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onCategoryChange('all')}
                        className={cn(
                            categoryFilter === 'all' &&
                            "bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                        )}
                    >
                        All
                    </Button>
                    {TASK_CATEGORIES.map((cat) => (
                        <Button
                            key={cat.id}
                            variant={categoryFilter === cat.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onCategoryChange(cat.id)}
                            className={cn(
                                categoryFilter === cat.id &&
                                "bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                            )}
                        >
                            {cat.icon} {cat.label}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}
