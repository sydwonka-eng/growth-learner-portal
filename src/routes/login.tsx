import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (role === "admin") navigate({ to: "/admin" });
    if (role === "aluno") navigate({ to: "/aluno" });
  }, [role, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center starfield px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-3 text-sm text-muted-foreground">Escolha como deseja entrar</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="group cursor-pointer border-border bg-card p-6 transition-all hover:border-primary hover:glow">
            <Shield className="mb-3 h-10 w-10 text-primary" />
            <h2 className="text-xl font-semibold">Sou Mentor</h2>
            <p className="mt-1 text-sm text-muted-foreground">Acesso admin com email e senha.</p>
            <div className="mt-5 flex flex-col gap-2">
              <Button asChild className="bg-flame">
                <Link to="/login-admin">Entrar como mentor</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/cadastro-admin">Criar conta de mentor</Link>
              </Button>
            </div>
          </Card>
          <Card className="group cursor-pointer border-border bg-card p-6 transition-all hover:border-primary hover:glow">
            <GraduationCap className="mb-3 h-10 w-10 text-primary" />
            <h2 className="text-xl font-semibold">Sou Aluno</h2>
            <p className="mt-1 text-sm text-muted-foreground">Acesse apenas com seu email.</p>
            <div className="mt-5 flex flex-col gap-2">
              <Button asChild className="bg-flame">
                <Link to="/acesso-aluno">Entrar como aluno</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/cadastro-aluno">Cadastrar-se</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
