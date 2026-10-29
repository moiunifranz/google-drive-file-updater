import React from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  FileSpreadsheet, 
  FileText,
  RotateCw,
  FolderTree
} from 'lucide-react';
import { exportResultsToCSV, exportResultsToTXT } from '../utils/exportUtils';

export function ResultsModal({
  isOpen,
  results,
  localFiles,
  rootName,
  onClose,
  onRetryFailed
}) {
  if (!isOpen) return null;

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const notFound = localFiles.filter(f => f.status === 'not-found');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Actualización completada
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Resultados del reemplazo de archivos en Google Drive
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjetas resumen de resultados */}
        <div className="p-6 grid grid-cols-3 gap-3 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-900/40">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 text-center">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Actualizados</p>
            <p className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">✓ {successful.length}</p>
          </div>

          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl p-3 text-center">
            <p className="text-xs font-medium text-rose-700 dark:text-rose-300">Errores</p>
            <p className="text-xl font-bold text-rose-900 dark:text-rose-200 mt-0.5">✕ {failed.length}</p>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No encontrados</p>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-0.5">○ {notFound.length}</p>
          </div>
        </div>

        {/* Lista detallada de operaciones */}
        <div className="p-6 overflow-y-auto space-y-2.5 flex-1 text-xs">
          <h4 className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2">
            Detalle de archivos procesados:
          </h4>

          {results.map((res, idx) => (
            <div
              key={res.taskId || idx}
              className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                res.success
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-slate-900 dark:text-slate-100'
                  : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 text-slate-900 dark:text-slate-100'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {res.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold font-mono truncate">{res.fileName}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate mt-0.5 flex items-center gap-1">
                    <FolderTree className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                    <span>{res.drivePath}</span>
                  </p>
                  {res.error && (
                    <p className="text-rose-600 dark:text-rose-400 text-[11px] font-medium mt-1">
                      {res.error}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  res.success 
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                }`}>
                  {res.success ? 'Exitoso' : 'Fallo'}
                </span>
              </div>
            </div>
          ))}

          {/* Archivos no encontrados listados informativamente */}
          {notFound.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-between text-xs"
            >
              <span className="font-mono text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
              <span className="text-[11px] italic">No encontrado en Drive (Omitido)</span>
            </div>
          ))}
        </div>

        {/* Footer con opciones de descarga de Logs */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportResultsToCSV(localFiles, rootName)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Descargar CSV</span>
            </button>

            <button
              type="button"
              onClick={() => exportResultsToTXT(localFiles, rootName)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Descargar TXT</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {failed.length > 0 && onRetryFailed && (
              <button
                type="button"
                onClick={onRetryFailed}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Reintentar fallidos</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
