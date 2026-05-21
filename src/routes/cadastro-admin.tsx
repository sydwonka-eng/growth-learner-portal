import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro-admin")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const redirectUrl = `${window.location.origin}/admin`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl, data: { nome } },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    // Garante sessão (caso auto-confirm esteja ligado já vem logado; senão tenta login)
    let session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      const { data: signIn } = await supabase.auth.signInWithPassword({ email, password });
      session = signIn.session;
    }
    if (session) {
      await supabase.from("profiles").update({ nome }).eq("id", session.user.id);
      const { error: rpcErr } = await supabase.rpc("claim_admin");
      if (rpcErr) {
        setLoading(false);
        toast.error("Erro ao ativar admin: " + rpcErr.message);
        return;
      }
    } else {
      setLoading(false);
      toast.info("Confirme seu email e faça login para ativar.");
      navigate({ to: "/login-admin" });
      return;
    }
    setLoading(false);
    toast.success("Conta criada!");
    navigate({ to: "/admin" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center starfield px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo size="lg" /></div>
        <Card className="border-border bg-card p-6">
          <h1 className="text-2xl font-bold">Cadastro de Mentor</h1>
          <p className="text-sm text-muted-foreground">Crie sua conta administrativa.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-flame" disabled={loading}>
              {loading ? "Criando..." : "Criar conta"}
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
