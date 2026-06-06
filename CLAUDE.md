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
- **Node.js:** v20.20.2 via Passenger (cPanel → Setup Node.js App)
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

### Columna `company_id` en `file_uploads` (ALTER ejecutado en producción — 2026-06-04)

```sql
ALTER TABLE file_uploads 
  MODIFY COLUMN ticket_id INT NULL,
  ADD COLUMN company_id INT NULL AFTER ticket_id,
  ADD FOREIGN KEY fk_company_file (company_id) REFERENCES companies(id) ON DELETE CASCADE;
```

### Columnas `is_new` y `is_active` (ALTER ejecutado en producción — 2026-06-01)

```sql
ALTER TABLE tickets ADD COLUMN is_new TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE companies ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
```

### Columna `is_active` en `users` (ALTER ejecutado en producción — 2026-06-06)

```sql
ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
```

### Columna `name` en `users` (ALTER ejecutado en producción — 2026-06-06)

```sql
ALTER TABLE users ADD COLUMN name VARCHAR(100) DEFAULT NULL AFTER username;
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

## Funcionalidades implementadas (al 2026-06-06)

### Vista cliente
- Al iniciar sesión va directo a **Mis Tickets** (no pasa por directorio de empresas)
- **Nombre de empresa** visible en la esquina superior derecha de la barra de navegación
- **Resumen por estado** en 4 tarjetas: Pendientes / En Proceso / En Revisión / Enviados
- Lista de tickets como tarjetas con título, fecha y badge de estado
- **Crear ticket:** modal con asunto, descripción y adjuntar múltiples archivos; la descripción se envía automáticamente como primer mensaje del hilo
- **Eliminar ticket:** botón rojo visible solo si el ticket está en estado `pending`
- **Mi Perfil** en el sidebar: página completa (no modal) para editar datos de empresa (nombre, NIT, contacto, teléfono, correo) y cambiar contraseña
- Panel de adjuntos en ticket: botón **×** para eliminar cada archivo

### Vista admin (abogadas / Admin)
- **Directorio de empresas** muestra conteo de tickets por estado (badges de color) en cada fila, usando LEFT JOIN en la consulta SQL
- **+ Nueva Empresa:** formulario con datos de empresa (nombre, NIT, contacto, teléfono, correo) y acceso del cliente (usuario + contraseña) — crea empresa y usuario cliente en un solo paso
- **+ Nuevo Usuario:** formulario con campos: Nombre completo, Cédula, Correo electrónico (opcional), Contraseña, Rol
- **Eliminar empresa:** solo Admin — borra empresa, usuario cliente y todos sus tickets en cascada
- **Desactivar / Activar empresa:** solo Admin — con confirmación; fila desactivada aparece con fondo rojo, nombre tachado y badge "Desactivada"; cliente no puede iniciar sesión
- Empresas desactivadas: solo visibles para Admin; Abogada Líder y Abogada Asignada no las ven
- **Punto rojo en tickets nuevos:** desaparece al abrir el ticket O al cambiar su estado (`is_new = false`)
- **Mi Perfil (admin):** barra de progreso de almacenamiento (límite 5 GB) y cambio de contraseña
- **Perfil Empresa:** lista empresas; al entrar muestra datos editables, conteo de tickets por estado, y documentos (subir/ver/descargar/eliminar); popup de previsualización con info de empresa + vista de imagen o PDF
- **Auto-NIT en nueva empresa:** campo Usuario se sincroniza al escribir el NIT
- **Usuarios del Sistema** (Admin y Abogada Líder): tabla con nombre, cédula, correo, rol y estado de todos los usuarios; botones Editar (nombre, correo, rol, contraseña) y Desactivar/Activar; usuario desactivado no puede iniciar sesión
- Rol `steven_marin` se muestra como **Admin** en toda la interfaz
- Al cerrar sesión va directamente al login (no a la landing)
- **Nombre del usuario** visible en la barra superior (en lugar del rol)
- **Favicon** configurado con el logo de Marín & Abogados
- Login por `username` (cédula/NIT), no por email

### Permisos por rol

| Acción | Admin | Abogada Líder | Abogada Asignada |
|--------|:-----:|:-------------:|:----------------:|
| Ver directorio de empresas | ✅ | ✅ | ✅ |
| Ver empresas desactivadas | ✅ | ❌ | ❌ |
| Activar / Desactivar empresa | ✅ | ❌ | ❌ |
| Eliminar empresa | ✅ | ❌ | ❌ |
| Usuarios del Sistema | ✅ | ✅ | ❌ |
| Crear usuario Admin | ✅ | ❌ | ❌ |
| Informes | ✅ | ❌ | ❌ |

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
- Ya insertado en producción en `marinyab_juridico.users`

## Pendientes — migración a nuevo hosting (marinyabogados.com.co)

### Completado (2026-06-02)
- [x] **cPanel → Dominios:** dominio principal `marinyabogados.com.co` → `public_html/`
- [x] **cPanel → Dominios:** subdominio `api.marinyabogados.com.co` → `public_html/api.marinyabogados.com.co/`
- [x] **cPanel → MySQL Databases:** BD `marinyab_juridico` creada, usuario `marinyab_marin` creado con ALL PRIVILEGES
- [x] **vite.config.js:** `base` cambiado a `/marinyabogados/` (frontend vive en `public_html/marinyabogados/`)

### Completado (2026-06-04)
- [x] **phpMyAdmin:** acceso resuelto con usuario `marinyab_marin`
- [x] **phpMyAdmin:** `backend/database.sql` importado en `marinyab_juridico`
- [x] **phpMyAdmin:** ALTER TABLEs ejecutados (companies, users, tickets)
- [x] **phpMyAdmin:** usuario admin insertado con hash bcrypt correcto
- [x] **cPanel → Setup Node.js App:** Node.js 20.20.2, app root y startup file configurados
- [x] **Crear .env en servidor:** creado con credenciales correctas
- [x] **Crear carpeta uploads/:** creada en `public_html/api.marinyabogados.com.co/uploads/`
- [x] **GitHub → Secrets:** 6 secrets actualizados (FTP host cambiado a `ftp.marinyabogados.com.co`)
- [x] **Deploy backend y frontend:** ambos workflows funcionando
- [x] **Sistema funcionando:** login con admin/1111 exitoso en producción

### Notas de configuración importantes
- **NODE_PATH:** configurado como variable de entorno en Setup Node.js App → `/home/marinyab/public_html/api.marinyabogados.com.co/node_modules`
- **npm install en servidor:** correr manualmente si hay cambios en `package.json`: `source /home/marinyab/nodevenv/public_html/api.marinyabogados.com.co/20/bin/activate && cd /home/marinyab/public_html/api.marinyabogados.com.co && npm install --prod`
- **Firewall Dongee:** fue necesario desactivarlo para permitir conexiones FTP desde GitHub Actions

### Pendiente
- [ ] Actualizar multer a 2.x en backend (advertencia de seguridad en multer 1.x)

## Historial del proyecto

Ver historial completo de funcionalidades UI en `frontend/CLAUDE.md`.
