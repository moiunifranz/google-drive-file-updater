import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Folder 
} from 'lucide-react';
import { formatDate } from '../utils/fileUtils';

const LOCAL_STORAGE_HISTORY_KEY = 'drive_uploader_history';

export function HistoryPanel({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    }
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
      setHistory([]);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Historial reciente</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Operaciones registradas localmente en este navegador</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Registros */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Aún no hay registros de operaciones previas.</p>
            </div>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-xs"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    {formatDate(record.timestamp)}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Folder className="w-3 h-3" />
                    {record.rootName || 'ver_act'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs mt-1">
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {record.updatedCount} actualizados
                  </span>

                  {record.errorCount > 0 && (
                    <span className="flex items-center gap-1 text-rose-700 dark:text-rose-300 font-medium">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      {record.errorCount} errores
                    </span>
                  )}

                  {record.notFoundCount > 0 && (
                    <span className="text-slate-400 dark:text-slate-500">
                      {record.notFoundCount} no encontrados
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs">
          {history.length > 0 ? (
            <button
              type="button"
              onClick={clearHistory}
              className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-medium py-1 px-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Borrar historial</span>
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
