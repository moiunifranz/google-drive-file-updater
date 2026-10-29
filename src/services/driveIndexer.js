import { DRIVE_CONFIG } from '../config/driveConfig';
import { getFolderMetadata, listFolderChildren } from './driveApi';

/**
 * Servicio encargado de recorrer de forma recursiva y exhaustiva
 * la jerarquía de Google Drive partiendo de ROOT_FOLDER_ID.
 */
class DriveIndexerService {
  constructor() {
    this.isIndexing = false;
    this.abortController = null;
  }

  /**
   * Detiene el proceso de indexación si está en curso.
   */
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.isIndexing = false;
    }
  }

  /**
   * Recorre recursivamente todas las subcarpetas dentro de targetFolderId.
   * Construye un índice en memoria mapeando nombre de archivo -> lista de ubicaciones.
   * 
   * @param {string} targetFolderId ID de la carpeta sobre la que se realizará el análisis (selectedFolderId)
   * @param {string} token 
   * @param {Function} onProgress Callback para reportar avance en tiempo real
   * @param {string|null} initialPath Ruta amigable de la carpeta seleccionada (ej: "Semestre 3 / PII-713")
   * @param {string|null} initialName Nombre de la carpeta seleccionada
   * @returns {Promise<{ index: Object, foldersMap: Map, stats: Object, rootName: string }>}
   */
  async indexHierarchy(targetFolderId, token, onProgress = null, initialPath = null, initialName = null) {
    if (this.isIndexing) {
      throw new Error('Ya hay una indexación en curso.');
    }

    this.isIndexing = true;
    this.abortController = new AbortController();

    try {
      // 1. Obtener información de la carpeta seleccionada si no viene proporcionada
      let folderName = initialName;
      if (!folderName) {
        const meta = await getFolderMetadata(targetFolderId, token);
        folderName = meta.name || 'Carpeta de Trabajo';
      }
      const folderPath = initialPath || folderName;

      // Estructuras en memoria
      const fileIndex = {}; // { [fileName]: Array<FileMatch> }
      const foldersMap = new Map(); // folderId -> folderInfo

      foldersMap.set(targetFolderId, {
        id: targetFolderId,
        name: folderName,
        path: folderPath,
        parentId: null
      });

      // Cola de carpetas por procesar (BFS)
      const folderQueue = [
        { id: targetFolderId, name: folderName, path: folderPath }
      ];

      let scannedFolders = 0;
      let foundFiles = 0;

      // Reporte inicial
      if (onProgress) {
        onProgress({
          scannedFolders,
          foundFiles,
          currentFolder: folderName,
          status: 'scanning'
        });
      }

      // Procesar la cola por lotes concurrentes para máxima velocidad
      const CONCURRENCY = 4;

      while (folderQueue.length > 0) {
        if (this.abortController.signal.aborted) {
          throw new Error('Indexación cancelada por el usuario.');
        }

        // Tomar hasta N carpetas para procesar concurrentemente
        const batch = folderQueue.splice(0, CONCURRENCY);

        await Promise.all(
          batch.map(async (folder) => {
            if (this.abortController.signal.aborted) return;

            let nextPageToken = null;

            // Recorrer todas las páginas de esta carpeta
            do {
              if (this.abortController.signal.aborted) return;

              const response = await listFolderChildren(folder.id, token, nextPageToken);
              const items = response.files || [];

              for (const item of items) {
                if (item.mimeType === 'application/vnd.google-apps.folder') {
                  // Es una subcarpeta: registrar y encolar
                  const subfolderPath = `${folder.path} / ${item.name}`;
                  foldersMap.set(item.id, {
                    id: item.id,
                    name: item.name,
                    path: subfolderPath,
                    parentId: folder.id
                  });

                  folderQueue.push({
                    id: item.id,
                    name: item.name,
                    path: subfolderPath
                  });
                } else {
                  // Es un archivo: registrar en el índice
                  foundFiles++;
                  const filePath = `${folder.path} / ${item.name}`;

                  const fileRecord = {
                    fileId: item.id,
                    name: item.name,
                    mimeType: item.mimeType,
                    parentId: folder.id,
                    parentName: folder.name,
                    path: filePath,
                    size: item.size ? Number(item.size) : 0,
                    modifiedTime: item.modifiedTime || null
                  };

                  if (!fileIndex[item.name]) {
                    fileIndex[item.name] = [];
                  }
                  fileIndex[item.name].push(fileRecord);
                }
              }

              nextPageToken = response.nextPageToken || null;
            } while (nextPageToken);

            scannedFolders++;

            // Notificar avance
            if (onProgress) {
              onProgress({
                scannedFolders,
                foundFiles,
                currentFolder: folder.name,
                status: 'scanning'
              });
            }
          })
        );
      }

      const stats = {
        totalFolders: scannedFolders,
        totalFiles: foundFiles,
        uniqueNames: Object.keys(fileIndex).length,
        indexedAt: new Date().toISOString()
      };

      if (onProgress) {
        onProgress({
          scannedFolders,
          foundFiles,
          currentFolder: '',
          status: 'completed'
        });
      }

      return {
        index: fileIndex,
        foldersMap,
        stats,
        rootName: folderName,
        folderPath
      };
    } finally {
      this.isIndexing = false;
      this.abortController = null;
    }
  }
}

export const driveIndexer = new DriveIndexerService();
