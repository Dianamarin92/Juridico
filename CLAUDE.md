# Marin & Abogados — Sistema de Gestión de Tickets Jurídicos

## Arquitectura

Monorepo con frontend y backend separados, desplegados de forma independiente via GitHub Actions + FTP.

```
juridico/
├── frontend/          React 19 + Vite  →  FTP a public_html/marinabogados/
├── backend/           Node.js + Express →  FTP a public_html/api.marinabogados/
└── .github/workflows/ deploy-frontend.yml / deploy-backend.yml
```

- **Frontend:** React 19 + Vite + CSS variables. Gestor de paquetes: **pnpm**.
- **Backend:** Node.js + Express + MySQL. Gestor de paquetes: **pnpm** (en servidor usar `npm`).
- **Base de datos:** MySQL (crear con `backend/database.sql`).
- **Autenticación:** JWT guardado en `localStorage`.

## URLs de producción

| Servicio | URL |
|----------|-----|
| Frontend (landing + app) | `https://marinabogados.funec.org` |
| Backend API | `https://api.marinabogados.funec.org` |
| Health check | `https://api.marinabogados.funec.org/health` |

## Hosting

- **Proveedor:** funec.org (hosting compartido cPanel)
- **Usuario cPanel:** `funecor`
- **Node.js:** v22.22.2 via Passenger (cPanel → Setup Node.js App)
- **Frontend en servidor:** `/home2/funecor/public_html/marinabogados/`
- **Backend en servidor:** `/home2/funecor/public_html/api.marinabogados/`
- **Base de datos:** `funecor_marin_abogados` (MySQL, usuario: `funecor_marin`)
- **FTP:** `ftp.funec.org` puerto 21 (protocolo FTPS explícito)

## Correr localmente

### Frontend
```bash
cd frontend
pnpm install
pnpm dev        # corre en http://localhost:5173
```

### Backend
```bash
cd backend
pnpm install
cp .env.example .env   # completar credenciales
pnpm dev        # corre en http://localhost:3001
```

## Variables de entorno del backend (.env en servidor)

Archivo en `/home2/funecor/public_html/api.marinabogados/.env` — nunca en git.

```
DB_HOST=localhost
DB_USER=funecor_marin
DB_PASS=<contraseña>
DB_NAME=funecor_marin_abogados
JWT_SECRET=<clave larga y aleatoria>
PORT=3001
FRONTEND_URL=https://marinabogados.funec.org
```

## Secrets de GitHub Actions

Repositorio: `https://github.com/Dianamarin92/Juridico`
Configurar en GitHub → Settings → Secrets and variables → Actions:

| Secret | Valor |
|--------|-------|
| `FTP_HOST` | `ftp.funec.org` |
| `FTP_USER` | `funecor` |
| `FTP_PASS` | contraseña FTP |
| `FTP_FRONTEND_DIR` | `public_html/marinabogados/` |
| `FTP_BACKEND_DIR` | `public_html/api.marinabogados/` |
| `VITE_API_URL` | `https://api.marinabogados.funec.org` |

> SSH no está configurado en CI — el restart y tareas de servidor se hacen manualmente.

## Cómo funciona el deploy

- Push con cambios en `frontend/**` → corre `deploy-frontend.yml` automáticamente
- Push con cambios en `backend/**` → corre `deploy-backend.yml` automáticamente
- Ambos workflows también se pueden lanzar manualmente desde GitHub Actions → "Run workflow"
- El backend se reinicia via `touch tmp/restart.txt` incluido en el FTP deploy (Passenger detecta el cambio)

## Después de cada deploy de backend

El workflow de GitHub Actions ya hace `touch tmp/restart.txt` automáticamente al final — no hay que hacer nada manual en el servidor.

**Excepción — solo si hubo cambios en `backend/package.json`**, entrar por SSH y correr:

```bash
cd public_html/api.marinabogados
npm install --prod
```

> pnpm no está disponible globalmente en el servidor — usar `npm install --prod`.
> El `touch tmp/restart.txt` lo hace el workflow automáticamente, no hace falta hacerlo a mano.

## Configuración Node.js en cPanel

- **Node.js version:** 22.22.2
- **Application mode:** Production
- **Application root:** `public_html/api.marinabogados`
- **Application URL:** `api.marinabogados.funec.org`
- **Application startup file:** `app.js`

## Rutas de la API

Todas las rutas son relativas a `https://api.marinabogados.funec.org`:

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Login → devuelve JWT |
| GET | `/companies` | Listar empresas |
| POST | `/companies` | Crear empresa + usuario cliente |
| PUT | `/companies/:id` | Actualizar datos de empresa |
| DELETE | `/companies/:id` | Eliminar empresa (cascade: usuarios, tickets, archivos) |
| GET/POST | `/tickets` | Listar / crear tickets |
| PUT | `/tickets/:id` | Actualizar ticket |
| DELETE | `/tickets/:id` | Eliminar ticket (solo si está en `pending`) |
| GET/POST | `/messages` | Mensajes de un ticket |
| POST | `/files/upload` | Subir archivo |
| GET | `/files` | Archivos de un ticket |
| DELETE | `/files/:id` | Eliminar archivo |
| GET | `/users` | Listar abogadas (para asignación) |
| POST | `/users` | Crear usuario administrativo (rol: abogada_asignada o abogada_lider) |
| PUT | `/users/me/password` | Cambiar contraseña del usuario autenticado |
| GET | `/health` | Health check |

