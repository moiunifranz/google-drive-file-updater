# Google Drive File Updater

Aplicación web 100% frontend diseñada para automatizar la sustitución y actualización segura de archivos existentes dentro de una jerarquía de carpetas en Google Drive, preservando intactos sus identificadores (`fileId`), enlaces compartidos, permisos de acceso y ubicación en las carpetas.

---

## 🌟 Características principales

- **100% Client-Side (Frontend):** Sin backend en Node.js, sin Express, sin base de datos (PostgreSQL, MongoDB, Firebase o Supabase). Toda la lógica se ejecuta directamente en el navegador del usuario.
- **Autenticación con Google Identity Services (GIS):** Flujo seguro OAuth 2.0 mediante Token Client en memoria. Nunca se almacenan `client_secret` ni refresh tokens permanentes.
- **Búsqueda Bounded Recursiva:** Rastreo exhaustivo limitado estrictamente a la carpeta raíz predefinida y todas sus subcarpetas descendientes (`'<folderId>' in parents and trashed = false`). Nunca busca fuera de esa estructura ni en todo "Mi unidad".
- **Comparación Exacta:** Mapeo de archivos locales contra el índice por coincidencia exacta de nombres (con opción configurable para ignorar mayúsculas/minúsculas).
- **Control Antierrores para Duplicados:**
  - **1 coincidencia encontrada:** Selección automática para reemplazo.
  - **2 o más coincidencias (duplicados en distintas materias/carpetas):** Bloqueo de reemplazo automático. Requiere revisión manual explícita en un modal interactivo con selección granular por ubicación.
  - **0 coincidencias:** El archivo se marca como "No encontrado en Drive" y se ignora por completo. **La aplicación jamás crea archivos nuevos (`files.create`)**.
- **Preservación Total de Metadatos:** Utiliza `files.update` (resumable upload) sobre el `fileId` existente. No realiza `delete + create`, conservando el enlace web, historial y permisos.
- **Cola Concurrente y Resumable Upload:** Carga con concurrencia controlada (3 tareas simultáneas) con seguimiento de progreso en tiempo real (0% - 100%) y reintento individual en caso de fallo de red.
- **Exportación de Reportes:** Descarga de logs de operaciones en formatos `.csv` y `.txt`.
- **Historial Local:** Registro no sensible en `localStorage` (fecha, hora, cantidad de archivos actualizados y errores).
- **Despliegue Gratuito en GitHub Pages:** Totalmente compatible con rutas relativas y flujo automatizado mediante GitHub Actions.

---

## 🔒 Scope de Google Drive y Seguridad

### Scope Utilizado
```text
https://www.googleapis.com/auth/drive
```

### ¿Por qué se utiliza este Scope?
La API de Google Drive ofrece el scope restrictivo `https://www.googleapis.com/auth/drive.file`, pero este scope **únicamente otorga acceso a archivos que fueron creados o abiertos directamente por la misma aplicación**.

Dado que esta herramienta tiene como objetivo actualizar una estructura académica preexistente (semestres, materias, proyectos) con archivos previamente subidos por profesores u otros usuarios:
1. Necesita listar recursivamente carpetas y archivos preexistentes dentro de la carpeta raíz.
2. Necesita actualizar el contenido binario de dichos archivos existentes con `files.update`.

Por ello, el scope `https://www.googleapis.com/auth/drive` es indispensable para acceder a archivos no creados originalmente por la aplicación.

### Principios de Seguridad
- **Sin servidor intermediario:** Las credenciales nunca pasan por ningún backend privado.
- **Sin `client_secret`:** Solo se expone el `Client ID` público de OAuth en el archivo `.env`.
- **En memoria:** Los Access Tokens residen exclusivamente en memoria volátil de la sesión activa y son revocados formalmente con `google.accounts.oauth2.revoke` al desconectar.

---

## 📁 Carpeta Raíz Fija

La aplicación está configurada internamente para operar sobre la siguiente carpeta raíz:

