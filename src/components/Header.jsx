import React from 'react';
import { 
  HardDrive, 
  RefreshCw, 
  LogOut, 
  Folder, 
  ExternalLink, 
  History, 
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  Volume2,
  VolumeX
} from 'lucide-react';
import { DRIVE_CONFIG } from '../config/driveConfig';

export function Header({
  isAuthenticated,
  userInfo,
  rootName,
  activeFolderName,
  activeFolderPath,
  stats,
  isIndexing,
  hasSelectedFolder = false,
  theme = 'light',
  onToggleTheme,
  onScanDrive,
  onLogout,
  onOpenHistory,
  soundEnabled = true,
  onToggleSound
}) {
  const isDark = theme === 'dark';
  const displayFolderName = activeFolderName || rootName || DRIVE_CONFIG.DEFAULT_ROOT_NAME || 'ver_act';
  const displayFolderPath = activeFolderPath || displayFolderName;

  return (
    <header className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/80 sticky top-0 z-30 transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Título */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                  Google Drive File Updater
                </h1>
                {isAuthenticated ? (
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex-shrink-0">
                    <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Conectado
                  </span>
                ) : (
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <AlertCircle className="w-3 h-3 text-slate-400" />
                    Desconectado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden lg:block truncate">
                Reemplazo seguro de contenido existente sin alterar URLs ni permisos
              </p>
            </div>
          </div>

          {/* Acciones & Controles de Usuario */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            
            {/* Carpeta Activa / Raíz (Visible si está autenticado) */}
            {isAuthenticated && (
              <a
                href={DRIVE_CONFIG.ROOT_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 transition-colors group"
                title={`Ubicación autorizada: ${displayFolderPath}`}
              >
                <Folder className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-current opacity-80" />
                <span className="font-semibold max-w-[130px] md:max-w-[160px] truncate">
                  {displayFolderName}
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 ml-0.5" />
              </a>
            )}

            {/* Botón Historial */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                title="Ver historial de actualizaciones"
                aria-label="Ver historial"
              >
                <History className="w-4 h-4" />
              </button>
            )}

            {/* Botón Analizar / Actualizar Índice */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={onScanDrive}
                disabled={isIndexing || !hasSelectedFolder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/60 disabled:opacity-40 transition-colors"
                title={hasSelectedFolder ? "Escanear y actualizar el índice de archivos en memoria" : "Selecciona primero una carpeta de trabajo"}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isIndexing ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
                <span className="hidden md:inline">
                  {stats ? 'Actualizar índice' : 'Analizar carpeta'}
                </span>
              </button>
            )}

            {/* Botón Alternar Tema Light / Dark (Visible siempre) */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Botón Notificaciones Sonoras (Visible siempre) */}
            <button
              type="button"
              onClick={onToggleSound}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
              title={soundEnabled ? 'Silenciar notificaciones' : 'Activar notificaciones'}
              aria-label={soundEnabled ? 'Silenciar notificaciones' : 'Activar notificaciones'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              )}
            </button>

            {/* Perfil de Usuario */}
            {isAuthenticated && userInfo && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                {userInfo.picture ? (
                  <img
                    src={userInfo.picture}
                    alt={userInfo.name || 'Usuario'}
                    className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {(userInfo.name || userInfo.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[110px] truncate hidden xl:block">
                  {userInfo.name || userInfo.email}
                </span>
              </div>
            )}

            {/* Botón Cerrar Sesión */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/60 transition-colors"
                title="Cerrar sesión de Google"
                aria-label="Desconectar cuenta de Google"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Desconectar</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
