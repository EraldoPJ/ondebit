import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { formatarData } from "@/lib/datas";
import { moeda, somarValores } from "@/lib/dinheiro";
import { linkWhatsapp, formatarTelefone } from "@/lib/telefone";
import { consultarPedidos, totalDoPedido, type Filtros } from "@/lib/relatorio";
import { montarMensagem } from "@/lib/cobranca";
import BotaoWhatsapp from "./BotaoWhatsapp";

export default async function CobrancaPage({
  searchParams,
}: {
  searchParams: Promise<Filtros>;
}) {
  await exigirSessao();
  const sp = await searchParams;

  // A cobrança só considera pedidos abertos e pendentes.
  const status =
    sp.status === "ABERTO" || sp.status === "PENDENTE" ? sp.status : "em-aberto";

  const resultado = await consultarPedidos({ ...sp, status });
  const erro = "erro" in resultado ? resultado.erro : null;
  const pedidos = "pedidos" in resultado ? (resultado.pedidos ?? []) : [];

  type PedidoCobranca = (typeof pedidos)[number];
  type Grupo = { cliente: PedidoCobranca["cliente"]; pedidos: PedidoCobranca[] };

  const grupos = new Map<number, Grupo>();
  for (const p of pedidos) {
    const grupo: Grupo = grupos.get(p.clienteId) ?? { cliente: p.cliente, pedidos: [] };
    grupo.pedidos.push(p);
    grupos.set(p.clienteId, grupo);
  }
  const lista = Array.from(grupos.values());

  const totalGeral = somarValores(pedidos.map((p) => totalDoPedido(p)));

  const voltar =
    "/relatorio?" +
    new URLSearchParams({
      inicio: sp.inicio ?? "",
      fim: sp.fim ?? "",
      cliente: sp.cliente ?? "",
      pedido: sp.pedido ?? "",
      status: sp.status ?? "em-aberto",
    }).toString();

  const envios = await prisma.envioCobranca.findMany({
    orderBy: { criadoEm: "desc" },
    take: 15,
    include: {
      cliente: { select: { nome: true } },
      usuario: { select: { nome: true } },
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Link href={voltar} className="text-sm text-blue-600 hover:underline">
          ← Voltar ao relatório
        </Link>

        <h1 className="text-2xl font-bold">Mala direta</h1>

        <p className="text-sm text-gray-600">
          Um cartão por cliente, com os pedidos abertos e pendentes do relatório.
          Ao clicar em <strong>Enviar no WhatsApp</strong>, a conversa abre com a
          mensagem pronta e os pedidos do cliente passam para{" "}
          <strong>pendente</strong>. Se abrir sem querer, use{" "}
          <strong>Reabrir</strong> na tela de Pedidos.
        </p>

        {erro && (
          <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
            {erro}
          </p>
        )}

        {!erro && lista.length === 0 && (
          <p className="rounded-lg bg-white shadow px-4 py-6 text-center text-gray-600">
            Nenhum pedido aberto ou pendente com esses filtros.
          </p>
        )}

        {lista.map((g) => {
          const total = somarValores(g.pedidos.map((p) => totalDoPedido(p)));
          const mensagem = montarMensagem(g.cliente.nome, g.pedidos);
          const href = linkWhatsapp(g.cliente.telefoneWhatsapp, mensagem);

          const datasEnvio = g.pedidos.flatMap((p) =>
            p.status === "PENDENTE" && p.enviadoEm ? [p.enviadoEm.getTime()] : []
          );
          const ultimoEnvio =
            datasEnvio.length > 0 ? new Date(Math.max(...datasEnvio)) : null;

          const csv =
            "/relatorio/csv?" +
            new URLSearchParams({
              inicio: sp.inicio ?? "",
              fim: sp.fim ?? "",
              cliente: String(g.cliente.id),
              pedido: sp.pedido ?? "",
              status,
            }).toString();

          return (
            <section
              key={g.cliente.id}
              className="bg-white rounded-xl shadow p-4 space-y-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{g.cliente.nome}</h2>
                  <p className="text-sm text-gray-600">
                    {formatarTelefone(g.cliente.telefoneWhatsapp)} ·{" "}
                    {g.pedidos.length}{" "}
                    {g.pedidos.length === 1 ? "pedido" : "pedidos"}
                  </p>
                </div>
                <p className="text-xl font-bold">{moeda(total)}</p>
              </div>

              {ultimoEnvio && (
                <p className="rounded-lg bg-amber-50 text-amber-800 px-3 py-1 text-sm">
                  Já cobrado em {formatarData(ultimoEnvio)}.
                </p>
              )}

              <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm font-sans">
                {mensagem}
              </pre>

              <div className="flex flex-wrap items-start gap-3">
                <BotaoWhatsapp
                  href={href}
                  clienteId={g.cliente.id}
                  pedidoIds={g.pedidos.map((p) => p.id)}
                  reenvio={ultimoEnvio !== null}
                />
                <a
                  href={csv}
                  className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
                >
                  Baixar CSV
                </a>
              </div>
            </section>
          );
        })}

        {lista.length > 0 && (
          <p className="text-right text-lg font-bold">
            {lista.length} {lista.length === 1 ? "cliente" : "clientes"} ·
            Total: {moeda(totalGeral)}
          </p>
        )}

        <section className="bg-white rounded-xl shadow p-4 space-y-3">
          <h2 className="font-semibold">Últimas cobranças registradas</h2>
          {envios.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhuma cobrança registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-600">
                  <tr>
                    <th className="py-1 pr-3">Quando</th>
                    <th className="py-1 pr-3">Cliente</th>
                    <th className="py-1 pr-3">Período dos pedidos</th>
                    <th className="py-1 pr-3 text-right">Valor</th>
                    <th className="py-1">Por</th>
                  </tr>
                </thead>
                <tbody>
                  {envios.map((e) => (
                    <tr key={e.id} className="border-t border-gray-100">
                      <td className="py-1 pr-3">
                        {e.criadoEm.toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="py-1 pr-3">{e.cliente.nome}</td>
                      <td className="py-1 pr-3">
                        {formatarData(e.periodoInicio)} a {formatarData(e.periodoFim)}
                      </td>
                      <td className="py-1 pr-3 text-right">{moeda(e.valorTotal)}</td>
                      <td className="py-1">{e.usuario.nome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}