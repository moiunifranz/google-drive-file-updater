import { DRIVE_CONFIG } from '../config/driveConfig';

/**
 * Servicio de Autenticación con Google Identity Services (GIS).
 * No almacena client_secrets ni refresh tokens permanentes.
 */
class GoogleAuthService {
  constructor() {
    this.tokenClient = null;
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.userInfo = null;
  }

  /**
   * Verifica si la librería GIS está cargada en window.
   */
  isGisLoaded() {
    return typeof window !== 'undefined' && window.google?.accounts?.oauth2 !== undefined;
  }

  /**
   * Inicializa el cliente de tokens OAuth 2.0.
   * @param {Function} onTokenReceived 
   * @param {Function} onError 
   */
  init(onTokenReceived, onError) {
    if (!this.isGisLoaded()) {
      throw new Error('La librería Google Identity Services aún no se ha cargado en la página.');
    }

    const clientId = DRIVE_CONFIG.CLIENT_ID;
    if (!clientId || clientId.trim() === '' || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
      throw new Error('Configuración incompleta: VITE_GOOGLE_CLIENT_ID no está definido o tiene el valor por defecto.');
    }

    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_CONFIG.OAUTH_SCOPES,
        callback: async (response) => {
          if (response.error) {
            console.error('Error de autenticación Google GIS:', response);
            let userMsg = 'Error al autorizar con Google.';
            if (response.error === 'access_denied') {
              userMsg = 'Acceso denegado: debes conceder los permisos solicitados para continuar.';
            } else if (response.error === 'popup_closed_by_user') {
              userMsg = 'La ventana de autenticación fue cerrada antes de completar el inicio de sesión.';
            }
            if (onError) onError(new Error(userMsg));
            return;
          }

          this.accessToken = response.access_token;
          // response.expires_in viene en segundos (generalmente 3599)
          const expiresInSeconds = Number(response.expires_in) || 3600;
          this.tokenExpiresAt = Date.now() + (expiresInSeconds - 60) * 1000; // Margen de seguridad de 60s

          // Intentar obtener el perfil del usuario
          try {
            this.userInfo = await this.fetchUserProfile(this.accessToken);
          } catch (err) {
            console.warn('No se pudo obtener información del perfil del usuario:', err);
            this.userInfo = null;
          }

          if (onTokenReceived) {
            onTokenReceived({
              accessToken: this.accessToken,
              expiresAt: this.tokenExpiresAt,
              userInfo: this.userInfo
            });
          }
        },
      });
      return true;
    } catch (err) {
      console.error('Fallo al inicializar initTokenClient:', err);
      throw err;
    }
  }

  /**
   * Abre la ventana emergente de Google para solicitar autorización.
   * @param {boolean} promptConsent Forzar pantalla de consentimiento
   */
  requestToken(promptConsent = false) {
    if (!this.tokenClient) {
      throw new Error('El cliente de autenticación no ha sido inicializado.');
    }

    this.tokenClient.requestAccessToken({
      prompt: promptConsent ? 'consent' : ''
    });
  }

  /**
   * Consulta los datos de usuario a la API de Google usando el Access Token.
   * @param {string} token 
   */
  async fetchUserProfile(token) {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Error ${res.status} al consultar perfil`);
    }

    return await res.json();
  }

  /**
   * Verifica si el token actual sigue vigente.
   */
  isAuthenticated() {
    return !!this.accessToken && !!this.tokenExpiresAt && Date.now() < this.tokenExpiresAt;
  }

  /**
   * Retorna el token actual si es válido.
   */
  getAccessToken() {
    if (this.isAuthenticated()) {
      return this.accessToken;
    }
    return null;
  }

  /**
   * Cierra sesión y revoca el token en los servidores de Google.
   */
  signOut() {
    return new Promise((resolve) => {
      const currentToken = this.accessToken;
      this.accessToken = null;
      this.tokenExpiresAt = null;
      this.userInfo = null;

      if (currentToken && window.google?.accounts?.oauth2?.revoke) {
        try {
          window.google.accounts.oauth2.revoke(currentToken, () => {
            resolve(true);
          });
        } catch {
          resolve(true);
        }
      } else {
        resolve(true);
      }
    });
  }
}

export const googleAuth = new GoogleAuthService();
