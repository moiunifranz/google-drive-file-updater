import React from 'react';
import { 
  FolderCheck, 
  FolderTree, 
  RotateCw, 
  Settings2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export function WorkingFolderCard({
  selectedFolder,
  onChangeFolder,
  onAnalyzeFolder,
  isIndexing,
  stats
}) {
  if (!selectedFolder) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 my-6 transition-colors animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        
        {/* Identificación de Carpeta de Trabajo */}
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-blue-500/20">
            <FolderCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
                Carpeta de trabajo
              </span>
              {stats ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Indexada ({stats.totalFiles} archivos)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                  <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  Requiere análisis
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
              {selectedFolder.name}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 truncate" title={selectedFolder.path}>
              <FolderTree className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Ruta:</span>
              <span className="font-mono text-slate-600 dark:text-slate-400 truncate max-w-xl">{selectedFolder.path}</span>
            </p>
          </div>
        </div>

        {/* Acciones: Cambiar carpeta / Analizar carpeta */}
        <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0">
          <button
            type="button"
            onClick={onChangeFolder}
            disabled={isIndexing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 transition-colors disabled:opacity-50"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Cambiar carpeta</span>
          </button>

          <button
            type="button"
            onClick={onAnalyzeFolder}
            disabled={isIndexing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isIndexing ? 'animate-spin' : ''}`} />
            <span>{stats ? 'Reanalizar carpeta' : 'Analizar carpeta'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
