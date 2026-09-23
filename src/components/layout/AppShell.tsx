import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

export function AppShell({
  nav,
  children,
  variant = "default",
}: {
  nav: NavItem[];
  children: ReactNode;
  variant?: "default" | "member";
}) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const member = variant === "member";

  const SidebarContent = (
    <>
      <div className={cn("flex items-center justify-between border-b border-sidebar-border", member ? "p-4 md:justify-center md:px-2 md:py-6" : "p-5")}>
        <div className={cn(member && "md:max-w-12 md:overflow-hidden")}><Logo size={member ? "sm" : "md"} /></div>
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <nav className={cn("flex-1 space-y-1 overflow-y-auto", member ? "p-3 md:px-2 md:py-5" : "p-3")}>
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
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                member && "md:h-11 md:justify-center md:px-0",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_0_24px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
              title={member ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={cn(member && "md:hidden")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          onClick={async () => {
            await signOut();
            navigate({ to: "/login" });
          }}
          className={cn("flex w-full items-center justify-start gap-3 px-3 text-sm font-medium text-sidebar-foreground", member && "md:justify-center md:px-0")}
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
          <span className={cn(member && "md:hidden")}>Sair</span>
        </Button>
      </div>
    </>
  );

  return (
    <div className={cn("flex min-h-dvh bg-background", member ? "member-shell" : "starfield")}>
      {/* Desktop sidebar */}
      <aside className={cn("hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur-xl md:flex", member ? "w-20" : "w-64")}>
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
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Logo size="sm" />
          <div className="w-9" />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
