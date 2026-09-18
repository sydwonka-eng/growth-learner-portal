import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink, Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileUploadButton } from "@/components/FileUploadButton";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/arsenal")({ component: Page });

interface Ferramenta {
  id: string;
  titulo: string;
  descricao: string | null;
  link: string | null;
  capa_url: string | null;
}

function Page() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ferramenta | null>(null);

  const { data: itens = [] } = useQuery({
    queryKey: ["arsenal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("arsenal").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Ferramenta[];
    },
  });

  const remover = async (id: string) => {
    if (!confirm("Excluir esta ferramenta?")) return;
    const { error } = await supabase.from("arsenal").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Ferramenta excluída");
    qc.invalidateQueries({ queryKey: ["arsenal"] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Arsenal de"
        highlight="Ferramentas"
        subtitle="Ferramentas liberadas para os alunos."
        actions={
          <Button className="bg-flame" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Nova Ferramenta
          </Button>
        }
      />

      {itens.length === 0 ? (
        <Card className="border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhuma ferramenta cadastrada ainda.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itens.map((f) => (
            <Card key={f.id} className="overflow-hidden border-border bg-card">
              <div className="aspect-video w-full bg-secondary">
                {f.capa_url ? (
                  <img src={f.capa_url} alt={f.titulo} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Swords className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <h3 className="font-semibold">{f.titulo}</h3>
                {f.descricao && <p className="line-clamp-3 text-sm text-muted-foreground">{f.descricao}</p>}
                <div className="flex items-center gap-2 pt-1">
                  {f.link && (
                    <a
                      href={f.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Abrir
                    </a>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => { setEditing(f); setOpen(true); }} className="rounded p-2 text-muted-foreground hover:text-primary">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remover(f.id)} className="rounded p-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <FerramentaDialog
        key={editing?.id ?? "nova"}
        open={open}
        onOpenChange={setOpen}
        item={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["arsenal"] })}
      />
    </div>
  );
}

function FerramentaDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  item: Ferramenta | null;
  onSaved: () => void;
}) {
  const [titulo, setTitulo] = useState(item?.titulo ?? "");
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [link, setLink] = useState(item?.link ?? "");
  const [capa, setCapa] = useState<string | null>(item?.capa_url ?? null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!titulo.trim()) return toast.error("Informe o título");
    setLoading(true);
    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      link: link.trim() || null,
      capa_url: capa,
    };
    const { error } = item
      ? await supabase.from("arsenal").update(payload).eq("id", item.id)
      : await supabase.from("arsenal").insert(payload);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(item ? "Ferramenta atualizada" : "Ferramenta cadastrada");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Editar Ferramenta" : "Nova Ferramenta"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Gerador de Copy" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Para que serve a ferramenta" rows={3} />
          </div>
          <div>
            <Label>Link da ferramenta</Label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Imagem de capa</Label>
            <FileUploadButton value={capa} onChange={setCapa} label="Enviar capa" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-flame" disabled={loading || !titulo} onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
