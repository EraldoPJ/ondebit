-- CreateTable
CREATE TABLE "tentativas_login" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tentativas_login_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tentativas_login_login_criadoEm_idx" ON "tentativas_login"("login", "criadoEm");

-- CreateIndex
CREATE INDEX "tentativas_login_ip_criadoEm_idx" ON "tentativas_login"("ip", "criadoEm");
