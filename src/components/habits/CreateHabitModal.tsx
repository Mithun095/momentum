'use client'

import { useState } from 'react'
import { z } from 'zod'
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

interface CreateHabitModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateHabitModal({ open, onOpenChange }: CreateHabitModalProps) {
    const { toast } = useToast()
    const utils = api.useUtils()

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'health',
        frequency: 'daily',
        color: 'blue',
        icon: '✅',
    })

    const createHabit = api.habit.create.useMutation({
        onSuccess: () => {
            toast({
                title: 'Habit created!',
                description: 'Your new habit has been added successfully.',
                variant: 'success',
            })
            utils.habit.getAll.invalidate()
            onOpenChange(false)
            // Reset form
            setFormData({
                name: '',
                description: '',
                category: 'health',
                frequency: 'daily',
                color: 'blue',
                icon: '✅',
            })
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create habit',
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

        createHabit.mutate({
            name: formData.name,
            description: formData.description || undefined,
            category: formData.category,
            frequency: formData.frequency as 'daily' | 'weekly' | 'custom',
            color: formData.color,
            icon: formData.icon,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Habit</DialogTitle>
                    <DialogDescription>
                        Add a new habit to track your progress and build consistency.
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

                    {/* Category */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Category</label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {HABIT_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        <span className="flex items-center gap-2">
                                            <span>{cat.icon}</span>
                                            <span>{cat.label}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Frequency</label>
                        <Select
                            value={formData.frequency}
                            onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Color</label>
                        <div className="grid grid-cols-6 gap-2">
                            {HABIT_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color: color.value })}
                                    className={`h-8 w-8 rounded-full ${color.bg} ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                                        }`}
                                    title={color.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Icon */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Icon</label>
                        <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
                            {HABIT_ICONS.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, icon })}
                                    className={`h-8 w-8 text-xl flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${formData.icon === icon ? 'bg-gray-200 dark:bg-gray-700' : ''
                                        }`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={createHabit.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createHabit.isPending}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                            {createHabit.isPending ? 'Creating...' : 'Create Habit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
