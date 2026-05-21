import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BookOpen, KanbanSquare, Calendar } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/aluno")({ component: Layout });

const nav = [
  { to: "/aluno", label: "Aulas", icon: <BookOpen className="h-4 w-4" /> },
  { to: "/aluno/tarefas", label: "Tarefas", icon: <KanbanSquare className="h-4 w-4" /> },
  { to: "/aluno/agenda", label: "Agenda", icon: <Calendar className="h-4 w-4" /> },
];

function Layout() {
  const { loading, role, profile } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (role !== "aluno") navigate({ to: "/login" });
  }, [loading, role, navigate]);

  if (loading || role !== "aluno") return null;
  if (!profile?.approved || !profile?.turma_id) {
    return (
      <div className="flex min-h-screen items-center justify-center starfield p-6">
        <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">Aguardando aprovação</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu cadastro ainda não foi aprovado ou nenhuma turma foi atribuída. Aguarde o mentor liberar o acesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell nav={nav as never}>
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 md:p-8">
        <Outlet />
      </div>
    </AppShell>
  );
}
