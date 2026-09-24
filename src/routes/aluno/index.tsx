import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Lock, Play, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aluno/")({
  head: () => ({
    meta: [
      { title: "Minhas Aulas | Operação Primeira Renda" },
      { name: "description", content: "Acompanhe suas aulas e seu progresso na Operação Primeira Renda." },
      { property: "og:title", content: "Minhas Aulas | Operação Primeira Renda" },
      { property: "og:description", content: "Acompanhe suas aulas e seu progresso na Operação Primeira Renda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

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
  const { profile, user } = useAuth();
  const turmaId = profile?.turma_id;

  const { data: aulas = [], isLoading } = useQuery({
    queryKey: ["aluno-aulas", turmaId],
    queryFn: async () => {
      if (!turmaId) return [];
      const { data, error } = await supabase
        .from("aulas")
        .select("id, numero, titulo, descricao, card_image_url, capa_url, liberada")
        .eq("turma_id", turmaId)
        .order("numero");
      if (error) throw error;
      return data as Aula[];
    },
    enabled: !!turmaId,
  });

  const { data: completedTasks = 0 } = useQuery({
    queryKey: ["aluno-progress-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("aluno_tarefa_status")
        .select("*", { count: "exact", head: true })
        .eq("aluno_id", user.id)
        .eq("status", "concluida");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const unlocked = aulas.filter((aula) => aula.liberada);
  const featured = unlocked[0] ?? aulas[0];
  const progress = aulas.length ? Math.min(100, Math.round((completedTasks / aulas.length) * 100)) : 0;

  return (
    <div className="min-h-dvh overflow-hidden bg-background">
      {isLoading ? (
        <div className="grid min-h-[70vh] place-items-center text-sm text-muted-foreground">Carregando sua jornada...</div>
      ) : aulas.length === 0 ? (
        <div className="grid min-h-[70vh] place-items-center px-6 text-center text-sm text-muted-foreground">Nenhuma aula disponível ainda.</div>
      ) : featured ? (
        <>
          <section className="member-hero relative flex min-h-[520px] items-end overflow-hidden px-5 pb-16 pt-24 sm:px-8 md:min-h-[610px] md:px-12 md:pb-24 lg:px-16">
            {featured.card_image_url || featured.capa_url ? (
              <img
                src={featured.card_image_url ?? featured.capa_url ?? ""}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 bg-secondary" aria-hidden="true" />
            )}
            <div className="member-hero-overlay absolute inset-0" aria-hidden="true" />
            <div className="relative z-10 w-full max-w-3xl animate-fade-in">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase text-muted-foreground">
                <span className="rounded-sm bg-primary px-2 py-1 text-primary-foreground">Em destaque</span>
                <span>Aula {featured.numero}</span>
                <span className="h-1 w-1 rounded-full bg-primary" />
                <span>{unlocked.length} de {aulas.length} liberadas</span>
              </div>
              <h1 className="max-w-3xl font-display text-4xl font-black uppercase leading-[1.02] text-foreground sm:text-5xl md:text-6xl">
                {featured.titulo}
              </h1>
              {featured.descricao && (
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/75 sm:text-lg">{featured.descricao}</p>
              )}
              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
                {!featured.liberada ? (
                  <Button disabled size="lg" className="h-12 px-6 uppercase">
                    <Lock className="h-4 w-4" /> Aula bloqueada
                  </Button>
                ) : (
                  <Button asChild size="lg" className="h-12 px-6 font-bold uppercase shadow-[0_0_28px_color-mix(in_oklab,var(--primary)_32%,transparent)]">
                    <Link to="/aluno/aulas/$aulaId" params={{ aulaId: featured.id }}>
                      <Play className="h-4 w-4 fill-current" /> Continuar aula
                    </Link>
                  </Button>
                )}
                <div className="min-w-0 flex-1 sm:max-w-xs">
                  <div className="mb-2 flex justify-between text-xs font-semibold uppercase text-muted-foreground">
                    <span>Progresso da jornada</span><span className="text-foreground">{progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-foreground/15">
                    <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative z-20 -mt-8 px-5 pb-12 sm:px-8 md:-mt-12 md:px-12 lg:px-16">
            <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold uppercase text-primary">Sua formação</p>
                <h2 className="font-display text-2xl font-black uppercase text-foreground sm:text-3xl">Todas as aulas</h2>
              </div>
              <Button asChild variant="ghost" size="sm" className="shrink-0 text-muted-foreground hover:text-foreground">
                <Link to="/aluno/tarefas">Tarefas <ChevronRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="member-rail flex snap-x gap-4 overflow-x-auto pb-7 pt-2">
          {aulas.map((aula) => {
            const locked = !aula.liberada;
            const img = aula.card_image_url ?? aula.capa_url;
            const inner = (
              <article className={cn("group relative h-full overflow-hidden rounded-md border border-border bg-card transition-all duration-300", locked ? "opacity-55" : "hover:-translate-y-2 hover:border-primary/70 hover:shadow-[0_20px_40px_-14px_color-mix(in_oklab,var(--primary)_30%,transparent)]")}>
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
                  {img ? (
                    <img src={img} alt={aula.titulo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="member-poster-fallback flex h-full w-full items-center justify-center">
                      <span className="font-display text-7xl font-black text-foreground/15">{String(aula.numero).padStart(2, "0")}</span>
                    </div>
                  )}
                  <div className="member-card-overlay absolute inset-0" aria-hidden="true" />
                  <div className="absolute left-3 top-3 rounded-sm bg-primary px-2 py-1 text-[10px] font-bold uppercase text-primary-foreground">
                    Aula {String(aula.numero).padStart(2, "0")}
                  </div>
                  {locked && (
                    <div className="absolute right-3 top-3 rounded-full border border-foreground/15 bg-background/75 p-2 backdrop-blur">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  {!locked && (
                    <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"><Play className="ml-0.5 h-5 w-5 fill-current" /></div>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="line-clamp-2 text-base font-bold leading-tight text-foreground">{aula.titulo}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{locked ? "Disponível em breve" : "Pronta para assistir"}</p>
                  </div>
                </div>
              </article>
            );
            return locked ? (
              <div key={aula.id} className="w-[164px] shrink-0 snap-start cursor-not-allowed sm:w-[190px] lg:w-[210px]">{inner}</div>
            ) : (
              <Link key={aula.id} to="/aluno/aulas/$aulaId" params={{ aulaId: aula.id }} className="w-[164px] shrink-0 snap-start sm:w-[190px] lg:w-[210px]">
                {inner}
              </Link>
            );
          })}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Link to="/aluno/tarefas" className="group flex min-h-28 items-center gap-4 rounded-md border border-border bg-card/65 p-5 transition-colors hover:border-primary/60 hover:bg-card">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary/15 text-primary"><Play className="h-5 w-5" /></div>
                <div className="min-w-0"><p className="font-display text-lg font-black uppercase">Organize suas tarefas</p><p className="text-sm text-muted-foreground">Avance cada missão até a conclusão.</p></div>
                <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/aluno/ranking" className="group flex min-h-28 items-center gap-4 rounded-md border border-border bg-card/65 p-5 transition-colors hover:border-primary/60 hover:bg-card">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-warning/15 text-warning"><Trophy className="h-5 w-5" /></div>
                <div className="min-w-0"><p className="font-display text-lg font-black uppercase">Veja sua posição</p><p className="text-sm text-muted-foreground">Acompanhe sua evolução no ranking.</p></div>
                <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
