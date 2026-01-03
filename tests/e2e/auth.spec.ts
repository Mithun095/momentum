import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
    })

    test('should redirect unauthenticated user to signin', async ({ page }) => {
        await page.goto('/dashboard')
        // Should redirect to signin
        await expect(page).toHaveURL(/.*signin.*/)
    })

    test('should display signin page correctly', async ({ page }) => {
        await page.goto('/auth/signin')

        // Check page elements
        await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
        await expect(page.getByPlaceholder(/email/i)).toBeVisible()
        await expect(page.getByPlaceholder(/password/i)).toBeVisible()
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('should display signup page correctly', async ({ page }) => {
        await page.goto('/auth/signup')

        // Check page elements
        await expect(page.getByRole('heading', { name: /create account|sign up/i })).toBeVisible()
        await expect(page.getByPlaceholder(/name/i)).toBeVisible()
        await expect(page.getByPlaceholder(/email/i)).toBeVisible()
        await expect(page.getByPlaceholder(/password/i).first()).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/auth/signin')

        await page.getByPlaceholder(/email/i).fill('invalid@example.com')
        await page.getByPlaceholder(/password/i).fill('wrongpassword')
        await page.getByRole('button', { name: /sign in/i }).click()

        // Should show error message
        await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 10000 })
    })

    test('should validate required fields on signup', async ({ page }) => {
        await page.goto('/auth/signup')

        // Click submit without filling fields
        await page.getByRole('button', { name: /sign up|create/i }).click()

        // Should show validation or stay on page
        await expect(page).toHaveURL(/.*signup.*/)
    })
})
