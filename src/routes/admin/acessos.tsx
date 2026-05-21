import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Infinity as InfinityIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/acessos")({ component: Page });

interface Acesso { id: string; email: string; nota: string | null; created_at: string }

function Page() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [nota, setNota] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: lista = [] } = useQuery({
    queryKey: ["acessos-vitalicios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("acessos_vitalicios").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Acesso[];
    },
  });

  const add = async () => {
    if (!email.includes("@")) return toast.error("Email inválido");
    setLoading(true);
    const { error } = await supabase.from("acessos_vitalicios").insert({ email: email.toLowerCase().trim(), nota: nota || null });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Acesso vitalício liberado");
    setEmail(""); setNota("");
    qc.invalidateQueries({ queryKey: ["acessos-vitalicios"] });
  };

  const remover = async (id: string) => {
    if (!confirm("Revogar este acesso?")) return;
    await supabase.from("acessos_vitalicios").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["acessos-vitalicios"] });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Acessos" highlight="Vitalícios" subtitle="Libere acesso permanente por email" />

      <Card className="border-border bg-card p-5">
        <h3 className="mb-3 font-semibold">Liberar novo acesso</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <div><Label>Email do aluno</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aluno@email.com" /></div>
          <div><Label>Nota (opcional)</Label><Input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ex: aluno bolsista" /></div>
          <div className="flex items-end"><Button className="bg-flame" disabled={loading || !email} onClick={add}><Plus className="mr-1 h-4 w-4" /> Liberar</Button></div>
        </div>
      </Card>

      <Card className="border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-semibold">Acessos ativos ({lista.length})</h3>
        </div>
        {lista.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Nenhum acesso vitalício liberado.</p>
        ) : (
          <div className="divide-y divide-border">
            {lista.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-flame text-primary-foreground">
                  <InfinityIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{a.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.nota && <>{a.nota} • </>}
                    Desde {format(new Date(a.created_at), "dd 'de' MMM. yyyy", { locale: ptBR })}
                  </div>
                </div>
                <button onClick={() => remover(a.id)} className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
