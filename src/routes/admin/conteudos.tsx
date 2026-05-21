import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { FileUploadButton } from "@/components/FileUploadButton";
import { supabase } from "@/integrations/supabase/client";
import { useTurmas } from "@/hooks/use-admin-turmas";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/conteudos")({ component: Page });

interface Aula {
  id: string; numero: number; titulo: string; descricao: string | null;
  iframe_video: string | null; card_image_url: string | null; capa_url: string | null;
  materiais_url: string | null; liberada: boolean;
}
interface Tarefa {
  id: string; aula_id: string; titulo: string; descricao: string | null;
  capa_url: string | null; iframe_video: string | null; materiais_url: string | null;
}

function Page() {
  const { selected } = useTurmas();
  const qc = useQueryClient();
  const [editAula, setEditAula] = useState<Aula | null>(null);
  const [newTask, setNewTask] = useState(false);

  // Garante 8 aulas para a turma
  useEffect(() => {
    if (!selected) return;
    (async () => {
      const { data } = await supabase.from("aulas").select("numero").eq("turma_id", selected);
      const existentes = new Set(data?.map((a) => a.numero) ?? []);
      const faltam = [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => !existentes.has(n));
      if (faltam.length) {
        const { error } = await supabase.from("aulas").insert(
          faltam.map((n) => ({ turma_id: selected, numero: n, titulo: `Aula ${n}`, liberada: false }))
        );
        if (error) toast.error("Erro ao criar aulas: " + error.message);
        qc.invalidateQueries({ queryKey: ["aulas", selected] });
      }
    })();
  }, [selected, qc]);

  const { data: aulas = [] } = useQuery({
    queryKey: ["aulas", selected],
    queryFn: async () => {
      const { data, error } = await supabase.from("aulas").select("*").eq("turma_id", selected!).order("numero");
      if (error) throw error;
      return data as Aula[];
    },
    enabled: !!selected,
  });

  const { data: tarefas = [] } = useQuery({
    queryKey: ["tarefas", selected, aulas.length],
    queryFn: async () => {
      const aulaIds = aulas.map((a) => a.id);
      if (!aulaIds.length) return [];
      const { data, error } = await supabase.from("tarefas").select("*").in("aula_id", aulaIds);
      if (error) throw error;
      return data as Tarefa[];
    },
    enabled: !!selected && aulas.length > 0,
  });

  const toggleLib = async (aula: Aula) => {
    await supabase.from("aulas").update({ liberada: !aula.liberada }).eq("id", aula.id);
    qc.invalidateQueries({ queryKey: ["aulas", selected] });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Painel do" highlight="Mentor" subtitle="Olá, Mentor. Gerencie sua tribo." />
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold">Conteúdos</h2>
          <p className="text-sm text-muted-foreground">Gerencie encontros e tarefas da turma</p>
        </div>
        <Button variant="outline" onClick={() => setNewTask(true)} disabled={!selected || aulas.length === 0}>
          <Plus className="mr-1 h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      {!selected && <p className="py-10 text-center text-muted-foreground">Selecione uma turma no topo da página.</p>}

      <div className="space-y-4">
        {aulas.map((aula) => {
          const aulaTarefas = tarefas.filter((t) => t.aula_id === aula.id);
          return (
            <Card key={aula.id} className="border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-flame text-sm font-bold text-primary-foreground">{aula.numero}</div>
                  <div>
                    <h3 className="font-semibold">{aula.titulo}</h3>
                    <p className="text-xs text-muted-foreground">{aulaTarefas.length} tarefa(s)</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {aula.card_image_url && <Badge variant="secondary">Card</Badge>}
                      {aula.capa_url && <Badge variant="secondary">Capa</Badge>}
                      {aula.iframe_video && <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">Vídeo</Badge>}
                      {aula.materiais_url && <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">Materiais</Badge>}
                      <Badge className={aula.liberada ? "bg-success/20 text-success-foreground" : "bg-destructive/20 text-destructive-foreground"}>
                        {aula.liberada ? "Liberado" : "Bloqueado"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditAula(aula)} className="rounded p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                  <label className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-xs">
                    <Switch checked={aula.liberada} onCheckedChange={() => toggleLib(aula)} />
                    {aula.liberada ? "Liberado" : "Bloqueado"}
                  </label>
                </div>
              </div>

              {aulaTarefas.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tarefas</div>
                  <div className="space-y-2">
                    {aulaTarefas.map((t) => <TarefaRow key={t.id} tarefa={t} aula={aula} />)}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <EditAulaDialog aula={editAula} onClose={() => setEditAula(null)} />
      <NewTarefaDialog open={newTask} onOpenChange={setNewTask} aulas={aulas} />
    </div>
  );
}

function TarefaRow({ tarefa, aula }: { tarefa: Tarefa; aula: Aula }) {
  const qc = useQueryClient();
  const del = async () => {
    if (!confirm("Remover tarefa?")) return;
    await supabase.from("tarefas").delete().eq("id", tarefa.id);
    qc.invalidateQueries({ queryKey: ["tarefas"] });
  };
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-flame text-xs font-bold text-primary-foreground">{aula.numero}</div>
      <div className="flex-1">
        <div className="text-sm font-medium">{tarefa.titulo}</div>
        {tarefa.descricao && <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">📌 {tarefa.descricao}</div>}
        <div className="mt-1 flex gap-1">
          {tarefa.capa_url && <Badge variant="secondary" className="text-[10px]">Capa</Badge>}
          {tarefa.iframe_video && <Badge variant="secondary" className="bg-blue-500/20 text-[10px] text-blue-300">Vídeo</Badge>}
          {tarefa.materiais_url && <Badge variant="secondary" className="bg-yellow-500/20 text-[10px] text-yellow-300">Materiais</Badge>}
        </div>
      </div>
      <button onClick={del} className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function EditAulaDialog({ aula, onClose }: { aula: Aula | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [iframe, setIframe] = useState("");
  const [cardImg, setCardImg] = useState("");
  const [capa, setCapa] = useState("");
  const [materiais, setMateriais] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (aula && !hydrated) {
      setTitulo(aula.titulo); setDescricao(aula.descricao ?? "");
      setIframe(aula.iframe_video ?? ""); setCardImg(aula.card_image_url ?? "");
      setCapa(aula.capa_url ?? ""); setMateriais(aula.materiais_url ?? "");
      setHydrated(true);
    }
  }, [aula, hydrated]);

  const close = () => {
    setTitulo(""); setDescricao(""); setIframe(""); setCardImg(""); setCapa(""); setMateriais("");
    setHydrated(false);
    onClose();
  };
  const save = async () => {
    if (!aula) return;
    const { error } = await supabase.from("aulas").update({
      titulo, descricao,
      iframe_video: iframe || null,
      card_image_url: cardImg || null,
      capa_url: capa || null,
      materiais_url: materiais || null,
    }).eq("id", aula.id);
    if (error) return toast.error(error.message);
    toast.success("Aula salva");
    qc.invalidateQueries({ queryKey: ["aulas"] });
    close();
  };
  return (
    <Dialog open={!!aula} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Aula {aula?.numero}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
          <div><Label>Resumo</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} placeholder="Descreva o encontro..." /></div>
          <div>
            <Label>Imagem do Card (3:4 vertical - para o carrossel)</Label>
            <FileUploadButton value={cardImg} onChange={(v) => setCardImg(v ?? "")} label="Upload imagem do card" accept="image/*" />
            <p className="mt-1 text-xs text-muted-foreground">Tamanho recomendado: 600x800px (3:4)</p>
          </div>
          <div>
            <Label>Capa da Aula (16:9 horizontal - exibida ao abrir)</Label>
            <FileUploadButton value={capa} onChange={(v) => setCapa(v ?? "")} label="Upload capa da aula (formato horizontal)" accept="image/*" />
            <p className="mt-1 text-xs text-muted-foreground">Tamanho recomendado: 1280x675px (16:9)</p>
          </div>
          <div><Label>Código do Vídeo (iframe)</Label><Textarea value={iframe} onChange={(e) => setIframe(e.target.value)} rows={3} placeholder='<iframe src="..."></iframe>' /></div>
          <div><Label>Materiais de Apoio (PDFs, Imagens, Documentos)</Label><FileUploadButton value={materiais} onChange={(v) => setMateriais(v ?? "")} label="Fazer upload de materiais" accept="*/*" multiple /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={close}>Cancelar</Button><Button className="bg-flame" onClick={save}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewTarefaDialog({ open, onOpenChange, aulas }: { open: boolean; onOpenChange: (b: boolean) => void; aulas: Aula[] }) {
  const qc = useQueryClient();
  const [aulaId, setAulaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [capa, setCapa] = useState("");
  const [iframe, setIframe] = useState("");
  const [materiais, setMateriais] = useState("");
  const close = () => {
    setAulaId(""); setTitulo(""); setDescricao("");
    setCapa(""); setIframe(""); setMateriais("");
    onOpenChange(false);
  };
  const submit = async () => {
    if (!aulaId) return toast.error("Selecione a aula");
    if (!titulo.trim()) return toast.error("Informe o título da tarefa");
    const { error } = await supabase.from("tarefas").insert({
      aula_id: aulaId,
      titulo: titulo.trim(),
      descricao: descricao || null,
      capa_url: capa || null,
      iframe_video: iframe || null,
      materiais_url: materiais || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Tarefa criada");
    qc.invalidateQueries({ queryKey: ["tarefas"] });
    close();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Aula</Label>
            <Select value={aulaId} onValueChange={setAulaId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{aulas.map((a) => <SelectItem key={a.id} value={a.id}>Aula {a.numero} - {a.titulo}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Título da Tarefa</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Questionário de Autoconhecimento" /></div>
          <div><Label>Descrição</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} placeholder="Descreva a tarefa..." /></div>
          <div><Label>Imagem de Capa</Label><FileUploadButton value={capa} onChange={(v) => setCapa(v ?? "")} label="Fazer upload da imagem de capa" accept="image/*" /></div>
          <div><Label>Iframe do Vídeo</Label><Textarea value={iframe} onChange={(e) => setIframe(e.target.value)} rows={3} placeholder='<iframe src="..."></iframe>' /></div>
          <div><Label>Materiais de Apoio</Label><FileUploadButton value={materiais} onChange={(v) => setMateriais(v ?? "")} label="Fazer upload dos materiais" accept="*/*" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={close}>Cancelar</Button><Button className="bg-flame" onClick={submit}>Criar Tarefa</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
