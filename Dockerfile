FROM oven/bun:1-slim AS backend-builder
WORKDIR /app
COPY package.json bun.lock ./
COPY web/package.json ./web/
COPY infra/package.json ./infra/
RUN bun install --frozen-lockfile
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN bunx --bun prisma generate
COPY src ./src
COPY tsconfig.json ./

FROM oven/bun:1-slim AS frontend-builder
WORKDIR /app
COPY package.json bun.lock ./
COPY web ./web
RUN cd web && bun install --frozen-lockfile
ENV NEXT_PUBLIC_API_URL=""
RUN cd web && bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app
COPY --from=backend-builder /app ./
COPY --from=frontend-builder /app/web/out ./public
EXPOSE 3001
CMD ["bun", "run", "src/index.ts"]
