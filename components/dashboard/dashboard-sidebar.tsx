"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ShoppingCart, MessageSquare, User, Settings, Store, Mail } from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Kolaborasi UMKM",
    href: "/marketplace",
    icon: ShoppingCart,
  },
  {
    name: "Forum",
    href: "/forum",
    icon: MessageSquare,
  },
  {
    name: "Pesan",
    href: "/chat",
    icon: Mail,
  },
  {
    name: "Profil Bisnis",
    href: "/profile",
    icon: User,
  },
  {
    name: "Pengaturan",
    href: "/settings",
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r bg-muted/10 min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        <Link href="/" className="flex items-center space-x-2 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-primary">My UMKM</span>
        </Link>

        <nav className="space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
