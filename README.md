# IntelliPair — Plataforma Web de Pair Programming asistida por IA

IntelliPair es una plataforma educativa enfocada en la metodología de *Pair Programming* (Programación en Parejas) en tiempo real. Está diseñada con una arquitectura de microservicios altamente escalable y permite a estudiantes colaborar en la resolución de retos de programación, mientras los profesores pueden monitorear su progreso y evaluar métricas de desempeño.

---

## 🏗️ Arquitectura del Proyecto

El proyecto está orquestado mediante **Docker Compose** para asegurar que todos los servicios corran en contenedores aislados. Las comunicaciones desde el cliente hacia el backend pasan a través de un **API Gateway**.

### 1. API Gateway (Kong)
- **Puerto expuesto:** `8000`
- Es el único punto de entrada público para el backend. Su función es recibir las peticiones del frontend y enrutarlas internamente al microservicio correspondiente.
- Protege la topología de la red interna, impidiendo que el cliente consulte las bases de datos o puertos internos de forma directa.

### 2. Frontend (`/frontend`)
- **Tecnologías:** React, Vite, Yjs, WebSockets, HTML/CSS (Glassmorphism).
- Sirve la interfaz gráfica para los estudiantes (Dashboards, Editor Colaborativo) y profesores (Panel de monitoreo, Analíticas).
- Empaquetado estáticamente y servido a través de **Nginx** en un contenedor Docker (`Puerto 80`).

---

## ⚙️ Microservicios (Backend)

La lógica de negocio está dividida en módulos independientes de Node.js, cada uno con una única responsabilidad.

*   🔐 **`ms-auth`** *(Puerto interno: 3001)*: 
    *   Gestiona la autenticación, registro de usuarios, roles (estudiante/profesor) y generación de tokens JWT. 
    *   **Base de datos:** PostgreSQL (`auth_db`).
*   👥 **`ms-pairing`** *(Puerto interno: 3002)*: 
    *   Controla el ciclo de vida de las sesiones de pair programming. Asigna roles de *driver* (conductor) y *navigator* (navegador), y maneja el acceso de observadores (profesores).
    *   **Base de datos:** PostgreSQL (`pairing_db`).
*   💻 **`ms-editor`** *(Puerto interno: 3003)*: 
    *   Es el servidor de WebSockets puro. Utiliza `y-websocket` para sincronizar las teclas presionadas en el editor de código entre todos los participantes de una sesión de forma instantánea.
*   🤖 **`ms-ai`** *(Puerto interno: 3004)*: 
    *   Microservicio encargado de la integración con Inteligencia Artificial. Recibe el código actual y devuelve sugerencias, correcciones o explicaciones teóricas al estudiante *navigator*.
*   ⚡ **`ms-evaluation`** *(Puerto interno: 3005)*: 
    *   Módulo diseñado para la ejecución y validación del código. (Actualmente apoyado por un entorno *sandbox* simulado en el frontend que soporta captura de `console.log`, `prompt`, y `alert`).
*   📚 **`ms-exercises`** *(Puerto interno: 3006)*: 
    *   Maneja el catálogo de retos académicos (CRUD). Los profesores crean los retos y los estudiantes los resuelven.
    *   **Base de datos:** MongoDB (`exercises_db`).
*   📊 **`ms-analytics`** *(Puerto interno: 3007)*: 
    *   Recopila eventos, métricas de rendimiento y uso de la IA de cada sesión finalizada para generar tableros estadísticos que el profesor puede consultar.

---

## 🗄️ Infraestructura de Bases de Datos
La persistencia de datos respeta el patrón de base de datos por microservicio:
- **PostgreSQL**: Se levantan dos contenedores para datos relacionales y transaccionales (Auth y Pairing).
- **MongoDB**: Un contenedor NoSQL ideal para almacenar esquemas flexibles como los documentos de ejercicios o analíticas.

---

## 🚀 Cómo ejecutar el proyecto en local

1. Clona este repositorio en tu máquina.
2. Asegúrate de tener instalado **Docker Desktop** (o Docker Engine y Docker Compose).
3. Abre una terminal en la carpeta raíz del proyecto.
4. Ejecuta el comando de construcción y orquestación:
   ```bash
   docker compose up -d --build
   ```
5. Abre tu navegador web y entra a `http://localhost`.

### Comandos útiles:
- Para ver los logs de un servicio específico (ej: frontend): `docker compose logs -f frontend`
- Para apagar todos los contenedores: `docker compose down`
