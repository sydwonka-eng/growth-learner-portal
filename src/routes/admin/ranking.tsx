import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Ranking } from "@/components/Ranking";
import { useTurmas } from "@/hooks/use-admin-turmas";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/ranking")({ component: Page });

function Page() {
  const { turmas, selected } = useTurmas();
  const [showAll, setShowAll] = useState(false);
  const turmaNome = turmas.find((t: { id: string; nome: string }) => t.id === selected)?.nome;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={showAll ? "outline" : "default"} className={!showAll ? "bg-flame" : ""} onClick={() => setShowAll(false)}>
          {turmaNome ?? "Turma atual"}
        </Button>
        <Button size="sm" variant={showAll ? "default" : "outline"} className={showAll ? "bg-flame" : ""} onClick={() => setShowAll(true)}>
          Todos os alunos
        </Button>
      </div>
      <Ranking turmaId={showAll ? null : selected} scope={showAll ? "all" : selected ?? "none"} />
    </div>
  );
}
