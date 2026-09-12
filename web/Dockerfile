# Development image — runs the Vite dev server with hot module replacement.
#
# docker-compose.yml bind-mounts the source over /app so edits reload instantly;
# this image just provides a reproducible Node toolchain + installed deps.
#
# Base image is pinned by digest for reproducibility. Bump the tag *and* the
# digest together (see CONTRIBUTING.md > Updating base images).
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32

WORKDIR /app

# Copy manifests first so the dependency layer is cached across source edits.
# (`--mount=type=cache` for /root/.npm can be added once buildx is installed.)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The edge proxy reaches this container over the compose network, so the dev
# server has to listen on all interfaces. Port 8080 matches the production
# image, which lets nginx/nginx.conf use a single upstream in both stacks.
EXPOSE 8080

# --no-open: there is no browser to launch inside the container.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080", "--no-open"]
