'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TaskCard } from '@/components/tasks/TaskCard'
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { EditTaskModal } from '@/components/tasks/EditTaskModal'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import {
    Plus,
    Search,
    Filter,
    ListTodo,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ArrowLeft
} from 'lucide-react'

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

export default function TasksPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [searchQuery, setSearchQuery] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [statusFilter, setStatusFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [showPreviousTasks, setShowPreviousTasks] = useState(false)

    // Fetch all tasks
    const { data: tasks, isLoading } = api.task.getAll.useQuery({})
    const { data: stats } = api.task.getStats.useQuery()

    // Calculate progress
    const totalTasks = stats?.total ?? 0
    const completedTasks = stats?.completed ?? 0
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const utils = api.useUtils()

    // Mutations
    const createTask = api.task.create.useMutation({
        onSuccess: () => {
            toast({ title: 'Task created!', description: 'Your new task has been added.' })
            void utils.task.getAll.invalidate()
            void utils.task.getStats.invalidate()
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        },
    })

    const updateTask = api.task.update.useMutation({
        onSuccess: () => {
            toast({ title: 'Task updated!', description: 'Your changes have been saved.' })
            void utils.task.getAll.invalidate()
            void utils.task.getStats.invalidate()
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        },
    })

    const toggleComplete = api.task.toggleComplete.useMutation({
        // Optimistic update for instant UI feedback
        onMutate: async ({ id }) => {
            // Cancel any outgoing refetches
            await utils.task.getAll.cancel()
            await utils.task.getStats.cancel()

            // Snapshot the previous value
            const previousTasks = utils.task.getAll.getData({})
            const previousStats = utils.task.getStats.getData()

            // Optimistically update to the new value
            utils.task.getAll.setData({}, (old) =>
                old?.map((task) =>
                    task.id === id
                        ? {
                            ...task,
                            status: task.status === 'completed' ? 'pending' : 'completed',
                            completedAt: task.status === 'completed' ? null : new Date(),
                        }
                        : task
                )
            )

            // Return context with previous values for rollback
            return { previousTasks, previousStats }
        },
        onError: (_err, _variables, context) => {
            // Rollback on error
            if (context?.previousTasks) {
                utils.task.getAll.setData({}, context.previousTasks)
            }
        },
        onSettled: () => {
            // Refetch to ensure data is in sync
            void utils.task.getAll.invalidate()
            void utils.task.getStats.invalidate()
        },
    })

    const deleteTask = api.task.delete.useMutation({
        onSuccess: () => {
            toast({ title: 'Task deleted', description: 'Task has been removed.' })
            void utils.task.getAll.invalidate()
            void utils.task.getStats.invalidate()
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        },
    })

    // Filter tasks
    const filteredTasks = tasks?.filter((task) => {
        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            if (!task.title.toLowerCase().includes(query) &&
                !task.description?.toLowerCase().includes(query)) {
                return false
            }
        }

        // Status filter
        if (statusFilter !== 'all' && task.status !== statusFilter) {
            return false
        }

        // Priority filter
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
            return false
        }

        // Category filter
        if (categoryFilter !== 'all' && task.category !== categoryFilter) {
            return false
        }

        return true
    })

    const handleCreate = async (data: {
        title: string
        description?: string
        dueDate?: Date
        priority: 'low' | 'medium' | 'high'
        category?: string
        isRecurring?: boolean
        recurringPattern?: string | null
    }) => {
        await createTask.mutateAsync({
            ...data,
            recurringPattern: data.recurringPattern ?? undefined,
        })
    }

    const handleUpdate = async (id: string, updates: {
        title?: string
        description?: string | null
        dueDate?: Date | null
        priority?: 'low' | 'medium' | 'high'
        status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
        category?: string | null
    }) => {
        await updateTask.mutateAsync({ id, ...updates })
    }

    const handleToggleComplete = (id: string) => {
        toggleComplete.mutate({ id })
    }

    const handleDelete = (id: string) => {
        deleteTask.mutate({ id })
    }
    return (
        <div className="min-h-screen">
            {/* Top Navigation */}
            {/* Page Header */}
            <div className="bg-white/70 dark:bg-[oklch(0.12_0.025_265/70%)] backdrop-blur-xl border-b border-gray-200/60 dark:border-[oklch(0.25_0.04_265/40%)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <a href="/dashboard">
                                <Button variant="ghost" size="icon" className="-ml-2">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </a>
                            <h1
                                className="text-xl font-semibold text-gray-900 dark:text-gray-100"
                                style={{ fontFamily: 'var(--font-heading)' }}
                            >
                                Tasks
                            </h1>
                        </div>
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Task
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
                {/* Progress Bar */}
                <div className="mb-8 p-4 bg-white dark:bg-[oklch(0.15_0.025_265)] rounded-xl border border-gray-200/60 dark:border-[oklch(0.25_0.04_265/40%)] shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Task Completion</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-children">
                        <Card className="border-0 shadow-sm dark:bg-[oklch(0.15_0.025_265)]">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                    <ListTodo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{stats.total}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm dark:bg-[oklch(0.15_0.025_265)]">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{stats.pending}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pending</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm dark:bg-[oklch(0.15_0.025_265)]">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{stats.completed}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Completed</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm dark:bg-[oklch(0.15_0.025_265)]">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30">
                                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{stats.overdue}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Overdue</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Search and Filter Bar */}
                <div className="mb-6 space-y-4">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200/60 dark:border-[oklch(0.25_0.04_265/40%)] bg-white dark:bg-[oklch(0.15_0.025_265)] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>

                    {/* Expandable Filters */}
                    {showFilters && (
                        <Card className="border-0 shadow-sm dark:bg-[oklch(0.15_0.025_265)] animate-fade-in-up">
                            <CardContent className="p-4">
                                <TaskFilters
                                    statusFilter={statusFilter}
                                    priorityFilter={priorityFilter}
                                    categoryFilter={categoryFilter}
                                    onStatusChange={setStatusFilter}
                                    onPriorityChange={setPriorityFilter}
                                    onCategoryChange={setCategoryFilter}
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Task List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i}>
                                <CardContent className="p-4">
                                    <Skeleton className="h-6 w-48 mb-2" />
                                    <Skeleton className="h-4 w-full mb-1" />
                                    <Skeleton className="h-4 w-3/4" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : !filteredTasks || filteredTasks.length === 0 ? (
                    <Card className="py-16 border-0 shadow-sm dark:bg-[oklch(0.15_0.025_265)]">
                        <CardContent className="text-center">
                            <ListTodo className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4 mx-auto" />
                            <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100" style={{ fontFamily: 'var(--font-heading)' }}>
                                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                                    ? 'No tasks found'
                                    : 'No tasks yet'
                                }
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Create your first task to get started'
                                }
                            </p>
                            {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && categoryFilter === 'all' && (
                                <Button
                                    onClick={() => setCreateModalOpen(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Task
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (() => {
                    const now = new Date()
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

                    // Separate tasks into active, overdue, and completed
                    const activeTasks = filteredTasks.filter(t =>
                        t.status !== 'completed' && t.status !== 'cancelled' &&
                        (!t.dueDate || new Date(t.dueDate) >= todayStart)
                    )
                    const overdueTasks = filteredTasks.filter(t =>
                        t.status !== 'completed' && t.status !== 'cancelled' &&
                        t.dueDate && new Date(t.dueDate) < todayStart
                    )
                    const completedTasks = filteredTasks
                        .filter(t => t.status === 'completed' || t.status === 'cancelled')
                        .sort((a, b) => {
                            const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0
                            const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0
                            return dateB - dateA // newest first
                        })

                    return (
                        <div className="space-y-6">
                            {/* Overdue Tasks */}
                            {overdueTasks.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                                            Overdue ({overdueTasks.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        {overdueTasks.map((task) => (
                                            <div key={task.id} className="group">
                                                <TaskCard
                                                    task={task}
                                                    onToggleComplete={handleToggleComplete}
                                                    onEdit={setEditingTask}
                                                    onDelete={handleDelete}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Active Tasks */}
                            {activeTasks.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Active ({activeTasks.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        {activeTasks.map((task) => (
                                            <div key={task.id} className="group">
                                                <TaskCard
                                                    task={task}
                                                    onToggleComplete={handleToggleComplete}
                                                    onEdit={setEditingTask}
                                                    onDelete={handleDelete}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTasks.length === 0 && overdueTasks.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                                    <p className="font-medium">All caught up! 🎉</p>
                                    <p className="text-sm mt-1">No pending tasks remaining.</p>
                                </div>
                            )}

                            {/* Completed/Previous Tasks — Collapsible */}
                            {completedTasks.length > 0 && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <button
                                        onClick={() => setShowPreviousTasks(!showPreviousTasks)}
                                        className="flex items-center gap-2 mb-3 w-full text-left hover:opacity-80 transition-opacity"
                                    >
                                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showPreviousTasks ? 'rotate-0' : '-rotate-90'}`} />
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Previous Tasks ({completedTasks.length})
                                        </h3>
                                    </button>
                                    {showPreviousTasks && (
                                        <div className="space-y-3 opacity-75">
                                            {completedTasks.map((task) => (
                                                <div key={task.id} className="group">
                                                    <TaskCard
                                                        task={task}
                                                        onToggleComplete={handleToggleComplete}
                                                        onEdit={setEditingTask}
                                                        onDelete={handleDelete}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })()}
            </div>

            {/* Create Task Modal */}
            <CreateTaskModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSubmit={handleCreate}
            />

            {/* Edit Task Modal */}
            <EditTaskModal
                task={editingTask}
                open={!!editingTask}
                onClose={() => setEditingTask(null)}
                onSubmit={handleUpdate}
            />
        </div>
    )
}
