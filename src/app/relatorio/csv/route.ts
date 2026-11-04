import { exigirSessao } from "@/lib/session";
import { formatarData, paraInputData } from "@/lib/datas";
import { valorParaCampo } from "@/lib/dinheiro";
import { formatarTelefone } from "@/lib/telefone";
import { STATUS } from "@/lib/status";
import { consultarPedidos, resumoItens, totalDoPedido } from "@/lib/relatorio";

// Aspas duplas em volta de cada campo; evita que o Excel execute "fórmulas"
// caso um texto comece com =, +, - ou @.
function celula(valor: string | number): string {
  let texto = String(valor);
  if (/^[=+\-@]/.test(texto)) texto = "'" + texto;
  return `"${texto.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  await exigirSessao();

  const { searchParams } = new URL(request.url);
  const resultado = await consultarPedidos({
    inicio: searchParams.get("inicio") ?? undefined,
    fim: searchParams.get("fim") ?? undefined,
    cliente: searchParams.get("cliente") ?? undefined,
    pedido: searchParams.get("pedido") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  if ("erro" in resultado) {
    return new Response(resultado.erro, { status: 400 });
  }

  const linhas = [
    ["Pedido", "Data", "Cliente", "WhatsApp", "Situação", "Itens", "Total"]
      .map(celula)
      .join(";"),
  ];

  for (const p of resultado.pedidos) {
    linhas.push(
      [
        p.id,
        formatarData(p.dataPedido),
        p.cliente.nome,
        formatarTelefone(p.cliente.telefoneWhatsapp),
        STATUS[p.status].rotulo,
        resumoItens(p),
        valorParaCampo(totalDoPedido(p)),
      ]
        .map(celula)
        .join(";")
    );
  }

  // O "\uFEFF" no início faz o Excel reconhecer os acentos corretamente.
  const csv = "\uFEFF" + linhas.join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-ondebit-${paraInputData(new Date())}.csv"`,
    },
  });
}