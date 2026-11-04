import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE = "ondebit_session";
const SETE_DIAS = 60 * 60 * 24 * 7;

export type Sessao = {
  usuarioId: number;
  nome: string;
  perfil: "ADMIN" | "OPERADOR";
};

// A chave só é lida quando necessária (e não durante o build do projeto).
function chave() {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo || segredo.length < 32) {
    throw new Error(
      "SESSION_SECRET ausente ou curto demais (mínimo de 32 caracteres) no .env."
    );
  }
  return new TextEncoder().encode(segredo);
}

export async function criarSessao(dados: Sessao) {
  const token = await new SignJWT({ ...dados })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(chave());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Seguro por padrão em produção. Só desligue (COOKIE_SEGURO="false" no .env)
    // quando o sistema rodar em rede local sem HTTPS.
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.COOKIE_SEGURO !== "false",
    path: "/",
    maxAge: SETE_DIAS,
  });
}

export async function lerSessao(): Promise<Sessao | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const k = chave(); // fora do try, para um segredo ausente aparecer como erro
  try {
    const { payload } = await jwtVerify(token, k, { algorithms: ["HS256"] });
    return {
      usuarioId: payload.usuarioId as number,
      nome: payload.nome as string,
      perfil: payload.perfil as Sessao["perfil"],
    };
  } catch {
    return null;
  }
}

export async function exigirSessao(): Promise<Sessao> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: sessao.usuarioId },
  });
  if (!usuario || !usuario.ativo) redirect("/login");

  return { usuarioId: usuario.id, nome: usuario.nome, perfil: usuario.perfil };
}

export async function exigirAdmin(): Promise<Sessao> {
  const sessao = await exigirSessao();
  if (sessao.perfil !== "ADMIN") redirect("/");
  return sessao;
}

export async function encerrarSessao() {
  (await cookies()).delete(COOKIE);
}