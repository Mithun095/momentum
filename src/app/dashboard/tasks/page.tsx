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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Navigation */}
            {/* Page Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <a href="/dashboard">
                                <Button variant="ghost" size="icon" className="-ml-2">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </a>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Tasks
                            </h1>
                        </div>
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Task
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Progress Bar */}
                <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Task Completion</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                                    <ListTodo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pending}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.completed}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.overdue}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
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
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
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
                        <Card>
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
                    <Card className="py-16">
                        <CardContent className="text-center">
                            <ListTodo className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4 mx-auto" />
                            <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
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
                                    className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Task
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredTasks.map((task) => (
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
