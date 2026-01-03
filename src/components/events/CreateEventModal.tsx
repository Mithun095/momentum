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
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'

interface CreateEventModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultDate?: Date
}

const eventCategories = [
    { value: 'work', label: 'Work', color: '#3B82F6' },
    { value: 'personal', label: 'Personal', color: '#8B5CF6' },
    { value: 'health', label: 'Health', color: '#10B981' },
    { value: 'social', label: 'Social', color: '#F59E0B' },
    { value: 'family', label: 'Family', color: '#EC4899' },
    { value: 'education', label: 'Education', color: '#6366F1' },
    { value: 'finance', label: 'Finance', color: '#14B8A6' },
    { value: 'other', label: 'Other', color: '#6B7280' },
]

const eventColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#6366F1', // Indigo
]

export function CreateEventModal({ open, onOpenChange, defaultDate }: CreateEventModalProps) {
    const { toast } = useToast()
    const utils = api.useUtils()

    const initialDate = defaultDate || new Date()
    const dateStr = initialDate.toISOString().split('T')[0]

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [startDate, setStartDate] = useState(dateStr)
    const [startTime, setStartTime] = useState('09:00')
    const [endDate, setEndDate] = useState(dateStr)
    const [endTime, setEndTime] = useState('10:00')
    const [location, setLocation] = useState('')
    const [isAllDay, setIsAllDay] = useState(false)
    const [category, setCategory] = useState('personal')
    const [color, setColor] = useState('#3B82F6')

    const createEvent = api.event.create.useMutation({
        onSuccess: () => {
            toast({
                title: 'Event created!',
                description: 'Your event has been added to the calendar.',
            })
            void utils.event.getAll.invalidate()
            void utils.event.getByMonth.invalidate()
            void utils.event.getUpcoming.invalidate()
            resetForm()
            onOpenChange(false)
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create event',
                variant: 'destructive',
            })
        },
    })

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setStartDate(dateStr)
        setStartTime('09:00')
        setEndDate(dateStr)
        setEndTime('10:00')
        setLocation('')
        setIsAllDay(false)
        setCategory('personal')
        setColor('#3B82F6')
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter an event title',
                variant: 'destructive',
            })
            return
        }

        const startDateTime = isAllDay
            ? new Date(`${startDate}T00:00:00`)
            : new Date(`${startDate}T${startTime}:00`)

        const endDateTime = isAllDay
            ? new Date(`${endDate}T23:59:59`)
            : new Date(`${endDate}T${endTime}:00`)

        if (endDateTime <= startDateTime) {
            toast({
                title: 'Error',
                description: 'End time must be after start time',
                variant: 'destructive',
            })
            return
        }

        createEvent.mutate({
            title: title.trim(),
            description: description.trim() || undefined,
            startTime: startDateTime,
            endTime: endDateTime,
            location: location.trim() || undefined,
            isAllDay,
            category,
            color,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Event</DialogTitle>
                    <DialogDescription>
                        Add a new event to your calendar.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Event title"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="allDay"
                            checked={isAllDay}
                            onChange={(e) => setIsAllDay(e.target.checked)}
                            className="h-4 w-4"
                        />
                        <Label htmlFor="allDay">All day event</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        {!isAllDay && (
                            <div className="space-y-2">
                                <Label>Start Time</Label>
                                <Input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        {!isAllDay && (
                            <div className="space-y-2">
                                <Label>End Time</Label>
                                <Input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Optional location"
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
                                    {eventCategories.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex gap-1 flex-wrap">
                                {eventColors.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'
                                            }`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setColor(c)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createEvent.isPending}
                        >
                            {createEvent.isPending ? 'Creating...' : 'Create Event'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
