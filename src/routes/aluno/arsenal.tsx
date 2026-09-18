import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/aluno/arsenal")({ component: Page });

interface Ferramenta {
  id: string;
  titulo: string;
  descricao: string | null;
  link: string | null;
  capa_url: string | null;
}

function Page() {
  const { data: itens = [] } = useQuery({
    queryKey: ["arsenal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arsenal")
        .select("id, titulo, descricao, link, capa_url")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Ferramenta[];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Seu" highlight="Arsenal" subtitle="Ferramentas liberadas pelo mentor." />

      {itens.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma ferramenta disponível ainda.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itens.map((f) => {
            const inner = (
              <Card className="group h-full overflow-hidden border-border bg-card transition-transform hover:-translate-y-1">
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
                  {f.descricao && <p className="text-sm text-muted-foreground">{f.descricao}</p>}
                  {f.link && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      <ExternalLink className="h-3 w-3" /> Acessar ferramenta
                    </span>
                  )}
                </div>
              </Card>
            );
            return f.link ? (
              <a key={f.id} href={f.link} target="_blank" rel="noopener noreferrer">{inner}</a>
            ) : (
              <div key={f.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
