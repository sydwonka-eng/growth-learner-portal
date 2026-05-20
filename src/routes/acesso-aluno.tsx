import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { loginAlunoByEmail } from "@/lib/aluno-auth.functions";

export const Route = createFileRoute("/acesso-aluno")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const loginFn = useServerFn(loginAlunoByEmail);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token_hash } = await loginFn({ data: { email } });
      const { error } = await supabase.auth.verifyOtp({ token_hash, type: "magiclink" });
      if (error) throw error;
      toast.success("Acesso liberado!");
      navigate({ to: "/aluno" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao acessar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center starfield px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo size="lg" /></div>
        <Card className="border-border bg-card p-6">
          <h1 className="text-2xl font-bold">Acesso do Aluno</h1>
          <p className="text-sm text-muted-foreground">Digite seu email cadastrado e aprovado pelo mentor.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-flame" disabled={loading}>
              {loading ? "Entrando..." : "Liberar acesso"}
            </Button>
            <div className="flex justify-between text-xs text-muted-foreground">
              <Link to="/cadastro-aluno" className="hover:text-primary">Sou novo</Link>
              <Link to="/login" className="hover:text-primary">Voltar</Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
