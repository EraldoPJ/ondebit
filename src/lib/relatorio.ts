import type { Prisma, StatusPedido } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { inicioDoDia, fimDoDia } from "@/lib/datas";
import { somarValores } from "@/lib/dinheiro";
import { STATUS } from "@/lib/status";

export type Filtros = {
  inicio?: string;
  fim?: string;
  cliente?: string;
  pedido?: string;
  status?: string;
};

export const STATUS_PADRAO = "em-aberto";
export const LIMITE_RELATORIO = 1000;

export async function consultarPedidos(f: Filtros) {
  const inicio = f.inicio ? inicioDoDia(f.inicio) : null;
  const fim = f.fim ? fimDoDia(f.fim) : null;

  if (f.inicio && !inicio) return { erro: "Data inicial inválida." } as const;
  if (f.fim && !fim) return { erro: "Data final inválida." } as const;
  if (inicio && fim && inicio > fim) {
    return { erro: "A data inicial não pode ser maior que a final." } as const;
  }

  const where: Prisma.PedidoWhereInput = {};

  if (inicio || fim) {
    where.dataPedido = {
      ...(inicio ? { gte: inicio } : {}),
      ...(fim ? { lte: fim } : {}),
    };
  }

  const status = f.status ?? STATUS_PADRAO;
  if (status === "em-aberto") {
    where.status = { in: ["ABERTO", "PENDENTE"] };
  } else if (Object.keys(STATUS).includes(status)) {
    where.status = status as StatusPedido;
  }

  const clienteId = Number(f.cliente);
  if (Number.isInteger(clienteId) && clienteId > 0) where.clienteId = clienteId;

  const textoPedido = f.pedido?.trim().replace(/^#/, "");
  if (textoPedido) {
    const numero = Number(textoPedido);
    if (!Number.isInteger(numero) || numero <= 0) {
      return { erro: "Número de pedido inválido." } as const;
    }
    where.id = numero;
  }

  const pedidos = await prisma.pedido.findMany({
    where,
    orderBy: [{ cliente: { nome: "asc" } }, { dataPedido: "asc" }, { id: "asc" }],
    take: LIMITE_RELATORIO,
    include: {
      cliente: { select: { id: true, nome: true, telefoneWhatsapp: true } },
      itens: {
        orderBy: { id: "asc" },
        include: { produto: { select: { nome: true } } },
      },
    },
  });

  return { pedidos } as const;
}

export type ItemResumo = {
  quantidade: number;
  subtotal: { toString(): string };
  produto: { nome: string };
};

export function totalDoPedido(pedido: { itens: ItemResumo[] }): number {
  return somarValores(pedido.itens.map((i) => i.subtotal));
}

// "2x Coca-Cola, 1x Pão"
export function resumoItens(pedido: { itens: ItemResumo[] }): string {
  return pedido.itens.map((i) => `${i.quantidade}x ${i.produto.nome}`).join(", ");
}