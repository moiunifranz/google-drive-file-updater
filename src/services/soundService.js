/**
 * Servicio de audio para notificaciones sonoras.
 * - Sonido de éxito: archivo MP3 alojado en public/sounds/success.mp3
 *   respetando import.meta.env.BASE_URL para compatibilidad en localhost y GitHub Pages.
 * - Sonido de advertencia: tonos sintetizados con Web Audio API con control de volumen proporcional.
 */

let audioCtx = null;

/**
 * Obtiene la URL absoluta o relativa correcta para el archivo de sonido,
 * respetando el `base` configurado en Vite (ej: '/google-drive-file-updater/' en GitHub Pages).
 */
export function getSuccessSoundUrl() {
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}sounds/success.mp3`;
}

/**
 * Obtiene o crea la instancia singleton de AudioContext.
 */
function getAudioContext() {
  if (typeof window === 'undefined') return null;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

/**
 * Reanuda el contexto de audio tras una interacción del usuario
 * para cumplir con las políticas de autoplay de los navegadores.
 */
export function resumeAudioContext() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    // Ignorar si el navegador restringe la reproducción
  }
}

/**
 * Genera un tono sintetizado con envolvente AD (Attack / Decay).
 */
function playTone(ctx, freq, startTime, duration, maxGain = 0.15, type = 'sine') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  const attack = 0.015;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(maxGain, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

/**
 * Reproduce el sonido de confirmación exitosa utilizando success.mp3.
 * 
 * @param {number} volume Nivel de volumen de 0.0 a 1.0 (por defecto 0.5)
 */
export function playSuccessSound(volume = 0.5) {
  try {
    resumeAudioContext();
    const clampedVolume = Math.max(0, Math.min(1, typeof volume === 'number' ? volume : 0.5));
    if (clampedVolume === 0) return;

    const soundUrl = getSuccessSoundUrl();
    const audio = new Audio(soundUrl);
    audio.volume = clampedVolume;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('No se pudo reproducir success.mp3:', err);
      });
    }
  } catch (err) {
    console.warn('Error al reproducir sonido de éxito:', err);
  }
}

/**
 * Reproduce el sonido de advertencia / finalización con errores:
 * Dos tonos descendentes sintetizados con Web Audio API (~0.64s),
 * con ganancia ajustada proporcionalmente según el volumen configurado.
 * 
 * @param {number} volume Nivel de volumen de 0.0 a 1.0 (por defecto 0.5)
 */
export function playWarningSound(volume = 0.5) {
  try {
    resumeAudioContext();
    const clampedVolume = Math.max(0, Math.min(1, typeof volume === 'number' ? volume : 0.5));
    if (clampedVolume === 0) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Escalar la ganancia con el volumen (0.5 equivale a la ganancia base de 0.15)
    const gainScale = 0.3 * clampedVolume;

    // Tono 1: A4 (440.00 Hz)
    playTone(ctx, 440.00, now, 0.18, gainScale);
    // Tono 2: F4 (349.23 Hz) - intervalo menor descendente
    playTone(ctx, 349.23, now + 0.22, 0.42, gainScale);
  } catch (err) {
    console.warn('No se pudo reproducir la notificación sonora de advertencia:', err);
  }
}
