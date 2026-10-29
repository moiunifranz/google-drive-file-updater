import React, { useState, useEffect, useCallback } from 'react';
import { 
  Folder, 
  ChevronRight, 
  ArrowLeft, 
  FolderCheck, 
  Loader2, 
  Search, 
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { DRIVE_CONFIG } from '../config/driveConfig';
import { listDirectSubfolders, getFolderMetadata } from '../services/driveApi';

export function FolderSelector({
  token,
  onSelectFolder,
  selectedFolder,
  onCancelChange
}) {
  const rootDisplayName = DRIVE_CONFIG.DEFAULT_ROOT_NAME || 'ver_act';

  // Historial de navegación para breadcrumbs y botón volver
  const [navHistory, setNavHistory] = useState([
    { id: DRIVE_CONFIG.ROOT_FOLDER_ID, name: rootDisplayName }
  ]);
  
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentFolder = navHistory[navHistory.length - 1];
  const isAtRoot = navHistory.length === 1;

  // Cargar las carpetas hijas directas del nivel actual (lazy loading)
  const loadCurrentLevel = useCallback(async (folderId) => {
    if (!token || !folderId) return;

    setIsLoading(true);
    setError(null);
    setSearchQuery('');

    try {
      // Si estamos en la raíz, consultar el nombre real dinámicamente si no coincide
      if (folderId === DRIVE_CONFIG.ROOT_FOLDER_ID) {
        getFolderMetadata(folderId, token)
          .then(meta => {
            if (meta?.name && meta.name !== navHistory[0].name) {
              setNavHistory(prev => [
                { id: prev[0].id, name: meta.name },
                ...prev.slice(1)
              ]);
            }
          })
          .catch(() => {});
      }

      // Consulta de un solo nivel: únicamente carpetas hijas directas, sin archivos ni recursión
      const items = await listDirectSubfolders(folderId, token);
      setFolders(items);
    } catch (err) {
      console.error('Error al listar carpetas:', err);
      setError(err.message || 'Error al consultar las carpetas de este nivel.');
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, navHistory]);

  // Al cambiar la carpeta actual en la pila de navegación, cargar sus hijas
  useEffect(() => {
    if (currentFolder?.id) {
      loadCurrentLevel(currentFolder.id);
    }
  }, [currentFolder?.id, loadCurrentLevel]);

  // Entrar a una carpeta hija
  const handleEnterFolder = (childFolder) => {
    setNavHistory(prev => [
      ...prev,
      { id: childFolder.id, name: childFolder.name }
    ]);
  };

  // Volver un nivel hacia atrás
  const handleGoBack = () => {
    if (isAtRoot) return; // Seguridad: nunca salir de ROOT_FOLDER_ID
    setNavHistory(prev => prev.slice(0, prev.length - 1));
  };

  // Saltar a un nivel específico del breadcrumb
  const handleJumpToLevel = (index) => {
    if (index >= 0 && index < navHistory.length) {
      setNavHistory(prev => prev.slice(0, index + 1));
    }
  };

  // Generar la ruta en texto (ej: "ver_act / Semestre 3 / PII-713")
  const buildCurrentPath = () => {
    return navHistory.map(item => item.name).join(' / ');
  };

  // Acción principal: "Usar esta carpeta"
  const handleConfirmFolder = () => {
    if (isAtRoot) {
      const confirmRoot = window.confirm(
        'Has seleccionado la carpeta raíz principal ("' + currentFolder.name + '"). Contiene gran cantidad de subcarpetas. ¿Deseas seleccionarla o prefieres entrar a una materia específica?'
      );
      if (!confirmRoot) return;
    }

    onSelectFolder({
      id: currentFolder.id,
      name: currentFolder.name,
      path: buildCurrentPath()
    });
  };

  // Filtrado de carpetas por búsqueda local en este nivel
  const filteredFolders = folders.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md shadow-slate-200/50 dark:shadow-black/30 overflow-hidden my-6 transition-colors animate-fade-in">
      
      {/* Encabezado del Navegador de Carpetas */}
      <div className="p-6 bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-white dark:from-slate-800 dark:via-slate-800 dark:to-slate-800/80 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
                PASO 1
              </span>
              <span>Selecciona la carpeta de la materia</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Seleccionar carpeta de trabajo
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Navega hasta la materia deseada. Solo se analizará la carpeta que elijas.
            </p>
          </div>

          {/* Botón principal: USAR ESTA CARPETA */}
          <div className="flex items-center gap-2">
            {selectedFolder && onCancelChange && (
              <button
                type="button"
                onClick={onCancelChange}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirmFolder}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <FolderCheck className="w-4 h-4" />
              <span>Usar esta carpeta</span>
            </button>
          </div>
        </div>

        {/* Barra de Breadcrumbs */}
        <div className="mt-5 p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={handleGoBack}
            disabled={isAtRoot || isLoading}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent font-medium transition-colors mr-1 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title="Volver al nivel anterior"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver</span>
          </button>

          <span className="text-slate-300 dark:text-slate-600">|</span>

          {navHistory.map((item, idx) => {
            const isLast = idx === navHistory.length - 1;
            return (
              <React.Fragment key={item.id + idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 flex-shrink-0" />}
                <button
                  type="button"
                  onClick={() => handleJumpToLevel(idx)}
                  disabled={isLast || isLoading}
                  className={`px-2 py-1 rounded-lg transition-colors truncate max-w-[200px] ${
                    isLast
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60 cursor-default'
                      : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                  }`}
                  title={item.name}
                >
                  {item.name}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Barra de Filtro de Búsqueda Rápida en este nivel */}
      <div className="px-6 py-3 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar carpeta en ${currentFolder.name}...`}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {isLoading ? 'Consultando...' : `${filteredFolders.length} carpetas`}
        </span>
      </div>

      {/* Contenido: Listado de Carpetas del Nivel Actual */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-xs font-medium">Consultando subcarpetas de &quot;{currentFolder.name}&quot;...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => loadCurrentLevel(currentFolder.id)}
              className="font-bold underline text-rose-700 dark:text-rose-300 ml-3"
            >
              Reintentar
            </button>
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {searchQuery ? 'No hay carpetas que coincidan con la búsqueda' : 'Esta carpeta no contiene subcarpetas directas'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Puedes pulsar <strong>&quot;Usar esta carpeta&quot;</strong> si deseas trabajar directamente sobre &quot;{currentFolder.name}&quot;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredFolders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => handleEnterFolder(folder)}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-blue-50/40 dark:hover:bg-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all text-left flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 dark:group-hover:text-white flex items-center justify-center flex-shrink-0 transition-colors">
                  <Folder className="w-5 h-5 fill-current opacity-80" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-900 dark:group-hover:text-blue-300 truncate" title={folder.name}>
                    {folder.name}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1 mt-0.5">
                    <span>Abrir carpeta</span>
                    <ChevronRight className="w-3 h-3" />
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
