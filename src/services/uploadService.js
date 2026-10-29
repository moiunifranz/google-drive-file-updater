import { DRIVE_CONFIG } from '../config/driveConfig';
import { getFileVerificationMeta, parseDriveError } from './driveApi';
import { getFileMimeType } from '../utils/fileUtils';

/**
 * Servicio encargado de actualizar el contenido de archivos existentes en Google Drive
 * mediante files.update (resumable upload) preservando fileId, URL, permisos y ubicación.
 * Incluye verificación estricta pre/post subida en Google Drive API.
 */
class UploadService {
  constructor() {
    this.activeXhrs = new Map(); // taskId -> XMLHttpRequest
  }

  /**
   * Actualiza el contenido binario de un archivo existente en Google Drive
   * y verifica explícitamente que los metadatos hayan cambiado en Drive antes de considerarlo exitoso.
   * 
   * @param {File} localFile Archivo del equipo del usuario
   * @param {string} targetFileId ID del archivo existente en Drive a reemplazar
   * @param {string} token Access Token de Google OAuth
   * @param {Function} onProgress Callback con porcentaje de 0 a 100
   * @param {string} taskId Identificador único de la tarea
   * @param {Object} targetContext Metadatos contextuales para trazabilidad (path, etc.)
   * @returns {Promise<Object>} Metadatos del archivo verificado
   */
  async updateFileContent(localFile, targetFileId, token, onProgress = null, taskId = null, targetContext = {}) {
    if (!localFile || !targetFileId || !token) {
      throw new Error('Parámetros insuficientes para la subida.');
    }

    const drivePath = targetContext.drivePath || targetFileId;
    console.log(`[UPLOAD START] Iniciando reemplazo para "${localFile.name}" (${localFile.size} bytes) -> Drive ID: ${targetFileId} [${drivePath}]`);

    // 1. Obtener metadatos ANTES de la subida para verificación estricta
    const beforeMeta = await getFileVerificationMeta(targetFileId, token);
    console.log(`[UPLOAD PRE-META] Metadatos previos en Google Drive:`, {
      fileId: targetFileId,
      name: beforeMeta.name,
      modifiedTime: beforeMeta.modifiedTime,
      md5Checksum: beforeMeta.md5Checksum || 'n/a',
      size: beforeMeta.size,
      version: beforeMeta.version
    });

    const mimeType = getFileMimeType(localFile);
    const fileSize = localFile.size;

    // 2. Iniciar sesión de subida resumable en Google Drive API v3 (PATCH files.update)
    const initUrl = `https://www.googleapis.com/upload/drive/v3/files/${targetFileId}?uploadType=resumable&supportsAllDrives=true`;

    const initResponse = await fetch(initUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': fileSize.toString()
      },
      body: JSON.stringify({}) // Preserva metadatos, actualiza únicamente el contenido binario
    });

    if (!initResponse.ok) {
      const errData = await initResponse.json().catch(() => ({}));
      const errorMsg = parseDriveError(initResponse, errData);
      console.error(`[UPLOAD INIT ERROR] Error al iniciar subida resumable:`, errorMsg);
      throw new Error(errorMsg);
    }

    // 3. Obtener la URL única de subida de la cabecera 'Location'
    const uploadSessionUrl = initResponse.headers.get('Location');
    if (!uploadSessionUrl) {
      throw new Error('Google Drive no devolvió una URL de subida resumable válida.');
    }

    // 4. Subir el contenido binario mediante XMLHttpRequest para seguimiento de progreso en tiempo real
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      if (taskId) {
        this.activeXhrs.set(taskId, xhr);
      }

      xhr.open('PUT', uploadSessionUrl, true);
      xhr.setRequestHeader('Content-Type', mimeType);

      // Evento de progreso continuo
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable && onProgress) {
          const percent = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
          onProgress(percent);
        }
      };

      // Carga completada
      xhr.onload = () => {
        if (taskId) this.activeXhrs.delete(taskId);
        console.log(`[UPLOAD RESPONSE] Código HTTP XHR recibido: ${xhr.status} para ${localFile.name} (fileId: ${targetFileId})`);

        if (xhr.status === 200 || xhr.status === 201) {
          resolve();
        } else {
          let errorMsg = `Error HTTP ${xhr.status} al reemplazar archivo en Drive.`;
          try {
            const errObj = JSON.parse(xhr.responseText);
            errorMsg = parseDriveError({ status: xhr.status }, errObj);
          } catch {}
          reject(new Error(errorMsg));
        }
      };

      // Errores de red
      xhr.onerror = () => {
        if (taskId) this.activeXhrs.delete(taskId);
        reject(new Error('Error de conexión o problema de red al subir los datos binarios.'));
      };

      // Cancelación
      xhr.onabort = () => {
        if (taskId) this.activeXhrs.delete(taskId);
        reject(new Error('Subida cancelada por el usuario.'));
      };

      // Enviar el archivo binario
      xhr.send(localFile);
    });

    // 5. Verificación POST-SUBIDA en Google Drive API v3
    // Comprobar que los metadatos realmente cambiaron en los servidores de Google
    console.log(`[VERIFY] Comprobando cambio real en Google Drive para ${targetFileId}...`);
    
    let afterMeta = null;
    let isVerified = false;

    // Se intentan hasta 2 consultas con delay de 600ms para manejar eventual consistency en Drive
    for (let attempt = 1; attempt <= 2; attempt++) {
      afterMeta = await getFileVerificationMeta(targetFileId, token);

      const modifiedChanged = afterMeta.modifiedTime !== beforeMeta.modifiedTime;
      const versionChanged = afterMeta.version && beforeMeta.version && afterMeta.version !== beforeMeta.version;
      const md5Changed = afterMeta.md5Checksum && beforeMeta.md5Checksum && afterMeta.md5Checksum !== beforeMeta.md5Checksum;
      const sizeChanged = afterMeta.size !== beforeMeta.size;
      const sizeMatchesLocal = Number(afterMeta.size) === localFile.size;

      console.log(`[UPLOAD POST-META] Intento ${attempt} de verificación:`, {
        fileId: targetFileId,
        beforeModified: beforeMeta.modifiedTime,
        afterModified: afterMeta.modifiedTime,
        modifiedChanged,
        beforeMd5: beforeMeta.md5Checksum,
        afterMd5: afterMeta.md5Checksum,
        md5Changed,
        beforeVersion: beforeMeta.version,
        afterVersion: afterMeta.version,
        versionChanged,
        beforeSize: beforeMeta.size,
        afterSize: afterMeta.size,
        sizeMatchesLocal
      });

      // Se considera verificado si cambió la fecha de modificación, o cambió la suma MD5,
      // o cambió la versión interna de Drive, o el tamaño cambió y coincide exactamente con el archivo local
      if (modifiedChanged || versionChanged || md5Changed || (sizeChanged && sizeMatchesLocal)) {
        isVerified = true;
        break;
      }

      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 600));
      }
    }

    if (!isVerified) {
      console.error(`[UPLOAD VERIFY ERROR] El servidor respondió 200 pero los metadatos en Google Drive no cambiaron:`, {
        before: beforeMeta,
        after: afterMeta
      });
      const verifyErr = new Error('verification-error: El servidor respondió, pero no se pudo verificar que el contenido haya cambiado en Google Drive.');
      verifyErr.isVerificationError = true;
      throw verifyErr;
    }

    if (onProgress) onProgress(100);

    console.log(`[UPLOAD VERIFIED] ✓ Reemplazo verificado exitosamente en Google Drive:`, {
      fileId: targetFileId,
      name: afterMeta.name,
      modifiedTime: afterMeta.modifiedTime,
      md5Checksum: afterMeta.md5Checksum,
      size: afterMeta.size
    });

    return {
      id: targetFileId,
      success: true,
      verified: true,
      beforeMeta,
      afterMeta
    };
  }

  /**
   * Cancela una subida activa por su taskId.
   * @param {string} taskId 
   */
  cancelTask(taskId) {
    if (this.activeXhrs.has(taskId)) {
      const xhr = this.activeXhrs.get(taskId);
      xhr.abort();
      this.activeXhrs.delete(taskId);
    }
  }

  /**
   * Cancela todas las subidas en curso.
   */
  cancelAll() {
    this.activeXhrs.forEach((xhr) => {
      try {
        xhr.abort();
      } catch {
        // ignore
      }
    });
    this.activeXhrs.clear();
  }

  /**
   * Ejecuta una cola de tareas de subida con control de concurrencia.
   * 
   * @param {Array<{ id: string, localFile: File, targetMatch: Object }>} tasks 
   * @param {string} token 
   * @param {Object} callbacks Callbacks de eventos ({ onTaskStart, onTaskProgress, onTaskSuccess, onTaskError, onQueueProgress })
   * @param {number} concurrency Concurrencia máxima
   * @returns {Promise<Array>} Resultados de las tareas
   */
  async processQueue(
    tasks,
    token,
    callbacks = {},
    concurrency = DRIVE_CONFIG.UPLOAD_CONCURRENCY
  ) {
    const {
      onTaskStart,
      onTaskProgress,
      onTaskSuccess,
      onTaskError,
      onQueueProgress
    } = callbacks;

    const queue = [...tasks];
    const results = [];
    let completedCount = 0;
    const totalTasks = tasks.length;

    // Worker que toma tareas hasta vaciar la cola
    const worker = async () => {
      while (queue.length > 0) {
        const task = queue.shift();
        if (!task) break;

        if (onTaskStart) onTaskStart(task);

        try {
          const res = await this.updateFileContent(
            task.localFile,
            task.targetMatch.fileId,
            token,
            (percent) => {
              if (onTaskProgress) onTaskProgress(task.id, percent);
            },
            task.id,
            { drivePath: task.targetMatch?.path }
          );

          completedCount++;
          const result = {
            taskId: task.id,
            success: true,
            fileId: task.targetMatch.fileId,
            fileName: task.localFile.name,
            drivePath: task.targetMatch.path,
            data: res
          };
          results.push(result);

          if (onTaskSuccess) onTaskSuccess(task, res);
          if (onQueueProgress) onQueueProgress(completedCount, totalTasks);
        } catch (err) {
          completedCount++;
          const errorMsg = err.message || 'Error desconocido';
          const isVerifyErr = Boolean(err.isVerificationError || errorMsg.includes('verification-error'));
          console.error(`[UPLOAD TASK ERROR] Falló "${task.localFile.name}" en Drive ID ${task.targetMatch.fileId}:`, errorMsg);

          const result = {
            taskId: task.id,
            success: false,
            isVerificationError: isVerifyErr,
            fileId: task.targetMatch.fileId,
            fileName: task.localFile.name,
            drivePath: task.targetMatch.path,
            error: errorMsg
          };
          results.push(result);

          if (onTaskError) onTaskError(task, errorMsg, isVerifyErr);
          if (onQueueProgress) onQueueProgress(completedCount, totalTasks);
        }
      }
    };

    // Lanzar N workers concurrentes
    const workers = Array.from(
      { length: Math.min(concurrency, tasks.length) },
      () => worker()
    );

    await Promise.all(workers);
    return results;
  }
}

export const uploadService = new UploadService();
