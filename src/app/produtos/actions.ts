"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { lerValor } from "@/lib/dinheiro";

type Estado = { erro?: string } | undefined;

function voltarComErro(mensagem: string): never {
  redirect("/produtos?erro=" + encodeURIComponent(mensagem));
}

function preparar(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const precoPadrao = lerValor(String(formData.get("preco") ?? ""));

  if (nome.length < 2) return { erro: "Informe o nome do produto." } as const;
  if (!precoPadrao) {
    return {
      erro: "Preço inválido. Informe um valor maior que zero, ex.: 12,50.",
    } as const;
  }
  return { dados: { nome, precoPadrao } } as const;
}

export async function criarProduto(
  _estado: Estado,
  formData: FormData
): Promise<Estado> {
  await exigirSessao();

  const r = preparar(formData);
  if ("erro" in r) return { erro: r.erro };

  await prisma.produto.create({ data: r.dados });

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function atualizarProduto(
  id: number,
  _estado: Estado,
  formData: FormData
): Promise<Estado> {
  await exigirSessao();

  const existe = await prisma.produto.findUnique({ where: { id } });
  if (!existe) return { erro: "Produto não encontrado." };

  const r = preparar(formData);
  if ("erro" in r) return { erro: r.erro };

  await prisma.produto.update({ where: { id }, data: r.dados });

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function alternarAtivoProduto(id: number) {
  await exigirSessao();

  const produto = await prisma.produto.findUnique({ where: { id } });
  if (!produto) redirect("/produtos");

  await prisma.produto.update({
    where: { id },
    data: { ativo: !produto.ativo },
  });

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function excluirProduto(id: number) {
  await exigirSessao();

  const produto = await prisma.produto.findUnique({
    where: { id },
    include: { _count: { select: { itens: true } } },
  });
  if (!produto) redirect("/produtos");

  if (produto._count.itens > 0) {
    voltarComErro(
      `${produto.nome} já foi usado em pedidos e não pode ser excluído. Desative o produto em vez de excluir.`
    );
  }

  await prisma.produto.delete({ where: { id } });

  revalidatePath("/produtos");
  redirect("/produtos");
}