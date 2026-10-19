// Driven by the existing reveal callback, never by a second typing timer.
const DIALOGUE_SOUND_DEFAULTS = Object.freeze({ enabled: true, cadence: 3, volume: 0.6 });

function createTextCadence(cadence = 3) {
  const interval = Math.max(2, Math.floor(Number(cadence) || 3));
  let visible = 0;
  return (character) => /[\p{L}\p{N}]/u.test(character) && ++visible % interval === 0;
}

function createDialogueSoundController(createPlayer) {
  let player = null, subscription = null, version = 0;
  let accepting = false, active = true, busy = false, disposed = false;
  function pause() {
    version++;
    busy = false;
    try { player?.pause(); } catch { /* Decorative audio must not block navigation. */ }
  }
  function stop() { accepting = false; pause(); }
  function begin(volume = DIALOGUE_SOUND_DEFAULTS.volume) {
    if (disposed) return;
    stop();
    accepting = true;
    try {
      if (!player) {
        player = createPlayer();
        subscription = player.onFinish(() => { busy = false; });
      }
      player.volume = Math.max(0, Math.min(1, Number(volume) || 0));
    } catch { stop(); }
  }
  async function pulse() {
    if (disposed || !accepting || !active || busy || !player?.isLoaded) return;
    busy = true;
    const ticket = version;
    const current = player;
    try {
      await current.seekTo(0);
      if (ticket !== version || disposed || !accepting || !active) return;
      await current.play();
    } catch {
      // Includes browser play() cancellation and native seek/disposal rejection.
      if (ticket === version) busy = false;
    }
  }
  function finish() {
    accepting = false;
    version++; // Cancel pending starts; an already audible 120 ms blip ends naturally.
  }
  function setActive(value) {
    active = value;
    if (!active) pause();
  }
  function dispose() {
    if (disposed) return;
    stop(); disposed = true;
    try { subscription?.remove(); } catch {}
    try { player?.remove(); } catch {}
    subscription = null; player = null;
  }
  return { begin, pulse, finish, stop, setActive, dispose };
}

module.exports = { DIALOGUE_SOUND_DEFAULTS, createTextCadence, createDialogueSoundController };
