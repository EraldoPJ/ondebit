"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { moeda } from "@/lib/dinheiro";

type Estado = { erro?: string } | undefined;
type ClienteOpcao = { id: number; nome: string };
type ProdutoOpcao = { id: number; nome: string; preco: string };
type ItemForm = {
  chave: number;
  produtoId: string;
  quantidade: string;
  preco: string;
};

type Props = {
  titulo: string;
  aviso?: string;
  modo?: "completo" | "observacao" | "leitura";
  acao: (estado: Estado, formData: FormData) => Promise<Estado>;
  clientes: ClienteOpcao[];
  produtos: ProdutoOpcao[];
  dataInicial: string;
  pedido?: {
    clienteId: number;
    data: string;
    observacao: string;
    itens: { produtoId: number; quantidade: number; preco: string }[];
  };
};

const campo =
  "w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-600";

// "12,50" ou "1.234,50" -> número (só para exibir o subtotal na tela)
function numero(texto: string) {
  const t = texto.replace(/R\$|\s/g, "");
  const normal = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  return Number(normal) || 0;
}

export default function FormPedido({
  titulo,
  aviso,
  modo = "completo",
  acao,
  clientes,
  produtos,
  dataInicial,
  pedido,
}: Props) {
  const [estado, enviar, pendente] = useActionState(acao, undefined);
  const editavel = modo === "completo";

  const [itens, setItens] = useState<ItemForm[]>(() =>
    pedido
      ? pedido.itens.map((i, n) => ({
          chave: n + 1,
          produtoId: String(i.produtoId),
          quantidade: String(i.quantidade),
          preco: i.preco,
        }))
      : [{ chave: 1, produtoId: "", quantidade: "1", preco: "" }]
  );

  const subtotalDe = (i: ItemForm) =>
    Math.round(numero(i.preco) * (parseInt(i.quantidade, 10) || 0) * 100) / 100;
  const total = itens.reduce((soma, i) => soma + subtotalDe(i), 0);

  function alterar(chave: number, parcial: Partial<ItemForm>) {
    setItens((lista) =>
      lista.map((i) => (i.chave === chave ? { ...i, ...parcial } : i))
    );
  }

  function escolherProduto(chave: number, produtoId: string) {
    const produto = produtos.find((p) => String(p.id) === produtoId);
    alterar(chave, { produtoId, preco: produto ? produto.preco : "" });
  }

  function adicionarItem() {
    const chave = Math.max(0, ...itens.map((i) => i.chave)) + 1;
    setItens((lista) => [
      ...lista,
      { chave, produtoId: "", quantidade: "1", preco: "" },
    ]);
  }

  function removerItem(chave: number) {
    setItens((lista) => lista.filter((i) => i.chave !== chave));
  }

  const semCadastro = clientes.length === 0 || produtos.length === 0;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <form
        action={enviar}
        className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 space-y-5"
      >
        <h1 className="text-xl font-bold">{titulo}</h1>

        {aviso && (
          <p className="rounded-lg bg-amber-50 text-amber-800 px-4 py-2 text-sm">
            {aviso}
          </p>
        )}

        {semCadastro && editavel && (
          <p className="rounded-lg bg-amber-50 text-amber-800 px-4 py-2 text-sm">
            Cadastre ao menos um cliente e um produto ativos antes de lançar pedidos.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="clienteId" className="text-sm font-medium">Cliente</label>
            <select
              id="clienteId"
              name="clienteId"
              required
              disabled={!editavel}
              defaultValue={pedido?.clienteId ?? ""}
              className={campo}
            >
              <option value="">Escolha...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="data" className="text-sm font-medium">Data do pedido</label>
            <input
              id="data"
              name="data"
              type="date"
              required
              disabled={!editavel}
              defaultValue={pedido?.data ?? dataInicial}
              className={campo}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium">Itens</h2>

          {itens.map((item) => (
            <div
              key={item.chave}
              className="grid gap-2 items-end border-t border-gray-100 pt-3 sm:grid-cols-[1fr_5rem_7rem_7rem_auto]"
            >
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Produto</label>
                <select
                  value={item.produtoId}
                  onChange={(e) => escolherProduto(item.chave, e.target.value)}
                  disabled={!editavel}
                  className={campo}
                >
                  <option value="">Escolha...</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600">Qtd.</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={item.quantidade}
                  onChange={(e) => alterar(item.chave, { quantidade: e.target.value })}
                  disabled={!editavel}
                  className={campo}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600">Preço un. (R$)</label>
                <input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={item.preco}
                  onChange={(e) => alterar(item.chave, { preco: e.target.value })}
                  disabled={!editavel}
                  className={campo}
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs text-gray-600">Subtotal</span>
                <div className="py-2 font-medium">{moeda(subtotalDe(item))}</div>
              </div>

              {editavel && itens.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removerItem(item.chave)}
                  className="rounded-lg border border-red-300 text-red-700 px-3 py-2 hover:bg-red-50"
                  aria-label="Remover item"
                >
                  Remover
                </button>
              ) : (
                <span />
              )}
            </div>
          ))}

          {editavel && (
            <button
              type="button"
              onClick={adicionarItem}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
            >
              + Novo item
            </button>
          )}

          <input
            type="hidden"
            name="itens"
            value={JSON.stringify(
              itens.map(({ produtoId, quantidade, preco }) => ({
                produtoId,
                quantidade,
                preco,
              }))
            )}
          />
        </div>

        <div className="flex justify-end text-lg font-bold">
          Total: {moeda(total)}
        </div>

        <div className="space-y-1">
          <label htmlFor="observacao" className="text-sm font-medium">
            Observação (opcional)
          </label>
          <textarea
            id="observacao"
            name="observacao"
            rows={3}
            disabled={modo === "leitura"}
            defaultValue={pedido?.observacao}
            className={campo}
          />
        </div>

        {estado?.erro && <p className="text-sm text-red-600">{estado.erro}</p>}

        <div className="flex gap-3">
          {modo !== "leitura" && (
            <button
              type="submit"
              disabled={pendente}
              className="flex-1 rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {pendente ? "Salvando..." : "Salvar"}
            </button>
          )}
          <Link
            href="/pedidos"
            className="flex-1 text-center rounded-lg border border-gray-300 py-2 hover:bg-gray-100"
          >
            {modo === "leitura" ? "Voltar" : "Cancelar"}
          </Link>
        </div>
      </form>
    </main>
  );
}