import React from 'react';
import { 
  FolderSync, 
  Loader2, 
  Folders, 
  Files, 
  XCircle, 
  CheckCircle2, 
  AlertCircle,
  Play
} from 'lucide-react';
import { formatDate } from '../utils/fileUtils';

export function IndexingBanner({
  isIndexing,
  progress,
  stats,
  rootName,
  onStartScan,
  onCancelScan,
  error
}) {
  // 1. Estado: Escaneo activo en tiempo real
  if (isIndexing) {
    return (
      <div className="bg-blue-600 dark:bg-blue-600 text-white rounded-2xl p-5 shadow-lg shadow-blue-500/20 my-6 animate-pulse-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight">
                Analizando carpeta seleccionada…
              </h4>
              <p className="text-xs text-blue-100 truncate max-w-md font-semibold mt-0.5">
                {rootName || progress.currentFolder || 'Carpeta de trabajo'}
              </p>
              {progress.currentFolder && progress.currentFolder !== rootName && (
                <p className="text-[11px] text-blue-200 truncate max-w-md">
                  Explorando: {progress.currentFolder}
                </p>
              )}
            </div>
          </div>

          {/* Estadísticas en vivo */}
          <div className="flex items-center gap-6 text-xs bg-white/10 px-4 py-2 rounded-xl backdrop-blur-xs">
            <div className="flex items-center gap-1.5">
              <Folders className="w-4 h-4 text-blue-200" />
              <span>Carpetas: <strong>{progress.scannedFolders}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Files className="w-4 h-4 text-blue-200" />
              <span>Archivos: <strong>{progress.foundFiles}</strong></span>
            </div>

            <button
              type="button"
              onClick={onCancelScan}
              className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/80 hover:bg-red-600 text-white font-medium text-xs transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Estado: Error durante la indexación
  if (error) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-4 my-6 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold mb-0.5">Error al analizar la carpeta seleccionada:</strong>
            <p>{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onStartScan}
          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors flex-shrink-0"
        >
          Reintentar análisis
        </button>
      </div>
    );
  }

  // 3. Estado: Aún no indexado
  if (!stats) {
    return (
      <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-blue-200 dark:border-slate-700 rounded-2xl p-6 my-6 text-center shadow-xs transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
          <FolderSync className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Carpeta pendiente de análisis
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Para comparar y reemplazar archivos existentes en <strong>&quot;{rootName}&quot;</strong>, presiona el botón para analizar sus subcarpetas y archivos.
        </p>
        <button
          type="button"
          onClick={onStartScan}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Analizar carpeta</span>
        </button>
      </div>
    );
  }

  // 4. Estado: Ya indexado exitosamente
  return (
    <div className="bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-4 py-3 my-4 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 transition-colors">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>
          <strong>Índice activo:</strong> {stats.totalFiles} archivos encontrados en {stats.totalFolders} subcarpetas de &quot;{rootName}&quot;.
        </span>
      </div>
      <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-[11px]">
        {stats.indexedAt && (
          <span>Actualizado: {formatDate(stats.indexedAt)}</span>
        )}
      </div>
    </div>
  );
}
