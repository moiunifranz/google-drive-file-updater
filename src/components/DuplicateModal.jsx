import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  FolderTree, 
  CheckSquare, 
  Square, 
  Check
} from 'lucide-react';
import { splitPathParts } from '../utils/pathUtils';
import { formatBytes, formatDate } from '../utils/fileUtils';

export function DuplicateModal({
  isOpen,
  fileItem,
  onClose,
  onSaveSelection
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Sincronizar las selecciones actuales al abrir el modal
  useEffect(() => {
    if (fileItem && fileItem.matches) {
      const initial = new Set(
        fileItem.matches.filter(m => m.selected).map(m => m.fileId)
      );
      setSelectedIds(initial);
    }
  }, [fileItem, isOpen]);

  if (!isOpen || !fileItem) return null;

  const matches = fileItem.matches || [];

  const handleToggle = (fileId) => {
    const next = new Set(selectedIds);
    if (next.has(fileId)) {
      next.delete(fileId);
    } else {
      next.add(fileId);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    const next = new Set(matches.map(m => m.fileId));
    setSelectedIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleConfirm = () => {
    if (selectedIds.size === 0) return;
    onSaveSelection(fileItem.id, selectedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        
        {/* Encabezado del Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Seleccionar archivos a reemplazar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Resuelve el destino para este archivo con múltiples coincidencias
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detalle del archivo local */}
        <div className="px-6 py-3 bg-blue-50/50 dark:bg-slate-900/60 border-b border-blue-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Archivo local: </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">{fileItem.name}</span>
            <span className="text-slate-400 dark:text-slate-500 ml-1.5">({formatBytes(fileItem.size)})</span>
          </div>
          <div className="text-amber-800 dark:text-amber-300 font-medium">
            {matches.length} coincidencias encontradas
          </div>
        </div>

        {/* Barra de Acciones rápidas (Seleccionar / Deseleccionar todos) */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <div className="text-slate-600 dark:text-slate-300">
            Seleccionados para reemplazo:{' '}
            <strong className="text-blue-700 dark:text-blue-400 font-bold">{selectedIds.size}</strong> de {matches.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all"
            >
              <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Seleccionar todos</span>
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all"
            >
              <Square className="w-3.5 h-3.5 text-slate-400" />
              <span>Deseleccionar todos</span>
            </button>
          </div>
        </div>

        {/* Lista de coincidencias */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {matches.map((match, idx) => {
            const isSelected = selectedIds.has(match.fileId);
            const pathParts = splitPathParts(match.path);

            return (
              <div
                key={match.fileId}
                onClick={() => handleToggle(match.fileId)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-blue-50/40 dark:bg-blue-950/40 border-blue-400 dark:border-blue-500 ring-1 ring-blue-400/30 shadow-xs'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-700/50'
                }`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="mt-1 w-4 h-4 text-blue-600 dark:text-blue-500 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer pointer-events-none"
                />

                {/* Información de la coincidencia */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Coincidencia #{idx + 1}
                    </span>
                  </div>

                  {/* Jerarquía visual / Migas de pan */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <FolderTree className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      {pathParts.map((part, pIdx) => {
                        const isLast = pIdx === pathParts.length - 1;
                        return (
                          <React.Fragment key={pIdx}>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                isLast
                                  ? 'bg-blue-100 dark:bg-blue-950/80 font-bold text-blue-900 dark:text-blue-200 font-mono'
                                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {part}
                            </span>
                            {!isLast && <span className="text-slate-400 dark:text-slate-500 text-xs">/</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metadatos adicionales */}
                  <div className="mt-2.5 flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Tamaño: {formatBytes(match.size)}</span>
                    {match.modifiedTime && (
                      <span>Modificado: {formatDate(match.modifiedTime)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer del Modal */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white shadow-md shadow-blue-500/20 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar selección</span>
          </button>
        </div>

      </div>
    </div>
  );
}
