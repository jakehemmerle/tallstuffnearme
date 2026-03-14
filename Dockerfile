FROM node:18-slim AS backend-builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn install --immutable
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
COPY tsconfig.json ./

FROM node:22-slim AS frontend-builder
WORKDIR /web
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY web/ ./
ENV NEXT_PUBLIC_API_URL=""
RUN pnpm build

FROM node:18-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=backend-builder /app ./
COPY --from=frontend-builder /web/out ./public
EXPOSE 3001
CMD ["npx", "ts-node", "src/index.ts"]
