'use client'

import { isToday, isTomorrow, isPast, isValid, format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    TASK_PRIORITIES,
    TASK_STATUS,
    getCategoryById,
    type TaskPriority,
    type TaskStatus
} from '@/lib/constants/taskCategories'
import { Pencil, Trash2, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
    id: string
    title: string
    description?: string | null
    dueDate?: Date | null
    priority: string
    status: string
    category?: string | null
    completedAt?: Date | null
}

interface TaskCardProps {
    task: Task
    onToggleComplete: (id: string) => void
    onEdit: (task: Task) => void
    onDelete: (id: string) => void
}

export function TaskCard({ task, onToggleComplete, onEdit, onDelete }: TaskCardProps) {
    const isCompleted = task.status === 'completed'
    const priority = TASK_PRIORITIES[task.priority as TaskPriority] || TASK_PRIORITIES.medium
    const status = TASK_STATUS[task.status as TaskStatus] || TASK_STATUS.pending
    const category = task.category ? getCategoryById(task.category) : null

    const getDueDateLabel = () => {
        if (!task.dueDate) return null
        const date = new Date(task.dueDate)
        if (!isValid(date)) return null

        if (isToday(date)) return 'Today'
        if (isTomorrow(date)) return 'Tomorrow'
        return format(date, 'MMM d')
    }

    const isOverdue = task.dueDate &&
        isPast(new Date(task.dueDate)) &&
        !isToday(new Date(task.dueDate)) &&
        !isCompleted

    const dueDateLabel = getDueDateLabel()

    return (
        <Card className={cn(
            "transition-all duration-200 hover:shadow-md",
            isCompleted && "opacity-60"
        )}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="pt-0.5">
                        <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => onToggleComplete(task.id)}
                            className="h-5 w-5"
                        />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                                <h3 className={cn(
                                    "font-medium text-gray-900 dark:text-gray-100",
                                    isCompleted && "line-through text-gray-500 dark:text-gray-400"
                                )}>
                                    {task.title}
                                </h3>
                                {task.description && (
                                    <p className={cn(
                                        "text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2",
                                        isCompleted && "line-through"
                                    )}>
                                        {task.description}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(task)}
                                    className="h-8 w-8 p-0"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(task.id)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Badges and Meta */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            {/* Priority Badge */}
                            <Badge className={cn("text-xs", priority.color)}>
                                {priority.label}
                            </Badge>

                            {/* Category Badge */}
                            {category && (
                                <Badge className={cn("text-xs", category.color)}>
                                    {category.icon} {category.label}
                                </Badge>
                            )}

                            {/* Due Date */}
                            {dueDateLabel && (
                                <div className={cn(
                                    "flex items-center gap-1 text-xs",
                                    isOverdue
                                        ? "text-red-600 dark:text-red-400 font-medium"
                                        : "text-gray-500 dark:text-gray-400"
                                )}>
                                    {isOverdue ? (
                                        <Clock className="h-3 w-3" />
                                    ) : (
                                        <Calendar className="h-3 w-3" />
                                    )}
                                    {isOverdue ? 'Overdue' : dueDateLabel}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
