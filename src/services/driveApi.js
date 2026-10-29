import { DRIVE_CONFIG } from '../config/driveConfig';

/**
 * Traduce respuestas y códigos de error HTTP de Google Drive a explicaciones claras en español.
 * @param {Response} response 
 * @param {any} errorData 
 * @returns {string}
 */
export function parseDriveError(response, errorData) {
  const status = response?.status;
  const errorObj = errorData?.error;
  const message = errorObj?.message || response?.statusText || 'Error desconocido';

  switch (status) {
    case 401:
      return 'Tu sesión ha expirado o el token de acceso es inválido. Por favor, reconéctate con Google Drive.';
    case 403:
      if (message.toLowerCase().includes('rate') || message.toLowerCase().includes('quota')) {
        return 'Se ha superado temporalmente la cuota de consultas de Google Drive. Por favor espera unos segundos.';
      }
      return 'No fue posible completar la acción porque tu cuenta de Google no tiene permisos de edición o acceso en esta carpeta/archivo.';
    case 404:
      return 'El archivo o carpeta no fue encontrado en Google Drive. Es posible que haya sido movido o eliminado.';
    case 429:
      return 'Límite de peticiones excedido (Rate Limit). Espera unos momentos antes de reintentar.';
    case 500:
    case 502:
    case 503:
      return 'Los servidores de Google Drive tuvieron un problema temporal. Intenta de nuevo en unos minutos.';
    default:
      return `Error en Google Drive (${status || 'Red'}): ${message}`;
  }
}

/**
 * Obtiene los metadatos de una carpeta específica.
 * @param {string} folderId 
 * @param {string} token 
 * @returns {Promise<Object>}
 */
export async function getFolderMetadata(folderId, token) {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,capabilities(canListChildren,canEdit)&supportsAllDrives=true`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(parseDriveError(res, errData));
    }

    return await res.json();
  } catch (err) {
    if (err.message && err.message.startsWith('Tu sesión') || err.message.startsWith('No fue posible')) {
      throw err;
    }
    throw new Error(`Error al verificar la carpeta raíz: ${err.message || 'Error de conexión'}`);
  }
}

/**
 * Lista ÚNICAMENTE las carpetas hijas directas de una carpeta (sin archivos, sin recursión).
 * Utilizado para la navegación interactiva bajo demanda / lazy loading.
 * 
 * @param {string} folderId 
 * @param {string} token 
 * @returns {Promise<Array<{ id: string, name: string, parents?: Array }>>}
 */
export async function listDirectSubfolders(folderId, token) {
  const folders = [];
  let nextPageToken = null;
  const q = `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const fields = 'files(id, name, parents), nextPageToken';

  do {
    let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=100&fields=${encodeURIComponent(fields)}&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true`;
    if (nextPageToken) {
      url += `&pageToken=${encodeURIComponent(nextPageToken)}`;
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(parseDriveError(res, errData));
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      folders.push(...data.files);
    }
    nextPageToken = data.nextPageToken || null;
  } while (nextPageToken);

  return folders;
}

/**
 * Lista los elementos hijos inmediatos (archivos y subcarpetas no eliminadas) de una carpeta.
 * @param {string} folderId 
 * @param {string} token 
 * @param {string|null} pageToken 
 * @returns {Promise<{ files: Array, nextPageToken?: string }>}
 */
export async function listFolderChildren(folderId, token, pageToken = null) {
  // Query estricta: sólo dentro de esta carpeta padre y que no esté en papelera
  const q = `'${folderId}' in parents and trashed = false`;
  let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=${DRIVE_CONFIG.PAGE_SIZE}&fields=${encodeURIComponent(DRIVE_CONFIG.FIELDS_LIST)}&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  
  if (pageToken) {
    url += `&pageToken=${encodeURIComponent(pageToken)}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(parseDriveError(res, errData));
  }

  return await res.json();
}

/**
 * Verifica el estado y permisos de un archivo antes de actualizarlo.
 * @param {string} fileId 
 * @param {string} token 
 * @returns {Promise<Object>}
 */
export async function verifyFileAccess(fileId, token) {
  return getFileVerificationMeta(fileId, token);
}

/**
 * Obtiene los metadatos completos de verificación de un archivo en Drive:
 * id, name, size, modifiedTime, md5Checksum, version, trashed, capabilities.
 * Permite comparar el estado antes y después del reemplazo para asegurar integridad.
 * 
 * @param {string} fileId 
 * @param {string} token 
 * @returns {Promise<{ id: string, name: string, size: string, modifiedTime: string, md5Checksum?: string, version?: string, trashed: boolean, capabilities?: Object }>}
 */
export async function getFileVerificationMeta(fileId, token) {
  const fields = 'id,name,size,modifiedTime,md5Checksum,version,trashed,capabilities(canEdit)';
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${encodeURIComponent(fields)}&supportsAllDrives=true`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(parseDriveError(res, errData));
  }

  const meta = await res.json();
  if (meta.trashed) {
    throw new Error('El archivo destino está actualmente en la papelera de Google Drive.');
  }

  if (meta.capabilities && meta.capabilities.canEdit === false) {
    throw new Error('Tu cuenta de Google no tiene permisos de edición sobre este archivo en Drive.');
  }

  return meta;
}
