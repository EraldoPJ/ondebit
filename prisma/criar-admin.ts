import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient();

async function main() {
  const login = "admin";
  const senha = readFileSync(0, "utf8").trim(); // a senha chega pela entrada padrao

  if (senha.length < 10 || senha.length > 72) {
    throw new Error("A senha do administrador deve ter entre 10 e 72 caracteres.");
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  await prisma.usuario.upsert({
    where: { login },
    update: { senhaHash, perfil: "ADMIN", ativo: true },
    create: { nome: "Administrador", login, senhaHash, perfil: "ADMIN" },
  });
  console.log(`Administrador "${login}" pronto.`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());