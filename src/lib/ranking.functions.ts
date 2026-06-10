import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface RankingEntry {
  id: string;
  nome: string;
  pontuacao: number;
  turma_id: string | null;
}

export const getRanking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { turmaId?: string | null } | undefined) => data ?? {})
  .handler(async ({ data }): Promise<RankingEntry[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: roles }, { data: profiles }, { data: vitalicios }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id").eq("role", "aluno"),
      supabaseAdmin.from("profiles").select("id, nome, email, pontuacao, turma_id, approved"),
      supabaseAdmin.from("acessos_vitalicios").select("id, nome, email, pontuacao, turma_id"),
    ]);

    const alunoIds = new Set((roles ?? []).map((r) => r.user_id));
    const alunos = (profiles ?? []).filter((p) => alunoIds.has(p.id) && p.approved);

    const emails = new Set(alunos.map((a) => (a.email ?? "").toLowerCase()));
    const virtuais = (vitalicios ?? []).filter((v) => !emails.has((v.email ?? "").toLowerCase()));

    let entries: RankingEntry[] = [
      ...alunos.map((a) => ({ id: a.id, nome: a.nome, pontuacao: a.pontuacao ?? 0, turma_id: a.turma_id })),
      ...virtuais.map((v) => ({ id: `vit-${v.id}`, nome: v.nome ?? v.email ?? "Aluno", pontuacao: v.pontuacao ?? 0, turma_id: v.turma_id })),
    ];

    if (data.turmaId) {
      entries = entries.filter((e) => e.turma_id === data.turmaId);
    }

    return entries.sort((a, b) => b.pontuacao - a.pontuacao || a.nome.localeCompare(b.nome));
  });
