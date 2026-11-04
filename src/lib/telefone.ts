// Aceita qualquer formato brasileiro e devolve 55 + DDD + número (só dígitos).
export function normalizarTelefone(entrada: string): string | null {
  const d = entrada.replace(/\D/g, "").replace(/^0+/, "");

  let completo: string | null = null;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) {
    completo = d;
  } else if (d.length === 10 || d.length === 11) {
    completo = "55" + d;
  }
  if (!completo) return null;

  return Number(completo.slice(2, 4)) >= 11 ? completo : null;
}

// 5547999999999 -> (47) 99999-9999
export function formatarTelefone(telefone: string): string {
  const nacional = telefone.startsWith("55") ? telefone.slice(2) : telefone;
  const ddd = nacional.slice(0, 2);
  const resto = nacional.slice(2);
  const corte = resto.length - 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

// Será usado na etapa da cobrança.
export function linkWhatsapp(telefone: string, mensagem?: string): string {
  const base = `https://wa.me/${telefone}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}