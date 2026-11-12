// Notification chime, synthesised with the Web Audio API (no audio file needed).
// Browsers only allow audio after the user has interacted with the page once, so we unlock on first gesture.

type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let listening = false;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function isSoundOn() {
  try { return localStorage.getItem("chat-sound") !== "off"; } catch { return true; }
}

export function setSoundOn(on: boolean) {
  try { localStorage.setItem("chat-sound", on ? "on" : "off"); } catch { /* ignore */ }
}

/** Call once from any component; the audio engine starts on the visitor's first click, tap or key press. */
export function unlockAudio() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  const events = ["pointerdown", "keydown", "touchstart"] as const;
  const unlock = () => {
    getCtx()?.resume().catch(() => null);
    events.forEach((e) => window.removeEventListener(e, unlock));
  };
  events.forEach((e) => window.addEventListener(e, unlock, { passive: true }));
}

function ding(c: AudioContext) {
  const now = c.currentTime;
  // two soft rising notes
  [
    { freq: 784, start: 0 }, // G5
    { freq: 1175, start: 0.14 }, // D6
  ].forEach(({ freq, start }) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.45);
    osc.connect(gain).connect(c.destination);
    osc.start(now + start);
    osc.stop(now + start + 0.5);
  });
}

/** Plays the chime if sound is on and the browser allows it. Never throws. */
export function playChime(force = false) {
  if (!force && !isSoundOn()) return;
  const c = getCtx();
  if (!c) return;
  try {
    if (c.state === "running") ding(c);
    else c.resume().then(() => ding(c)).catch(() => null);
  } catch { /* ignore */ }
}
