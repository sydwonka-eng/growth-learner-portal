import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const loginAlunoByEmail = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(input),
  )
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase();

    // Buscar profile aprovado
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, approved")
      .eq("email", email)
      .maybeSingle();

    if (pErr) throw new Error("Erro ao consultar cadastro");
    if (!profile) throw new Error("Email não cadastrado. Faça seu cadastro primeiro.");
    if (!profile.approved)
      throw new Error("Seu cadastro ainda não foi aprovado pelo mentor.");

    // Verificar role aluno
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id);
    const isAluno = roles?.some((r) => r.role === "aluno");
    if (!isAluno) throw new Error("Este email não está cadastrado como aluno.");

    // Gerar magic link
    const { data: link, error: lErr } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
    if (lErr || !link?.properties?.hashed_token)
      throw new Error("Não foi possível gerar acesso. Tente novamente.");

    return { token_hash: link.properties.hashed_token };
  });
