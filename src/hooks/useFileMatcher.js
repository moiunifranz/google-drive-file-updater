import { useState, useCallback, useMemo } from 'react';
import { getFileMimeType } from '../utils/fileUtils';

/**
 * Hook para gestionar los archivos locales cargados, compararlos contra el índice
 * de Google Drive, resolver selecciones, duplicados y rastrear el estado granular
 * por cada destino individual evitando re-subidas accidentales.
 */
export function useFileMatcher(driveIndex) {
  const [localFiles, setLocalFiles] = useState([]);
  const [caseSensitive, setCaseSensitive] = useState(true);

  /**
   * Encuentra las coincidencias en el índice para un nombre de archivo local.
   */
  const findMatches = useCallback((fileName, index, isCaseSensitive) => {
    if (!index) return [];

    let rawMatches = [];
    if (isCaseSensitive) {
      // Coincidencia EXACTA por defecto
      rawMatches = index[fileName] || [];
    } else {
      // Coincidencia ignorando mayúsculas/minúsculas
      const lower = fileName.toLowerCase();
      for (const [indexedName, fileList] of Object.entries(index)) {
        if (indexedName.toLowerCase() === lower) {
          rawMatches.push(...fileList);
        }
      }
    }

    return rawMatches.map(m => ({
      fileId: m.fileId,
      name: m.name,
      path: m.path,
      parentId: m.parentId,
      selected: false,
      completed: false, // true solo cuando Drive confirma el cambio con éxito
      uploadStatus: 'pending', // 'pending' | 'uploading' | 'success' | 'error' | 'verification-error'
      uploadProgress: 0,
      errorMessage: null,
      verifiedAt: null
    }));
  }, []);

  /**
   * Procesa un array de objetos File y genera la estructura interna.
   */
  const processFiles = useCallback((filesList, currentIndex, isCaseSensitive) => {
    return Array.from(filesList).map(file => {
      const matches = findMatches(file.name, currentIndex, isCaseSensitive);
      
      let status = 'not-found';
      if (matches.length === 1) {
        status = 'unique';
        // Regla: 1 coincidencia se selecciona automáticamente
        matches[0].selected = true;
      } else if (matches.length > 1) {
        status = 'multiple';
        // Regla: 2 o más coincidencias NO se seleccionan automáticamente; requieren revisión
        matches.forEach(m => { m.selected = false; });
      } else {
        status = 'not-found';
      }

      return {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        localFile: file,
        name: file.name,
        size: file.size,
        mimeType: getFileMimeType(file),
        matches,
        status, // 'unique' | 'multiple' | 'not-found'
        reviewed: false, // true cuando el usuario confirma explícitamente en el modal
        uploadStatus: 'idle', // 'idle' | 'uploading' | 'completed' | 'partial-error' | 'error'
        uploadProgress: 0,
        completedCount: 0,
        totalSelectedCount: matches.filter(m => m.selected).length,
        errorMessage: null
      };
    });
  }, [findMatches]);

  /**
   * Añade nuevos archivos locales a la lista.
   * IMPORTANTE (Problema 3): Preserva el estado de los archivos y coincidencias ya completados.
   */
  const addFiles = useCallback((newFiles) => {
    if (!newFiles || newFiles.length === 0) return;

    setLocalFiles(prev => {
      const processed = processFiles(newFiles, driveIndex, caseSensitive);
      const prevMap = new Map(prev.map(item => [item.name, item]));
      const result = [...prev];

      processed.forEach(newItem => {
        if (prevMap.has(newItem.name)) {
          const existingItem = prevMap.get(newItem.name);
          const hasAnyCompleted = existingItem.matches?.some(m => m.completed);
          
          if (hasAnyCompleted) {
            // Se conserva el item existente con su estado completado y verificado intacto
            console.log(`[FILE MATCHER] Conservando archivo previamente completado: "${newItem.name}"`);
          } else {
            // Si aún no estaba completado, actualizar el archivo conservando selecciones
            const index = result.findIndex(i => i.id === existingItem.id);
            if (index !== -1) {
              const prevSelectedIds = new Set(
                (existingItem.matches || []).filter(m => m.selected).map(m => m.fileId)
              );
              newItem.matches.forEach(m => {
                if (prevSelectedIds.has(m.fileId)) m.selected = true;
              });
              newItem.reviewed = existingItem.reviewed;
              result[index] = { ...newItem, id: existingItem.id };
            }
          }
        } else {
          result.push(newItem);
        }
      });

      return result;
    });
  }, [driveIndex, caseSensitive, processFiles]);

  /**
   * Reevalúa todas las coincidencias cuando cambia el índice o la sensibilidad a mayúsculas.
   */
  const reevaluateMatches = useCallback((newCaseSensitive) => {
    const isCase = newCaseSensitive !== undefined ? newCaseSensitive : caseSensitive;
    setLocalFiles(prev => {
      return prev.map(item => {
        const matches = findMatches(item.name, driveIndex, isCase);
        let status = 'not-found';

        const prevMatchMap = new Map(
          (item.matches || []).map(m => [m.fileId, m])
        );

        matches.forEach(m => {
          if (prevMatchMap.has(m.fileId)) {
            const prevM = prevMatchMap.get(m.fileId);
            m.selected = prevM.selected;
            m.completed = prevM.completed || false;
            m.uploadStatus = prevM.uploadStatus || 'pending';
            m.uploadProgress = prevM.uploadProgress || 0;
            m.errorMessage = prevM.errorMessage || null;
            m.verifiedAt = prevM.verifiedAt || null;
          }
        });

        if (matches.length === 1) {
          status = 'unique';
          if (!prevMatchMap.has(matches[0].fileId)) {
            matches[0].selected = true;
          }
        } else if (matches.length > 1) {
          status = 'multiple';
        }

        const selectedMatches = matches.filter(m => m.selected);
        const completedCount = selectedMatches.filter(m => m.completed).length;

        return {
          ...item,
          matches,
          status,
          reviewed: item.reviewed || false,
          completedCount,
          totalSelectedCount: selectedMatches.length
        };
      });
    });
  }, [driveIndex, caseSensitive, findMatches]);

  /**
   * Cambia la opción de sensibilidad a mayúsculas/minúsculas.
   */
  const toggleCaseSensitive = useCallback((value) => {
    const newValue = value !== undefined ? value : !caseSensitive;
    setCaseSensitive(newValue);
    reevaluateMatches(newValue);
  }, [caseSensitive, reevaluateMatches]);

  /**
   * Elimina un archivo local de la lista.
   */
  const removeFile = useCallback((itemId) => {
    setLocalFiles(prev => prev.filter(f => f.id !== itemId));
  }, []);

  /**
   * Limpia toda la lista de archivos locales.
   */
  const clearFiles = useCallback(() => {
    setLocalFiles([]);
  }, []);

  /**
   * Actualiza la selección de una coincidencia específica para un archivo.
   */
  const updateMatchSelection = useCallback((itemId, targetFileId, isSelected) => {
    setLocalFiles(prev => {
      return prev.map(item => {
        if (item.id !== itemId) return item;

        const updatedMatches = item.matches.map(m => {
          if (m.fileId === targetFileId) {
            return { ...m, selected: isSelected };
          }
          return m;
        });

        const selectedMatches = updatedMatches.filter(m => m.selected);

        return {
          ...item,
          matches: updatedMatches,
          totalSelectedCount: selectedMatches.length
        };
      });
    });
  }, []);

  /**
   * Confirma la selección de coincidencias en el modal y marca el archivo como revisado.
   * Si al menos una coincidencia está seleccionada, reviewed se vuelve true.
   */
  const confirmMultipleMatches = useCallback((itemId, selectedIds) => {
    setLocalFiles(prev => {
      return prev.map(item => {
        if (item.id !== itemId) return item;

        const updatedMatches = item.matches.map(m => ({
          ...m,
          selected: selectedIds.has(m.fileId)
        }));

        const hasAnySelected = updatedMatches.some(m => m.selected);
        const selectedMatches = updatedMatches.filter(m => m.selected);
        const completedCount = selectedMatches.filter(m => m.completed).length;

        return {
          ...item,
          matches: updatedMatches,
          reviewed: hasAnySelected ? true : item.reviewed,
          completedCount,
          totalSelectedCount: selectedMatches.length
        };
      });
    });
  }, []);

  /**
   * Selecciona todas las coincidencias para un archivo con múltiples coincidencias.
   */
  const selectAllMatches = useCallback((itemId) => {
    setLocalFiles(prev => {
      return prev.map(item => {
        if (item.id !== itemId) return item;
        const matches = item.matches.map(m => ({ ...m, selected: true }));
        return {
          ...item,
          matches,
          totalSelectedCount: matches.length
        };
      });
    });
  }, []);

  /**
   * Deselecciona todas las coincidencias para un archivo.
   */
  const deselectAllMatches = useCallback((itemId) => {
    setLocalFiles(prev => {
      return prev.map(item => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          matches: item.matches.map(m => ({ ...m, selected: false })),
          totalSelectedCount: 0
        };
      });
    });
  }, []);

  /**
   * Actualiza el estado granular de subida y verificación de un destino específico (Problema 2 y 3).
   * Reevalúa automáticamente el estado global del archivo:
   * - 'completed': todos los destinos seleccionados fueron actualizados y verificados.
   * - 'partial-error': algunos se actualizaron y otros fallaron o no se pudieron verificar.
   * - 'error': todos los destinos seleccionados fallaron.
   * - 'uploading': en curso.
   */
  const updateMatchUploadState = useCallback((itemId, targetFileId, updateData) => {
    const { progress, status, errorMsg, verifiedMeta } = updateData;

    setLocalFiles(prev => {
      return prev.map(item => {
        if (item.id !== itemId) return item;

        const isSuccess = status === 'success';
        const isError = status === 'error' || status === 'verification-error';

        const updatedMatches = item.matches.map(m => {
          if (m.fileId === targetFileId) {
            return {
              ...m,
              uploadProgress: progress !== undefined ? progress : m.uploadProgress,
              uploadStatus: status || m.uploadStatus,
              completed: isSuccess ? true : (isError ? false : m.completed),
              errorMessage: errorMsg !== undefined ? errorMsg : m.errorMessage,
              verifiedMeta: verifiedMeta || m.verifiedMeta,
              verifiedAt: isSuccess ? new Date().toISOString() : m.verifiedAt
            };
          }
          return m;
        });

        // Calcular estado global derivado
        const selectedMatches = updatedMatches.filter(m => m.selected);
        const totalSelected = selectedMatches.length;
        const completedCount = selectedMatches.filter(m => m.completed || m.uploadStatus === 'success').length;
        const errorCount = selectedMatches.filter(m => m.uploadStatus === 'error' || m.uploadStatus === 'verification-error').length;
        const isAnyUploading = selectedMatches.some(m => m.uploadStatus === 'uploading');

        let aggregateStatus = item.uploadStatus;
        let itemProgress = item.uploadProgress;
        let itemError = item.errorMessage;

        if (totalSelected > 0) {
          const sumProgress = selectedMatches.reduce((acc, m) => acc + (m.uploadProgress || 0), 0);
          itemProgress = Math.round(sumProgress / totalSelected);

          if (isAnyUploading) {
            aggregateStatus = 'uploading';
          } else if (completedCount === totalSelected && totalSelected > 0) {
            // Todos los destinos seleccionados completados y verificados
            aggregateStatus = 'completed';
            itemProgress = 100;
            itemError = null;
          } else if (completedCount > 0 && errorCount > 0) {
            // Éxito parcial: algunos confirmados y otros con error
            aggregateStatus = 'partial-error';
            itemError = `${completedCount} de ${totalSelected} destinos actualizados. Destinos restantes fallaron.`;
          } else if (errorCount === totalSelected && totalSelected > 0) {
            // Todos los seleccionados fallaron
            aggregateStatus = 'error';
            const firstErr = selectedMatches.find(m => m.errorMessage)?.errorMessage;
            itemError = firstErr || errorMsg || 'Error al actualizar destinos en Drive.';
          }
        }

        return {
          ...item,
          matches: updatedMatches,
          uploadStatus: aggregateStatus,
          uploadProgress: itemProgress,
          completedCount,
          totalSelectedCount: totalSelected,
          errorMessage: itemError
        };
      });
    });
  }, []);

  /**
   * Wrapper retrocompatible para actualizar progreso general.
   */
  const updateItemProgress = useCallback((itemId, percent, status, errorMsg = null, targetFileId = null) => {
    if (targetFileId) {
      updateMatchUploadState(itemId, targetFileId, {
        progress: percent,
        status: status === 'completed' ? 'success' : status,
        errorMsg
      });
    } else {
      setLocalFiles(prev => {
        return prev.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            uploadProgress: percent !== undefined ? percent : item.uploadProgress,
            uploadStatus: status || item.uploadStatus,
            errorMessage: errorMsg !== undefined ? errorMsg : item.errorMessage
          };
        });
      });
    }
  }, [updateMatchUploadState]);

  /**
   * Calcula el resumen estadístico para el dashboard y la confirmación final.
   * REGLA (Problema 3): 'totalSelectedTargets' (A reemplazar) cuenta ÚNICAMENTE destinos PENDIENTES.
   */
  const summary = useMemo(() => {
    let totalFiles = localFiles.length;
    let uniqueCount = 0;
    let multipleCount = 0;
    let notFoundCount = 0;
    let totalSelectedTargets = 0; // SOLO DESTINOS PENDIENTES
    let totalCompletedTargets = 0; // DESTINOS YA ACTUALIZADOS
    let unselectedMatches = 0;
    const affectedFolders = new Set();

    localFiles.forEach(item => {
      if (item.status === 'unique') {
        uniqueCount++;
      } else if (item.status === 'multiple') {
        // La tarjeta 'Requieren revisión' cuenta únicamente los archivos que tengan reviewed = false
        if (!item.reviewed) {
          multipleCount++;
        }
      } else if (item.status === 'not-found') {
        notFoundCount++;
      }

      // Elegibilidad para reemplazo: unique o multiple confirmado
      const isEligibleForReplacement = 
        item.status === 'unique' || 
        (item.status === 'multiple' && item.reviewed);

      if (item.matches && item.matches.length > 0) {
        if (isEligibleForReplacement) {
          item.matches.forEach(m => {
            if (m.selected) {
              if (m.completed || m.uploadStatus === 'success') {
                totalCompletedTargets++;
              } else {
                // Destino pendiente
                totalSelectedTargets++;
                if (m.parentId) affectedFolders.add(m.parentId);
              }
            } else {
              unselectedMatches++;
            }
          });
        } else {
          // Si tiene múltiples coincidencias y no está revisado, se consideran no seleccionadas
          unselectedMatches += item.matches.length;
        }
      }
    });

    return {
      totalFiles,
      uniqueCount,
      multipleCount,
      notFoundCount,
      totalSelectedTargets, // PENDIENTES
      totalCompletedTargets,
      foldersCount: affectedFolders.size,
      unselectedMatches
    };
  }, [localFiles]);

  return {
    localFiles,
    caseSensitive,
    summary,
    addFiles,
    removeFile,
    clearFiles,
    toggleCaseSensitive,
    updateMatchSelection,
    confirmMultipleMatches,
    selectAllMatches,
    deselectAllMatches,
    updateItemProgress,
    updateMatchUploadState,
    reevaluateMatches
  };
}
