/**
 * Utilidades para procesamiento y presentación visual de rutas de Google Drive.
 */

/**
 * Divide una ruta de Drive separada por " / " en sus segmentos componentes.
 * @param {string} fullPath 
 * @returns {string[]}
 */
export function splitPathParts(fullPath) {
  if (!fullPath || typeof fullPath !== 'string') return [];
  return fullPath.split(' / ').map(p => p.trim()).filter(Boolean);
}

/**
 * Obtiene el nombre de la carpeta padre inmediata a partir de una ruta completa.
 * @param {string} fullPath 
 * @returns {string}
 */
export function getParentFolderName(fullPath) {
  const parts = splitPathParts(fullPath);
  if (parts.length <= 1) return 'Raíz';
  return parts[parts.length - 2];
}

/**
 * Retorna la ruta del directorio (sin el nombre del archivo final).
 * @param {string} fullPath 
 * @returns {string}
 */
export function getDirectoryPath(fullPath) {
  const parts = splitPathParts(fullPath);
  if (parts.length <= 1) return '/';
  return parts.slice(0, -1).join(' / ');
}
