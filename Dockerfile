# ==============================================================================
# SMART SCHOLARSHIP ELIGIBILITY & DISBURSEMENT PROCESSING SYSTEM
# Multi-Stage Production Dockerfile with Native GnuCOBOL Execution Engine
# ==============================================================================

# STAGE 1: COBOL Compiler Stage
FROM debian:bookworm-slim AS cobol-builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    gnucobol \
    build-essential \
    libdb-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY mainframe ./mainframe

RUN mkdir -p mainframe/bin && \
    cobc -x -std=default -I mainframe/copybooks -o mainframe/bin/MAIN0001 \
    mainframe/cobol/MAIN0001.cbl \
    mainframe/cobol/STU1001.cbl \
    mainframe/cobol/SCH2001.cbl \
    mainframe/cobol/DUP3001.cbl \
    mainframe/cobol/DIS4001.cbl \
    mainframe/cobol/RPT5001.cbl

# STAGE 2: Node.js Backend & Frontend Build Stage
FROM node:20-bookworm-slim AS node-builder

WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

COPY backend ./backend
RUN cd backend && npm run build

COPY dashboard/package*.json ./dashboard/
RUN cd dashboard && npm ci

COPY dashboard ./dashboard
RUN cd dashboard && npm run build

# STAGE 3: Final Production Runtime Container
FROM node:20-bookworm-slim AS runner

# Install GnuCOBOL runtime libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    gnucobol \
    libdb5.3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy COBOL executable and artifacts
COPY --from=cobol-builder /app/mainframe ./mainframe

# Copy built backend
COPY --from=node-builder /app/backend/dist ./backend/dist
COPY --from=node-builder /app/backend/src/database/schema.sql ./backend/dist/database/schema.sql
COPY --from=node-builder /app/backend/node_modules ./backend/node_modules
COPY --from=node-builder /app/backend/package.json ./backend/package.json

# Copy built frontend (servable statically if desired)
COPY --from=node-builder /app/dashboard/dist ./dashboard/dist

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "backend/dist/index.js"]
