// "12,50", "R$ 12,50", "1.234,50" ou "12.5" -> "12.50" (string aceita pelo banco)
export function lerValor(entrada: string): string | null {
  let t = entrada.replace(/R\$|\s/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Number(t) > 0 ? t : null;
}

export function moeda(valor: { toString(): string } | number): string {
  return Number(valor.toString()).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Para preencher o campo de edição: 12.5 -> "12,50"
export function valorParaCampo(valor: { toString(): string } | number): string {
  return Number(valor.toString()).toFixed(2).replace(".", ",");
}

// Soma valores em centavos, sem erro de arredondamento.
export function somarValores(valores: { toString(): string }[]): number {
  const centavos = valores.reduce<number>(
    (soma, v) => soma + Math.round(Number(v.toString()) * 100),
    0
  );
  return centavos / 100;
}
