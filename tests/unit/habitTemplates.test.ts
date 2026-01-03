import { describe, it, expect } from 'vitest'
import {
    habitTemplates,
    habitCategories,
    getTemplatesByCategory,
    getTemplateById,
} from '@/lib/constants/habitTemplates'

describe('habitTemplates', () => {
    describe('habitCategories', () => {
        it('should have at least 5 categories', () => {
            expect(habitCategories.length).toBeGreaterThanOrEqual(5)
        })

        it('each category should have id, name, icon, and color', () => {
            habitCategories.forEach((cat) => {
                expect(cat).toHaveProperty('id')
                expect(cat).toHaveProperty('name')
                expect(cat).toHaveProperty('icon')
                expect(cat).toHaveProperty('color')
            })
        })
    })

    describe('habitTemplates', () => {
        it('should have at least 20 templates', () => {
            expect(habitTemplates.length).toBeGreaterThanOrEqual(20)
        })

        it('each template should have required fields', () => {
            habitTemplates.forEach((template) => {
                expect(template).toHaveProperty('id')
                expect(template).toHaveProperty('name')
                expect(template).toHaveProperty('description')
                expect(template).toHaveProperty('category')
                expect(template).toHaveProperty('frequency')
                expect(template).toHaveProperty('icon')
                expect(template).toHaveProperty('color')
            })
        })

        it('each template should have a valid frequency', () => {
            const validFrequencies = ['daily', 'weekly', 'custom']
            habitTemplates.forEach((template) => {
                expect(validFrequencies).toContain(template.frequency)
            })
        })

        it('each template should reference an existing category', () => {
            const categoryIds = habitCategories.map((c) => c.id)
            habitTemplates.forEach((template) => {
                expect(categoryIds).toContain(template.category)
            })
        })
    })

    describe('getTemplatesByCategory', () => {
        it('should return templates for health category', () => {
            const healthTemplates = getTemplatesByCategory('health')
            expect(healthTemplates.length).toBeGreaterThan(0)
            healthTemplates.forEach((t) => {
                expect(t.category).toBe('health')
            })
        })

        it('should return empty array for non-existent category', () => {
            const result = getTemplatesByCategory('nonexistent')
            expect(result).toEqual([])
        })
    })

    describe('getTemplateById', () => {
        it('should return template by id', () => {
            const template = getTemplateById('meditate')
            expect(template).toBeDefined()
            expect(template?.name).toBe('Meditate')
        })

        it('should return undefined for non-existent id', () => {
            const result = getTemplateById('nonexistent')
            expect(result).toBeUndefined()
        })
    })
})
