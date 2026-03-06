"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu, X, Trophy, LogIn, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/theme-toggle"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const navLinks = [
  { href: "/", label: "Home" },
]

export function Navbar({ leagues }: { leagues: { slug: string; name: string }[] }) {
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [open, setOpen] = useState(false)

  // Hide navbar on admin, score, login, register routes
  const hiddenPrefixes = ["/admin", "/score", "/login", "/register"]
  if (hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = "/"
  }

  const allLinks = [
    ...navLinks,
    ...leagues.map((l) => ({ href: `/league/${l.slug}`, label: l.name })),
  ]

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg mr-6">
          <Trophy className="size-5 text-primary" />
          <span className="hidden sm:inline">Courtside</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(link.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <User className="size-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="size-4 mr-1" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  <LogIn className="size-4 mr-1" />
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 pt-10">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <nav className="flex flex-col gap-1 px-2">
                {allLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(link.href)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="my-2 h-px bg-border" />
                {user ? (
                  <>
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setOpen(false)
                        handleSignOut()
                      }}
                      className="px-3 py-2 text-sm font-medium rounded-md text-left text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  >
                    Login
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
