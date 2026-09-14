# ============================================================
# RESGATE AI — API Dockerfile (multi-stage)
# ============================================================

FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app
COPY package.json ./

# ── Development ───────────────────────────────────────────────
FROM base AS development
COPY . .
RUN pnpm install
RUN npx prisma generate
EXPOSE 3000
CMD ["pnpm", "run", "start:dev"]

# ── Builder ───────────────────────────────────────────────────
FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
RUN npx prisma generate
RUN pnpm run build

# ── Production ────────────────────────────────────────────────
FROM node:20-alpine AS production
RUN npm install -g pnpm@9
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs \
  && chown -R nestjs:nodejs /app

USER nestjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main"]
