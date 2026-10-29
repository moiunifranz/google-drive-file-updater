import React from 'react';
import { 
  Folder, 
  ExternalLink, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { DRIVE_CONFIG } from '../config/driveConfig';

export function LoginButton({ onLogin, isLoading, isGisReady, error, rootFolderName }) {
  const isMissingClientId = !DRIVE_CONFIG.CLIENT_ID || DRIVE_CONFIG.CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID';
  const displayRootName = rootFolderName || DRIVE_CONFIG.DEFAULT_ROOT_NAME || 'ver_act';

  return (
    <div className="max-w-md mx-auto my-12 px-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        
        {/* Banner Superior con degradado sobrio */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 text-white text-center">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3.5 border border-white/20 shadow-inner">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Google Drive File Updater</h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">
            Reemplazo seguro de archivos existentes conservando enlaces, historial y permisos.
          </p>
        </div>

        {/* Contenido y Acción */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Advertencia si falta Client ID */}
          {isMissingClientId && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold mb-1">Configuración pendiente:</strong>
                  Crea un archivo <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono">.env</code> y define tu <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono">VITE_GOOGLE_CLIENT_ID</code>.
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de Error si ocurrió alguno */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Error de autenticación:</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Botón de Inicio de Sesión */}
          <button
            type="button"
            onClick={() => onLogin(false)}
            disabled={isLoading || !isGisReady || isMissingClientId}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Conectando con Google...</span>
              </>
            ) : (
              <>
                {/* Google "G" icon */}
                <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Conectar con Google Drive</span>
              </>
            )}
          </button>

          {/* Tarjeta Compacta de Carpeta Raíz */}
          <div className="pt-2">
            <a
              href={DRIVE_CONFIG.ROOT_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 transition-colors flex items-center justify-between group"
              title="Abrir carpeta raíz en Google Drive"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Folder className="w-4 h-4 fill-current opacity-80" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                    Carpeta raíz autorizada
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {displayRootName}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
