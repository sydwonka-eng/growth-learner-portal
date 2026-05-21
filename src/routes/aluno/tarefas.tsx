import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/aluno/tarefas")({ component: Page });

type Status = "a_fazer" | "em_andamento" | "concluida";
const cols: { key: Status; label: string }[] = [
  { key: "a_fazer", label: "A Fazer" },
  { key: "em_andamento", label: "Fazendo" },
  { key: "concluida", label: "Concluídas" },
];

interface Row {
  id: string;
  titulo: string;
  aula_numero: number;
  aula_titulo: string;
  status: Status;
}

function Page() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const turmaId = profile?.turma_id;

  const { data: rows = [] } = useQuery({
    queryKey: ["aluno-kanban", user?.id, turmaId],
    queryFn: async () => {
      if (!user || !turmaId) return [];
      const { data: aulas } = await supabase.from("aulas").select("id, numero, titulo").eq("turma_id", turmaId);
      const aulaMap = new Map((aulas ?? []).map((a) => [a.id, a]));
      const aulaIds = aulas?.map((a) => a.id) ?? [];
      if (!aulaIds.length) return [];
      const { data: tarefas } = await supabase.from("tarefas").select("id, titulo, aula_id").in("aula_id", aulaIds);
      const { data: statuses } = await supabase
        .from("aluno_tarefa_status")
        .select("tarefa_id, status")
        .eq("aluno_id", user.id);
      const sm = new Map((statuses ?? []).map((s) => [s.tarefa_id, s.status as Status]));
      return (tarefas ?? []).map((t) => {
        const a = aulaMap.get(t.aula_id);
        return {
          id: t.id,
          titulo: t.titulo,
          aula_numero: a?.numero ?? 0,
          aula_titulo: a?.titulo ?? "",
          status: sm.get(t.id) ?? "a_fazer",
        } as Row;
      });
    },
    enabled: !!user && !!turmaId,
  });

  const mut = useMutation({
    mutationFn: async ({ tarefa_id, status }: { tarefa_id: string; status: Status }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase
        .from("aluno_tarefa_status")
        .upsert({ aluno_id: user.id, tarefa_id, status }, { onConflict: "aluno_id,tarefa_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aluno-kanban"] });
      qc.invalidateQueries({ queryKey: ["aluno-status"] });
      toast.success("Movida");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Minhas Tarefas" subtitle="Organize sua jornada em três etapas." />
      <div className="grid gap-4 md:grid-cols-3">
        {cols.map((c) => {
          const items = rows.filter((r) => r.status === c.key);
          return (
            <div key={c.key} className="rounded-xl border border-border bg-card/50 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{c.label}</h3>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.length === 0 && <p className="px-1 py-4 text-center text-xs text-muted-foreground">Nada por aqui</p>}
                {items.map((r) => (
                  <Card key={r.id} className="space-y-2 border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Aula {r.aula_numero} · {r.aula_titulo}</p>
                    <p className="text-sm font-medium">{r.titulo}</p>
                    <Select value={r.status} onValueChange={(v) => mut.mutate({ tarefa_id: r.id, status: v as Status })}>
                      <SelectTrigger className="h-8 bg-secondary text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {cols.map((cc) => <SelectItem key={cc.key} value={cc.key}>{cc.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
