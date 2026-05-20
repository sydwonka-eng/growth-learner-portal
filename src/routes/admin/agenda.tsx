import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar as CalIcon, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTurmas } from "@/routes/admin";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/agenda")({ component: Page });

interface Compromisso { id: string; titulo: string; descricao: string | null; data_hora: string }

function Page() {
  const { selected } = useTurmas();
  const qc = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);

  const { data: compromissos = [] } = useQuery({
    queryKey: ["compromissos", selected],
    queryFn: async () => {
      const { data, error } = await supabase.from("compromissos").select("*").eq("turma_id", selected!).order("data_hora");
      if (error) throw error;
      return data as Compromisso[];
    },
    enabled: !!selected,
  });

  const doDia = date ? compromissos.filter((c) => isSameDay(new Date(c.data_hora), date)) : [];
  const diasComEvento = compromissos.map((c) => new Date(c.data_hora));

  return (
    <div className="space-y-6">
      <PageHeader title="Painel do" highlight="Mentor" subtitle="Olá, Mentor. Gerencie sua tribo." />
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold">Agenda</h2>
          <p className="text-sm text-muted-foreground">Gerencie os compromissos da turma</p>
        </div>
        <Button className="bg-flame" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Novo Compromisso</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card p-5">
          <CalendarUI
            mode="single" selected={date} onSelect={setDate} locale={ptBR}
            modifiers={{ withEvent: diasComEvento }}
            modifiersClassNames={{ withEvent: "bg-primary/30 text-primary font-bold rounded-md" }}
          />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-primary/40" /> Com compromisso</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-secondary" /> Sem compromisso</span>
          </div>
        </Card>
        <div className="space-y-3">
          <h3 className="font-semibold">{date && format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</h3>
          {doDia.length === 0 ? (
            <Card className="border-dashed border-border bg-card p-10 text-center">
              <CalIcon className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Nenhum compromisso para esta data</p>
              <button onClick={() => setOpen(true)} className="mt-2 text-sm text-primary hover:underline">Adicionar compromisso</button>
            </Card>
          ) : doDia.map((c) => (
            <Card key={c.id} className="border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{c.titulo}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(c.data_hora), "HH:mm")}</div>
                  {c.descricao && <p className="mt-2 text-sm text-muted-foreground">{c.descricao}</p>}
                </div>
                <button onClick={async () => { await supabase.from("compromissos").delete().eq("id", c.id); qc.invalidateQueries({ queryKey: ["compromissos"] }); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <NovoDialog open={open} onOpenChange={setOpen} turmaId={selected} initialDate={date} />
    </div>
  );
}

function NovoDialog({ open, onOpenChange, turmaId, initialDate }: { open: boolean; onOpenChange: (b: boolean) => void; turmaId: string | null; initialDate?: Date }) {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [hora, setHora] = useState("19:00");
  const submit = async () => {
    if (!turmaId || !titulo) return toast.error("Preencha os campos");
    const dt = new Date(`${data}T${hora}`);
    const { error } = await supabase.from("compromissos").insert({ turma_id: turmaId, titulo, descricao, data_hora: dt.toISOString() });
    if (error) return toast.error(error.message);
    toast.success("Compromisso criado");
    qc.invalidateQueries({ queryKey: ["compromissos"] });
    setTitulo(""); setDescricao("");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Compromisso</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Aula 4" /></div>
          <div><Label>Descrição</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data</Label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
            <div><Label>Horário</Label><Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button className="bg-flame" onClick={submit}>Criar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
