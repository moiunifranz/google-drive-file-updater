import React from 'react';
import { 
  FileText, 
  Trash2, 
  Settings2, 
  FolderTree, 
  RotateCw,
  Check
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import { formatBytes } from '../utils/fileUtils';

export function FileTable({
  files,
  onOpenDuplicateModal,
  onRemoveFile,
  onRetryItem,
  isUploading
}) {
  if (!files || files.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden my-6 transition-colors animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Archivo local</th>
              <th className="py-3.5 px-4">Estado</th>
              <th className="py-3.5 px-4 text-center">Coincidencias</th>
              <th className="py-3.5 px-4">Destino en Drive</th>
              <th className="py-3.5 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {files.map((item) => {
              const matchCount = item.matches ? item.matches.length : 0;
              const selectedMatches = item.matches ? item.matches.filter(m => m.selected) : [];
              
              // Determinar la visualización de destino
              let destinationDisplay = null;
              if (item.uploadStatus === 'completed') {
                destinationDisplay = (
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium truncate max-w-xs" title={selectedMatches.map(m => m.path).join(', ')}>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5] flex-shrink-0" />
                    <span className="truncate">
                      {selectedMatches.length === 1 ? selectedMatches[0].path : `${selectedMatches.length} carpetas actualizadas`}
                    </span>
                  </div>
                );
              } else if (item.uploadStatus === 'partial-error') {
                destinationDisplay = (
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-medium truncate max-w-xs">
                    <span className="truncate">{item.completedCount} de {selectedMatches.length} carpetas actualizadas</span>
                  </div>
                );
              } else if (matchCount === 1) {
                const singleMatch = item.matches[0];
                destinationDisplay = (
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={singleMatch.path}>
                    <FolderTree className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                    <span className="truncate">{singleMatch.path}</span>
                  </div>
                );
              } else if (matchCount > 1) {
                if (!item.reviewed || selectedMatches.length === 0) {
                  destinationDisplay = (
                    <span className="text-amber-800 dark:text-amber-300 italic">
                      Pendiente de revisar coincidencias
                    </span>
                  );
                } else if (selectedMatches.length === 1) {
                  destinationDisplay = (
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 max-w-xs truncate" title={selectedMatches[0].path}>
                      <FolderTree className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="truncate font-medium">{selectedMatches[0].path}</span>
                    </div>
                  );
                } else {
                  destinationDisplay = (
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                      {selectedMatches.length} carpetas seleccionadas
                    </span>
                  );
                }
              } else {
                destinationDisplay = (
                  <span className="text-slate-400 dark:text-slate-500 italic">
                    Sin destino asignado (No existe en raíz)
                  </span>
                );
              }

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors group"
                >
                  {/* Columna 1: Archivo local */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 max-w-[220px]">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate font-mono" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {formatBytes(item.size)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Columna 2: Estado / Progreso */}
                  <td className="py-3 px-4">
                    {item.uploadStatus === 'uploading' ? (
                      <div className="w-36">
                        <ProgressBar
                          progress={item.uploadProgress}
                          showPercent={true}
                          height="h-1.5"
                        />
                      </div>
                    ) : (
                      <div>
                        <StatusBadge
                          status={item.status}
                          uploadStatus={item.uploadStatus}
                          matchCount={matchCount}
                          reviewed={item.reviewed}
                          completedCount={item.completedCount}
                          totalSelectedCount={item.totalSelectedCount}
                        />
                        {item.errorMessage && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 max-w-[200px] truncate" title={item.errorMessage}>
                            {item.errorMessage}
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Columna 3: Conteo Coincidencias */}
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      matchCount === 1
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                        : matchCount > 1
                        ? item.reviewed
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {matchCount}
                    </span>
                  </td>

                  {/* Columna 4: Destino */}
                  <td className="py-3 px-4">
                    {destinationDisplay}
                  </td>

                  {/* Columna 5: Acción */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Botón Revisar/Revisado si tiene múltiples coincidencias */}
                      {matchCount > 1 && (
                        <button
                          type="button"
                          onClick={() => onOpenDuplicateModal(item)}
                          disabled={isUploading}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                            item.reviewed
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-xs'
                              : 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-700'
                          }`}
                          title={item.reviewed ? "Selección revisada. Haz clic para volver a editar." : "Hacer clic para revisar coincidencias"}
                        >
                          {item.reviewed ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                              <span>Revisado</span>
                            </>
                          ) : (
                            <>
                              <Settings2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                              <span>Revisar</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Botón Reintentar si falló o si hubo error parcial */}
                      {(item.uploadStatus === 'error' || item.uploadStatus === 'partial-error' || item.uploadStatus === 'verification-error') && onRetryItem && (
                        <button
                          type="button"
                          onClick={() => onRetryItem(item)}
                          disabled={isUploading}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 transition-colors disabled:opacity-50"
                          title="Reintentar destinos fallidos"
                        >
                          <RotateCw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Reintentar</span>
                        </button>
                      )}

                      {/* Botón Quitar de la lista */}
                      <button
                        type="button"
                        onClick={() => onRemoveFile(item.id)}
                        disabled={isUploading}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-50"
                        title="Quitar archivo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
