"use client";

import Link from "next/link";
import { useActionState } from "react";

type Estado = { erro?: string } | undefined;

type Props = {
  titulo: string;
  acao: (estado: Estado, formData: FormData) => Promise<Estado>;
  produto?: { nome: string; preco: string };
};

const campo = "w-full rounded-lg border border-gray-300 px-3 py-2";

export default function FormProduto({ titulo, acao, produto }: Props) {
  const [estado, enviar, pendente] = useActionState(acao, undefined);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <form
        action={enviar}
        className="max-w-md mx-auto bg-white rounded-xl shadow p-6 space-y-4"
      >
        <h1 className="text-xl font-bold">{titulo}</h1>

        <div className="space-y-1">
          <label htmlFor="nome" className="text-sm font-medium">Produto</label>
          <input
            id="nome"
            name="nome"
            required
            autoFocus
            defaultValue={produto?.nome}
            className={campo}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="preco" className="text-sm font-medium">Preço (R$)</label>
          <input
            id="preco"
            name="preco"
            required
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={produto?.preco}
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
            href="/produtos"
            className="flex-1 text-center rounded-lg border border-gray-300 py-2 hover:bg-gray-100"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}