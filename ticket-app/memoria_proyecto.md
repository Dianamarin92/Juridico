# Memoria del Proyecto: Sistema de Gestión de Tickets Jurídicos (Marin & Abogados)

Este documento sirve como registro oficial del estado actual del desarrollo, la arquitectura, las decisiones tecnológicas tomadas y los pasos a seguir.

## 1. Arquitectura General
El proyecto actualmente se estructura como una **Single Page Application (SPA)** enfocada exclusivamente en el **Frontend**.
*   **Gestión de Estado (Mockup):** Toda la lógica de roles (Cliente, Abogada Líder, Abogada Asignada, Steven Marin), la base de datos de empresas y los tickets se manejan temporalmente en la memoria del navegador usando el estado nativo de React (`useState`). Esto permite validar la experiencia de usuario (UX) y la interfaz gráfica (UI) rápidamente con el cliente sin necesidad de un servidor.
*   **Flujo de Navegación:**
    1.  **Login Simulado:** Pantalla de entrada para elegir el rol de prueba.
    2.  **Directorio de Empresas (Dashboard):** Vista principal para roles administrativos que lista las empresas y muestra notificaciones (alertas rojas) si hay tickets nuevos.
    3.  **Lista de Tickets:** Vista intermedia que lista los casos de una empresa seleccionada.
    4.  **Detalle del Ticket:** Vista final que incluye la información del caso, un **hilo de chat** para comunicación asíncrona, y un **historial de auditoría** que registra cada cambio de estado (quién y cuándo).

## 2. Tecnologías Empleadas
*   **Frontend Core:** React.js
*   **Build Tool:** Vite (elegido por su extremada rapidez en el empaquetado y arranque en desarrollo).
*   **Estilos:** Vanilla CSS (CSS puro). Se implementó un sistema de diseño basado en variables CSS (`--primary-color`, `--surface-color`, etc.) para garantizar una estética premium, moderna y fácilmente escalable a "Modo Oscuro" si se requiere.
*   **Integración Continua y Despliegue (CI/CD):** GitHub Actions. Se configuró un flujo de trabajo (`deploy.yml`) que compila automáticamente el proyecto y lo publica en **GitHub Pages** cada vez que se suben cambios a la rama principal (`main`).
*   **Control de Versiones y Repositorio:** Git / GitHub.
    *   **URL del Repositorio:** `https://github.com/neland92/marinAbogados.git`
    *   **URL de la Aplicación (En Vivo):** `https://neland92.github.io/marinAbogados/`
    *   **Comandos habituales para actualizar el código:**
        ```bash
        git add .
        git commit -m "Descripción de los cambios"
        git push origin main
        ```

