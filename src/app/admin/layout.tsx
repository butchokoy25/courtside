import { requireAdmin } from '@/lib/auth/utils'
import { AdminSidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-4 md:p-6 pt-16 md:pt-6">
        {children}
      </main>
    </div>
  )
}
