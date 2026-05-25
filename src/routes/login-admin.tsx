import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login-admin")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    const uid = signIn.user?.id;
    if (uid) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const isAdmin = roles?.some((r) => r.role === "admin");
      if (!isAdmin) {
        const { error: rpcErr } = await supabase.rpc("claim_admin");
        if (rpcErr) {
          setLoading(false);
          toast.error("Erro ao ativar admin: " + rpcErr.message);
          return;
        }
      } else {
        await supabase.from("profiles").update({ approved: true }).eq("id", uid);
      }
    }
    setLoading(false);
    toast.success("Bem-vindo!");
    navigate({ to: "/admin" });
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div className="flex min-h-screen items-center justify-center starfield px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo size="lg" /></div>
        <Card className="border-border bg-card p-6">
          <h1 className="text-2xl font-bold">Acesso do Mentor</h1>
          <p className="text-sm text-muted-foreground">Entre com email e senha.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-flame" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="flex justify-between text-xs text-muted-foreground">
              <Link to="/cadastro-admin" className="hover:text-primary">Criar conta</Link>
              <Link to="/login" className="hover:text-primary">Voltar</Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
