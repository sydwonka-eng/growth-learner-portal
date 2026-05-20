import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro-aluno")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Cria conta com senha aleatória (aluno não usa senha)
    const randomPass = crypto.randomUUID() + crypto.randomUUID();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: randomPass,
      options: { data: { nome }, emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    if (data.user) {
      await supabase.from("profiles").update({ nome, telefone, approved: false }).eq("id", data.user.id);
      await supabase.from("user_roles").insert({ user_id: data.user.id, role: "aluno" });
    }
    await supabase.auth.signOut();
    setLoading(false);
    toast.success("Cadastro enviado! Aguarde aprovação do mentor.");
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center starfield px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo size="lg" /></div>
        <Card className="border-border bg-card p-6">
          <h1 className="text-2xl font-bold">Cadastro do Aluno</h1>
          <p className="text-sm text-muted-foreground">Preencha seus dados. O mentor irá aprovar seu acesso.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="telefone">WhatsApp</Label>
              <Input id="telefone" required value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="DDD + número" maxLength={20} />
            </div>
            <Button type="submit" className="w-full bg-flame" disabled={loading}>
              {loading ? "Enviando..." : "Enviar cadastro"}
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              <Link to="/login" className="hover:text-primary">Voltar</Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
