"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/session";

type Estado = { erro?: string } | undefined;

type Dados = {
  nome: string;
  login: string;
  perfil: "ADMIN" | "OPERADOR";
  senha: string;
};

function lerDados(formData: FormData): Dados {
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    login: String(formData.get("login") ?? "").trim().toLowerCase(),
    perfil: formData.get("perfil") === "ADMIN" ? "ADMIN" : "OPERADOR",
    senha: String(formData.get("senha") ?? ""),
  };
}

function validar(d: Dados, senhaObrigatoria: boolean): string | null {
  if (d.nome.length < 2) return "Informe o nome.";
  if (!/^[a-z0-9._-]{3,}$/.test(d.login)) {
    return "O usuário deve ter ao menos 3 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado.";
  }

  if (senhaObrigatoria || d.senha.length > 0) {
    if (d.senha.length < 10) return "A senha deve ter ao menos 10 caracteres.";
    if (d.senha.length > 72) return "A senha deve ter no máximo 72 caracteres.";
    if (d.senha.toLowerCase().includes(d.login)) {
      return "A senha não pode conter o nome de usuário.";
    }
  }
  return null;
}

async function haOutroAdminAtivo(idIgnorado: number) {
  const total = await prisma.usuario.count({
    where: { perfil: "ADMIN", ativo: true, id: { not: idIgnorado } },
  });
  return total > 0;
}

function voltarComErro(mensagem: string): never {
  redirect("/usuarios?erro=" + encodeURIComponent(mensagem));
}

export async function criarUsuario(
  _estado: Estado,
  formData: FormData
): Promise<Estado> {
  await exigirAdmin();

  const d = lerDados(formData);
  const erro = validar(d, true);
  if (erro) return { erro };

  const existente = await prisma.usuario.findUnique({
    where: { login: d.login },
  });
  if (existente) return { erro: "Já existe um usuário com esse login." };

  await prisma.usuario.create({
    data: {
      nome: d.nome,
      login: d.login,
      perfil: d.perfil,
      senhaHash: await bcrypt.hash(d.senha, 10),
    },
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function atualizarUsuario(
  id: number,
  _estado: Estado,
  formData: FormData
): Promise<Estado> {
  await exigirAdmin();

  const atual = await prisma.usuario.findUnique({ where: { id } });
  if (!atual) return { erro: "Usuário não encontrado." };

  const d = lerDados(formData);
  const erro = validar(d, false);
  if (erro) return { erro };

  const duplicado = await prisma.usuario.findFirst({
    where: { login: d.login, id: { not: id } },
  });
  if (duplicado) return { erro: "Já existe um usuário com esse login." };

  if (
    atual.perfil === "ADMIN" &&
    d.perfil !== "ADMIN" &&
    !(await haOutroAdminAtivo(id))
  ) {
    return { erro: "O sistema precisa de ao menos um administrador ativo." };
  }

  await prisma.usuario.update({
    where: { id },
    data: {
      nome: d.nome,
      login: d.login,
      perfil: d.perfil,
      ...(d.senha ? { senhaHash: await bcrypt.hash(d.senha, 10) } : {}),
    },
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function alternarAtivo(id: number) {
  const sessao = await exigirAdmin();

  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) redirect("/usuarios");

  if (usuario.ativo) {
    if (usuario.id === sessao.usuarioId) {
      redirect(
        "/usuarios?erro=" +
          encodeURIComponent("Você não pode desativar o seu próprio usuário.")
      );
    }
    if (usuario.perfil === "ADMIN" && !(await haOutroAdminAtivo(usuario.id))) {
      redirect(
        "/usuarios?erro=" +
          encodeURIComponent("O sistema precisa de ao menos um administrador ativo.")
      );
    }
  }

  await prisma.usuario.update({
    where: { id },
    data: { ativo: !usuario.ativo },
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function excluirUsuario(id: number) {
  const sessao = await exigirAdmin();

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: { _count: { select: { pedidos: true, envios: true } } },
  });
  if (!usuario) redirect("/usuarios");

  if (usuario.id === sessao.usuarioId) {
    voltarComErro("Você não pode excluir o seu próprio usuário.");
  }

  if (
    usuario.perfil === "ADMIN" &&
    usuario.ativo &&
    !(await haOutroAdminAtivo(usuario.id))
  ) {
    voltarComErro("O sistema precisa de ao menos um administrador ativo.");
  }

  if (usuario._count.pedidos > 0 || usuario._count.envios > 0) {
    voltarComErro(
      `${usuario.nome} já tem pedidos ou cobranças registrados e não pode ser excluído. Desative o usuário em vez de excluir.`
    );
  }

  await prisma.usuario.delete({ where: { id } });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}