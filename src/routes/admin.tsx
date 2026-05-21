import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode, createContext, useContext } from "react";
import { LayoutGrid, Users, BookOpen, Calendar, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Turma { id: string; nome: string; community_link: string | null }
interface TurmaCtx {
  turmas: Turma[];
  selected: string | null;
  setSelected: (id: string | null) => void;
  refetch: () => void;
}
const Ctx = createContext<TurmaCtx | undefined>(undefined);
export const useTurmas = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTurmas inside admin");
  return c;
};

export const Route = createFileRoute("/admin")({ component: Layout });

const nav = [
  { to: "/admin", label: "Visão Geral", icon: <LayoutGrid className="h-4 w-4" /> },
  { to: "/admin/alunos", label: "Alunos", icon: <Users className="h-4 w-4" /> },
  { to: "/admin/conteudos", label: "Conteúdos", icon: <BookOpen className="h-4 w-4" /> },
  { to: "/admin/agenda", label: "Agenda", icon: <Calendar className="h-4 w-4" /> },
];

function Layout() {
  const { loading, role } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("admin-turma") : null,
  );
  const [openNew, setOpenNew] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (role !== "admin") navigate({ to: "/login" });
  }, [loading, role, navigate]);

  const { data: turmas = [], refetch } = useQuery({
    queryKey: ["turmas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("turmas").select("*").order("created_at");
      if (error) throw error;
      return data as Turma[];
    },
    enabled: role === "admin",
  });

  useEffect(() => {
    if (!selected && turmas.length) {
      setSelected(turmas[0].id);
      localStorage.setItem("admin-turma", turmas[0].id);
    }
  }, [turmas, selected]);

  const onSel = (id: string | null) => {
    setSelected(id);
    if (id) localStorage.setItem("admin-turma", id);
  };

  if (loading || role !== "admin") return null;

  return (
    <Ctx.Provider value={{ turmas, selected, setSelected: onSel, refetch }}>
      <AppShell nav={nav as never}>
        <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Select value={selected ?? ""} onValueChange={onSel}>
              <SelectTrigger className="w-[180px] bg-card"><SelectValue placeholder="Selecione turma" /></SelectTrigger>
              <SelectContent>
                {turmas.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="bg-flame" onClick={() => setOpenNew(true)}>
              <Plus className="mr-1 h-4 w-4" /> Nova Turma
            </Button>
          </div>
          <Outlet />
        </div>
      </AppShell>
      <NovaTurmaDialog open={openNew} onOpenChange={setOpenNew} onCreated={(id) => { refetch(); qc.invalidateQueries(); onSel(id); }} />
    </Ctx.Provider>
  );
}

function NovaTurmaDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (b: boolean) => void; onCreated: (id: string) => void }) {
  const [nome, setNome] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("turmas").insert({ nome, community_link: link || null }).select().single();
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Turma criada!");
    setNome(""); setLink("");
    onOpenChange(false);
    if (data) onCreated(data.id);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Turma</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nome da Turma</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Turma Janeiro 2024" maxLength={80} /></div>
          <div><Label>Link da Comunidade (opcional)</Label><Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-flame" disabled={!nome || loading} onClick={submit}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminPageWrap({ children }: { children: ReactNode }) { return <div className="space-y-6">{children}</div>; }
