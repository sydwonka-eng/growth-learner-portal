import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Crown, Medal, Trophy, Sparkles } from "lucide-react";
import { getRanking, type RankingEntry } from "@/lib/ranking.functions";
import { cn } from "@/lib/utils";

function initials(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

function Podium({ entry, place }: { entry: RankingEntry; place: 1 | 2 | 3 }) {
  const cfg = {
    1: { h: "h-40", ring: "ring-yellow-400/70", grad: "from-yellow-400/30 to-yellow-600/10", badge: "bg-yellow-400 text-yellow-950", label: "1º", icon: <Crown className="h-6 w-6 crown-glow text-yellow-400" /> },
    2: { h: "h-32", ring: "ring-slate-300/60", grad: "from-slate-300/25 to-slate-500/10", badge: "bg-slate-300 text-slate-900", label: "2º", icon: <Medal className="h-5 w-5 text-slate-300" /> },
    3: { h: "h-28", ring: "ring-amber-600/60", grad: "from-amber-600/25 to-amber-800/10", badge: "bg-amber-600 text-amber-50", label: "3º", icon: <Medal className="h-5 w-5 text-amber-600" /> },
  }[place];
  const order = place === 1 ? "order-2" : place === 2 ? "order-1" : "order-3";
  return (
    <div className={cn("flex flex-1 flex-col items-center justify-end gap-3 rank-rise", order)} style={{ animationDelay: `${place * 0.12}s` }}>
      <div className={cn("flex flex-col items-center gap-2", place === 1 && "rank-float")}>
        {cfg.icon}
        <div className={cn("relative flex h-16 w-16 items-center justify-center rounded-full bg-card text-lg font-bold ring-2", cfg.ring)}>
          {initials(entry.nome)}
        </div>
        <div className="max-w-[8rem] truncate text-center text-sm font-semibold">{entry.nome}</div>
        <div className="text-flame text-lg font-extrabold">{entry.pontuacao}</div>
      </div>
      <div className={cn("relative w-full overflow-hidden rounded-t-xl bg-gradient-to-b ring-1 ring-border", cfg.h, cfg.grad)}>
        <div className="rank-shimmer absolute inset-0" />
        <div className="absolute inset-x-0 top-3 flex justify-center">
          <span className={cn("rounded-full px-3 py-0.5 text-sm font-black shadow", cfg.badge)}>{cfg.label}</span>
        </div>
      </div>
    </div>
  );
}

export function Ranking({ turmaId, scope }: { turmaId?: string | null; scope?: string }) {
  const fetchRanking = useServerFn(getRanking);
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["ranking", turmaId ?? "all", scope ?? "global"],
    queryFn: () => fetchRanking({ data: { turmaId: turmaId ?? null } }),
  });

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 starfield">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-flame">
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Ranking <span className="text-flame">da Tribo</span></h1>
            <p className="text-sm text-muted-foreground">A pontuação é definida pelo mentor. Suba no ranking! <Sparkles className="inline h-3.5 w-3.5 text-flame" /></p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando ranking...</div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Nenhum aluno pontuado ainda.</div>
      ) : (
        <>
          {top3.length > 0 && (
            <div className="mx-auto flex max-w-2xl items-end gap-3 px-2 sm:gap-5">
              {top3.map((e, i) => <Podium key={e.id} entry={e} place={(i + 1) as 1 | 2 | 3} />)}
            </div>
          )}

          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((e, i) => (
                <div
                  key={e.id}
                  className="rank-rise flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-transform hover:scale-[1.01] hover:border-flame/50"
                  style={{ animationDelay: `${0.4 + i * 0.05}s` }}
                >
                  <div className="w-8 text-center text-lg font-bold text-muted-foreground">{i + 4}</div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold">{initials(e.nome)}</div>
                  <div className="flex-1 truncate font-medium">{e.nome}</div>
                  <div className="flex items-center gap-1.5 rounded-full bg-flame/10 px-3 py-1">
                    <Trophy className="h-3.5 w-3.5 text-flame" />
                    <span className="text-flame text-sm font-extrabold">{e.pontuacao}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
