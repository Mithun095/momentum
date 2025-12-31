'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { HABIT_CATEGORIES } from '@/lib/constants/habitCategories'
import { HABIT_COLORS } from '@/lib/constants/habitColors'
import { HABIT_ICONS } from '@/lib/constants/habitIcons'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, Trash2 } from 'lucide-react'

interface Habit {
    id: string
    name: string
    description?: string | null
    category?: string | null
    frequency: string
    color?: string | null
    icon?: string | null
    isActive: boolean
}

interface EditHabitModalProps {
    habit: Habit
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditHabitModal({ habit, open, onOpenChange }: EditHabitModalProps) {
    const { toast } = useToast()
    const utils = api.useUtils()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const [formData, setFormData] = useState({
        name: habit.name,
        description: habit.description || '',
        isActive: habit.isActive,
    })

    // Reset form when habit changes
    useEffect(() => {
        setFormData({
            name: habit.name,
            description: habit.description || '',
            isActive: habit.isActive,
        })
    }, [habit])

    const updateHabit = api.habit.update.useMutation({
        onSuccess: () => {
            toast({
                title: 'Habit updated!',
                description: 'Your habit has been updated successfully.',
                variant: 'success',
            })
            utils.habit.getAll.invalidate()
            onOpenChange(false)
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update habit',
                variant: 'destructive',
            })
        },
    })

    const deleteHabit = api.habit.delete.useMutation({
        onSuccess: () => {
            toast({
                title: 'Habit deleted',
                description: 'Your habit has been deleted successfully.',
            })
            utils.habit.getAll.invalidate()
            onOpenChange(false)
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete habit',
                variant: 'destructive',
            })
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please enter a habit name',
                variant: 'destructive',
            })
            return
        }

        updateHabit.mutate({
            id: habit.id,
            name: formData.name,
            description: formData.description || undefined,
            isActive: formData.isActive,
        })
    }

    const handleDelete = () => {
        deleteHabit.mutate({ id: habit.id })
    }

    if (showDeleteConfirm) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            Delete Habit?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{habit.name}"? This action cannot be undone.
                            All completion history for this habit will be preserved but the habit will be archived.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={deleteHabit.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteHabit.isPending}
                        >
                            {deleteHabit.isPending ? 'Deleting...' : 'Delete Habit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Habit</DialogTitle>
                    <DialogDescription>
                        Update your habit details or archive it if you're no longer tracking it.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">
                            Habit Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="e.g., Morning Exercise"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            maxLength={100}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Description</label>
                        <Input
                            placeholder="Optional description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium">
                            Active (uncheck to archive this habit)
                        </label>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={updateHabit.isPending}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateHabit.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateHabit.isPending}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                            {updateHabit.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
