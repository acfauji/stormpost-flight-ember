export function createSoundEngine() {
  let context = null;
  let oscillator = null;
  let gain = null;
  let muted = false;
  function start() {
    if (context || typeof window.AudioContext === 'undefined') return;
    try {
      context = new window.AudioContext();
      oscillator = context.createOscillator();
      gain = context.createGain();
      oscillator.type = 'sawtooth'; oscillator.frequency.value = 74;
      gain.gain.value = 0.012;
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start();
    } catch { context = null; }
  }
  function engine(throttle, storm) {
    if (!context || !oscillator || !gain || muted) return;
    const now = context.currentTime;
    oscillator.frequency.setTargetAtTime(66 + throttle * 70 + storm * 10, now, 0.12);
    gain.gain.setTargetAtTime(0.008 + throttle * 0.018, now, 0.18);
  }
  function cue(frequency = 440, duration = 0.12, shape = 'triangle') {
    if (!context || muted) return;
    const tone = context.createOscillator(); const amp = context.createGain();
    tone.type = shape; tone.frequency.setValueAtTime(frequency, context.currentTime);
    amp.gain.setValueAtTime(0.055, context.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    tone.connect(amp); amp.connect(context.destination); tone.start(); tone.stop(context.currentTime + duration);
  }
  function toggle() { muted = !muted; if (context?.state === 'suspended') context.resume(); return !muted; }
  return { start, engine, cue, toggle };
}
