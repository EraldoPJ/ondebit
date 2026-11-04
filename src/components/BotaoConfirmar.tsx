"use client";

export default function BotaoConfirmar({
  acao,
  mensagem,
  rotulo,
  classe,
}: {
  acao: () => Promise<void>;
  mensagem: string;
  rotulo: string;
  classe: string;
}) {
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!confirm(mensagem)) e.preventDefault();
      }}
    >
      <button className={`rounded-lg border px-3 py-1 ${classe}`}>{rotulo}</button>
    </form>
  );
}