# Edge reverse-proxy image.
#
# Built on nginxinc/nginx-unprivileged: the process runs as a non-root user and
# listens on 8080, so the container needs no capabilities at all
# (docker-compose*.yml drops every cap).
FROM nginxinc/nginx-unprivileged:1.27-alpine@sha256:65e3e85dbaed8ba248841d9d58a899b6197106c23cb0ff1a132b7bfe0547e4c0

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
	CMD ["wget", "-q", "--spider", "http://127.0.0.1:8080/healthz"]

CMD ["nginx", "-g", "daemon off;"]
