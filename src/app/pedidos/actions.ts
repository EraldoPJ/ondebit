"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { lerValor } from "@/lib/dinheiro";
import { lerDataInput } from "@/lib/datas";

type Estado = { erro?: string } | undefined;

function voltarComErro(mensagem: string): never {
  redirect("/pedidos?erro=" + encodeURIComponent(mensagem));
}

// Valida o formulário e recalcula os subtotais no servidor.
async function montar(
  formData: FormData,
  atual?: { clienteId: number; produtosIds: Set<number> }
) {
  const clienteId = Number(formData.get("clienteId"));
  const dataPedido = lerDataInput(String(formData.get("data") ?? ""));
  const observacao = String(formData.get("observacao") ?? "").trim() || null;

  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    return { erro: "Escolha o cliente." } as const;
  }
  if (!dataPedido) return { erro: "Informe uma data válida." } as const;

  let brutos: unknown;
  try {
    brutos = JSON.parse(String(formData.get("itens") ?? "[]"));
  } catch {
    brutos = null;
  }
  if (!Array.isArray(brutos) || brutos.length === 0) {
    return { erro: "Adicione ao menos um item." } as const;
  }
  if (brutos.length > 100) {
    return { erro: "Um pedido pode ter no máximo 100 itens." } as const;
  }

  const itens: {
    produtoId: number;
    quantidade: number;
    precoUnitario: string;
    subtotal: string;
  }[] = [];

  for (const bruto of brutos) {
    const produtoId = Number(bruto?.produtoId);
    const quantidade = Number(bruto?.quantidade);
    const preco = lerValor(String(bruto?.preco ?? ""));

    if (!Number.isInteger(produtoId) || produtoId <= 0) {
      return { erro: "Escolha o produto em todos os itens." } as const;
    }
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 9999) {
      return {
        erro: "Quantidade inválida: use números inteiros de 1 a 9999.",
      } as const;
    }
    if (!preco) return { erro: "Preço inválido em um dos itens." } as const;

    const centavos = Math.round(Number(preco) * 100);
    itens.push({
      produtoId,
      quantidade,
      precoUnitario: preco,
      subtotal: ((centavos * quantidade) / 100).toFixed(2),
    });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) return { erro: "Cliente não encontrado." } as const;
  if (!cliente.ativo && cliente.id !== atual?.clienteId) {
    return { erro: "Este cliente está inativo." } as const;
  }

  const ids = [...new Set(itens.map((i) => i.produtoId))];
  const produtos = await prisma.produto.findMany({ where: { id: { in: ids } } });
  if (produtos.length !== ids.length) {
    return { erro: "Produto não encontrado." } as const;
  }
  const inativo = produtos.find((p) => !p.ativo && !atual?.produtosIds.has(p.id));
  if (inativo) {
    return { erro: `O produto "${inativo.nome}" está inativo.` } as const;
  }

  return { dados: { clienteId, dataPedido, observacao, itens } } as const;
}

export async function criarPedido(
  _estado: Estado,
  formData: FormData
): Promise<Estado> {
  const sessao = await exigirSessao();

  const r = await montar(formData);
  if ("erro" in r) return { erro: r.erro };

  const { itens, ...resto } = r.dados;
  await prisma.pedido.create({
    data: { ...resto, usuarioId: sessao.usuarioId, itens: { create: itens } },
  });

  revalidatePath("/pedidos");
  redirect("/pedidos");
}

export async function atualizarPedido(
  id: number,
  _estado: Estado,
  formData: FormData
): Promise<Estado> {
  await exigirSessao();

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { itens: true },
  });
  if (!pedido) return { erro: "Pedido não encontrado." };

  if (pedido.status === "PENDENTE") {
    // Pendente: só a observação pode mudar.
    const observacao = String(formData.get("observacao") ?? "").trim() || null;
    await prisma.pedido.update({ where: { id }, data: { observacao } });
  } else if (pedido.status === "ABERTO") {
    const r = await montar(formData, {
      clienteId: pedido.clienteId,
      produtosIds: new Set(pedido.itens.map((i) => i.produtoId)),
    });
    if ("erro" in r) return { erro: r.erro };

    const { itens, ...resto } = r.dados;
    await prisma.pedido.update({
      where: { id },
      data: { ...resto, itens: { deleteMany: {}, create: itens } },
    });
  } else {
    return { erro: "Este pedido não pode mais ser alterado." };
  }

  revalidatePath("/pedidos");
  redirect("/pedidos");
}

export async function marcarPago(id: number) {
  await exigirSessao();

  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) redirect("/pedidos");

  if (pedido.status !== "ABERTO" && pedido.status !== "PENDENTE") {
    voltarComErro("Só pedidos abertos ou pendentes podem ser marcados como pagos.");
  }

  await prisma.pedido.update({
    where: { id },
    data: { status: "FECHADO", fechadoEm: new Date() },
  });

  revalidatePath("/pedidos");
  redirect("/pedidos");
}

export async function cancelarPedido(id: number) {
  await exigirSessao();

  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) redirect("/pedidos");

  if (pedido.status !== "ABERTO" && pedido.status !== "PENDENTE") {
    voltarComErro("Só pedidos abertos ou pendentes podem ser cancelados.");
  }

  await prisma.pedido.update({ where: { id }, data: { status: "CANCELADO" } });

  revalidatePath("/pedidos");
  redirect("/pedidos");
}

export async function reabrirPedido(id: number) {
  await exigirSessao();

  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) redirect("/pedidos");

  if (pedido.status !== "PENDENTE") {
    voltarComErro("Só pedidos pendentes podem ser reabertos.");
  }

  await prisma.pedido.update({
    where: { id },
    data: { status: "ABERTO", enviadoEm: null, envioId: null },
  });

  revalidatePath("/pedidos");
  redirect("/pedidos");
}