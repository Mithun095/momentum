'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { useState } from 'react'
import superjson from 'superjson'

import { type AppRouter } from '@/server/api/root'

export const trpc = createTRPCReact<AppRouter>()

// Export as 'api' for convenience
export const api = trpc

export function TRPCProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Data is considered fresh for 30 seconds - balances freshness with performance
                staleTime: 30 * 1000,
                // Keep unused data in cache for 5 minutes before garbage collection
                gcTime: 5 * 60 * 1000,
                // Don't refetch when window regains focus (reduces unnecessary requests)
                refetchOnWindowFocus: false,
                // Refetch when network reconnects for better data freshness
                refetchOnReconnect: true,
                // Retry failed requests once with exponential backoff
                retry: 1,
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
                // Always refetch on mount if data is stale (ensures fresh data on page load)
                refetchOnMount: 'always',
            },
        },
    }))
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: '/api/trpc',
                    transformer: superjson,
                }),
            ],
        })
    )

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </trpc.Provider>
    )
}
