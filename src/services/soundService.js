/**
 * Servicio de audio utilizando Web Audio API para notificaciones sonoras.
 * Genera sonidos sintetizados profesionales sin archivos de audio externos.
 */

let audioCtx = null;

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
 * Reproduce el sonido de confirmación exitosa:
 * Acorde ascendente suave de tres notas (~0.73s).
 */
export function playSuccessSound() {
  try {
    resumeAudioContext();
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Nota 1: D5 (587.33 Hz)
    playTone(ctx, 587.33, now, 0.18, 0.12);
    // Nota 2: F#5 (739.99 Hz)
    playTone(ctx, 739.99, now + 0.09, 0.20, 0.14);
    // Nota 3: A5 (880.00 Hz) con mayor duración
    playTone(ctx, 880.00, now + 0.18, 0.55, 0.16);
    // Armónico sutil para brillo cristalino: A6 (1760.00 Hz)
    playTone(ctx, 1760.00, now + 0.18, 0.40, 0.03);
  } catch (err) {
    console.warn('No se pudo reproducir la notificación sonora de éxito:', err);
  }
}

/**
 * Reproduce el sonido de advertencia / finalización con errores:
 * Dos tonos descendentes claros (~0.64s).
 */
export function playWarningSound() {
  try {
    resumeAudioContext();
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tono 1: A4 (440.00 Hz)
    playTone(ctx, 440.00, now, 0.18, 0.15);
    // Tono 2: F4 (349.23 Hz) - intervalo menor descendente
    playTone(ctx, 349.23, now + 0.22, 0.42, 0.15);
  } catch (err) {
    console.warn('No se pudo reproducir la notificación sonora de advertencia:', err);
  }
}
