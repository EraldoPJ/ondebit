"use client";

import { useActionState } from "react";
import { entrar } from "./actions";

export default function LoginPage() {
  const [estado, acao, pendente] = useActionState(entrar, undefined);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4">
      <form
        action={acao}
        className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">Ondebit</h1>

        <div className="space-y-1">
          <label htmlFor="login" className="text-sm font-medium">
            Usuário
          </label>
          <input
            id="login"
            name="login"
            required
            autoFocus
            autoComplete="username"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="senha" className="text-sm font-medium">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        {estado?.erro && (
          <p className="text-sm text-red-600">{estado.erro}</p>
        )}

        <button
          type="submit"
          disabled={pendente}
          className="w-full rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {pendente ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}