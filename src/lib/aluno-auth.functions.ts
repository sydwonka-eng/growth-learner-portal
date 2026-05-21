import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const loginAlunoByEmail = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(input),
  )
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase();

    // Buscar profile
    let { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, approved")
      .eq("email", email)
      .maybeSingle();

    // Se não existe profile, checar acesso vitalício
    if (!profile) {
      const { data: vit } = await supabaseAdmin
        .from("acessos_vitalicios")
        .select("email, nome, telefone, turma_id")
        .ilike("email", email)
        .maybeSingle();

      if (!vit) throw new Error("Email não cadastrado. Solicite acesso ao mentor.");

      // Criar usuário no auth + profile + role aluno
      const { data: created, error: cErr } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { nome: vit.nome ?? email },
        });
      if (cErr || !created?.user) throw new Error("Erro ao criar acesso do aluno.");

      const uid = created.user.id;
      await supabaseAdmin.from("profiles").upsert({
        id: uid,
        email,
        nome: vit.nome ?? email,
        telefone: vit.telefone,
        turma_id: vit.turma_id,
        approved: true,
      });
      await supabaseAdmin.from("user_roles").upsert({ user_id: uid, role: "aluno" });
      profile = { id: uid, approved: true };
    }

    if (!profile.approved)
      throw new Error("Seu cadastro ainda não foi aprovado pelo mentor.");

    // Garantir role aluno
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id);
    const isAluno = roles?.some((r) => r.role === "aluno");
    if (!isAluno) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: profile.id, role: "aluno" });
    }

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
