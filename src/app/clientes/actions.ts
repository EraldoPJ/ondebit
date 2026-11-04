"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { normalizarTelefone } from "@/lib/telefone";

type Estado = { erro?: string } | undefined;

function voltarComErro(mensagem: string): never {
  redirect("/clientes?erro=" + encodeURIComponent(mensagem));
}

function preparar(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefoneWhatsapp = normalizarTelefone(
    String(formData.get("telefone") ?? "")
  );
  const observacao = String(formData.get("observacao") ?? "").trim() || null;

  if (nome.length < 2) return { erro: "Informe o nome." } as const;
  if (!telefoneWhatsapp) {
    return {
      erro: "Telefone inválido. Informe DDD e número, ex.: (47) 99999-9999.",
    } as const;
  }
  return { dados: { nome, telefoneWhatsapp, observacao } } as const;
}

export async function criarCliente(
  _estado: Estado,
  formData: FormData
): Promise<Estado> {
  await exigirSessao();

  const r = preparar(formData);
  if ("erro" in r) return { erro: r.erro };

  await prisma.cliente.create({ data: r.dados });

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function atualizarCliente(
  id: number,
  _estado: Estado,
  formData: FormData
): Promise<Estado> {
  await exigirSessao();

  const existe = await prisma.cliente.findUnique({ where: { id } });
  if (!existe) return { erro: "Cliente não encontrado." };

  const r = preparar(formData);
  if ("erro" in r) return { erro: r.erro };

  await prisma.cliente.update({ where: { id }, data: r.dados });

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function alternarAtivoCliente(id: number) {
  await exigirSessao();

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) redirect("/clientes");

  await prisma.cliente.update({
    where: { id },
    data: { ativo: !cliente.ativo },
  });

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function excluirCliente(id: number) {
  await exigirSessao();

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { _count: { select: { pedidos: true, envios: true } } },
  });
  if (!cliente) redirect("/clientes");

  if (cliente._count.pedidos > 0 || cliente._count.envios > 0) {
    voltarComErro(
      `${cliente.nome} já tem pedidos ou cobranças registrados e não pode ser excluído. Desative o cliente em vez de excluir.`
    );
  }

  await prisma.cliente.delete({ where: { id } });

  revalidatePath("/clientes");
  redirect("/clientes");
}