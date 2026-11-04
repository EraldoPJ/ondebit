import Link from "next/link";
import type { Prisma, StatusPedido } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { formatarData } from "@/lib/datas";
import { moeda, somarValores } from "@/lib/dinheiro";
import { STATUS } from "@/lib/status";
import BotaoConfirmar from "@/components/BotaoConfirmar";
import { cancelarPedido, marcarPago, reabrirPedido } from "./actions";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; status?: string; cliente?: string }>;
}) {
  await exigirSessao();
  const { erro, status, cliente } = await searchParams;

  const filtroStatus = status ?? "em-aberto";
  const where: Prisma.PedidoWhereInput = {};

  if (filtroStatus === "em-aberto") {
    where.status = { in: ["ABERTO", "PENDENTE"] };
  } else if (filtroStatus in STATUS) {
    where.status = filtroStatus as StatusPedido;
  }

  const clienteId = Number(cliente);
  if (Number.isInteger(clienteId) && clienteId > 0) where.clienteId = clienteId;

  const [pedidos, clientes] = await Promise.all([
    prisma.pedido.findMany({
      where,
      orderBy: [{ dataPedido: "desc" }, { id: "desc" }],
      take: 200,
      include: {
        cliente: { select: { nome: true } },
        itens: { select: { subtotal: true } },
      },
    }),
    prisma.cliente.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  const totalListado = somarValores(
    pedidos
      .filter((p) => p.status !== "CANCELADO")
      .flatMap((p) => p.itens.map((i) => i.subtotal))
  );

  const campo = "rounded-lg border border-gray-300 px-3 py-2";

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Voltar ao painel
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <Link
            href="/pedidos/novo"
            className="rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700"
          >
            Novo pedido
          </Link>
        </div>

        <form className="flex flex-wrap gap-2">
          <select name="status" defaultValue={filtroStatus} className={campo}>
            <option value="em-aberto">Em aberto (abertos e pendentes)</option>
            <option value="todos">Todos</option>
            <option value="ABERTO">Somente abertos</option>
            <option value="PENDENTE">Somente pendentes</option>
            <option value="FECHADO">Fechados</option>
            <option value="CANCELADO">Cancelados</option>
          </select>
          <select name="cliente" defaultValue={cliente ?? ""} className={campo}>
            <option value="">Todos os clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          <button className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100">
            Filtrar
          </button>
        </form>

        {erro && (
          <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
            {erro}
          </p>
        )}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2">Nº</th>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2">Situação</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
              {pedidos.map((p) => {
                const aberto = p.status === "ABERTO" || p.status === "PENDENTE";
                const rotuloAbrir =
                  p.status === "ABERTO"
                    ? "Editar"
                    : p.status === "PENDENTE"
                      ? "Observação"
                      : "Ver";

                return (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-2">#{p.id}</td>
                    <td className="px-4 py-2">{formatarData(p.dataPedido)}</td>
                    <td className="px-4 py-2">{p.cliente.nome}</td>
                    <td className="px-4 py-2 text-right">
                      {moeda(somarValores(p.itens.map((i) => i.subtotal)))}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 ${STATUS[p.status].classe}`}
                      >
                        {STATUS[p.status].rotulo}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/pedidos/${p.id}/editar`}
                          className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-100"
                        >
                          {rotuloAbrir}
                        </Link>
                        {aberto && (
                          <> 
                            {p.status === "PENDENTE" && (
                              <BotaoConfirmar
                                acao={reabrirPedido.bind(null, p.id)}
                                mensagem={`Reabrir o pedido #${p.id} de ${p.cliente.nome}? Ele volta para "aberto" e pode ser editado de novo.`}
                                rotulo="Reabrir"
                                classe="border-gray-300 text-gray-700 hover:bg-gray-100"
                              />
                            )}
                            <BotaoConfirmar
                              acao={marcarPago.bind(null, p.id)}
                              mensagem={`Marcar o pedido #${p.id} de ${p.cliente.nome} como pago?`}
                              rotulo="Pago"
                              classe="border-green-300 text-green-700 hover:bg-green-50"
                            />
                            <BotaoConfirmar
                              acao={cancelarPedido.bind(null, p.id)}
                              mensagem={`Cancelar o pedido #${p.id} de ${p.cliente.nome}?`}
                              rotulo="Cancelar"
                              classe="border-red-300 text-red-700 hover:bg-red-50"
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-right text-sm text-gray-600">
          Total listado (sem cancelados):{" "}
          <strong className="text-gray-900">{moeda(totalListado)}</strong>
        </p>
      </div>
    </main>
  );
}