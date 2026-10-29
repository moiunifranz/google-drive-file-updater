import { useState, useEffect, useCallback } from 'react';
import { googleAuth } from '../services/googleAuth';
import { DRIVE_CONFIG } from '../config/driveConfig';

/**
 * Hook para gestionar el ciclo de autenticación con Google Identity Services.
 */
export function useGoogleAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGisReady, setIsGisReady] = useState(false);

  // Inicializar GIS cuando la librería externa esté disponible en window
  useEffect(() => {
    let checkInterval = null;
    let attempts = 0;

    const setupGis = () => {
      if (googleAuth.isGisLoaded()) {
        try {
          googleAuth.init(
            (authResult) => {
              setAccessToken(authResult.accessToken);
              setUserInfo(authResult.userInfo);
              setIsAuthenticated(true);
              setIsLoading(false);
              setError(null);
            },
            (authError) => {
              setError(authError.message || 'Error durante la autenticación.');
              setIsLoading(false);
            }
          );
          setIsGisReady(true);
          if (checkInterval) clearInterval(checkInterval);
        } catch (err) {
          setError(err.message);
          if (checkInterval) clearInterval(checkInterval);
        }
      } else {
        attempts++;
        if (attempts > 30) { // 15 segundos max
          if (checkInterval) clearInterval(checkInterval);
          setError('No fue posible cargar el script de Google Identity Services.');
        }
      }
    };

    if (googleAuth.isGisLoaded()) {
      setupGis();
    } else {
      checkInterval = setInterval(setupGis, 500);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  // Función para solicitar inicio de sesión
  const login = useCallback((promptConsent = false) => {
    setError(null);
    setIsLoading(true);

    if (!DRIVE_CONFIG.CLIENT_ID || DRIVE_CONFIG.CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
      setIsLoading(false);
      setError('Falta configurar VITE_GOOGLE_CLIENT_ID en el archivo .env.');
      return;
    }

    try {
      googleAuth.requestToken(promptConsent);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Error al solicitar token de Google.');
    }
  }, []);

  // Función para cerrar sesión
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await googleAuth.signOut();
    } finally {
      setAccessToken(null);
      setUserInfo(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      setError(null);
    }
  }, []);

  return {
    isAuthenticated,
    accessToken,
    userInfo,
    isLoading,
    error,
    isGisReady,
    login,
    logout,
    clearError: () => setError(null)
  };
}
