import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Pencil, MessageCircle, Check, X, Folder } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTurmas } from "@/hooks/use-admin-turmas";
import { PageHeader } from "@/components/layout/PageHeader";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/alunos")({ component: Page });

interface Aluno {
  id: string; nome: string; email: string; telefone: string | null;
  turma_id: string | null; approved: boolean; created_at: string;
}

function Page() {
  const { turmas } = useTurmas();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Aluno | null>(null);

  const { data: alunos = [] } = useQuery({
    queryKey: ["alunos-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles").select("*")
        .in("id", (await supabase.from("user_roles").select("user_id").eq("role", "aluno")).data?.map((r) => r.user_id) ?? [])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Aluno[];
    },
  });

  const { data: vitalicios = [] } = useQuery({
    queryKey: ["acessos-vitalicios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("acessos_vitalicios").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; email: string; nome: string | null; telefone: string | null; created_at: string }[];
    },
  });

  const pending = alunos.filter((a) => !a.approved);
  const approved = alunos.filter((a) => a.approved);

  // Vitalícios que ainda não criaram conta aparecem como alunos virtuais
  const emailsCadastrados = new Set(alunos.map((a) => a.email.toLowerCase()));
  const vitaliciosVirtuais: Aluno[] = vitalicios
    .filter((v) => !emailsCadastrados.has(v.email.toLowerCase()))
    .map((v) => ({
      id: `vit-${v.id}`, nome: v.nome ?? v.email, email: v.email, telefone: v.telefone,
      turma_id: null, approved: true, created_at: v.created_at,
    }));
  const todos = [...approved, ...vitaliciosVirtuais];

  const tabs = [
    { id: "todos", nome: `Todos (${todos.length})`, filter: () => todos },
    { id: "sem", nome: `Sem Turma (${todos.filter((a) => !a.turma_id).length})`, filter: () => todos.filter((a) => !a.turma_id) },
    { id: "vitalicio", nome: `Vitalícios (${vitaliciosVirtuais.length})`, filter: () => vitaliciosVirtuais },
    ...turmas.map((t: { id: string; nome: string }) => ({
      id: t.id, nome: `${t.nome} (${approved.filter((a) => a.turma_id === t.id).length})`,
      filter: () => approved.filter((a) => a.turma_id === t.id),
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Painel do" highlight="Mentor" subtitle="Olá, Mentor. Gerencie sua tribo." />
      <div>
        <h2 className="text-xl font-bold">Alunos</h2>
        <p className="text-sm text-muted-foreground">Gerencie os alunos e suas turmas</p>
      </div>

      {pending.length > 0 && (
        <Card className="border-warning/40 bg-warning/5 p-4">
          <h3 className="mb-3 font-semibold">Aprovações Pendentes ({pending.length})</h3>
          <div className="space-y-2">
            {pending.map((a) => <PendingRow key={a.id} aluno={a} onChanged={() => qc.invalidateQueries({ queryKey: ["alunos-all"] })} />)}
          </div>
        </Card>
      )}

      <Card className="border-border bg-card p-2">
        <Tabs defaultValue="todos">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-transparent p-2">
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="gap-1 data-[state=active]:bg-flame data-[state=active]:text-primary-foreground">
                <Folder className="h-3 w-3" /> {t.nome}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((t) => (
            <TabsContent key={t.id} value={t.id} className="m-0 p-4">
              <Table rows={t.filter()} turmas={turmas} onEdit={setEditing} />
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      <EditAlunoDialog aluno={editing} turmas={turmas} onClose={() => setEditing(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["alunos-all"] })} />
    </div>
  );
}

function PendingRow({ aluno, onChanged }: { aluno: Aluno; onChanged: () => void }) {
  const approve = async () => {
    const { error } = await supabase.from("profiles").update({ approved: true }).eq("id", aluno.id);
    if (error) return toast.error(error.message);
    toast.success("Aluno aprovado!");
    onChanged();
  };
  const reject = async () => {
    if (!confirm("Remover este cadastro?")) return;
    await supabase.from("profiles").delete().eq("id", aluno.id);
    toast.success("Removido");
    onChanged();
  };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-secondary/40 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-flame text-sm font-bold text-primary-foreground">{aluno.nome.charAt(0).toUpperCase()}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{aluno.nome}</div>
        <div className="text-xs text-muted-foreground">{aluno.email} • {aluno.telefone}</div>
      </div>
      <Button size="sm" className="bg-flame" onClick={approve}><Check className="h-4 w-4" /> Aprovar</Button>
      <Button size="sm" variant="outline" onClick={reject}><X className="h-4 w-4" /></Button>
    </div>
  );
}

function Table({ rows, turmas, onEdit }: { rows: Aluno[]; turmas: { id: string; nome: string }[]; onEdit: (a: Aluno) => void }) {
  if (!rows.length) return <p className="py-10 text-center text-sm text-muted-foreground">Nenhum aluno aqui ainda.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="px-3 py-2">Nome</th><th className="px-3 py-2">Telefone</th><th className="px-3 py-2">Turma</th>
          <th className="px-3 py-2">Progresso</th><th className="px-3 py-2">Cadastro</th><th className="px-3 py-2">Ações</th>
        </tr></thead>
        <tbody>
          {rows.map((a) => {
            const turma = turmas.find((t) => t.id === a.turma_id);
            return (
              <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/40">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-flame text-xs font-bold text-primary-foreground">{a.nome.charAt(0).toUpperCase()}</div>
                    <span className="font-medium">{a.nome}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  {a.id.startsWith("vit-") ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <Select
                      value={a.turma_id ?? "none"}
                      onValueChange={async (v) => {
                        const novo = v === "none" ? null : v;
                        const { error } = await supabase.from("profiles").update({ turma_id: novo }).eq("id", a.id);
                        if (error) return toast.error(error.message);
                        toast.success("Turma atualizada");
                        qc.invalidateQueries({ queryKey: ["alunos-all"] });
                      }}
                    >
                      <SelectTrigger className="h-8 w-[160px] bg-secondary/40 text-xs">
                        <SelectValue placeholder="Sem turma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem turma</SelectItem>
                        {turmas.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </td>
                <td className="px-3 py-3 text-muted-foreground">{format(new Date(a.created_at), "dd 'de' MMM. 'de' yyyy", { locale: ptBR })}</td>
                <td className="px-3 py-3"><div className="flex gap-1">
                  {a.telefone && <a href={`https://wa.me/55${a.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="rounded p-1.5 text-emerald-400 hover:bg-secondary"><MessageCircle className="h-4 w-4" /></a>}
                  {!a.id.startsWith("vit-") && <button onClick={() => onEdit(a)} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="h-4 w-4" /></button>}
                </div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EditAlunoDialog({ aluno, turmas, onClose, onSaved }: { aluno: Aluno | null; turmas: { id: string; nome: string }[]; onClose: () => void; onSaved: () => void }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [turmaId, setTurmaId] = useState<string | null>(null);
  useState(() => {});
  // sync on open
  if (aluno && nome === "" && telefone === "" && turmaId === null) {
    setNome(aluno.nome); setTelefone(aluno.telefone ?? ""); setTurmaId(aluno.turma_id);
  }
  const close = () => { setNome(""); setTelefone(""); setTurmaId(null); onClose(); };
  const save = async () => {
    if (!aluno) return;
    const { error } = await supabase.from("profiles").update({ nome, telefone, turma_id: turmaId }).eq("id", aluno.id);
    if (error) return toast.error(error.message);
    toast.success("Aluno atualizado");
    onSaved(); close();
  };
  return (
    <Dialog open={!!aluno} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Aluno</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <div><Label>Telefone</Label><Input value={telefone} onChange={(e) => setTelefone(e.target.value)} /></div>
          <div><Label>Turma</Label>
            <Select value={turmaId ?? "none"} onValueChange={(v) => setTurmaId(v === "none" ? null : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem turma</SelectItem>
                {turmas.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancelar</Button>
          <Button className="bg-flame" onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
