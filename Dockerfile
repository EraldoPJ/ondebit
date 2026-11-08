FROM node:22-bookworm-slim

RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

# Valor de mentira, usado somente durante a montagem da imagem: o Prisma exige
# a variavel para carregar a configuracao. Em execucao, o docker-compose informa
# a URL real do banco.
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -H 0.0.0.0 -p 3000"]