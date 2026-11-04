"use client";

export default function BotaoExcluir({
  acao,
  nome,
}: {
  acao: () => Promise<void>;
  nome: string;
}) {
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!confirm(`Excluir o usuário "${nome}"? Esta ação não pode ser desfeita.`)) {
          e.preventDefault();
        }
      }}
    >
      <button className="rounded-lg border border-red-300 text-red-700 px-3 py-1 hover:bg-red-50">
        Excluir
      </button>
    </form>
  );
}