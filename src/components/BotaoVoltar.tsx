import Link from "next/link";

export default function BotaoVoltar({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-block rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
    >
      Voltar
    </Link>
  );
}