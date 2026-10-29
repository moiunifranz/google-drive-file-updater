import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  FileUp, 
  Trash2
} from 'lucide-react';

export function DropZone({
  onFilesSelected,
  onClearFiles,
  hasFiles,
  filesCount,
  caseSensitive,
  onToggleCaseSensitive,
  disabled = false
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      {/* Contenedor DropZone Compacto y Limpio */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center cursor-pointer transition-all ${
          disabled
            ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
            : isDragOver
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.003] shadow-lg shadow-blue-500/10'
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800/80 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center pointer-events-none">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
            isDragOver 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
          }`}>
            <UploadCloud className="w-6 h-6" />
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Arrastra aquí los archivos que deseas actualizar
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm">
            También puedes seleccionarlos desde tu equipo. Acepta cualquier formato compatible con Drive.
          </p>

          <button
            type="button"
            className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={disabled}
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Seleccionar archivos</span>
          </button>
        </div>
      </div>

      {/* Barra de opciones y controles inferiores */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-600 dark:text-slate-400">
        
        {/* Toggle Sensibilidad a mayúsculas/minúsculas */}
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => onToggleCaseSensitive(e.target.checked)}
            className="w-4 h-4 text-blue-600 dark:text-blue-500 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-blue-500"
          />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Coincidencia exacta de mayúsculas y minúsculas
          </span>
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">
            (Por defecto: Activo)
          </span>
        </label>

        {/* Botón limpiar archivos si hay cargados */}
        {hasFiles && (
          <button
            type="button"
            onClick={onClearFiles}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-800/60 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar lista ({filesCount})</span>
          </button>
        )}

      </div>
    </div>
  );
}
