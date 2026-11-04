import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import { formatarTelefone } from "@/lib/telefone";
import { atualizarCliente } from "../../actions";
import FormCliente from "../../FormCliente";

export default async function EditarCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirSessao();
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero)) notFound();

  const cliente = await prisma.cliente.findUnique({ where: { id: numero } });
  if (!cliente) notFound();

  return (
    <FormCliente
      titulo="Editar cliente"
      acao={atualizarCliente.bind(null, cliente.id)}
      cliente={{
        nome: cliente.nome,
        telefone: formatarTelefone(cliente.telefoneWhatsapp),
        observacao: cliente.observacao ?? "",
      }}
    />
  );
}