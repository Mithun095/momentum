'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { X, Plus } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'

interface CreateGoalModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const goalCategories = [
    { value: 'career', label: 'Career' },
    { value: 'health', label: 'Health & Fitness' },
    { value: 'finance', label: 'Finance' },
    { value: 'education', label: 'Education' },
    { value: 'personal', label: 'Personal' },
    { value: 'relationships', label: 'Relationships' },
    { value: 'creative', label: 'Creative' },
    { value: 'other', label: 'Other' },
]

const goalColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1',
]

export function CreateGoalModal({ open, onOpenChange }: CreateGoalModalProps) {
    const { toast } = useToast()
    const utils = api.useUtils()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('personal')
    const [targetDate, setTargetDate] = useState('')
    const [color, setColor] = useState('#3B82F6')
    const [milestones, setMilestones] = useState<string[]>([])
    const [newMilestone, setNewMilestone] = useState('')

    const createGoal = api.goal.create.useMutation({
        onSuccess: () => {
            toast({
                title: 'Goal created!',
                description: 'Start working towards your new goal!',
            })
            void utils.goal.getAll.invalidate()
            void utils.goal.getActive.invalidate()
            void utils.goal.getStats.invalidate()
            resetForm()
            onOpenChange(false)
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create goal',
                variant: 'destructive',
            })
        },
    })

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setCategory('personal')
        setTargetDate('')
        setColor('#3B82F6')
        setMilestones([])
        setNewMilestone('')
    }

    const addMilestone = () => {
        if (newMilestone.trim()) {
            setMilestones([...milestones, newMilestone.trim()])
            setNewMilestone('')
        }
    }

    const removeMilestone = (index: number) => {
        setMilestones(milestones.filter((_, i) => i !== index))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a goal title',
                variant: 'destructive',
            })
            return
        }

        createGoal.mutate({
            title: title.trim(),
            description: description.trim() || undefined,
            category,
            targetDate: targetDate ? new Date(targetDate) : undefined,
            color,
            milestones: milestones.length > 0 ? milestones : undefined,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Goal</DialogTitle>
                    <DialogDescription>
                        Set a goal and break it down into milestones.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="goal-title">Goal Title *</Label>
                        <Input
                            id="goal-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Run a marathon"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="goal-description">Description</Label>
                        <Input
                            id="goal-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {goalCategories.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Target Date</Label>
                            <Input
                                type="date"
                                value={targetDate}
                                onChange={(e) => setTargetDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex gap-2">
                            {goalColors.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'
                                        }`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Milestones */}
                    <div className="space-y-2">
                        <Label>Milestones (optional)</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newMilestone}
                                onChange={(e) => setNewMilestone(e.target.value)}
                                placeholder="Add a milestone"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        addMilestone()
                                    }
                                }}
                            />
                            <Button type="button" variant="outline" onClick={addMilestone}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {milestones.length > 0 && (
                            <div className="space-y-2 mt-2">
                                {milestones.map((milestone, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                                    >
                                        <span className="text-sm">{milestone}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeMilestone(index)}
                                            className="text-gray-500 hover:text-red-500"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createGoal.isPending}>
                            {createGoal.isPending ? 'Creating...' : 'Create Goal'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
