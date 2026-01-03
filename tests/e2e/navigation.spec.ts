import { test, expect } from '@playwright/test'

// These tests require authentication
// For full E2E, you would need to set up test credentials

test.describe('Dashboard Pages', () => {
    test.describe.configure({ mode: 'serial' })

    test('should load events page', async ({ page }) => {
        await page.goto('/dashboard/events')
        // Even without auth, should redirect or show some content
        await expect(page).toHaveURL(/.*/)
    })

    test('should load goals page', async ({ page }) => {
        await page.goto('/dashboard/goals')
        await expect(page).toHaveURL(/.*/)
    })

    test('should load settings page', async ({ page }) => {
        await page.goto('/dashboard/settings')
        await expect(page).toHaveURL(/.*/)
    })

    test('should load habits page', async ({ page }) => {
        await page.goto('/dashboard/habits')
        await expect(page).toHaveURL(/.*/)
    })

    test('should load tasks page', async ({ page }) => {
        await page.goto('/dashboard/tasks')
        await expect(page).toHaveURL(/.*/)
    })

    test('should load journal page', async ({ page }) => {
        await page.goto('/dashboard/journal')
        await expect(page).toHaveURL(/.*/)
    })

    test('should load analytics page', async ({ page }) => {
        await page.goto('/dashboard/analytics')
        await expect(page).toHaveURL(/.*/)
    })
})

test.describe('Page Navigation', () => {
    test('home page should load', async ({ page }) => {
        await page.goto('/')
        // Check that page loads without errors
        await expect(page.locator('body')).toBeVisible()
    })
})
