import React from 'react';
import { 
  AlertCircle, 
  ShieldAlert, 
  FolderCheck, 
  FileCheck2, 
  FileX2, 
  FileMinus2 
} from 'lucide-react';

export function ConfirmModal({
  isOpen,
  summary,
  onClose,
  onConfirm,
  isUploading
}) {
  if (!isOpen) return null;

  const {
    totalSelectedTargets = 0,
    foldersCount = 0,
    notFoundCount = 0,
    unselectedMatches = 0
  } = summary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden flex flex-col transition-colors">
        
        {/* Header con icono de advertencia */}
        <div className="p-6 text-center border-b border-slate-100 dark:border-slate-700">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 border border-blue-100 dark:border-blue-900/60 shadow-inner">
            <ShieldAlert className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Confirmar actualización
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Por favor, revisa el resumen antes de aplicar los cambios en Google Drive.
          </p>
        </div>

        {/* Resumen de la Operación */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
            
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Se actualizarán:</span>
              </span>
              <strong className="text-sm font-bold text-blue-700 dark:text-blue-400">
                {totalSelectedTargets} {totalSelectedTargets === 1 ? 'archivo existente' : 'archivos existentes'}
              </strong>
            </div>

            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <FolderCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Distribuidos en:</span>
              </span>
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                {foldersCount} {foldersCount === 1 ? 'carpeta' : 'carpetas'}
              </strong>
            </div>

            {notFoundCount > 0 && (
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="flex items-center gap-2">
                  <FileX2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span>No encontrados (ignorados):</span>
                </span>
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {notFoundCount} archivos
                </span>
              </div>
            )}

            {unselectedMatches > 0 && (
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-2">
                  <FileMinus2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>Coincidencias no seleccionadas:</span>
                </span>
                <span className="font-medium text-amber-700 dark:text-amber-300">
                  {unselectedMatches}
                </span>
              </div>
            )}

          </div>

          {/* Mensaje de Garantía Importante */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold mb-0.5">Mensaje importante:</strong>
              Esta acción reemplazará el contenido de archivos existentes en Google Drive manteniendo su ubicación, permisos y enlace.
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isUploading || totalSelectedTargets === 0}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            Confirmar reemplazo
          </button>
        </div>

      </div>
    </div>
  );
}
