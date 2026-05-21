import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aluno/")({ component: Page });

interface Aula {
  id: string;
  numero: number;
  titulo: string;
  descricao: string | null;
  card_image_url: string | null;
  capa_url: string | null;
  liberada: boolean;
}

function Page() {
  const { profile } = useAuth();
  const turmaId = profile?.turma_id;

  const { data: aulas = [], isLoading } = useQuery({
    queryKey: ["aluno-aulas", turmaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas")
        .select("id, numero, titulo, descricao, card_image_url, capa_url, liberada")
        .eq("turma_id", turmaId!)
        .order("numero");
      if (error) throw error;
      return data as Aula[];
    },
    enabled: !!turmaId,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Minhas Aulas" subtitle="Acompanhe sua jornada da Tríade da Ação." />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : aulas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma aula disponível ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {aulas.map((aula) => {
            const locked = !aula.liberada;
            const img = aula.card_image_url ?? aula.capa_url;
            const inner = (
              <Card
                className={cn(
                  "group relative h-full overflow-hidden border-border bg-card transition-all",
                  locked ? "opacity-60" : "hover:border-primary hover:glow hover:-translate-y-0.5",
                )}
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
                  {img ? (
                    <img src={img} alt={aula.titulo} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-flame">
                      <span className="text-3xl font-bold text-primary-foreground">{aula.numero}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    {locked ? <Lock className="h-10 w-10 text-white" /> : <PlayCircle className="h-12 w-12 text-white" />}
                  </div>
                  {locked && (
                    <div className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-muted-foreground">Aula {aula.numero}</p>
                  <h3 className="line-clamp-2 text-sm font-semibold">{aula.titulo}</h3>
                </div>
              </Card>
            );
            return locked ? (
              <div key={aula.id} className="cursor-not-allowed">{inner}</div>
            ) : (
              <Link key={aula.id} to="/aluno/aulas/$aulaId" params={{ aulaId: aula.id }}>
                {inner}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
