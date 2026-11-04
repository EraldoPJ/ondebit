import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { formatarTelefone } from "@/lib/telefone";
import BotaoExcluir from "@/components/BotaoExcluir";
import { alternarAtivoCliente, excluirCliente } from "./actions";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; q?: string }>;
}) {
  await exigirSessao();
  const { erro, q } = await searchParams;
  const busca = q?.trim();

  const clientes = await prisma.cliente.findMany({
    where: busca ? { nome: { contains: busca, mode: "insensitive" } } : {},
    orderBy: { nome: "asc" },
  });

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Voltar ao painel
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Clientes</h1>
          <Link
            href="/clientes/novo"
            className="rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700"
          >
            Novo cliente
          </Link>
        </div>

        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={busca}
            placeholder="Buscar por nome"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
          />
          <button className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100">
            Buscar
          </button>
        </form>

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
                <th className="px-4 py-2">WhatsApp</th>
                <th className="px-4 py-2">Situação</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
              {clientes.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{c.nome}</td>
                  <td className="px-4 py-2">
                    <a
                      href={`https://wa.me/${c.telefoneWhatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {formatarTelefone(c.telefoneWhatsapp)}
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        c.ativo
                          ? "rounded-full bg-green-100 text-green-800 px-2 py-0.5"
                          : "rounded-full bg-gray-200 text-gray-700 px-2 py-0.5"
                      }
                    >
                      {c.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/clientes/${c.id}/editar`}
                        className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-100"
                      >
                        Editar
                      </Link>
                      <form action={alternarAtivoCliente.bind(null, c.id)}>
                        <button className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-100">
                          {c.ativo ? "Desativar" : "Ativar"}
                        </button>
                      </form>
                      <BotaoExcluir
                        acao={excluirCliente.bind(null, c.id)}
                        mensagem={`Excluir o cliente "${c.nome}"? Esta ação não pode ser desfeita.`}
                      />
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