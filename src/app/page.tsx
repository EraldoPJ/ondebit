import Link from "next/link";
import { exigirSessao } from "@/lib/session";
import { sair } from "./login/actions";

const cards = [
  {
    titulo: "Usuários",
    descricao: "Quem acessa o sistema",
    href: "/usuarios",
    somenteAdmin: true,
  },
  {
    titulo: "Clientes",
    descricao: "Cadastro de clientes e WhatsApp",
    href: "/clientes",
  },
  {
    titulo: "Produtos",
    descricao: "Produtos e preços",
    href: "/produtos",
  },
  {
    titulo: "Pedidos",
    descricao: "Lançar e acompanhar pedidos",
    href: "/pedidos",
  },
  {
    titulo: "Relatório",
    descricao: "Filtros, contas e cobrança",
    href: "/relatorio",
  },
];

export default async function Dashboard() {
  const sessao = await exigirSessao();
  const visiveis = cards.filter((c) => !c.somenteAdmin || sessao.perfil === "ADMIN");

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <span className="text-xl font-bold">Ondebit</span>
          <div className="flex items-center gap-4 text-sm">
            <span>Olá, {sessao.nome}</span>
            <form action={sair}>
              <button className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-100">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visiveis.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-xl shadow p-6 hover:shadow-md hover:-translate-y-0.5 transition"
          >
            <h2 className="text-lg font-semibold">{card.titulo}</h2>
            <p className="text-sm text-gray-600 mt-1">{card.descricao}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}