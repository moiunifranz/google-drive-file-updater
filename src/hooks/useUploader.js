import { useState, useCallback, useRef } from 'react';
import { uploadService } from '../services/uploadService';
import { DRIVE_CONFIG } from '../config/driveConfig';

const LOCAL_STORAGE_HISTORY_KEY = 'drive_uploader_history';

/**
 * Hook para orquestar la cola de subidas concurrentes, verificación estricta
 * y almacenamiento de historial de operaciones.
 */
export function useUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0); // 0 a 100
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const isCancelledRef = useRef(false);

  /**
   * Guarda una sesión en el historial de localStorage.
   */
  const saveHistoryRecord = useCallback((updatedCount, errorCount, notFoundCount, rootName) => {
    try {
      const existing = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      const history = existing ? JSON.parse(existing) : [];
      
      const newRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        timestamp: new Date().toISOString(),
        updatedCount,
        errorCount,
        notFoundCount,
        rootName: rootName || 'Google Drive'
      };

      // Conservar las últimas 30 operaciones
      const updatedHistory = [newRecord, ...history].slice(0, 30);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch {
      // Ignorar restricciones de almacenamiento local
    }
  }, []);

  /**
   * Inicia la actualización concurrente de los archivos seleccionados.
   * REGLA (Problema 3): Encola ÚNICAMENTE destinos pendientes (!completed && uploadStatus !== 'success').
   * 
   * @param {Array} localFiles Lista de archivos procesados por useFileMatcher
   * @param {string} token Access Token de Google OAuth
   * @param {Function} updateMatchUploadState Callback para actualizar el estado granular del destino en la tabla
   * @param {string} rootName Nombre de la carpeta raíz para el reporte
   */
  const startUpload = useCallback(async (localFiles, token, updateMatchUploadState, rootName) => {
    if (!token) {
      throw new Error('No hay sesión activa con Google Drive.');
    }

    // 1. Descomponer los archivos locales en tareas individuales para cada coincidencia seleccionada PENDIENTE
    const tasks = [];
    localFiles.forEach(item => {
      const isEligible = item.status === 'unique' || (item.status === 'multiple' && item.reviewed);
      if (isEligible && item.matches && item.matches.length > 0) {
        item.matches.forEach(match => {
          // EXCLUSIÓN ESTRICTA: No volver a encolar archivos ya actualizados con éxito
          const isPending = match.selected && !match.completed && match.uploadStatus !== 'success';
          if (isPending) {
            tasks.push({
              id: `${item.id}_${match.fileId}`,
              itemId: item.id,
              targetFileId: match.fileId,
              localFile: item.localFile,
              targetMatch: match
            });
          }
        });
      }
    });

    if (tasks.length === 0) {
      throw new Error('No hay destinos pendientes de reemplazo en Google Drive.');
    }

    isCancelledRef.current = false;
    setIsUploading(true);
    setIsCompleted(false);
    setResults([]);
    setTotalTasksCount(tasks.length);
    setCompletedTasksCount(0);
    setOverallProgress(0);

    // Inicializar visualmente las tareas pendientes
    tasks.forEach(t => {
      if (updateMatchUploadState) {
        updateMatchUploadState(t.itemId, t.targetFileId, {
          progress: 0,
          status: 'uploading',
          errorMsg: null
        });
      }
    });

    try {
      const taskResults = await uploadService.processQueue(
        tasks,
        token,
        {
          onTaskStart: (task) => {
            if (updateMatchUploadState) {
              updateMatchUploadState(task.itemId, task.targetFileId, {
                progress: 0,
                status: 'uploading',
                errorMsg: null
              });
            }
          },
          onTaskProgress: (taskId, percent) => {
            const task = tasks.find(t => t.id === taskId);
            if (task && updateMatchUploadState) {
              updateMatchUploadState(task.itemId, task.targetFileId, {
                progress: percent,
                status: 'uploading'
              });
            }
          },
          onTaskSuccess: (task, res) => {
            if (updateMatchUploadState) {
              updateMatchUploadState(task.itemId, task.targetFileId, {
                progress: 100,
                status: 'success',
                errorMsg: null,
                verifiedMeta: res.afterMeta
              });
            }
          },
          onTaskError: (task, errorMsg, isVerifyErr) => {
            const status = isVerifyErr ? 'verification-error' : 'error';
            if (updateMatchUploadState) {
              updateMatchUploadState(task.itemId, task.targetFileId, {
                progress: 0,
                status,
                errorMsg
              });
            }
          },
          onQueueProgress: (completed, total) => {
            setCompletedTasksCount(completed);
            setOverallProgress(Math.round((completed / total) * 100));
          }
        },
        DRIVE_CONFIG.UPLOAD_CONCURRENCY
      );

      taskResults.wasCancelled = isCancelledRef.current;
      setResults(taskResults);
      setIsCompleted(true);

      // Calcular totales para el historial
      const updatedCount = taskResults.filter(r => r.success).length;
      const errorCount = taskResults.filter(r => !r.success).length;
      const notFoundCount = localFiles.filter(f => f.status === 'not-found').length;

      saveHistoryRecord(updatedCount, errorCount, notFoundCount, rootName);

      return taskResults;
    } finally {
      setIsUploading(false);
    }
  }, [saveHistoryRecord]);

  /**
   * Reintenta una tarea específica que falló sin alterar otras que ya tuvieron éxito.
   */
  const retryTask = useCallback(async (task, token, updateMatchUploadState) => {
    if (!task || !token) return;

    if (updateMatchUploadState) {
      updateMatchUploadState(task.itemId, task.targetFileId, {
        progress: 0,
        status: 'uploading',
        errorMsg: null
      });
    }

    try {
      const res = await uploadService.updateFileContent(
        task.localFile,
        task.targetFileId,
        token,
        (percent) => {
          if (updateMatchUploadState) {
            updateMatchUploadState(task.itemId, task.targetFileId, {
              progress: percent,
              status: 'uploading'
            });
          }
        },
        task.id,
        { drivePath: task.targetMatch?.path }
      );

      if (updateMatchUploadState) {
        updateMatchUploadState(task.itemId, task.targetFileId, {
          progress: 100,
          status: 'success',
          errorMsg: null,
          verifiedMeta: res.afterMeta
        });
      }

      setResults(prev => prev.map(r => r.taskId === task.id ? { ...r, success: true, error: null, data: res } : r));
    } catch (err) {
      const errorMsg = err.message || 'Error en reintento';
      const isVerifyErr = Boolean(err.isVerificationError || errorMsg.includes('verification-error'));
      const status = isVerifyErr ? 'verification-error' : 'error';

      if (updateMatchUploadState) {
        updateMatchUploadState(task.itemId, task.targetFileId, {
          progress: 0,
          status,
          errorMsg
        });
      }

      setResults(prev => prev.map(r => r.taskId === task.id ? { ...r, success: false, error: errorMsg } : r));
    }
  }, []);

  /**
   * Cancela todas las subidas en progreso.
   */
  const cancelAll = useCallback(() => {
    isCancelledRef.current = true;
    uploadService.cancelAll();
    setIsUploading(false);
  }, []);

  return {
    isUploading,
    isCompleted,
    results,
    overallProgress,
    completedTasksCount,
    totalTasksCount,
    startUpload,
    retryTask,
    cancelAll,
    resetCompleted: () => setIsCompleted(false),
    isCancelled: () => isCancelledRef.current
  };
}
