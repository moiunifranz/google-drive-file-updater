/**
 * Configuración central de Google Drive y la aplicación.
 */
export const DRIVE_CONFIG = {
  // ID estricto de la carpeta raíz de Google Drive donde reside la jerarquía
  ROOT_FOLDER_ID: "1STFdAXTtj8ACSq2-BV21JoWK0kl2GEth",
  
  // Nombre por defecto / fallback de la carpeta raíz si no se ha consultado aún la API
  DEFAULT_ROOT_NAME: "ver_act",
  
  // URL directa de la carpeta en Google Drive para referencia rápida
  ROOT_FOLDER_URL: "https://drive.google.com/drive/folders/1STFdAXTtj8ACSq2-BV21JoWK0kl2GEth",
  
  // Número de subidas simultáneas para evitar saturación de red o rate limits (HTTP 429)
  UPLOAD_CONCURRENCY: 3,
  
  // Tamaño de página para consultas a Google Drive API v3 (máximo permitido por la API: 1000)
  PAGE_SIZE: 1000,
  
  // Campos estrictos para optimizar rendimiento de transferencia
  FIELDS_LIST: "files(id, name, mimeType, parents, size, modifiedTime), nextPageToken",
  
  // Scope de Google OAuth requerido:
  // Se requiere 'https://www.googleapis.com/auth/drive' porque la aplicación debe leer y actualizar
  // archivos preexistentes en la jerarquía que NO fueron creados por esta aplicación.
  // El scope restrictivo 'drive.file' sólo da acceso a archivos creados por la propia app.
  OAUTH_SCOPES: "https://www.googleapis.com/auth/drive",
  
  // Client ID obtenido desde Vite env
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || ""
};
