# Marin & Abogados — Sistema de Gestión de Tickets Jurídicos

## Arquitectura

Monorepo con frontend y backend separados, desplegados de forma independiente via GitHub Actions + FTP.

```
juridico/
├── frontend/          React + Vite  →  FTP a public_html/
├── backend/           Node.js + Express  →  FTP a public_html/api/
└── .github/workflows/ deploy-frontend.yml / deploy-backend.yml
```

- **Frontend:** React 19 + Vite + CSS variables. Gestor de paquetes: **pnpm**.
- **Backend:** Node.js + Express + MySQL. Gestor de paquetes: **pnpm**.
- **Base de datos:** MySQL (crear con `backend/database.sql`).
- **Autenticación:** JWT guardado en `localStorage`.

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

## Secrets de GitHub Actions

Configurar en GitHub → Settings → Secrets and variables → Actions:

| Secret | Descripción |
|--------|-------------|
| `FTP_HOST` | Servidor FTP del hosting |
| `FTP_USER` | Usuario FTP |
| `FTP_PASS` | Contraseña FTP |
| `FTP_FRONTEND_DIR` | Ruta destino frontend (ej: `public_html/`) |
| `FTP_BACKEND_DIR` | Ruta destino backend (ej: `public_html/api/`) |
| `VITE_API_URL` | URL pública de la API (ej: `https://tudominio.com/api`) |
| `SSH_HOST` | Servidor SSH (para restart del backend) |
| `SSH_USER` | Usuario SSH |
| `SSH_PASS` | Contraseña SSH |

## Cómo funciona el deploy

- Push con cambios en `frontend/**` → solo corre `deploy-frontend.yml`
- Push con cambios en `backend/**` → solo corre `deploy-backend.yml`
- El backend se reinicia automáticamente con `touch tmp/restart.txt` (Passenger de cPanel)

## Verificar Node.js en el servidor (SSH)

```bash
node --version
npm --version
```

Si no hay Node.js disponible → contactar al hosting para activar Node.js via Passenger.

## Roles del sistema

| Rol | Permisos |
|-----|----------|
| `cliente` | Ve sus tickets, puede chatear y subir archivos |
| `abogada_asignada` | Ve y gestiona tickets asignados, cambia estado |
| `abogada_lider` | Asigna tickets, ve todo |
| `steven_marin` | Acceso total + panel de informes |

## Base de datos

Script completo en `backend/database.sql`. Crear en cPanel → phpMyAdmin.

## Historial del proyecto

Ver historial completo de funcionalidades en `frontend/CLAUDE.md`.
