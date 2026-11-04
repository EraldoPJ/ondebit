"use client";

import Link from "next/link";
import { useActionState } from "react";

type Estado = { erro?: string } | undefined;

type Props = {
  titulo: string;
  acao: (estado: Estado, formData: FormData) => Promise<Estado>;
  cliente?: { nome: string; telefone: string; observacao: string };
};

const campo = "w-full rounded-lg border border-gray-300 px-3 py-2";

export default function FormCliente({ titulo, acao, cliente }: Props) {
  const [estado, enviar, pendente] = useActionState(acao, undefined);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <form
        action={enviar}
        className="max-w-md mx-auto bg-white rounded-xl shadow p-6 space-y-4"
      >
        <h1 className="text-xl font-bold">{titulo}</h1>

        <div className="space-y-1">
          <label htmlFor="nome" className="text-sm font-medium">Nome</label>
          <input
            id="nome"
            name="nome"
            required
            autoFocus
            defaultValue={cliente?.nome}
            className={campo}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="telefone" className="text-sm font-medium">WhatsApp</label>
          <input
            id="telefone"
            name="telefone"
            required
            inputMode="tel"
            placeholder="(47) 99999-9999"
            defaultValue={cliente?.telefone}
            className={campo}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="observacao" className="text-sm font-medium">
            Observação (opcional)
          </label>
          <textarea
            id="observacao"
            name="observacao"
            rows={3}
            defaultValue={cliente?.observacao}
            className={campo}
          />
        </div>

        {estado?.erro && <p className="text-sm text-red-600">{estado.erro}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pendente}
            className="flex-1 rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {pendente ? "Salvando..." : "Salvar"}
          </button>
          <Link
            href="/clientes"
            className="flex-1 text-center rounded-lg border border-gray-300 py-2 hover:bg-gray-100"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}