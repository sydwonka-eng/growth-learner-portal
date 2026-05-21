import { createContext, useContext, type ReactNode } from "react";

export interface Turma {
  id: string;
  nome: string;
  community_link: string | null;
}

interface TurmaCtx {
  turmas: Turma[];
  selected: string | null;
  setSelected: (id: string | null) => void;
  refetch: () => void;
}

const AdminTurmasContext = createContext<TurmaCtx | undefined>(undefined);

export function AdminTurmasProvider({ children, value }: { children: ReactNode; value: TurmaCtx }) {
  return <AdminTurmasContext.Provider value={value}>{children}</AdminTurmasContext.Provider>;
}

export function useTurmas() {
  const context = useContext(AdminTurmasContext);
  if (!context) throw new Error("useTurmas inside admin");
  return context;
}