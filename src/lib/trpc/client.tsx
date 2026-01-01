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
                // Data is considered fresh for 30 seconds - prevents refetching on every mount
                staleTime: 30 * 1000,
                // Don't refetch when window regains focus (reduces unnecessary requests)
                refetchOnWindowFocus: false,
                // Retry failed requests once
                retry: 1,
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
