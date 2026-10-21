FROM node:22-bookworm-slim
WORKDIR /app
ENV HOST=0.0.0.0 PORT=8080 PINJAMLAB_DB=/app/data/pinjamlab.sqlite
COPY --chown=node:node package.json server.mjs db.mjs manage.mjs schema.sql ./
COPY --chown=node:node public ./public
RUN mkdir -p /app/data && chown node:node /app/data
USER node
VOLUME ["/app/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD node -e "fetch('http://127.0.0.1:8080/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
