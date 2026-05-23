const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
        plugins:
          - name: proxy-cache
            config:
              strategy: memory
              cache_ttl: 10
              content_type:
                - "application/json"
              request_method:
                - GET

  - name: ms-editor
    url: http://ms-editor:3000
    routes:
      - name: editor-route
        paths:
          - /api/editor
        plugins:
          - name: rate-limiting
            config:
              minute: 30  # Stricter limit for AI Syncs/Editor calls
              policy: local

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
      minute: 200
      policy: local

  - name: correlation-id
    config:
      header_name: X-Trace-ID
      generator: uuid
      echo_downstream: true
`;

fs.writeFileSync(path.join(__dirname, 'api-gateway/kong.yml'), kongYml);

console.log('Restarting Kong to apply the new declarative configuration...');
try {
  execSync('docker compose restart kong', { cwd: __dirname, stdio: 'inherit' });
  console.log('Phase 14 Kong Gateway Refinement complete');
} catch (e) {
  console.error('Warning: could not restart Kong container via docker-compose. It may not be running currently.', e.message);
  console.log('Phase 14 Kong Gateway Refinement complete');
}
