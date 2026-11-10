import { useState, useCallback, useRef } from 'react';
import {
  playSuccessSound as playSuccess,
  playWarningSound as playWarning,
  resumeAudioContext
} from '../services/soundService';

const SOUND_STORAGE_KEY = 'drive_uploader_sound_enabled';

/**
 * Obtiene la preferencia de sonido guardada en localStorage.
 * Por defecto está activada (true).
 */
function getInitialSoundEnabled() {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(SOUND_STORAGE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // Ignorar restricciones de almacenamiento local
    }
  }
  return true;
}

/**
 * Hook centralizado para el control y reproducción de notificaciones sonoras.
 */
export function useSoundNotification() {
  const [soundEnabled, setSoundEnabled] = useState(getInitialSoundEnabled);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Alterna el estado del sonido y persiste la preferencia
  const toggleSound = useCallback(() => {
    resumeAudioContext();
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      } catch {
        // Ignorar restricciones de almacenamiento
      }
      return next;
    });
  }, []);

  // Sonido de confirmación exitosa directa
  const playSuccessSound = useCallback(() => {
    if (!soundEnabledRef.current) return;
    playSuccess();
  }, []);

  // Sonido de advertencia directo
  const playWarningSound = useCallback(() => {
    if (!soundEnabledRef.current) return;
    playWarning();
  }, []);

  /**
   * Evalúa el resultado final del lote de subida y reproduce el sonido correspondiente una sola vez:
   * - Si se canceló el lote: no reproduce sonido de éxito.
   * - Si uno o varios archivos fallaron: reproduce sonido de advertencia.
   * - Si todos los archivos se actualizaron con éxito: reproduce sonido de confirmación.
   */
  const playBatchResultSound = useCallback((results, wasCancelled = false) => {
    if (!soundEnabledRef.current) return;
    if (!results || results.length === 0) return;

    // Regla de cancelación: no reproducir sonido de éxito
    if (wasCancelled) {
      return;
    }

    const hasErrors = results.some((r) => !r.success);
    if (hasErrors) {
      playWarning();
    } else {
      playSuccess();
    }
  }, []);

  return {
    soundEnabled,
    toggleSound,
    playSuccessSound,
    playWarningSound,
    playBatchResultSound,
    resumeAudio: resumeAudioContext
  };
}
