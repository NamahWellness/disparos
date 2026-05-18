"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Megaphone,
  Send,
  Calendar,
  Upload,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { signOut } from "next-auth/react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campanhas", icon: Megaphone },
  { href: "/sends", label: "Disparos", icon: Send },
  { href: "/calendar", label: "Calendário", icon: Calendar },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-gray-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">CampaignOps</p>
          <p className="text-xs text-gray-500">Central de Disparos</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3 pt-4">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-indigo-600" : "text-gray-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4 text-gray-400" />
          Sair
        </button>
      </div>
    </aside>
  );
}
