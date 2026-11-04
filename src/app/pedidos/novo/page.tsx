import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { paraInputData } from "@/lib/datas";
import { valorParaCampo } from "@/lib/dinheiro";
import { criarPedido } from "../actions";
import FormPedido from "../FormPedido";

export default async function NovoPedido() {
  await exigirSessao();

  const [clientes, produtos] = await Promise.all([
    prisma.cliente.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.produto.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, precoPadrao: true },
    }),
  ]);

  return (
    <FormPedido
      titulo="Novo pedido"
      acao={criarPedido}
      clientes={clientes}
      produtos={produtos.map((p) => ({
        id: p.id,
        nome: p.nome,
        preco: valorParaCampo(p.precoPadrao),
      }))}
      dataInicial={paraInputData(new Date())}
    />
  );
}