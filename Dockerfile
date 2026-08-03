FROM node:22-alpine AS build
RUN corepack enable && apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
ARG PUBLIC_SITE_URL
ENV PUBLIC_SITE_URL=${PUBLIC_SITE_URL}
COPY . .
ENV ASTRO_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:22-alpine AS runtime
RUN corepack enable && addgroup -S tink && adduser -S tink -G tink
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
COPY --from=build --chown=tink:tink /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build --chown=tink:tink /app/node_modules ./node_modules
COPY --from=build --chown=tink:tink /app/dist ./dist
COPY --from=build --chown=tink:tink /app/drizzle ./drizzle
COPY --from=build --chown=tink:tink /app/src/server/db ./src/server/db
COPY --from=build --chown=tink:tink /app/scripts ./scripts
COPY --from=build --chown=tink:tink /app/src ./src
RUN chown tink:tink /app
USER tink
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
