const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Installing OpenTelemetry dependencies in ms-auth and ms-pairing...');

const otelPackages = '@opentelemetry/sdk-node @opentelemetry/api @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http';

execSync(`npm install ${otelPackages}`, { cwd: path.join(__dirname, 'ms-auth'), stdio: 'inherit' });
execSync(`npm install ${otelPackages}`, { cwd: path.join(__dirname, 'ms-pairing'), stdio: 'inherit' });

const tracingContent = `const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
`;

fs.writeFileSync(path.join(__dirname, 'ms-auth/src/tracing.js'), tracingContent);
fs.writeFileSync(path.join(__dirname, 'ms-pairing/src/tracing.js'), tracingContent);

['ms-auth', 'ms-pairing'].forEach(service => {
  const appJsPath = path.join(__dirname, `${service}/src/app.js`);
  let appJs = fs.readFileSync(appJsPath, 'utf8');
  if (!appJs.includes("require('./tracing')")) {
    appJs = `require('./tracing');\n` + appJs;
    fs.writeFileSync(appJsPath, appJs);
  }
});

let dockerCompose = fs.readFileSync(path.join(__dirname, 'docker-compose.yml'), 'utf8');

const jaegerService = `
  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: pp_jaeger
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    ports:
      - "16686:16686"
      - "4318:4318"
    networks:
      - pp-network

`;

if (!dockerCompose.includes('jaeger:')) {
  if (dockerCompose.includes('kong:')) {
    dockerCompose = dockerCompose.replace('  kong:', jaegerService + '  kong:');
  }
  
  if (!dockerCompose.includes('OTEL_SERVICE_NAME=ms-auth')) {
    dockerCompose = dockerCompose.replace(
      'container_name: pp_ms_auth\n    ports:',
      'container_name: pp_ms_auth\n    environment:\n      - OTEL_SERVICE_NAME=ms-auth\n    ports:'
    );
  }
  if (!dockerCompose.includes('OTEL_SERVICE_NAME=ms-pairing')) {
    dockerCompose = dockerCompose.replace(
      'container_name: pp_ms_pairing\n    ports:',
      'container_name: pp_ms_pairing\n    environment:\n      - OTEL_SERVICE_NAME=ms-pairing\n    ports:'
    );
  }

  fs.writeFileSync(path.join(__dirname, 'docker-compose.yml'), dockerCompose);
}

console.log('Phase 17 Distributed Tracing setup complete');
