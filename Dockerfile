FROM oven/bun:1-slim AS backend-builder
WORKDIR /app
COPY package.json bun.lock ./
COPY web/package.json ./web/
COPY infra/package.json ./infra/
RUN bun install --frozen-lockfile
COPY prisma ./prisma
RUN bunx --bun prisma generate
COPY src ./src
COPY tsconfig.json ./

FROM oven/bun:1-slim AS frontend-builder
WORKDIR /app
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/web/node_modules ./web/node_modules
WORKDIR /app/web
COPY web/ ./
ENV NEXT_PUBLIC_API_URL=""
RUN bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app
COPY --from=backend-builder /app ./
COPY --from=frontend-builder /app/web/out ./public
EXPOSE 3001
CMD ["bun", "run", "src/index.ts"]
