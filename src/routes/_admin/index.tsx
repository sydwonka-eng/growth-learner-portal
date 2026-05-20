import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, UserX, BookOpen, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTurmas } from "@/routes/_admin";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_admin/")({ component: Page });

function Page() {
  const { selected } = useTurmas();

  const { data } = useQuery({
    queryKey: ["admin-overview", selected],
    queryFn: async () => {
      const [{ count: alunos }, { count: semTurma }, { count: encontros }, { count: compromissos }, { data: recentes }, { data: proximos }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("turma_id", selected!).eq("approved", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }).is("turma_id", null).eq("approved", true),
        supabase.from("aulas").select("*", { count: "exact", head: true }).eq("turma_id", selected!),
        supabase.from("compromissos").select("*", { count: "exact", head: true }).eq("turma_id", selected!),
        supabase.from("profiles").select("id, nome, turma_id, turmas(nome)").eq("approved", true).order("created_at", { ascending: false }).limit(5),
        supabase.from("compromissos").select("*").eq("turma_id", selected!).gte("data_hora", new Date().toISOString()).order("data_hora").limit(5),
      ]);
      return { alunos: alunos ?? 0, semTurma: semTurma ?? 0, encontros: encontros ?? 0, compromissos: compromissos ?? 0, recentes: recentes ?? [], proximos: proximos ?? [] };
    },
    enabled: !!selected,
  });

  const stats = [
    { icon: Users, label: "Alunos na Turma", value: data?.alunos ?? 0, color: "text-orange-400" },
    { icon: UserX, label: "Sem Turma", value: data?.semTurma ?? 0, color: "text-emerald-400" },
    { icon: BookOpen, label: "Encontros", value: data?.encontros ?? 0, color: "text-violet-400" },
    { icon: Calendar, label: "Compromissos", value: data?.compromissos ?? 0, color: "text-yellow-400" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Painel do" highlight="Mentor" subtitle="Olá, Mentor. Gerencie sua tribo." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-secondary ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Alunos Recentes</h3>
            <Link to="/admin/alunos" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-2">
            {data?.recentes.map((a: { id: string; nome: string; turmas: { nome: string } | null }) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-flame text-sm font-bold text-primary-foreground">
                  {a.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">{a.nome}</div>
                  <div className="text-xs text-muted-foreground">{a.turmas?.nome ?? "Sem turma"}</div>
                </div>
              </div>
            ))}
            {!data?.recentes.length && <p className="py-6 text-center text-xs text-muted-foreground">Nenhum aluno ainda.</p>}
          </div>
        </Card>
        <Card className="border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Próximos Compromissos</h3>
            <Link to="/admin/agenda" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-2">
            {data?.proximos.map((c: { id: string; titulo: string; data_hora: string }) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary"><Calendar className="h-4 w-4" /></div>
                <div>
                  <div className="text-sm font-medium">{c.titulo}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(c.data_hora), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</div>
                </div>
              </div>
            ))}
            {!data?.proximos.length && <p className="py-6 text-center text-xs text-muted-foreground">Nenhum compromisso futuro.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