## Roles del sistema

| Rol | Permisos |
|-----|----------|
| `cliente` | Ve sus tickets, puede chatear y subir archivos |
| `abogada_asignada` | Ve y gestiona tickets asignados, cambia estado |
| `abogada_lider` | Asigna tickets, ve todo |
| `steven_marin` | Acceso total + panel de informes |

## Base de datos

Script completo en `backend/database.sql`. Tablas: `users`, `companies`, `tickets`, `messages`, `audit_logs`, `file_uploads`.
Crear en cPanel → phpMyAdmin seleccionando la BD primero (no usar `CREATE DATABASE` en hosting compartido).

### Columnas añadidas a `companies` (ALTER ejecutado en producción)

```sql
ALTER TABLE companies
  ADD COLUMN nit VARCHAR(20) DEFAULT NULL AFTER name,
  ADD COLUMN contact_name VARCHAR(100) DEFAULT NULL,
  ADD COLUMN phone VARCHAR(20) DEFAULT NULL,
  ADD COLUMN email VARCHAR(255) DEFAULT NULL;
```

### Columna `username` añadida a `users` (ALTER ejecutado en producción)

```sql
ALTER TABLE users ADD COLUMN username VARCHAR(50) NOT NULL UNIQUE AFTER id;
```

## Frontend — estructura clave

```
frontend/src/
├── App.jsx              Sistema de tickets conectado a la API real
├── LandingPage.jsx      Sitio institucional con info del brochure
├── landing.css          Estilos landing (paleta: #1a1a1a, #c0392b, #fff)
├── index.css            Estilos sistema de tickets
└── services/
    └── api.js           Capa HTTP → llama a api.marinabogados.funec.org
```

## Funcionalidades implementadas (al 2026-05-27)

### Vista cliente
- Al iniciar sesión va directo a **Mis Tickets** (no pasa por directorio de empresas)
- **Nombre de empresa** visible en la esquina superior derecha de la barra de navegación
- **Resumen por estado** en 4 tarjetas: Pendientes / En Proceso / En Revisión / Enviados
- Lista de tickets como tarjetas con título, fecha y badge de estado
- **Crear ticket:** modal con asunto, descripción y adjuntar múltiples archivos; la descripción se envía automáticamente como primer mensaje del hilo
- **Eliminar ticket:** botón rojo visible solo si el ticket está en estado `pending`
- **Mi Perfil** en el sidebar: página completa (no modal) para editar datos de empresa (nombre, NIT, contacto, teléfono, correo) y cambiar contraseña
- Panel de adjuntos en ticket: botón **×** para eliminar cada archivo

### Vista admin (abogadas / Steven Marín)
- **Directorio de empresas** muestra conteo de tickets por estado (badges de color) en cada fila, usando LEFT JOIN en la consulta SQL
- **+ Nueva Empresa:** formulario con datos de empresa (nombre, NIT, contacto, teléfono, correo) y acceso del cliente (usuario + contraseña) — crea empresa y usuario cliente en un solo paso
- **+ Nuevo Usuario:** formulario para crear usuarios administrativos (Abogada Asignada o Abogada Líder) — sin acceso al módulo de Informes
- **Eliminar empresa:** botón en cada fila del directorio — borra empresa, usuario cliente y todos sus tickets en cascada
- Login por `username` (cédula/NIT), no por email

### Indicadores de carga
- **Barra roja animada** fija en la parte superior en todas las pantallas (login incluido) durante cualquier petición
- **Spinner giratorio** con texto dentro de cada sección mientras carga su contenido
- **Botones de formularios** se deshabilitan y muestran texto descriptivo ("Creando...", "Guardando...", "Enviando...") mientras procesa
- Estado `loading` para consultas de datos; estado `busy` para mutaciones (crear, eliminar, guardar)

### General
- Deploy FTP a veces da timeout — si falla, re-ejecutar desde GitHub Actions → Re-run jobs
- `email` en tabla `users` permite NULL (ALTER ejecutado en producción)

## Usuario admin

- **Username:** `admin` | **Password:** `1111` | **Rol:** `steven_marin`
- Ya insertado en producción en `funecor_marin_abogados.users`

## Pendientes

- [ ] Crear carpeta `uploads/` en servidor via SSH: `mkdir -p public_html/api.marinabogados/uploads`
- [ ] Actualizar multer a 2.x en backend (advertencia de seguridad en multer 1.x)
- [ ] Si el deploy de FTP falla por timeout, re-ejecutar manualmente desde GitHub Actions → Re-run jobs

## Historial del proyecto

Ver historial completo de funcionalidades UI en `frontend/CLAUDE.md`.
