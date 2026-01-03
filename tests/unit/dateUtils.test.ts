import { describe, it, expect } from 'vitest'
import { startOfDay, endOfDay, subDays, addDays, format } from 'date-fns'

describe('Date utilities', () => {
    describe('startOfDay and endOfDay', () => {
        it('startOfDay should set time to 00:00:00', () => {
            const date = new Date('2026-01-03T14:30:45')
            const start = startOfDay(date)

            expect(start.getHours()).toBe(0)
            expect(start.getMinutes()).toBe(0)
            expect(start.getSeconds()).toBe(0)
        })

        it('endOfDay should set time to 23:59:59', () => {
            const date = new Date('2026-01-03T14:30:45')
            const end = endOfDay(date)

            expect(end.getHours()).toBe(23)
            expect(end.getMinutes()).toBe(59)
            expect(end.getSeconds()).toBe(59)
        })
    })

    describe('subDays and addDays', () => {
        it('subDays should subtract days correctly', () => {
            const date = new Date('2026-01-10')
            const result = subDays(date, 5)

            expect(format(result, 'yyyy-MM-dd')).toBe('2026-01-05')
        })

        it('addDays should add days correctly', () => {
            const date = new Date('2026-01-10')
            const result = addDays(date, 5)

            expect(format(result, 'yyyy-MM-dd')).toBe('2026-01-15')
        })

        it('should handle month boundary correctly', () => {
            const date = new Date('2026-01-31')
            const result = addDays(date, 1)

            expect(format(result, 'yyyy-MM-dd')).toBe('2026-02-01')
        })
    })

    describe('format', () => {
        it('should format date correctly', () => {
            const date = new Date('2026-01-03T14:30:00')
            expect(format(date, 'yyyy-MM-dd')).toBe('2026-01-03')
            expect(format(date, 'MMM d, yyyy')).toBe('Jan 3, 2026')
        })
    })
})
