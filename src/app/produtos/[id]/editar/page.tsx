import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { valorParaCampo } from "@/lib/dinheiro";
import { atualizarProduto } from "../../actions";
import FormProduto from "../../FormProduto";

export default async function EditarProduto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirSessao();
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero)) notFound();

  const produto = await prisma.produto.findUnique({ where: { id: numero } });
  if (!produto) notFound();

  return (
    <FormProduto
      titulo="Editar produto"
      acao={atualizarProduto.bind(null, produto.id)}
      produto={{
        nome: produto.nome,
        preco: valorParaCampo(produto.precoPadrao),
      }}
    />
  );
}