import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Tríade da Ação" },
      { name: "description", content: "Plataforma de mentoria Tríade da Ação." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundPage,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center starfield px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço que você tentou abrir não existe ou foi movido.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-md bg-flame px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Ir para login
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium"
          >
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}
