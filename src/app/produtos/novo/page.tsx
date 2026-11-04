import { exigirSessao } from "@/lib/session";
import { criarProduto } from "../actions";
import FormProduto from "../FormProduto";

export default async function NovoProduto() {
  await exigirSessao();
  return <FormProduto titulo="Novo produto" acao={criarProduto} />;
}