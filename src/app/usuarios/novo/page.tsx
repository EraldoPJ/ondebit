import { exigirAdmin } from "@/lib/session";
import { criarUsuario } from "../actions";
import FormUsuario from "../FormUsuario";

export default async function NovoUsuario() {
  await exigirAdmin();
  return <FormUsuario titulo="Novo usuário" acao={criarUsuario} />;
}