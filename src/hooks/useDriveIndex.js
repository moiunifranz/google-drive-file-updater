import { useState, useCallback, useEffect } from 'react';
import { driveIndexer } from '../services/driveIndexer';
import { DRIVE_CONFIG } from '../config/driveConfig';

const LOCAL_STORAGE_CACHE_KEY = 'drive_uploader_index_stats';

/**
 * Hook para gestionar la indexación recursiva en memoria de Google Drive.
 */
export function useDriveIndex() {
  const [index, setIndex] = useState(null);
  const [foldersMap, setFoldersMap] = useState(null);
  const [stats, setStats] = useState(null);
  const [rootName, setRootName] = useState('Carpeta Raíz');
  const [folderPath, setFolderPath] = useState('');
  const [isIndexing, setIsIndexing] = useState(false);
  const [progress, setProgress] = useState({
    scannedFolders: 0,
    foundFiles: 0,
    currentFolder: '',
    status: 'idle'
  });
  const [error, setError] = useState(null);

  // Cargar estadísticas previas guardadas en localStorage si existen
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.stats) setStats(parsed.stats);
        if (parsed.rootName) setRootName(parsed.rootName);
        if (parsed.folderPath) setFolderPath(parsed.folderPath);
      }
    } catch {
      // ignore
    }
  }, []);

  /**
   * Inicia el análisis recursivo estricto desde la carpeta de trabajo seleccionada.
   * 
   * @param {string} targetFolderId ID de la carpeta seleccionada (selectedFolderId)
   * @param {string} targetFolderName Nombre de la carpeta seleccionada
   * @param {string} targetFolderPath Ruta completa de navegación de la carpeta
   * @param {string} token Token de acceso OAuth
   */
  const scanDrive = useCallback(async (targetFolderId, targetFolderName, targetFolderPath, token) => {
    if (!token) {
      setError('Se requiere una sesión activa con Google Drive.');
      return;
    }
    if (!targetFolderId) {
      setError('Debes seleccionar una carpeta de trabajo antes de analizar.');
      return;
    }

    setIsIndexing(true);
    setError(null);
    setProgress({
      scannedFolders: 0,
      foundFiles: 0,
      currentFolder: targetFolderName || 'Conectando...',
      status: 'starting'
    });

    try {
      const result = await driveIndexer.indexHierarchy(
        targetFolderId,
        token,
        (prog) => {
          setProgress(prog);
        },
        targetFolderPath,
        targetFolderName
      );

      setIndex(result.index);
      setFoldersMap(result.foldersMap);
      setStats(result.stats);
      setRootName(result.rootName);
      setFolderPath(result.folderPath || targetFolderPath);

      // Guardar estadísticas no sensibles
      try {
        localStorage.setItem(
          LOCAL_STORAGE_CACHE_KEY,
          JSON.stringify({
            stats: result.stats,
            rootName: result.rootName,
            folderPath: result.folderPath || targetFolderPath
          })
        );
      } catch {
        // ignore quota limits
      }
    } catch (err) {
      console.error('Error al indexar Google Drive:', err);
      setError(err.message || 'Ocurrió un error inesperado al analizar la carpeta seleccionada.');
    } finally {
      setIsIndexing(false);
    }
  }, []);

  /**
   * Cancela el escaneo actual.
   */
  const cancelScan = useCallback(() => {
    driveIndexer.cancel();
    setIsIndexing(false);
    setProgress(prev => ({ ...prev, status: 'canceled' }));
  }, []);

  /**
   * Limpia el índice en memoria.
   */
  const clearIndex = useCallback(() => {
    setIndex(null);
    setFoldersMap(null);
    setStats(null);
    setProgress({
      scannedFolders: 0,
      foundFiles: 0,
      currentFolder: '',
      status: 'idle'
    });
    try {
      localStorage.removeItem(LOCAL_STORAGE_CACHE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    index,
    foldersMap,
    stats,
    rootName,
    folderPath,
    isIndexing,
    progress,
    error,
    scanDrive,
    cancelScan,
    clearIndex,
    clearError: () => setError(null)
  };
}
