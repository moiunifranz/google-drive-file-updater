import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { LoginButton } from './components/LoginButton';
import { FolderSelector } from './components/FolderSelector';
import { WorkingFolderCard } from './components/WorkingFolderCard';
import { DropZone } from './components/DropZone';
import { SummaryCards } from './components/SummaryCards';
import { FileTable } from './components/FileTable';
import { DuplicateModal } from './components/DuplicateModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ResultsModal } from './components/ResultsModal';
import { HistoryPanel } from './components/HistoryPanel';
import { IndexingBanner } from './components/IndexingBanner';
import { ProgressBar } from './components/ProgressBar';

import { useGoogleAuth } from './hooks/useGoogleAuth';
import { useDriveIndex } from './hooks/useDriveIndex';
import { useFileMatcher } from './hooks/useFileMatcher';
import { useUploader } from './hooks/useUploader';
import { useTheme } from './hooks/useTheme';
import { DRIVE_CONFIG } from './config/driveConfig';
import { getFolderMetadata } from './services/driveApi';

export function App() {
  // 1. Tema Claro / Oscuro
  const { theme, toggleTheme } = useTheme();

  // 2. Autenticación Google GIS
  const {
    isAuthenticated,
    accessToken,
    userInfo,
    isLoading: isAuthLoading,
    error: authError,
    isGisReady,
    login,
    logout
  } = useGoogleAuth();

  // 3. Nombre dinámico de la carpeta raíz (obtenido vía API con fallback a 'ver_act')
  const [rootFolderName, setRootFolderName] = useState(DRIVE_CONFIG.DEFAULT_ROOT_NAME || 'ver_act');

  // Obtener nombre real de la carpeta raíz desde Drive API
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      getFolderMetadata(DRIVE_CONFIG.ROOT_FOLDER_ID, accessToken)
        .then(meta => {
          if (meta?.name) {
            setRootFolderName(meta.name);
          }
        })
        .catch(() => {
          setRootFolderName(DRIVE_CONFIG.DEFAULT_ROOT_NAME || 'ver_act');
        });
    }
  }, [isAuthenticated, accessToken]);

  // 4. Carpeta de trabajo seleccionada manualmente
  const [selectedFolder, setSelectedFolder] = useState(null); // { id, name, path }
  const [isSelectingFolder, setIsSelectingFolder] = useState(true);

  // 5. Indexación recursiva de Google Drive (partiendo de selectedFolder)
  const {
    index: driveIndex,
    stats: indexStats,
    rootName,
    isIndexing,
    progress: indexProgress,
    error: indexError,
    scanDrive,
    cancelScan,
    clearIndex
  } = useDriveIndex();

  // 6. Comparador y selector de archivos locales
  const {
    localFiles,
    caseSensitive,
    summary,
    addFiles,
    removeFile,
    clearFiles,
    toggleCaseSensitive,
    updateMatchSelection,
    confirmMultipleMatches,
    updateItemProgress,
    updateMatchUploadState
  } = useFileMatcher(driveIndex);

  // 7. Cola de subida concurrente y resultados
  const {
    isUploading,
    isCompleted: isUploadCompleted,
    results: uploadResults,
    overallProgress,
    completedTasksCount,
    totalTasksCount,
    startUpload,
    retryTask,
    cancelAll: cancelAllUploads,
    resetCompleted
  } = useUploader();

  // Estados locales de Modales
  const [duplicateModalItem, setDuplicateModalItem] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  // Manejador cuando el usuario confirma una carpeta en FolderSelector
  const handleSelectFolder = useCallback((folder) => {
    setSelectedFolder(folder);
    setIsSelectingFolder(false);
    clearIndex(); // Se limpia el índice anterior para requerir análisis explícito de la nueva carpeta
    clearFiles(); // Se limpian los archivos locales cargados previamente
  }, [clearIndex, clearFiles]);

  // Manejador para iniciar el análisis recursivo de la carpeta seleccionada
  const handleAnalyzeFolder = useCallback(() => {
    if (!selectedFolder || !accessToken) return;
    scanDrive(selectedFolder.id, selectedFolder.name, selectedFolder.path, accessToken);
  }, [selectedFolder, accessToken, scanDrive]);

  // Manejador para guardar selección de duplicados desde DuplicateModal
  const handleSaveDuplicateSelection = useCallback((itemId, selectedIds) => {
    confirmMultipleMatches(itemId, selectedIds);
  }, [confirmMultipleMatches]);

  // Manejador para ejecutar la confirmación final de actualización
  const handleExecuteUpload = useCallback(async () => {
    setIsConfirmModalOpen(false);
    setGeneralError(null);

    const targetName = selectedFolder ? selectedFolder.name : rootFolderName;

    try {
      await startUpload(localFiles, accessToken, updateMatchUploadState, targetName);
    } catch (err) {
      console.error('Error durante la subida:', err);
      setGeneralError(err.message || 'Error durante el reemplazo de archivos.');
    }
  }, [localFiles, accessToken, updateMatchUploadState, selectedFolder, rootFolderName, startUpload]);

  // Manejador de reintento para un item individual: reintenta ÚNICAMENTE los destinos fallidos
  const handleRetryItem = useCallback((item) => {
    if (!item || !accessToken) return;
    const failedMatches = item.matches.filter(m => m.selected && !m.completed && m.uploadStatus !== 'success');
    failedMatches.forEach(failedMatch => {
      const task = {
        id: `${item.id}_${failedMatch.fileId}`,
        itemId: item.id,
        targetFileId: failedMatch.fileId,
        localFile: item.localFile,
        targetMatch: failedMatch
      };
      retryTask(task, accessToken, updateMatchUploadState);
    });
  }, [accessToken, retryTask, updateMatchUploadState]);

  // Manejador para reintentar todas las tareas fallidas desde ResultsModal
  const handleRetryAllFailed = useCallback(() => {
    resetCompleted();
    uploadResults.filter(r => !r.success).forEach(failedResult => {
      const item = localFiles.find(f => f.matches.some(m => m.fileId === failedResult.fileId));
      if (item) {
        handleRetryItem(item);
      }
    });
  }, [uploadResults, localFiles, handleRetryItem, resetCompleted]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 transition-colors duration-150">
      
      {/* Encabezado Principal */}
      <Header
        isAuthenticated={isAuthenticated}
        userInfo={userInfo}
        rootName={rootFolderName}
        activeFolderName={selectedFolder ? selectedFolder.name : rootFolderName}
        activeFolderPath={selectedFolder ? selectedFolder.path : rootFolderName}
        stats={indexStats}
        isIndexing={isIndexing}
        hasSelectedFolder={!!selectedFolder}
        theme={theme}
        onToggleTheme={toggleTheme}
        onScanDrive={handleAnalyzeFolder}
        onLogout={() => {
          logout();
          setSelectedFolder(null);
          setIsSelectingFolder(true);
          clearIndex();
          clearFiles();
        }}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Contenido Principal con ancho coherente (1440px max) */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!isAuthenticated ? (
          // Vista 1: Pantalla de inicio de sesión con Google
          <LoginButton
            onLogin={login}
            isLoading={isAuthLoading}
            isGisReady={isGisReady}
            error={authError}
            rootFolderName={rootFolderName}
          />
        ) : (
          // Vista 2: Flujo paso a paso
          <div className="space-y-6">

            {/* PASO 1: Selector visual de carpetas (Navegación bajo demanda) */}
            {(isSelectingFolder || !selectedFolder) ? (
              <FolderSelector
                token={accessToken}
                onSelectFolder={handleSelectFolder}
                selectedFolder={selectedFolder}
                onCancelChange={() => selectedFolder && setIsSelectingFolder(false)}
              />
            ) : (
              // Tarjeta de Carpeta de Trabajo confirmada
              <WorkingFolderCard
                selectedFolder={selectedFolder}
                onChangeFolder={() => setIsSelectingFolder(true)}
                onAnalyzeFolder={handleAnalyzeFolder}
                isIndexing={isIndexing}
                stats={indexStats}
              />
            )}

            {/* Banner de Estado del Análisis Recursivo */}
            {selectedFolder && (
              <IndexingBanner
                isIndexing={isIndexing}
                progress={indexProgress}
                stats={indexStats}
                rootName={selectedFolder.name}
                onStartScan={handleAnalyzeFolder}
                onCancelScan={cancelScan}
                error={indexError}
              />
            )}

            {/* Alerta de Error General si ocurrió alguno */}
            {generalError && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between">
                <span>{generalError}</span>
                <button
                  type="button"
                  onClick={() => setGeneralError(null)}
                  className="font-bold underline text-rose-700 dark:text-rose-300 ml-3"
                >
                  Cerrar
                </button>
              </div>
            )}

            {/* Barra de progreso global si está subiendo */}
            {isUploading && (
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-md shadow-blue-500/10 space-y-2 transition-colors">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-blue-900 dark:text-blue-300">
                    Actualizando archivos en Google Drive ({completedTasksCount} de {totalTasksCount})
                  </span>
                  <span className="text-blue-700 dark:text-blue-400 font-bold">{overallProgress}%</span>
                </div>
                <ProgressBar
                  progress={overallProgress}
                  height="h-2.5"
                  color="bg-blue-600"
                  showPercent={false}
                />
                <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>Concurrencia activa (3 simultáneos). No cierres esta pestaña.</span>
                  <button
                    type="button"
                    onClick={cancelAllUploads}
                    className="text-rose-600 dark:text-rose-400 hover:underline font-medium"
                  >
                    Detener subidas
                  </button>
                </div>
              </div>
            )}

            {/* Zona de Carga y Tabla (habilitada cuando la carpeta está seleccionada e indexada) */}
            {selectedFolder && indexStats && (
              <>
                {/* Área de Carga Drag & Drop */}
                <DropZone
                  onFilesSelected={addFiles}
                  onClearFiles={clearFiles}
                  hasFiles={localFiles.length > 0}
                  filesCount={localFiles.length}
                  caseSensitive={caseSensitive}
                  onToggleCaseSensitive={toggleCaseSensitive}
                  disabled={isUploading || isIndexing}
                />

                {/* Tarjetas de Resumen Estadístico */}
                <SummaryCards summary={summary} />

                {/* Tabla de Archivos */}
                <FileTable
                  files={localFiles}
                  onOpenDuplicateModal={(item) => setDuplicateModalItem(item)}
                  onRemoveFile={removeFile}
                  onRetryItem={handleRetryItem}
                  isUploading={isUploading}
                />

                {/* Botón Flotante / Inferior de Confirmación de Reemplazo */}
                {localFiles.length > 0 && (
                  <div className="sticky bottom-6 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg flex flex-wrap items-center justify-between gap-4 transition-colors">
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      <span>Archivos preparados para actualizar: </span>
                      <strong className="text-blue-700 dark:text-blue-400 font-bold text-sm">
                        {summary.totalSelectedTargets}
                      </strong>
                      {summary.multipleCount > 0 && summary.unselectedMatches > 0 && (
                        <span className="text-amber-800 dark:text-amber-300 ml-2">
                          ({summary.unselectedMatches} coincidencias pendientes o no seleccionadas)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={clearFiles}
                        disabled={isUploading}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                      >
                        Descartar todo
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsConfirmModalOpen(true)}
                        disabled={isUploading || summary.totalSelectedTargets === 0}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>
                          {summary.totalSelectedTargets > 0
                            ? `Reemplazar en Drive (${summary.totalSelectedTargets})`
                            : (summary.totalCompletedTargets > 0 ? '✓ Todo actualizado' : 'Sin reemplazos pendientes')}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        )}

      </main>

      {/* Footer Solicitado con adaptación Light/Dark */}
      <footer className="mt-auto py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500 transition-colors">
        <p>Google Drive File Updater &bull; Created by Moises Luna for Unifranz Online &copy; 2026</p>
      </footer>

      {/* Modal 1: Múltiples Coincidencias (Revisar Duplicados) */}
      <DuplicateModal
        isOpen={!!duplicateModalItem}
        fileItem={duplicateModalItem}
        onClose={() => setDuplicateModalItem(null)}
        onSaveSelection={handleSaveDuplicateSelection}
      />

      {/* Modal 2: Confirmación previa a la modificación en Drive */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        summary={summary}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleExecuteUpload}
        isUploading={isUploading}
      />

      {/* Modal 3: Resultados finales y Descarga de Reporte */}
      <ResultsModal
        isOpen={isUploadCompleted}
        results={uploadResults}
        localFiles={localFiles}
        rootName={selectedFolder ? selectedFolder.name : rootFolderName}
        onClose={resetCompleted}
        onRetryFailed={handleRetryAllFailed}
      />

      {/* Panel 4: Historial de Operaciones Locales */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

    </div>
  );
}

export default App;
