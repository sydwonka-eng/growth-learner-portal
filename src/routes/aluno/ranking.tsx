import { createFileRoute } from "@tanstack/react-router";
import { Ranking } from "@/components/Ranking";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/aluno/ranking")({ component: Page });

function Page() {
  const { profile } = useAuth();
  return <Ranking turmaId={profile?.turma_id ?? null} scope="aluno" />;
}
