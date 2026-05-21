import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/aluno/agenda")({ component: Page });

interface Compromisso { id: string; titulo: string; descricao: string | null; data_hora: string }

function Page() {
  const { profile } = useAuth();
  const turmaId = profile?.turma_id;

  const { data: items = [] } = useQuery({
    queryKey: ["aluno-agenda", turmaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compromissos")
        .select("id, titulo, descricao, data_hora")
        .eq("turma_id", turmaId!)
        .order("data_hora");
      if (error) throw error;
      return data as Compromisso[];
    },
    enabled: !!turmaId,
  });

  const now = Date.now();
  const upcoming = items.filter((i) => new Date(i.data_hora).getTime() >= now);
  const past = items.filter((i) => new Date(i.data_hora).getTime() < now);

  const fmt = (d: string) =>
    new Date(d).toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <PageHeader title="Agenda" description="Compromissos da sua turma." />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Próximos</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum compromisso futuro.</p>
        ) : (
          upcoming.map((c) => (
            <Card key={c.id} className="flex gap-4 border-border bg-card p-4">
              <div className="rounded-lg bg-flame p-3 text-primary-foreground">
                <CalIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-primary">{fmt(c.data_hora)}</p>
                <h3 className="mt-1 font-semibold">{c.titulo}</h3>
                {c.descricao && <p className="mt-1 text-sm text-muted-foreground">{c.descricao}</p>}
              </div>
            </Card>
          ))
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Anteriores</h2>
          {past.map((c) => (
            <Card key={c.id} className="border-border bg-card/50 p-4 opacity-70">
              <p className="text-xs text-muted-foreground">{fmt(c.data_hora)}</p>
              <h3 className="font-medium">{c.titulo}</h3>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