- **ID de la carpeta:** `1STFdAXTtj8ACSq2-BV21JoWK0kl2GEth`
- **Enlace de Google Drive:** [https://drive.google.com/drive/folders/1STFdAXTtj8ACSq2-BV21JoWK0kl2GEth](https://drive.google.com/drive/folders/1STFdAXTtj8ACSq2-BV21JoWK0kl2GEth)

### ¿Cómo cambiar el ID en el futuro?
Para cambiar la carpeta raíz o la concurrencia, edita el archivo:
`src/config/driveConfig.js`:

```javascript
export const DRIVE_CONFIG = {
  ROOT_FOLDER_ID: "TU_NUEVO_ID_DE_CARPETA",
  ROOT_FOLDER_URL: "https://drive.google.com/drive/folders/TU_NUEVO_ID_DE_CARPETA",
  UPLOAD_CONCURRENCY: 3,
  // ...
};
```

---

## 📋 Requisitos Previos

- **Node.js** (versión 18 o superior recomendada; probado en v20/v24).
- **npm** (incluido con Node.js).
- **Cuenta de Google** con permisos de edición sobre la carpeta de Drive `1STFdAXTtj8ACSq2-BV21JoWK0kl2GEth`.
- **Cuenta de GitHub** (para el despliegue automático en GitHub Pages).

---

## ⚙️ Guía Paso a Paso: Configurar Google Cloud Console

Para permitir que la aplicación se conecte con Google Drive desde el navegador, debes crear un **OAuth 2.0 Client ID** en Google Cloud:

### 1. Crear Proyecto en Google Cloud
1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. En la barra superior, haz clic en el selector de proyectos y luego en **"Nuevo proyecto"** (New Project).
3. Asígnale un nombre (por ejemplo, `drive-file-updater`) y pulsa **Crear**.

### 2. Habilitar la Google Drive API
1. En el menú de navegación lateral, dirígete a **APIs y servicios > Biblioteca** (APIs & Services > Library).
2. Busca `Google Drive API`.
3. Haz clic en el resultado y pulsa el botón azul **Habilitar** (Enable).

### 3. Configurar la Pantalla de Consentimiento OAuth (OAuth Consent Screen)
1. En el menú lateral, ve a **APIs y servicios > Pantalla de consentimiento de OAuth**.
2. Selecciona el tipo de usuario:
   - **Externo (External):** Para cualquier cuenta de Google (recomendado o cuentas de prueba).
   - **Interno (Internal):** Si estás dentro de una organización con Google Workspace.
3. Haz clic en **Crear**.
4. Completa la información básica requerida:
   - **Nombre de la aplicación:** `Google Drive File Updater`
   - **Correo de soporte del usuario:** Tu correo electrónico.
   - **Datos de contacto del desarrollador:** Tu correo electrónico.
5. Pulsa **Guardar y continuar**.
6. En la pestaña **Permisos (Scopes)**:
   - Pulsa **Agregar o quitar permisos** (Add or remove scopes).
   - Busca y marca: `.../auth/drive` (Ver, editar, crear y borrar todos tus archivos de Google Drive).
   - Pulsa **Actualizar** y luego **Guardar y continuar**.
7. En la pestaña **Usuarios de prueba (Test users)** (si el estado es "En prueba"):
   - Haz clic en **+ Agregar usuarios** e introduce tu cuenta de Google (y las cuentas de quienes vayan a usar la herramienta).
   - Pulsa **Guardar y continuar**.

### 4. Crear el OAuth Client ID
1. En el menú lateral, dirígete a **APIs y servicios > Credenciales** (Credentials).
2. Haz clic en **+ Crear credenciales > ID de cliente de OAuth** (+ Create Credentials > OAuth client ID).
3. En **Tipo de aplicación**, selecciona: **Aplicación web** (Web application).
4. Asigna un nombre: `Drive Updater Web Client`.

### 5. Configurar Orígenes de JavaScript Autorizados (Authorized JavaScript origins)
> [!IMPORTANT]
> Google Identity Services exige registrar exactamente los dominios/orígenes desde los cuales se cargará la página (sin barra `/` al final).

En la sección **Orígenes autorizados de JavaScript**, añade:

1. **Para desarrollo local:**
   ```text
   http://localhost:3000
   http://localhost:5173
   ```
2. **Para producción en GitHub Pages:**
   ```text
   https://TU_USUARIO.github.io
   ```
   *(Reemplaza `TU_USUARIO` por tu nombre de usuario en GitHub).*

*(Nota: En el flujo GIS Token Client en navegador no es necesario configurar URIs de redireccionamiento, ya que la autenticación se procesa mediante ventana emergente/postMessage).*

### 6. Copiar el Client ID
1. Haz clic en **Crear**.
2. Aparecerá una ventana con tu **ID de cliente** (con formato similar a `1234567890-abcdefg.apps.googleusercontent.com`).
3. Copia ese ID de cliente. **No necesitas el client secret**.

---

## 💻 Desarrollo Local

### 1. Clonar e Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto a partir del ejemplo:

```bash
cp .env.example .env
```

Abre `.env` y pega tu Client ID de Google:
```env
VITE_GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
```

### 3. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
La aplicación se abrirá en [http://localhost:3000](http://localhost:3000).

---

## 🚀 Despliegue en GitHub Pages

Este repositorio ya incluye el workflow de GitHub Actions en `.github/workflows/deploy.yml` configurado para compilar y desplegar automáticamente en cada push a la rama `main`.

### Pasos para publicar:

1. **Crear repositorio en GitHub:**
   Crea un nuevo repositorio en tu cuenta de GitHub (por ejemplo, `drive-uploader`).

2. **Configurar el Secret en GitHub:**
   - En tu repositorio de GitHub, ve a **Settings > Secrets and variables > Actions**.
   - Haz clic en **New repository secret**.
   - Nombre: `VITE_GOOGLE_CLIENT_ID`
   - Valor: Tu Client ID de Google Cloud.
   - Pulsa **Add secret**.

3. **Habilitar GitHub Pages en el repositorio:**
   - Ve a **Settings > Pages**.
   - En **Build and deployment > Source**, selecciona: **GitHub Actions**.

4. **Subir los cambios al repositorio:**
   ```bash
   git init
   git add .
   git commit -m "feat: Google Drive File Updater completo"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/drive-uploader.git
   git push -u origin main
   ```

5. **Verificar el despliegue:**
   - Ve a la pestaña **Actions** en tu repositorio para ver el progreso del workflow `Deploy to GitHub Pages`.
   - Una vez finalizado, tu sitio estará accesible en:
     ```text
     https://TU_USUARIO.github.io/drive-uploader/
     ```

6. **Actualizar Google Cloud Console:**
   Asegúrate de que `https://TU_USUARIO.github.io` esté añadido en los **Orígenes autorizados de JavaScript** en Google Cloud Console.

---

## 🛠️ Estructura del Proyecto

```text
├── .github/
│   └── workflows/
│       └── deploy.yml        # Flujo CI/CD automatizado para GitHub Pages
├── public/                   # Recursos estáticos
├── src/
│   ├── components/           # Componentes modulares de interfaz
│   │   ├── ConfirmModal.jsx  # Modal de confirmación final con advertencia de integridad
│   │   ├── DropZone.jsx      # Área drag & drop y selector de archivos
│   │   ├── DuplicateModal.jsx# Resolución interactiva de archivos duplicados
│   │   ├── FileTable.jsx     # Tabla de comparación, estados y destinos
│   │   ├── Header.jsx        # Barra superior con estado de Drive y usuario
│   │   ├── HistoryPanel.jsx  # Historial local de actualizaciones previas
│   │   ├── IndexingBanner.jsx# Visualizador del progreso del escaneo recursivo
│   │   ├── LoginButton.jsx   # Pantalla de bienvenida y conexión con Google GIS
│   │   ├── ProgressBar.jsx   # Barra de progreso porcentual
│   │   ├── ResultsModal.jsx  # Resultados finales y descarga de logs
│   │   ├── StatusBadge.jsx   # Insignias visuales de estado (Único, Múltiple, No encontrado)
│   │   └── SummaryCards.jsx  # Tarjetas con métricas cuantitativas
│   ├── config/
│   │   └── driveConfig.js    # ID de carpeta raíz, scopes y concurrencia
│   ├── hooks/
│   │   ├── useDriveIndex.js  # Estado y ciclo de indexación recursiva
│   │   ├── useFileMatcher.js # Mapeo de nombres y gestión de selecciones
│   │   ├── useGoogleAuth.js  # Ciclo de vida de Google Identity Services
│   │   └── useUploader.js    # Orquestador de la cola de subidas concurrentes
│   ├── services/
│   │   ├── driveApi.js       # Consultas y traducción de errores HTTP de Google Drive
│   │   ├── driveIndexer.js   # Algoritmo BFS para recorrido de árbol de carpetas
│   │   ├── googleAuth.js     # Integración con GIS Token Client
│   │   └── uploadService.js  # Resumable uploads mediante PATCH files.update y XHR
│   ├── utils/
│   │   ├── exportUtils.js    # Generadores de reportes CSV y TXT
│   │   ├── fileUtils.js      # Formateo de bytes, fechas y tipos MIME
│   │   └── pathUtils.js      # Análisis y formateo de jerarquías de carpetas
│   ├── App.jsx               # Componente principal integrador
│   ├── index.css             # Estilos globales y utilidades Tailwind CSS
│   └── main.jsx              # Punto de entrada de la aplicación React
├── .env.example              # Plantilla de variables de entorno
├── .gitignore                # Reglas de exclusión para Git
├── index.html                # Plantilla HTML con SDK de Google Identity Services
├── package.json              # Dependencias y scripts
├── tailwind.config.js        # Configuración de diseño y paleta de colores
└── vite.config.js            # Configuración de compilación con base relativa
```

---

## 🛡️ Flujo de Operación y Reglas Críticas

1. **Autenticación:** El usuario pulsa "Conectar con Google Drive" y autoriza los permisos requeridos.
2. **Navegación Visual Bajo Demanda (Lazy Loading):**
   - El sistema NO inicia ningún análisis masivo automático.
   - Presenta las carpetas hijas directas partiendo de `1STFdAXTtj8ACSq2-BV21JoWK0kl2GEth`.
   - El usuario hace clic en los semestres y materias navegando un nivel a la vez con migas de pan (*breadcrumbs*) y botón *Volver*.
3. **Selección de Carpeta de Trabajo:**
   - El usuario hace clic en **"Usar esta carpeta"** sobre la materia específica en la que trabajará.
4. **Análisis Bounded de la Carpeta:**
   - Al pulsar **"Analizar carpeta"**, el sistema realiza el análisis recursivo únicamente dentro de esa materia seleccionada (reduciendo el tiempo de escaneo de 10 minutos a escasos segundos).
5. **Carga Local y Evaluación:**
   - El usuario arrastra los archivos locales y el sistema compara sus nombres contra los archivos indexados de esa materia.
   - **Coincidencia Única:** Preseleccionada automáticamente.
   - **Múltiples Coincidencias:** Requiere revisión manual explícita en modal con selección de rutas.
   - **No encontrado:** Se marca y omite; nunca se crean archivos nuevos (`files.create` jamás se llama).
6. **Confirmación y Actualización:**
   - Modal de confirmación con advertencia de integridad.
   - Reemplazo binario con `files.update` (resumable upload) y concurrencia controlada (3 simultáneos).
7. **Reportes:** Descarga de log de operaciones en formatos `.csv` y `.txt`.

---

## 📄 Licencia

Este proyecto está disponible bajo la licencia MIT. Puedes usarlo, distribuirlo y modificarlo libremente.
