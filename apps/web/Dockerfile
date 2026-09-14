FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS development
COPY package.json ./
RUN pnpm install
COPY . .
EXPOSE 3001
CMD ["pnpm", "run", "dev"]

FROM base AS builder
COPY package.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:20-alpine AS production
RUN npm install -g pnpm@9
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs && chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3001
ENV PORT=3001 NODE_ENV=production
CMD ["node", "server.js"]
