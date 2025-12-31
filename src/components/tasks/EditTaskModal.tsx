'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { TASK_PRIORITIES, TASK_CATEGORIES, TASK_STATUS } from '@/lib/constants/taskCategories'
import { Loader2, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface Task {
    id: string
    title: string
    description?: string | null
    dueDate?: Date | null
    priority: string
    status: string
    category?: string | null
}

interface EditTaskModalProps {
    task: Task | null
    open: boolean
    onClose: () => void
    onSubmit: (id: string, updates: {
        title?: string
        description?: string | null
        dueDate?: Date | null
        priority?: 'low' | 'medium' | 'high'
        status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
        category?: string | null
    }) => Promise<void>
}

export function EditTaskModal({ task, open, onClose, onSubmit }: EditTaskModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
    const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'cancelled'>('pending')
    const [category, setCategory] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (task) {
            setTitle(task.title)
            setDescription(task.description || '')
            setDueDate(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '')
            setPriority(task.priority as any)
            setStatus(task.status as any)
            setCategory(task.category || '')
        }
    }, [task])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!task || !title.trim()) return

        setIsSubmitting(true)
        try {
            await onSubmit(task.id, {
                title: title.trim(),
                description: description.trim() || null,
                dueDate: dueDate ? new Date(dueDate) : null,
                priority,
                status,
                category: category || null,
            })
            onClose()
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-title">Title *</Label>
                            <Input
                                id="edit-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What needs to be done?"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <textarea
                                id="edit-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add more details..."
                                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 resize-y"
                            />
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-dueDate">Due Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="edit-dueDate"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Priority */}
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(TASK_PRIORITIES).map(([key, val]) => (
                                            <SelectItem key={key} value={key}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 rounded-full ${val.dotColor}`} />
                                                    {val.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(TASK_STATUS).map(([key, val]) => (
                                            <SelectItem key={key} value={key}>
                                                {val.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={category || 'none'} onValueChange={(v) => setCategory(v === 'none' ? '' : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {TASK_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            <div className="flex items-center gap-2">
                                                <span>{cat.icon}</span>
                                                {cat.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!title.trim() || isSubmitting}
                            className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
