const { spawn } = require('child_process');
const { execSync } = require('child_process');

console.log('🚀 Iniciando Pair Programming Platform (Local)...\n');

try {
  console.log('📦 Levantando contenedores (Docker Compose)...');
  execSync('docker compose up -d', { stdio: 'inherit' });
  
  console.log('\n⏳ Esperando a que Kafka esté listo (esto puede tomar 10-20 segundos)...');
  // Simple sleep since healthchecks are in docker-compose
  execSync('node -e "setTimeout(()=>{}, 15000)"');

  console.log('📝 Creando tópicos de Kafka...');
  try {
    execSync('docker exec pp_kafka bash -c "/bin/sh -c \"kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic session-events && kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic code-events && kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic ai-suggestions && kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic evaluation-completed && kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic collaboration-metrics\""', { stdio: 'ignore' });
    console.log('✅ Tópicos creados exitosamente.');
  } catch (e) {
    console.log('⚠️ No se pudieron crear los tópicos automáticamente. Verifica los logs de Kafka.');
  }

  console.log('\n✨ ¡Plataforma levantada con éxito! ✨\n');
  console.log('🌐 Frontend (React):        http://localhost:80');
  console.log('🚪 API Gateway (Kong):      http://localhost:8000');
  console.log('📊 Tracing (Jaeger):        http://localhost:16686');
  console.log('📈 Métricas (InfluxDB):     http://localhost:8086');
  console.log('🧠 Eventos (Kafka UI):      http://localhost:9090');
  
} catch (error) {
  console.error('❌ Error iniciando el entorno local:', error.message);
}
