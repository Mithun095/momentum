import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Clean up after each test
afterEach(() => {
    cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}))

// Mock next-auth
vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: {
            user: {
                id: 'test-user-id',
                name: 'Test User',
                email: 'test@example.com',
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated',
    }),
    signIn: vi.fn(),
    signOut: vi.fn(),
}))

// Mock tRPC client
vi.mock('@/lib/trpc/client', () => ({
    api: {
        useUtils: () => ({
            invalidate: vi.fn(),
        }),
        habit: {
            getAll: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
            create: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
            update: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
            delete: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
            markComplete: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
            getStats: { useQuery: vi.fn(() => ({ data: {}, isLoading: false })) },
            getAllCompletions: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
        },
        task: {
            getAll: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
            getToday: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
            create: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
            update: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
            delete: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
            toggleComplete: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
            getStats: { useQuery: vi.fn(() => ({ data: {}, isLoading: false })) },
        },
        goal: {
            getAll: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
            getActive: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
            create: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
            update: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
            delete: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
            getStats: { useQuery: vi.fn(() => ({ data: {}, isLoading: false })) },
            addMilestone: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
            toggleMilestone: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
        },
        event: {
            getAll: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
            getByDateRange: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
            getUpcoming: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
            create: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
            update: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
            delete: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
        },
    },
}))

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}))
