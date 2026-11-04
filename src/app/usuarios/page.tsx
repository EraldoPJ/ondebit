import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/session";
import { alternarAtivo, excluirUsuario } from "./actions";
import BotaoExcluir from "./BotaoExcluir";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  await exigirAdmin();
  const { erro } = await searchParams;
  const usuarios = await prisma.usuario.findMany({ orderBy: { nome: "asc" } });

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Voltar ao painel
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Usuários</h1>
          <Link
            href="/usuarios/novo"
            className="rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700"
          >
            Novo usuário
          </Link>
        </div>

        {erro && (
          <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
            {erro}
          </p>
        )}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Usuário</th>
                <th className="px-4 py-2">Perfil</th>
                <th className="px-4 py-2">Situação</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{u.nome}</td>
                  <td className="px-4 py-2">{u.login}</td>
                  <td className="px-4 py-2">
                    {u.perfil === "ADMIN" ? "Administrador" : "Operador"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        u.ativo
                          ? "rounded-full bg-green-100 text-green-800 px-2 py-0.5"
                          : "rounded-full bg-gray-200 text-gray-700 px-2 py-0.5"
                      }
                    >
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/usuarios/${u.id}/editar`}
                        className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-100"
                      >
                        Editar
                      </Link>
                      <form action={alternarAtivo.bind(null, u.id)}>
                        <button className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-100">
                          {u.ativo ? "Desativar" : "Ativar"}
                        </button>
                      </form>
                      <BotaoExcluir acao={excluirUsuario.bind(null, u.id)} nome={u.nome} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}