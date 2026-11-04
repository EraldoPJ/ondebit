import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/session";
import { atualizarUsuario } from "../../actions";
import FormUsuario from "../../FormUsuario";

export default async function EditarUsuario({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirAdmin();
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero)) notFound();

  const usuario = await prisma.usuario.findUnique({ where: { id: numero } });
  if (!usuario) notFound();

  return (
    <FormUsuario
      titulo="Editar usuário"
      acao={atualizarUsuario.bind(null, usuario.id)}
      usuario={{
        nome: usuario.nome,
        login: usuario.login,
        perfil: usuario.perfil,
      }}
    />
  );
}