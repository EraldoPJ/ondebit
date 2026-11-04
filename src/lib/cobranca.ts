import { formatarData } from "@/lib/datas";
import { moeda, somarValores } from "@/lib/dinheiro";
import { resumoItens, totalDoPedido, type ItemResumo } from "@/lib/relatorio";

// Para mudar o texto de abertura, edite aqui. {CLIENTE} vira o nome do cliente.
export const ABERTURA =
  "Olá, {CLIENTE}, tudo bem? Aqui está a sua continha que está em aberto.";

const LIMITE_CARACTERES = 1500;

type PedidoMensagem = { dataPedido: Date; itens: ItemResumo[] };

export function montarMensagem(
  nomeCliente: string,
  pedidos: PedidoMensagem[]
): string {
  const abertura = ABERTURA.replace("{CLIENTE}", nomeCliente);
  const total = somarValores(pedidos.map((p) => totalDoPedido(p)));

  const montar = (detalhado: boolean) => {
    const linhas = pedidos.map((p) =>
      detalhado
        ? `• ${formatarData(p.dataPedido)} - ${resumoItens(p)}: ${moeda(totalDoPedido(p))}`
        : `• ${formatarData(p.dataPedido)}: ${moeda(totalDoPedido(p))}`
    );
    return [abertura, "", ...linhas, "", `Total: ${moeda(total)}`].join("\n");
  };

  const completa = montar(true);
  return completa.length <= LIMITE_CARACTERES ? completa : montar(false);
}