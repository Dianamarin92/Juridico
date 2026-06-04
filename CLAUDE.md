# Marin & Abogados — Sistema de Gestión de Tickets Jurídicos

## Arquitectura

Monorepo con frontend y backend separados, desplegados de forma independiente via GitHub Actions + FTP.

```
juridico/
├── frontend/          React 19 + Vite  →  FTP a public_html/
├── backend/           Node.js + Express →  FTP a public_html/api.marinyabogados.com.co/
└── .github/workflows/ deploy-frontend.yml / deploy-backend.yml
```

- **Frontend:** React 19 + Vite + CSS variables. Gestor de paquetes: **pnpm**.
- **Backend:** Node.js + Express + MySQL. Gestor de paquetes: **pnpm** (en servidor usar `npm`).
- **Base de datos:** MySQL (crear con `backend/database.sql`).
- **Autenticación:** JWT guardado en `localStorage`.

## URLs de producción

| Servicio | URL |
|----------|-----|
| Frontend (landing + app) | `https://marinyabogados.com.co` |
| Backend API | `https://api.marinyabogados.com.co` |
| Health check | `https://api.marinyabogados.com.co/health` |

## Hosting

- **Proveedor:** marinyabogados.com.co (hosting compartido cPanel)
- **Usuario cPanel:** `marinyab`
- **Node.js:** configurar en cPanel → Setup Node.js App (ver sección abajo)
- **Frontend en servidor:** `/home/marinyab/public_html/marinyabogados/`
- **Backend en servidor:** `/home/marinyab/public_html/api.marinyabogados.com.co/`
- **Base de datos:** `marinyab_juridico` (MySQL, usuario: `marinyab_marin`)
- **FTP:** `192.99.84.46` puerto 21 (protocolo FTPS explícito)

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

Archivo en `/home/marinyab/public_html/api.marinyabogados.com.co/.env` — nunca en git.

```
DB_HOST=localhost
DB_USER=marinyab_marin
DB_PASS=<contraseña BD>
DB_NAME=marinyab_juridico
JWT_SECRET=<clave larga y aleatoria>
PORT=3001
FRONTEND_URL=https://marinyabogados.com.co
```

## Secrets de GitHub Actions

Repositorio: `https://github.com/Dianamarin92/Juridico`
Configurar en GitHub → Settings → Secrets and variables → Actions:

| Secret | Valor |
|--------|-------|
| `FTP_HOST` | `192.99.84.46` |
| `FTP_USER` | `marinyab` |
| `FTP_PASS` | contraseña FTP |
| `FTP_FRONTEND_DIR` | `public_html/marinyabogados/` |
| `FTP_BACKEND_DIR` | `public_html/api.marinyabogados.com.co/` |
| `VITE_API_URL` | `https://api.marinyabogados.com.co` |

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
cd public_html/api.marinyabogados.com.co
npm install --prod
```

> pnpm no está disponible globalmente en el servidor — usar `npm install --prod`.
> El `touch tmp/restart.txt` lo hace el workflow automáticamente, no hace falta hacerlo a mano.

## Configuración Node.js en cPanel

- **Node.js version:** la más alta disponible (preferir 20.x o 22.x)
- **Application mode:** Production
- **Application root:** `public_html/api.marinyabogados.com.co`
- **Application URL:** `api.marinyabogados.com.co`
- **Application startup file:** `app.js`

## Rutas de la API

Todas las rutas son relativas a `https://api.marinyabogados.com.co`:

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

### Columnas `is_new` y `is_active` (ALTER ejecutado en producción — 2026-06-01)

```sql
ALTER TABLE tickets ADD COLUMN is_new TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE companies ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
```

## Frontend — estructura clave

```
frontend/src/
├── App.jsx              Sistema de tickets conectado a la API real
├── LandingPage.jsx      Sitio institucional con info del brochure
├── landing.css          Estilos landing (paleta: #1a1a1a, #c0392b, #fff)
├── index.css            Estilos sistema de tickets
└── services/
    └── api.js           Capa HTTP → llama a api.marinyabogados.com.co
```

## Funcionalidades implementadas (al 2026-06-01)

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
- **+ Nuevo Usuario:** formulario con campos: Cédula, Correo electrónico (opcional), Contraseña, Rol — crea Abogada Asignada o Abogada Líder sin acceso a Informes
- **Eliminar empresa:** botón en cada fila del directorio — borra empresa, usuario cliente y todos sus tickets en cascada
- **Desactivar / Activar empresa:** botón amarillo/verde por fila — cliente desactivado no puede iniciar sesión (verificación en `/auth/login`); empresa aparece atenuada con badge "Desactivada"
- **Punto rojo en tickets nuevos:** tickets creados por el cliente aparecen con un punto rojo parpadeante y título en negrita en la vista de admin/abogada; el punto desaparece cuando el admin abre el ticket (`is_new = false`)
- **Mi Perfil (admin):** página con barra de progreso de almacenamiento de documentos (GET `/files/storage` lee el directorio `uploads/`, límite: 5 GB) y formulario para cambiar contraseña
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
- Insertar en producción después de importar `backend/database.sql` (ver sección Pendientes)

## Pendientes — migración a nuevo hosting (marinyabogados.com.co)

### Completado (2026-06-02)
- [x] **cPanel → Dominios:** dominio principal `marinyabogados.com.co` → `public_html/`
- [x] **cPanel → Dominios:** subdominio `api.marinyabogados.com.co` → `public_html/api.marinyabogados.com.co/`
- [x] **cPanel → MySQL Databases:** BD `marinyab_juridico` creada, usuario `marinyab_marin` creado con ALL PRIVILEGES
- [x] **vite.config.js:** `base` cambiado a `/marinyabogados/` (frontend vive en `public_html/marinyabogados/`)

### Pendiente
- [ ] **phpMyAdmin:** resolver acceso (error "Access denied for user marinyab" — entrar con usuario `marinyab_marin`)
- [ ] **phpMyAdmin:** importar `backend/database.sql` en la BD `marinyab_juridico`
- [ ] **phpMyAdmin:** ejecutar los ALTER TABLE del historial (companies, users, tickets — ver sección Base de datos)
- [ ] **phpMyAdmin:** insertar usuario admin: `INSERT INTO users (username, password_hash, role) VALUES ('admin', '<hash bcrypt de 1111>', 'steven_marin');`
- [ ] **cPanel → Setup Node.js App:** configurar app con los valores de la sección "Configuración Node.js en cPanel"
- [ ] **Crear .env en servidor:** crear manualmente en `public_html/api.marinyabogados.com.co/.env` (ver sección Variables de entorno)
- [ ] **Crear carpeta uploads/:** en File Manager → `public_html/api.marinyabogados.com.co/uploads/`
- [ ] **GitHub → Secrets:** actualizar los 6 secrets (FTP_HOST, FTP_USER, FTP_PASS, FTP_FRONTEND_DIR, FTP_BACKEND_DIR, VITE_API_URL)
- [ ] **Primer deploy:** lanzar manualmente ambos workflows desde GitHub Actions → Run workflow
- [ ] Actualizar multer a 2.x en backend (advertencia de seguridad en multer 1.x)
- [ ] Si el deploy de FTP falla por timeout, re-ejecutar manualmente desde GitHub Actions → Re-run jobs

## Historial del proyecto

Ver historial completo de funcionalidades UI en `frontend/CLAUDE.md`.
