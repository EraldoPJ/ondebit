"use client";

import { useState } from "react";
import { registrarEnvio } from "./actions";

type Props = {
  href: string;
  clienteId: number;
  pedidoIds: number[];
  reenvio: boolean;
};

type Estado = "parado" | "registrando" | "ok" | { erro: string };

export default function BotaoWhatsapp({
  href,
  clienteId,
  pedidoIds,
  reenvio,
}: Props) {
  const [estado, setEstado] = useState<Estado>("parado");

  async function aoClicar(e: React.MouseEvent<HTMLAnchorElement>) {
    if (estado === "registrando") {
      e.preventDefault(); // evita abrir duas abas em cliques repetidos
      return;
    }
    setEstado("registrando");
    try {
      const r = await registrarEnvio(clienteId, pedidoIds);
      setEstado(r.erro ? { erro: r.erro } : "ok");
    } catch {
      setEstado({ erro: "Não foi possível registrar o envio." });
    }
  }

  return (
    <div className="space-y-1">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={aoClicar}
        className="inline-block rounded-lg bg-green-600 text-white px-4 py-2 font-medium hover:bg-green-700"
      >
        {reenvio || estado === "ok" ? "Reenviar no WhatsApp" : "Enviar no WhatsApp"}
      </a>
      {estado === "ok" && (
        <p className="text-sm text-green-700">
          Cobrança registrada: pedidos marcados como pendentes.
        </p>
      )}
      {typeof estado === "object" && (
        <p className="text-sm text-red-600">{estado.erro}</p>
      )}
    </div>
  );
}