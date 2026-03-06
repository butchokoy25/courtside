'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { logout } from '@/lib/actions/auth'
import {
  LayoutDashboard,
  Trophy,
  Users,
  UserCog,
  CalendarDays,
  Shield,
  Menu,
  X,
  ArrowLeft,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/leagues', label: 'Leagues', icon: Trophy },
  { href: '/admin/teams', label: 'Teams', icon: Shield },
  { href: '/admin/players', label: 'Players', icon: Users },
  { href: '/admin/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/admin/users', label: 'Users', icon: UserCog },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
        <Link href="/" className="text-sm font-medium text-muted-foreground">
          <ArrowLeft className="mr-1 inline-block size-4" />
          Back to site
        </Link>
        <span className="text-sm font-semibold">Admin</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-1 hover:bg-muted"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-out nav */}
      <div
        className={cn(
          'fixed top-12 right-0 z-30 h-[calc(100vh-3rem)] w-64 transform border-l bg-background p-4 transition-transform duration-200 md:hidden',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto pt-6">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-background md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to site
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
