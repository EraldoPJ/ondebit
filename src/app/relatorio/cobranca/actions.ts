"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { somarValores } from "@/lib/dinheiro";

export async function registrarEnvio(
  clienteId: number,
  pedidoIds: number[]
): Promise<{ erro?: string }> {
  const sessao = await exigirSessao();

  if (
    !Number.isInteger(clienteId) ||
    !Array.isArray(pedidoIds) ||
    pedidoIds.length === 0 ||
    pedidoIds.some((id) => !Number.isInteger(id))
  ) {
    return { erro: "Dados inválidos." };
  }

  // Só entram pedidos deste cliente que ainda estão abertos ou pendentes.
  const pedidos = await prisma.pedido.findMany({
    where: {
      id: { in: pedidoIds },
      clienteId,
      status: { in: ["ABERTO", "PENDENTE"] },
    },
    include: { itens: { select: { subtotal: true } } },
  });

  if (pedidos.length === 0) {
    return { erro: "Nenhum pedido em aberto encontrado para este cliente." };
  }

  const valorTotal = somarValores(
    pedidos.flatMap((p) => p.itens.map((i) => i.subtotal))
  );
  const datas = pedidos.map((p) => p.dataPedido.getTime());
  const agora = new Date();

  await prisma.$transaction(async (tx) => {
    const envio = await tx.envioCobranca.create({
      data: {
        clienteId,
        usuarioId: sessao.usuarioId,
        periodoInicio: new Date(Math.min(...datas)),
        periodoFim: new Date(Math.max(...datas)),
        valorTotal: valorTotal.toFixed(2),
      },
    });

    await tx.pedido.updateMany({
      where: { id: { in: pedidos.map((p) => p.id) } },
      data: { status: "PENDENTE", enviadoEm: agora, envioId: envio.id },
    });
  });

  revalidatePath("/relatorio/cobranca");
  revalidatePath("/pedidos");
  return {};
}