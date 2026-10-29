import React from 'react';
import { 
  Files, 
  CheckCircle2, 
  AlertTriangle, 
  FileQuestion, 
  Upload
} from 'lucide-react';

export function SummaryCards({ summary }) {
  const {
    totalFiles = 0,
    uniqueCount = 0,
    multipleCount = 0,
    notFoundCount = 0,
    totalSelectedTargets = 0,
    foldersCount = 0
  } = summary;

  if (totalFiles === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 my-6 animate-fade-in">
      
      {/* 1. Archivos Cargados */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3.5 transition-colors h-full">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
          <Files className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Archivos cargados</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{totalFiles}</p>
        </div>
      </div>

      {/* 2. Coincidencia Única */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3.5 transition-colors h-full">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Coincidencia única</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{uniqueCount}</p>
        </div>
      </div>

      {/* 3. Requieren Revisión */}
      <div className={`p-4 rounded-xl border shadow-xs flex items-center gap-3.5 transition-colors h-full ${
        multipleCount > 0 
          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80' 
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          multipleCount > 0 
            ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300' 
            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
        }`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Requieren revisión</p>
          <p className={`text-xl font-bold ${multipleCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
            {multipleCount}
          </p>
        </div>
      </div>

      {/* 4. No encontrados */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3.5 transition-colors h-full">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
          <FileQuestion className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">No encontrados</p>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300">{notFoundCount}</p>
        </div>
      </div>

      {/* 5. Total a Reemplazar */}
      <div className="bg-blue-50/60 dark:bg-slate-800 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-xs flex items-center gap-3.5 col-span-2 sm:col-span-2 lg:col-span-1 transition-colors h-full">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
          <Upload className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-300 truncate">A reemplazar</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-blue-700 dark:text-blue-400">{totalSelectedTargets}</span>
            <span className="text-[11px] text-blue-600 dark:text-blue-300 truncate">en {foldersCount} {foldersCount === 1 ? 'carpeta' : 'carpetas'}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
