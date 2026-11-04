import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { paraInputData } from "@/lib/datas";
import { valorParaCampo } from "@/lib/dinheiro";
import { STATUS } from "@/lib/status";
import { atualizarPedido } from "../../actions";
import FormPedido from "../../FormPedido";

export default async function EditarPedido({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirSessao();
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero)) notFound();

  const pedido = await prisma.pedido.findUnique({
    where: { id: numero },
    include: { itens: { orderBy: { id: "asc" } } },
  });
  if (!pedido) notFound();

  const idsProdutos = pedido.itens.map((i) => i.produtoId);

  const [clientes, produtos] = await Promise.all([
    prisma.cliente.findMany({
      where: { OR: [{ ativo: true }, { id: pedido.clienteId }] },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.produto.findMany({
      where: { OR: [{ ativo: true }, { id: { in: idsProdutos } }] },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, precoPadrao: true },
    }),
  ]);

  const modo =
    pedido.status === "ABERTO"
      ? "completo"
      : pedido.status === "PENDENTE"
        ? "observacao"
        : "leitura";

  const aviso =
    modo === "observacao"
      ? "Pedido pendente: só a observação pode ser alterada (use-a para anotar, por exemplo, um pagamento parcial)."
      : modo === "leitura"
        ? `Pedido ${STATUS[pedido.status].rotulo.toLowerCase()}: somente consulta.`
        : undefined;

  return (
    <FormPedido
      titulo={`Pedido #${pedido.id} (${STATUS[pedido.status].rotulo})`}
      aviso={aviso}
      modo={modo}
      acao={atualizarPedido.bind(null, pedido.id)}
      clientes={clientes}
      produtos={produtos.map((p) => ({
        id: p.id,
        nome: p.nome,
        preco: valorParaCampo(p.precoPadrao),
      }))}
      dataInicial={paraInputData(new Date())}
      pedido={{
        clienteId: pedido.clienteId,
        data: paraInputData(pedido.dataPedido),
        observacao: pedido.observacao ?? "",
        itens: pedido.itens.map((i) => ({
          produtoId: i.produtoId,
          quantidade: i.quantidade,
          preco: valorParaCampo(i.precoUnitario),
        })),
      }}
    />
  );
}