/**
 * Utilidades para manejo y formateo de archivos.
 */

/**
 * Formatea un tamaño numérico de bytes en formato legible (B, KB, MB, GB).
 * @param {number|string} bytes 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 2) {
  const num = Number(bytes);
  if (isNaN(num) || num === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));

  return parseFloat((num / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formatea una fecha ISO en formato legible local en español.
 * @param {string|Date} isoString 
 * @returns {string}
 */
export function formatDate(isoString) {
  if (!isoString) return 'Desconocida';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Desconocida';
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Desconocida';
  }
}

/**
 * Obtiene el MIME type del archivo local con fallback a application/octet-stream.
 * @param {File} file 
 * @returns {string}
 */
export function getFileMimeType(file) {
  if (file && file.type && file.type.trim() !== '') {
    return file.type;
  }
  return 'application/octet-stream';
}

/**
 * Obtiene la extensión de un nombre de archivo.
 * @param {string} fileName 
 * @returns {string}
 */
export function getFileExtension(fileName) {
  if (!fileName || typeof fileName !== 'string') return '';
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.substring(lastDot + 1).toLowerCase();
}
