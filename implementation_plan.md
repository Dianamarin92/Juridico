# Plan de Implementación: Sistema Web de Tickets Legales

Este documento detalla el plan de desarrollo para la plataforma web de gestión de solicitudes legales (sistema de tickets), basado en la necesidad de centralizar la comunicación, eliminar el uso de WhatsApp para solicitudes formales y organizar el flujo de trabajo interno de la firma de abogados.

## Resumen del Proyecto

Se desarrollará una aplicación web (Single Page Application) que actuará como un portal corporativo. Los clientes podrán iniciar sesión, crear tickets de servicio (ej. elaboración de un reglamento, despido, etc.) y adjuntar documentos. El equipo legal recibirá estas solicitudes en un panel organizado, donde se asignarán tareas, se hará seguimiento y el administrador (tú) podrá revisar y aprobar el trabajo antes de enviarlo al cliente final.

## User Review Required

> [!IMPORTANT]
> **Decisión de Arquitectura Backend:** Para que este sistema funcione en la vida real, requiere una base de datos y almacenamiento de archivos. Propongo usar **Supabase** (una alternativa de código abierto a Firebase que incluye base de datos SQL, Autenticación y Almacenamiento de archivos) por su facilidad de integración y bajo costo inicial. Otra opción es iniciar construyendo solo el **Frontend (Maqueta Funcional)** con datos falsos (mock data) para validar el diseño visual primero. ¿Estás de acuerdo en empezar con la maqueta funcional del Frontend y luego integrar Supabase?

> [!WARNING]
> **Diseño y Estilos:** Siguiendo directrices de diseño moderno, la interfaz no usará plantillas aburridas. Implementaremos un diseño "Premium" (estilo Glassmorphism, paletas oscuras o elegantes, animaciones sutiles y tipografía moderna). ¿Tienes alguna preferencia de colores corporativos (ej. azul marino, negro y dorado)?

## Open Questions

1. **Flujo de Asignación:** ¿Quieres que el sistema asigne los tickets automáticamente a las abogadas de forma rotativa, o prefieres que la "abogada líder" asigne los tickets manualmente a su equipo?
2. **Notificaciones:** Para la primera versión, ¿las alertas (cuando se crea un ticket o se necesita tu revisión) deben ser solo visuales dentro de la plataforma, o también quieres notificaciones por correo electrónico?

## Arquitectura Tecnológica Propuesta

- **Frontend:** React + Vite (Rápido, moderno y escalable).
- **Estilos:** Vanilla CSS con variables nativas, priorizando un diseño premium y responsivo.
- **Backend & Base de Datos:** Supabase (Autenticación, PostgreSQL para los tickets, Storage para los archivos).
- **Enrutamiento:** React Router para el manejo de múltiples vistas.

## Funcionalidades y Roles

### 1. Rol: Cliente Final
- **Vistas:**
  - Login / Registro.
  - Dashboard: Lista de sus tickets activos e históricos.
  - Nuevo Ticket: Formulario para crear solicitud (Tipo de trámite, Descripción, Carga de archivos adjuntos).
  - Detalle del Ticket: Ver estado ("En proceso", "En revisión", "Finalizado") y descargar el documento final.

### 2. Rol: Abogada (Líder / Operativa)
- **Vistas:**
  - Dashboard: Lista de tickets asignados (Bandeja de entrada).
  - Detalle de Tarea: Ver requerimiento y documentos del cliente.
  - Subida de Borrador: Opción para subir el documento trabajado para que pase a estado "En revisión por Administrador".

### 3. Rol: Administrador (Tú)
- **Vistas:**
  - Panel General: Visión global de todos los tickets de todas las empresas.
  - Bandeja de Revisión: Tickets marcados como completados por las abogadas que requieren tu aprobación.
  - Aprobación: Botón para "Aprobar y Enviar al Cliente" (el ticket pasa a finalizado y el documento queda en la carpeta del cliente) o "Rechazar/Corregir" (vuelve a la abogada con observaciones).

## Plan de Ejecución (Fases)

### Fase 1: Configuración y Diseño Base (Frontend)
- [ ] Inicializar el proyecto React con Vite en la carpeta `juridico/ticket-app`.
- [ ] Configurar la estructura de carpetas (componentes, páginas, estilos, servicios).
- [ ] Crear el sistema de diseño en `index.css` (Colores, tipografías, variables, clases base para estilo premium).

### Fase 2: Componentes y Vistas Estáticas
- [ ] Crear vistas de Autenticación (Login).
- [ ] Desarrollar la vista del Dashboard del Cliente (Lista de tickets y creación de tickets).
- [ ] Desarrollar la vista del Dashboard Interno (Vista tipo tablero Kanban o lista para las abogadas y administrador).
- [ ] Conectar las vistas con React Router utilizando datos de prueba (Mock Data) para validar el flujo visualmente.

### Fase 3: Integración y Lógica (Backend)
- [ ] Configurar el proyecto de Supabase.
- [ ] Implementar la autenticación de usuarios por roles.
- [ ] Conectar la base de datos para la creación, lectura y actualización de tickets.
- [ ] Implementar la subida y descarga de archivos adjuntos usando Supabase Storage.

## Verification Plan

### Manual Verification
- Te pediré que corras la aplicación web en tu entorno local (`npm run dev`).
- Ingresaremos con diferentes usuarios de prueba (Cliente, Abogada, Administrador) para validar que el flujo de creación de un ticket, asignación, trabajo, revisión y entrega funcione de principio a fin sin necesidad de usar WhatsApp.
- Validaremos que el diseño cumpla con los estándares visuales premium esperados.
