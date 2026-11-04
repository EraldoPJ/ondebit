"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { criarSessao, encerrarSessao } from "@/lib/session";

const JANELA_MS = 15 * 60 * 1000;
const MAX_POR_LOGIN = 5;
const MAX_POR_IP = 30;
const prismaTentativaLogin = prisma as any;

// Hash de mentira, usado quando o usuário não existe, para a resposta demorar
// o mesmo tempo e não revelar quais logins existem.
const HASH_FALSO = bcrypt.hashSync("senha-falsa-para-igualar-o-tempo", 10);

async function obterIp(): Promise<string> {
  const h = await headers();
  const encaminhado = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (encaminhado || h.get("x-real-ip") || "desconhecido").slice(0, 64);
}

export async function entrar(
  _estado: { erro?: string } | undefined,
  formData: FormData
) {
  const login = String(formData.get("login") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 100);
  const senha = String(formData.get("senha") ?? "").slice(0, 200);
  const ip = await obterIp();
  const desde = new Date(Date.now() - JANELA_MS);

  const [porLogin, porIp] = await Promise.all([
    prismaTentativaLogin.tentativaLogin.count({
      where: { login, criadoEm: { gte: desde } },
    }),
    prismaTentativaLogin.tentativaLogin.count({
      where: { ip, criadoEm: { gte: desde } },
    }),
  ]);

  if (porLogin >= MAX_POR_LOGIN || porIp >= MAX_POR_IP) {
    return { erro: "Muitas tentativas. Aguarde 15 minutos e tente de novo." };
  }

  const usuario = await prisma.usuario.findUnique({ where: { login } });
  const senhaCorreta = await bcrypt.compare(
    senha,
    usuario?.senhaHash ?? HASH_FALSO
  );

  if (!usuario || !usuario.ativo || !senhaCorreta) {
    await prismaTentativaLogin.tentativaLogin.create({ data: { login, ip } });
    // Limpeza: apaga registros com mais de 24 horas.
    await prismaTentativaLogin.tentativaLogin.deleteMany({
      where: { criadoEm: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
    return { erro: "Usuário ou senha inválidos." };
  }

  await prismaTentativaLogin.tentativaLogin.deleteMany({ where: { login } });

  await criarSessao({
    usuarioId: usuario.id,
    nome: usuario.nome,
    perfil: usuario.perfil,
  });
  redirect("/");
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}