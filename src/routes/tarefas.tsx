import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/tarefas")({
  beforeLoad: () => {
    throw redirect({ to: "/aluno/tarefas" });
  },
  component: () => null,
});