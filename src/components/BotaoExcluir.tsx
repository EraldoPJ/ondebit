"use client";

export default function BotaoExcluir({
  acao,
  mensagem,
}: {
  acao: () => Promise<void>;
  mensagem: string;
}) {
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!confirm(mensagem)) e.preventDefault();
      }}
    >
      <button className="rounded-lg border border-red-300 text-red-700 px-3 py-1 hover:bg-red-50">
        Excluir
      </button>
    </form>
  );
}