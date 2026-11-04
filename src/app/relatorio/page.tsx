import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { formatarData, paraInputData } from "@/lib/datas";
import { moeda } from "@/lib/dinheiro";
import { STATUS } from "@/lib/status";
import {
  consultarPedidos,
  resumoItens,
  totalDoPedido,
  STATUS_PADRAO,
  LIMITE_RELATORIO,
  type Filtros,
} from "@/lib/relatorio";

export default async function RelatorioPage({
  searchParams,
}: {
  searchParams: Promise<Filtros>;
}) {
  await exigirSessao();
  const sp = await searchParams;

  // A consulta só roda depois que o usuário clica em "Consultar".
  const consultado = sp.status !== undefined;

  const hoje = new Date();
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(hoje.getDate() - 6);

  const clientes = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  const resultado = consultado ? await consultarPedidos(sp) : null;
  const erro = resultado && "erro" in resultado ? resultado.erro : null;
  const pedidos = resultado && "pedidos" in resultado ? resultado.pedidos : null;

  // Totais (cancelados ficam de fora) e resumo por cliente.
  const validos = (pedidos ?? []).filter((p) => p.status !== "CANCELADO");
  const porCliente = new Map<
    number,
    { nome: string; pedidos: number; centavos: number }
  >();
  for (const p of validos) {
    const centavos = Math.round(totalDoPedido(p) * 100);
    const atual = porCliente.get(p.clienteId) ?? {
      nome: p.cliente.nome,
      pedidos: 0,
      centavos: 0,
    };
    atual.pedidos += 1;
    atual.centavos += centavos;
    porCliente.set(p.clienteId, atual);
  }
  const resumo = Array.from(porCliente.values());
  const totalGeral =
    resumo.reduce<number>((soma, c) => soma + c.centavos, 0) / 100;

  const consultaCsv = new URLSearchParams({
    inicio: sp.inicio ?? "",
    fim: sp.fim ?? "",
    cliente: sp.cliente ?? "",
    pedido: sp.pedido ?? "",
    status: sp.status ?? STATUS_PADRAO,
  }).toString();

  const campo = "w-full rounded-lg border border-gray-300 px-3 py-2";
  const rotulo = "text-sm font-medium";

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Voltar ao painel
        </Link>

        <h1 className="text-2xl font-bold">Relatório</h1>

        <form className="bg-white rounded-xl shadow p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div className="space-y-1">
            <label htmlFor="inicio" className={rotulo}>Data início</label>
            <input
              id="inicio"
              name="inicio"
              type="date"
              defaultValue={sp.inicio ?? paraInputData(seteDiasAtras)}
              className={campo}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="fim" className={rotulo}>Data fim</label>
            <input
              id="fim"
              name="fim"
              type="date"
              defaultValue={sp.fim ?? paraInputData(hoje)}
              className={campo}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cliente" className={rotulo}>Cliente</label>
            <select
              id="cliente"
              name="cliente"
              defaultValue={sp.cliente ?? ""}
              className={campo}
            >
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="pedido" className={rotulo}>Nº do pedido</label>
            <input
              id="pedido"
              name="pedido"
              inputMode="numeric"
              placeholder="Ex.: 15"
              defaultValue={sp.pedido ?? ""}
              className={campo}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="status" className={rotulo}>Situação</label>
            <select
              id="status"
              name="status"
              defaultValue={sp.status ?? STATUS_PADRAO}
              className={campo}
            >
              <option value="em-aberto">Em aberto (abertos e pendentes)</option>
              <option value="todos">Todos</option>
              <option value="ABERTO">Somente abertos</option>
              <option value="PENDENTE">Somente pendentes</option>
              <option value="FECHADO">Fechados</option>
              <option value="CANCELADO">Cancelados</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-5 flex gap-2">
            <button className="rounded-lg bg-blue-600 text-white px-5 py-2 font-medium hover:bg-blue-700">
              Consultar
            </button>
            {pedidos && pedidos.length > 0 && (
               <>
                <a
                href={`/relatorio/csv?${consultaCsv}`}
                className="rounded-lg border border-gray-300 px-5 py-2 hover:bg-gray-100"
                >
              Exportar CSV
                </a>
                {validos.some((p) => p.status === "ABERTO" || p.status === "PENDENTE") && (
                  <Link
                  href={`/relatorio/cobranca?${consultaCsv}`}
                  className="rounded-lg bg-green-600 text-white px-5 py-2 font-medium hover:bg-green-700"
                  >
              Mala direta
            </Link>
            )}
            </>
          )}
          </div>
        </form>

        {!consultado && (
          <p className="text-gray-600">
            Defina os filtros e clique em Consultar.
          </p>
        )}

        {erro && (
          <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
            {erro}
          </p>
        )}

        {pedidos && (
          <>
            {pedidos.length >= LIMITE_RELATORIO && (
              <p className="rounded-lg bg-amber-50 text-amber-800 px-4 py-2 text-sm">
                Mostrando os primeiros {LIMITE_RELATORIO} pedidos. Refine os
                filtros para ver o restante.
              </p>
            )}

            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="px-4 py-2">Nº</th>
                    <th className="px-4 py-2">Data</th>
                    <th className="px-4 py-2">Cliente</th>
                    <th className="px-4 py-2">Itens</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2">Situação</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {pedidos.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                        Nenhum pedido encontrado com esses filtros.
                      </td>
                    </tr>
                  )}
                  {pedidos.map((p) => (
                    <tr
                      key={p.id}
                      className={`border-t border-gray-100 ${
                        p.status === "CANCELADO" ? "text-gray-400 line-through" : ""
                      }`}
                    >
                      <td className="px-4 py-2">#{p.id}</td>
                      <td className="px-4 py-2">{formatarData(p.dataPedido)}</td>
                      <td className="px-4 py-2">{p.cliente.nome}</td>
                      <td className="px-4 py-2 max-w-xs">{resumoItens(p)}</td>
                      <td className="px-4 py-2 text-right">
                        {moeda(totalDoPedido(p))}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 no-underline inline-block ${STATUS[p.status].classe}`}
                        >
                          {STATUS[p.status].rotulo}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/pedidos/${p.id}/editar`}
                          className="text-blue-600 hover:underline no-underline"
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {resumo.length > 0 && (
              <div className="bg-white rounded-xl shadow p-4 space-y-3">
                <h2 className="font-semibold">Resumo por cliente (sem cancelados)</h2>
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-600">
                    <tr>
                      <th className="py-1">Cliente</th>
                      <th className="py-1 text-right">Pedidos</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumo.map((c) => (
                      <tr key={c.nome} className="border-t border-gray-100">
                        <td className="py-1">{c.nome}</td>
                        <td className="py-1 text-right">{c.pedidos}</td>
                        <td className="py-1 text-right">{moeda(c.centavos / 100)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-right text-lg font-bold">
                  Total do período: {moeda(totalGeral)}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}