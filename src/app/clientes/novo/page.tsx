import { exigirSessao } from "@/lib/session";
import { criarCliente } from "../actions";
import FormCliente from "../FormCliente";

export default async function NovoCliente() {
  await exigirSessao();
  return <FormCliente titulo="Novo cliente" acao={criarCliente} />;
}