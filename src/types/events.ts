// Shared types for events across the application

export interface CalendarEvent {
    id: string
    title: string
    description?: string | null
    startTime: Date
    endTime: Date
    location?: string | null
    isAllDay: boolean
    category?: string | null
    color?: string | null
}

// Minimal event type for calendar display (subset of CalendarEvent)
export interface CalendarEventDisplay {
    id: string
    title: string
    startTime: Date
    color?: string | null
    isAllDay: boolean
}
