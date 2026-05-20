import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Flame } from "lucide-react";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (role === "admin") navigate({ to: "/admin" });
    else if (role === "aluno") navigate({ to: "/aluno" });
    else navigate({ to: "/login" });
  }, [loading, role, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background starfield">
      <Flame className="h-16 w-16 animate-pulse text-primary" fill="currentColor" />
    </div>
  );
}
