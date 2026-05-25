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
| GET/POST | `/companies` | Listar / crear empresas |
| GET/POST | `/tickets` | Listar / crear tickets |
| PUT | `/tickets/:id` | Actualizar ticket |
| GET/POST | `/messages` | Mensajes de un ticket |
| POST | `/files/upload` | Subir archivo |
| GET | `/files` | Archivos de un ticket |
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

## Frontend — estructura clave

```
frontend/src/
├── App.jsx              Sistema de tickets (mock data aún — pendiente conectar API)
├── LandingPage.jsx      Sitio institucional con info del brochure
├── landing.css          Estilos landing (paleta: #1a1a1a, #c0392b, #fff)
├── index.css            Estilos sistema de tickets
└── services/
    └── api.js           Capa HTTP → llama a api.marinabogados.funec.org
```

## Pendientes

- [ ] Conectar `App.jsx` a la API real (reemplazar `MOCK_COMPANIES` con llamadas a `api.js`)
- [ ] Insertar primer usuario real en la BD (`funecor_marin_abogados.users`)
- [ ] Probar login real con JWT
- [ ] Configurar multer 2.x en backend (advertencia de seguridad en multer 1.x)
- [ ] Crear carpeta `uploads/` en servidor: `mkdir -p public_html/api.marinabogados/uploads`

## Historial del proyecto

Ver historial completo de funcionalidades UI en `frontend/CLAUDE.md`.
