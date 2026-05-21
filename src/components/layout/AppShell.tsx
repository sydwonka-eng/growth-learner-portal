import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

export function AppShell({
  nav,
  children,
}: {
  nav: NavItem[];
  children: ReactNode;
}) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const SidebarContent = (
    <>
      <div className="flex items-center justify-between border-b border-sidebar-border p-5">
        <Logo size="md" />
        <button
          className="rounded-md p-1 text-sidebar-foreground hover:bg-sidebar-accent md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const active =
            location.pathname === item.to ||
            (item.to !== "/admin" && item.to !== "/aluno" && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-flame text-primary-foreground glow"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/login" });
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-dvh bg-background starfield">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="flex items-center justify-between border-b border-sidebar-border bg-sidebar/90 backdrop-blur px-4 py-3 md:hidden">
          <button
            className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo size="sm" />
          <div className="w-9" />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
