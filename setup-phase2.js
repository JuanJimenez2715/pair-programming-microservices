const fs = require('fs');
const path = require('path');

const kongYml = `_format_version: "3.0"

services:
  - name: ms-auth
    url: http://ms-auth:3000
    routes:
      - name: auth-route
        paths:
          - /api/auth

  - name: ms-pairing
    url: http://ms-pairing:3000
    routes:
      - name: pairing-route
        paths:
          - /api/sessions

  - name: ms-editor
    url: http://ms-editor:3000
    routes:
      - name: editor-route
        paths:
          - /api/editor

  - name: ms-ai
    url: http://ms-ai:8080
    routes:
      - name: ai-route
        paths:
          - /api/ai

plugins:
  - name: cors
    config:
      origins:
        - '*'
      methods:
        - GET
        - POST
        - PUT
        - PATCH
        - DELETE
        - OPTIONS
      headers:
        - Accept
        - Accept-Version
        - Content-Length
        - Content-MD5
        - Content-Type
        - Date
        - Authorization
      exposed_headers:
        - X-Trace-ID
      credentials: true
      max_age: 3600

  - name: rate-limiting
    config:
      minute: 100
      policy: local

  - name: correlation-id
    config:
      header_name: X-Trace-ID
      generator: uuid
      echo_downstream: true

  # JWT is prepared but needs consumers to be fully enforced. 
  # We will attach it specific routes when ms-auth is fully ready.
  # - name: jwt
`;

const kongDockerfile = `FROM kong:3.4-ubuntu

# Set up Kong to run in DB-less mode
ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/usr/local/kong/declarative/kong.yml

COPY kong.yml /usr/local/kong/declarative/kong.yml

USER root
RUN chown -R kong:0 /usr/local/kong/declarative && chmod -R g=u /usr/local/kong/declarative
USER kong
`;

fs.writeFileSync(path.join(__dirname, 'api-gateway/kong.yml'), kongYml);
fs.writeFileSync(path.join(__dirname, 'api-gateway/Dockerfile'), kongDockerfile);

// Append kong to docker-compose.yml
let dockerCompose = fs.readFileSync(path.join(__dirname, 'docker-compose.yml'), 'utf8');

const kongService = `
  kong:
    build: ./api-gateway
    container_name: pp_api_gateway
    environment:
      - KONG_DATABASE=off
      - KONG_DECLARATIVE_CONFIG=/usr/local/kong/declarative/kong.yml
      - KONG_PROXY_ACCESS_LOG=/dev/stdout
      - KONG_ADMIN_ACCESS_LOG=/dev/stdout
      - KONG_PROXY_ERROR_LOG=/dev/stderr
      - KONG_ADMIN_ERROR_LOG=/dev/stderr
      - KONG_ADMIN_LISTEN=0.0.0.0:8001, 0.0.0.0:8444 ssl
    ports:
      - "8000:8000"
      - "8443:8443"
      - "8001:8001"
      - "8444:8444"
    networks:
      - pp-network
    healthcheck:
      test: ["CMD", "kong", "health"]
      interval: 10s
      timeout: 5s
      retries: 5
`;

if (!dockerCompose.includes('kong:')) {
  // Insert before networks: if it exists, otherwise just append
  if (dockerCompose.includes('networks:')) {
    dockerCompose = dockerCompose.replace('networks:', kongService + '\\nnetworks:');
  } else {
    dockerCompose += kongService;
  }
  fs.writeFileSync(path.join(__dirname, 'docker-compose.yml'), dockerCompose);
}

console.log('Phase 2 scaffolding complete');
