'use client'

import { useState, useEffect } from 'react'
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
import { format } from 'date-fns'
import type { CalendarEvent } from '@/types/events'

interface EditEventModalProps {
    event: CalendarEvent
    open: boolean
    onOpenChange: (open: boolean) => void
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
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1',
]

export function EditEventModal({ event, open, onOpenChange }: EditEventModalProps) {
    const { toast } = useToast()
    const utils = api.useUtils()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [startDate, setStartDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endDate, setEndDate] = useState('')
    const [endTime, setEndTime] = useState('')
    const [location, setLocation] = useState('')
    const [isAllDay, setIsAllDay] = useState(false)
    const [category, setCategory] = useState('personal')
    const [color, setColor] = useState('#3B82F6')

    useEffect(() => {
        if (event && open) {
            const start = new Date(event.startTime)
            const end = new Date(event.endTime)
            setTitle(event.title)
            setDescription(event.description || '')
            setStartDate(format(start, 'yyyy-MM-dd'))
            setStartTime(format(start, 'HH:mm'))
            setEndDate(format(end, 'yyyy-MM-dd'))
            setEndTime(format(end, 'HH:mm'))
            setLocation(event.location || '')
            setIsAllDay(event.isAllDay)
            setCategory(event.category || 'personal')
            setColor(event.color || '#3B82F6')
        }
    }, [event, open])

    const updateEvent = api.event.update.useMutation({
        onSuccess: () => {
            toast({
                title: 'Event updated!',
                description: 'Your event has been updated.',
            })
            void utils.event.getAll.invalidate()
            void utils.event.getByMonth.invalidate()
            void utils.event.getUpcoming.invalidate()
            onOpenChange(false)
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update event',
                variant: 'destructive',
            })
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            toast({ title: 'Error', description: 'Please enter an event title', variant: 'destructive' })
            return
        }

        const startDateTime = isAllDay
            ? new Date(`${startDate}T00:00:00`)
            : new Date(`${startDate}T${startTime}:00`)

        const endDateTime = isAllDay
            ? new Date(`${endDate}T23:59:59`)
            : new Date(`${endDate}T${endTime}:00`)

        if (endDateTime <= startDateTime) {
            toast({ title: 'Error', description: 'End time must be after start time', variant: 'destructive' })
            return
        }

        updateEvent.mutate({
            id: event.id,
            title: title.trim(),
            description: description.trim() || null,
            startTime: startDateTime,
            endTime: endDateTime,
            location: location.trim() || null,
            isAllDay,
            category,
            color,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Event</DialogTitle>
                    <DialogDescription>
                        Update event details.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-title">Title *</Label>
                        <Input
                            id="edit-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Event title"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Input
                            id="edit-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="edit-allDay"
                            checked={isAllDay}
                            onChange={(e) => setIsAllDay(e.target.checked)}
                            className="h-4 w-4"
                        />
                        <Label htmlFor="edit-allDay">All day event</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        {!isAllDay && (
                            <div className="space-y-2">
                                <Label>Start Time</Label>
                                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        {!isAllDay && (
                            <div className="space-y-2">
                                <Label>End Time</Label>
                                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-location">Location</Label>
                        <Input
                            id="edit-location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Optional location"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {eventCategories.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateEvent.isPending}>
                            {updateEvent.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
