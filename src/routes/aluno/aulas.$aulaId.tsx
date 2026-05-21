import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, CheckCircle2, Circle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/aluno/aulas/$aulaId")({ component: Page });

type Status = "a_fazer" | "em_andamento" | "concluida";
interface Aula { id: string; numero: number; titulo: string; descricao: string | null; iframe_video: string | null; capa_url: string | null; materiais_url: string | null }
interface Tarefa { id: string; titulo: string; descricao: string | null; capa_url: string | null; iframe_video: string | null; materiais_url: string | null }

const statusLabel: Record<Status, string> = {
  a_fazer: "A fazer",
  em_andamento: "Fazendo",
  concluida: "Concluída",
};

function Page() {
  const { aulaId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: aula } = useQuery({
    queryKey: ["aluno-aula", aulaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("aulas").select("id, numero, titulo, descricao, iframe_video, capa_url, materiais_url").eq("id", aulaId).single();
      if (error) throw error;
      return data as Aula;
    },
  });

  const { data: tarefas = [] } = useQuery({
    queryKey: ["aluno-tarefas", aulaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tarefas").select("id, titulo, descricao, capa_url, iframe_video, materiais_url").eq("aula_id", aulaId);
      if (error) throw error;
      return data as Tarefa[];
    },
  });

  const tarefaIds = tarefas.map((t) => t.id);
  const { data: status = [] } = useQuery({
    queryKey: ["aluno-status", aulaId, user?.id, tarefaIds.join(",")],
    queryFn: async () => {
      if (!user || !tarefaIds.length) return [];
      const { data, error } = await supabase
        .from("aluno_tarefa_status")
        .select("tarefa_id, status")
        .eq("aluno_id", user.id)
        .in("tarefa_id", tarefaIds);
      if (error) throw error;
      return data as { tarefa_id: string; status: Status }[];
    },
    enabled: !!user && tarefaIds.length > 0,
  });

  const setStatusMut = useMutation({
    mutationFn: async ({ tarefa_id, status }: { tarefa_id: string; status: Status }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase
        .from("aluno_tarefa_status")
        .upsert({ aluno_id: user.id, tarefa_id, status }, { onConflict: "aluno_id,tarefa_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aluno-status"] });
      qc.invalidateQueries({ queryKey: ["aluno-kanban"] });
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusFor = (id: string): Status =>
    (status.find((s) => s.tarefa_id === id)?.status as Status) ?? "a_fazer";

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/aluno"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar para aulas</Link>
      </Button>

      <div>
        <p className="text-sm text-muted-foreground">Aula {aula?.numero}</p>
        <h1 className="text-2xl font-bold md:text-3xl">{aula?.titulo}</h1>
        {aula?.descricao && <p className="mt-2 text-muted-foreground">{aula.descricao}</p>}
      </div>

      {aula?.iframe_video && (
        <Card className="overflow-hidden border-border bg-card">
          <div className="aspect-video w-full [&>iframe]:h-full [&>iframe]:w-full" dangerouslySetInnerHTML={{ __html: aula.iframe_video }} />
        </Card>
      )}

      {aula?.materiais_url && (
        <Button asChild variant="outline">
          <a href={aula.materiais_url} target="_blank" rel="noreferrer">
            <FileText className="mr-2 h-4 w-4" /> Materiais de apoio
          </a>
        </Button>
      )}

      <div>
        <h2 className="mb-3 text-xl font-semibold">Tarefas</h2>
        {tarefas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma tarefa para esta aula.</p>
        ) : (
          <div className="space-y-3">
            {tarefas.map((t) => {
              const cur = statusFor(t.id);
              const Icon = cur === "concluida" ? CheckCircle2 : cur === "em_andamento" ? Clock : Circle;
              return (
                <Card key={t.id} className="flex flex-col gap-3 border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className={cur === "concluida" ? "h-5 w-5 text-success" : cur === "em_andamento" ? "h-5 w-5 text-warning" : "h-5 w-5 text-muted-foreground"} />
                    <div>
                      <p className="font-medium">{t.titulo}</p>
                      {t.descricao && <p className="text-sm text-muted-foreground">{t.descricao}</p>}
                    </div>
                  </div>
                  <Select value={cur} onValueChange={(v) => setStatusMut.mutate({ tarefa_id: t.id, status: v as Status })}>
                    <SelectTrigger className="w-[160px] bg-secondary"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(statusLabel) as Status[]).map((s) => (
                        <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
