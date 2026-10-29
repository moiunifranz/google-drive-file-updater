import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, MinusCircle, ShieldAlert } from 'lucide-react';

export function StatusBadge({ 
  status, 
  uploadStatus, 
  matchCount = 0, 
  reviewed = false,
  completedCount = 0,
  totalSelectedCount = 0
}) {
  // 1. Prioridad: Estados del proceso de subida
  if (uploadStatus === 'uploading') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
        Actualizando...
      </span>
    );
  }

  if (uploadStatus === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
        Actualizado
      </span>
    );
  }

  if (uploadStatus === 'partial-error') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 shadow-xs">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        {completedCount > 0 ? `${completedCount} de ${totalSelectedCount} actualizados` : 'Actualización parcial'}
      </span>
    );
  }

  if (uploadStatus === 'verification-error') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-xs">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        Sin verificación
      </span>
    );
  }

  if (uploadStatus === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-xs">
        <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        Error
      </span>
    );
  }

  // 2. Prioridad: Estados de coincidencia
  switch (status) {
    case 'unique':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          1 coincidencia
        </span>
      );

    case 'multiple':
      if (reviewed) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {matchCount} coincidencias
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          {matchCount} coincidencias (Revisión)
        </span>
      );

    case 'not-found':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          <MinusCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          No encontrado en Drive
        </span>
      );

    default:
      return null;
  }
}
