/**
 * Utility to play send sound effect when a message is successfully delivered.
 * Uses /sounds/mge_send.mp3 with Web Audio API fallback.
 */

let cachedAudio: HTMLAudioElement | null = null;

export function playSendSound() {
  try {
    if (typeof window === "undefined") return;

    if (!cachedAudio) {
      cachedAudio = new Audio("/sounds/mge_send.mp3");
      cachedAudio.volume = 0.5;
    }

    // Reset playback position
    cachedAudio.currentTime = 0;

    const playPromise = cachedAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Fallback to synthesized Web Audio API sound if audio element fails or is blocked
        playSynthesizedSendChime();
      });
    }
  } catch (err) {
    playSynthesizedSendChime();
  }
}

/**
 * Fallback Web Audio API chime generator for send feedback
 */
function playSynthesizedSendChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5 note

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Ignore audio context errors silently
  }
}
