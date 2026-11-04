import type { StatusPedido } from "@prisma/client";

export const STATUS: Record<StatusPedido, { rotulo: string; classe: string }> = {
  ABERTO: { rotulo: "Aberto", classe: "bg-blue-100 text-blue-800" },
  PENDENTE: { rotulo: "Pendente", classe: "bg-amber-100 text-amber-800" },
  FECHADO: { rotulo: "Fechado", classe: "bg-green-100 text-green-800" },
  CANCELADO: { rotulo: "Cancelado", classe: "bg-gray-200 text-gray-700" },
};