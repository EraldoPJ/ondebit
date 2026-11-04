function dois(n: number) {
  return String(n).padStart(2, "0");
}

// Date -> "2026-11-02" (para o campo de data)
export function paraInputData(d: Date): string {
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

// "2026-11-02" -> Date (ao meio-dia, para evitar problemas de fuso)
export function lerDataInput(texto: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
  const d = new Date(`${texto}T12:00:00`);
  if (isNaN(d.getTime())) return null;
  return paraInputData(d) === texto ? d : null; // recusa datas como 31/02
}

export function formatarData(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

export function inicioDoDia(texto: string): Date | null {
  const d = lerDataInput(texto);
  if (!d) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

export function fimDoDia(texto: string): Date | null {
  const d = lerDataInput(texto);
  if (!d) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}