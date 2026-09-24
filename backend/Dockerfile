FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY src ./src
EXPOSE 4000
# Oracle XE stays HOST-LOCAL (not containerised): point ORACLE_CONNECT at the host.
# e.g. ORACLE_CONNECT=host.docker.internal/XEPDB1
CMD ["node", "src/server.js"]
