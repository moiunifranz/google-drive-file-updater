import { useState, useCallback, useRef } from 'react';
import {
  playSuccessSound as playSuccess,
  playWarningSound as playWarning,
  resumeAudioContext
} from '../services/soundService';

const SOUND_STORAGE_KEY = 'drive_uploader_sound_enabled';
const VOLUME_STORAGE_KEY = 'drive_uploader_volume';

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
 * Obtiene el volumen inicial guardado en localStorage (0.0 a 1.0).
 * Por defecto es 0.5 (50 %).
 */
function getInitialVolume() {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(VOLUME_STORAGE_KEY);
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          return parsed;
        }
      }
    } catch {
      // Ignorar restricciones de almacenamiento local
    }
  }
  return 0.5; // 50% por defecto
}

/**
 * Hook centralizado para el control, volumen y reproducción de notificaciones sonoras.
 */
export function useSoundNotification() {
  const [soundEnabled, setSoundEnabled] = useState(getInitialSoundEnabled);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const [volume, setVolumeState] = useState(getInitialVolume);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

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

  // Actualiza el volumen (0.0 a 1.0) y persiste la preferencia
  const setVolume = useCallback((newVolume) => {
    resumeAudioContext();
    const clamped = Math.max(0, Math.min(1, Number(newVolume)));
    setVolumeState(clamped);
    volumeRef.current = clamped;
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
    } catch {
      // Ignorar restricciones de almacenamiento
    }
  }, []);

  // Sonido de prueba ejecutado a petición del usuario
  const testSound = useCallback(() => {
    resumeAudioContext();
    playSuccess(volumeRef.current);
  }, []);

  // Sonido de confirmación exitosa directa
  const playSuccessSound = useCallback(() => {
    if (!soundEnabledRef.current || volumeRef.current <= 0) return;
    playSuccess(volumeRef.current);
  }, []);

  // Sonido de advertencia directo
  const playWarningSound = useCallback(() => {
    if (!soundEnabledRef.current || volumeRef.current <= 0) return;
    playWarning(volumeRef.current);
  }, []);

  /**
   * Evalúa el resultado final del lote de subida y reproduce el sonido correspondiente una sola vez:
   * - Si se canceló el lote: no reproduce sonido de éxito.
   * - Si uno o varios archivos fallaron: reproduce sonido de advertencia.
   * - Si todos los archivos se actualizaron con éxito: reproduce sonido de confirmación MP3.
   */
  const playBatchResultSound = useCallback((results, wasCancelled = false) => {
    if (!soundEnabledRef.current || volumeRef.current <= 0) return;
    if (!results || results.length === 0) return;

    // Regla de cancelación: no reproducir sonido de éxito
    if (wasCancelled) {
      return;
    }

    const hasErrors = results.some((r) => !r.success);
    if (hasErrors) {
      playWarning(volumeRef.current);
    } else {
      playSuccess(volumeRef.current);
    }
  }, []);

  return {
    soundEnabled,
    toggleSound,
    volume,
    setVolume,
    testSound,
    playSuccessSound,
    playWarningSound,
    playBatchResultSound,
    resumeAudio: resumeAudioContext
  };
}
