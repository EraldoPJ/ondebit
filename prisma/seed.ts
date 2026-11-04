import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash("trocar123", 10);
  await prisma.usuario.upsert({
    where: { login: "admin" },
    update: {},
    create: { nome: "Administrador", login: "admin", senhaHash, perfil: "ADMIN" },
  });
}

main().finally(() => prisma.$disconnect());