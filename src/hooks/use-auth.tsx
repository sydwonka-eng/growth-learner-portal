import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "admin" | "aluno";
export interface Profile {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  turma_id: string | null;
  approved: boolean;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

async function loadExtras(userId: string) {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  const role = (roles?.[0]?.role as AppRole | undefined) ?? null;
  return { profile: (profile as Profile | null) ?? null, role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const apply = async (s: Session | null) => {
    setLoading(true);
    setSession(s);
    setUser(s?.user ?? null);
    if (s?.user) {
      try {
        const { profile, role } = await loadExtras(s.user.id);
        setProfile(profile);
        setRole(role);
      } catch (error) {
        console.error("Erro ao carregar perfil e papel do usuário", error);
        setProfile(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    } else {
      setProfile(null);
      setRole(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setLoading(true);
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => {
          loadExtras(s.user.id)
            .then(({ profile, role }) => {
              setProfile(profile);
              setRole(role);
            })
            .catch((error) => {
              console.error("Erro ao atualizar perfil e papel do usuário", error);
              setProfile(null);
              setRole(null);
            })
            .finally(() => {
              setLoading(false);
            });
        }, 0);
      } else {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      void apply(data.session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const value: AuthCtx = {
    user,
    session,
    profile,
    role,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refresh: async () => {
      if (user) {
        const { profile, role } = await loadExtras(user.id);
        setProfile(profile);
        setRole(role);
      }
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