## 3. Tareas Completadas Hasta Ahora
- [x] **Análisis de Requerimientos:** Extracción de necesidades a partir de la reunión grabada con el cliente (Reunion1.mp4), identificando la necesidad de organizar el flujo de trabajo de las abogadas y eliminar la dependencia de WhatsApp.
- [x] **Configuración del Entorno:** Inicialización del proyecto Vite + React.
- [x] **Sistema de Diseño Base:** Creación del archivo `index.css` con variables, tipografía y estilos de tarjetas, tablas y botones.
- [x] **Maquetación de Login:** Pantalla inicial con selector de roles para facilitar las pruebas.
- [x] **Dashboard de Directorio:** Tabla principal con conteo de tickets y sistema de alertas (puntos rojos parpadeantes para tickets pendientes).
- [x] **Sistema de Comunicación:** Interfaz de hilo de chat dentro de cada ticket.
- [x] **Historial de Auditoría:** Registro automático de acciones dentro del ticket.
- [x] **Despliegue Automático:** Configuración de GitHub Actions superando el problema de dependencias en Google Drive (generación manual del `package-lock.json`).
- [x] **Actualización de Branding:** Cambio del nombre genérico a "Marin & Abogados" en toda la interfaz y ajustes de textos en la pantalla de Login.
- [x] **Mejora UI:** Rediseño de la tabla en el Dashboard para mostrar columnas separadas con los conteos exactos de tickets (Pendientes, En Proceso, En Revisión, y Enviados). Se actualizó el color del estado "Pendiente" a rojo para mayor resaltado visual. Se agregó un enlace exclusivo de "Informes" en el menú para el Steven Marin. Se añadió un botón de "Cerrar Sesión" en la barra superior.
- [x] **Datos Simulados y Panel de Tickets:** Actualización de logos (uso de imagen real), adición de tickets de prueba (COMP-01 y COMP-03), adición de 2 tickets adicionales "Enviados" a Distribuidora del Norte, y reemplazo de botones de estado por un menú desplegable (Combo Box) con nuevos estados ("En Proceso", "Enviado"). Se incluyó un botón de "Adjuntar" exclusivo en el hilo de chat para los abogados, mientras que para el rol "Cliente" se agregó un botón dedicado de "Subir Archivo" directamente en el panel lateral de "Adjuntos", permitiendo centralizar múltiples documentos por caso.
- [x] **Rediseño Estético General:** Migración de la paleta de colores a Blanco, Negro y Rojo (Corporativo). La barra superior (topbar) es ahora negra para mayor contraste, los botones tienen bordes más definidos (menos redondeados) y el fondo es de un gris/blanco sutil, dándole un look moderno, minimalista y elegante.
- [x] **Gestión de Asignaciones (UI):** Se agregó la visualización del responsable asignado a cada ticket en la tabla general. En la vista de detalles, dentro del recuadro "Información", se implementó un menú desplegable (Combo Box) que permite reasignar el ticket a los diferentes roles, registrando automáticamente el cambio en el historial de auditoría. Esta opción de asignación es visible y operable de forma exclusiva para el personal de la firma; para el rol "Cliente", toda esta información se oculta completamente por seguridad y privacidad.
- [x] **Flujo de Navegación del Cliente:** Se optimizó la experiencia del usuario cliente. Al iniciar sesión, ingresan directamente a la lista de "Mis Tickets" sin pasar por el Directorio de Empresas global. El menú lateral se adaptó para reflejar esto y se eliminó el botón de "Volver" hacia vistas administrativas.
- [x] **Restricciones de Cliente:** Se ocultaron varias funcionalidades en la vista del ticket para el rol "Cliente", específicamente el selector de "Cambiar Estado" y el bloque completo de "Historial (Auditoría)". De este modo, el cliente no puede modificar el estado de su caso ni ver el registro de auditoría interno del despacho.
- [x] **Personalización de Roles:** Se cambió la denominación genérica del rol "Abogado Jefe" por "Steven Marin" en todo el sistema (menús, asignaciones, historial y panel de informes), dándole un toque más personalizado a la aplicación.
## 4. Problemas Conocidos y Tareas Pendientes

### Problemas Actuales (Limitaciones Técnicas)
*   **Entorno Google Drive:** El desarrollo local con Node.js (`npm install`) falla al ejecutarse directamente dentro de la carpeta sincronizada con Google Drive (`G:\Mi unidad`) debido a problemas del sistema de archivos con los enlaces simbólicos de Node.
    *   *Solución temporal:* Se delegó la instalación y compilación a GitHub Actions, o se recomienda mover la carpeta fuera de Drive para programar localmente.
*   **Volatilidad de Datos:** Como la aplicación es 100% Frontend (Mock), cualquier ticket creado o mensaje enviado se borrará al recargar la página.

### Tareas Pendientes (Siguientes Fases)
1.  **Diseño de la Base de Datos Real:** Migrar la estructura de datos quemada (`MOCK_COMPANIES`) a un modelo relacional o NoSQL.
2.  **Desarrollo del Backend Propio:** Construir una API (Node.js/Express, PHP u otro) para manejar la creación de usuarios, autenticación segura y persistencia de tickets y chats.
3.  **Gestión de Archivos Reales:** Reemplazar el botón simulado de "Subir Archivo" por una integración real con un servicio de almacenamiento (Amazon S3, Supabase Storage, o el propio hosting) para que el cliente pueda descargar los PDFs directamente.
4.  **Sistema de Notificaciones Reales:** Enviar correos electrónicos o notificaciones push cuando el Abogado Jefe apruebe un documento para avisarle al cliente.
