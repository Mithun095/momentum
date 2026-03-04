import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClientLayout from './ClientLayout'

export default async function DashboardServerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect('/auth/signin')
    }

    return <ClientLayout>{children}</ClientLayout>
}
