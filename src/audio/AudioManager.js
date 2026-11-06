import Phaser from 'phaser';

// Keys -> files inside public/audio/. Missing files are skipped without errors.
export const MUSIC_FILES = {
  bgm: 'music/background.mp3',
  'movie-music': 'music/movie.mp3',
};
export const SFX_FILES = {
  'sfx-footsteps': 'effects/footsteps.mp3',
  'sfx-click': 'effects/click.mp3',
  'sfx-pizza-open': 'effects/pizza-open.mp3',
  'sfx-eating': 'effects/eating.mp3',
  'sfx-typing': 'effects/typing.mp3',
  'sfx-clapping': 'effects/clapping.mp3',   
};

// BASE_URL is "/" under `vite dev`. A future Electron build only needs Vite's `base: './'`.
const BASE = (import.meta.env && import.meta.env.BASE_URL) || './';
export const audioUrl = (p) => `${BASE}audio/${p}`;

export function loadAudio(loader) {
  Object.entries({ ...MUSIC_FILES, ...SFX_FILES }).forEach(([key, file]) => loader.audio(key, audioUrl(file)));
}

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

export class AudioManager {
  constructor(game) {
    this.game = game;
    this.vol = { music: 0.6, sfx: 0.8 };       // kept for the whole session
    this.muted = false;
    this.duck = 1; this.duckTarget = 1; this.duckRate = 1;
    this.tracks = new Map();                   // music + looping sfx (one instance per key)
    this.shots = new Map();                    // one-shot sfx (one instance per key)
    this.missing = new Set();
    this.wantMusic = null;
    this.armed = false;
    this.listeners = new Set();
    game.events.on('step', this.tick, this);
  }

  get snd() { return this.game.sound; }
  has(key) { return this.game.cache.audio.exists(key); }
  markMissing(key) { this.missing.add(key); console.warn(`[audio] "${key}" not found - continuing without it.`); }
  musicLevel() { return this.muted ? 0 : this.vol.music * this.duck; }
  sfxLevel() { return this.muted ? 0 : this.vol.sfx; }

  /* ---------- lifecycle ---------- */
  tick(time, delta) {
    const snd = this.snd;
    if (!snd) return;
    if (!this.armed) {                         // autoplay: Phaser unlocks on the first key/click
      this.armed = true;
      if (snd.locked) snd.once(Phaser.Sound.Events.UNLOCKED, () => this.resumeWanted());
    }
    const dt = delta / 1000;
    if (this.duck !== this.duckTarget) {
      const st = this.duckRate * dt;
      this.duck = this.duck < this.duckTarget ? Math.min(this.duckTarget, this.duck + st) : Math.max(this.duckTarget, this.duck - st);
    }
    for (const t of this.tracks.values()) {
      if (t.gain !== t.target) {
        const st = t.rate * dt;
        t.gain = t.gain < t.target ? Math.min(t.target, t.gain + st) : Math.max(t.target, t.gain - st);
      }
      if (t.sound.isPlaying) {
        t.sound.setVolume(t.gain * (t.bus === 'music' ? this.musicLevel() : this.sfxLevel()));
        if (t.gain === 0 && t.target === 0) t.sound.stop();
      }
    }
  }

  resumeWanted() { if (this.wantMusic) this.playMusic(this.wantMusic); }
  onAssetsLoaded() { this.resumeWanted(); }

  track(key, bus, loop) {
    let t = this.tracks.get(key);
    if (!t) {
      if (!this.has(key)) return null;
      t = { key, bus, sound: this.snd.add(key, { loop }), gain: 0, target: 0, rate: 1 };
      this.tracks.set(key, t);
    }
    return t;
  }

  fadeTo(t, target, ms) {
    t.target = target;
    if (ms <= 0) { t.gain = target; return; }
    t.rate = Math.max(0.0001, Math.abs(target - t.gain)) / (ms / 1000);
  }

  /* ---------- music ---------- */
  // Returns false only if the file is known to be missing (so callers can duck instead).
  playMusic(key, { fade = 1400 } = {}) {
    if (this.missing.has(key)) return false;
    this.wantMusic = key;
    if (!this.snd || this.snd.locked || !this.has(key)) return true;   // starts after unlock / load
    for (const t of this.tracks.values()) if (t.bus === 'music' && t.key !== key) this.fadeTo(t, 0, fade);
    const t = this.track(key, 'music', true);
    if (!t) return true;
    if (!t.sound.isPlaying) { t.gain = 0; t.sound.play({ loop: true, volume: 0 }); }
    this.fadeTo(t, 1, fade);
    return true;
  }

  stopMusic(fade = 800) {
    this.wantMusic = null;
    for (const t of this.tracks.values()) if (t.bus === 'music') this.fadeTo(t, 0, fade);
  }

  setDuck(factor, ms = 600) {
    this.duckTarget = clamp01(factor);
    this.duckRate = Math.max(0.0001, Math.abs(this.duckTarget - this.duck)) / (Math.max(1, ms) / 1000);
  }

  /* ---------- sound effects ---------- */
  // Looping effect whose loudness follows `level` (0 = stop). Used for footsteps and typing.
  setLoop(key, level, ms = 160) {
    const snd = this.snd;
    if (!snd || snd.locked || this.missing.has(key)) return;
    const t = this.track(key, 'sfx', true);
    if (!t) return;
    if (t.target === level && (level === 0 || t.sound.isPlaying)) return;
    if (level > 0 && !t.sound.isPlaying) { t.gain = 0; t.sound.play({ loop: true, volume: 0 }); }
    this.fadeTo(t, level, ms);
  }

  play(key, { volume = 1, rate = 1, overlap = false, throttle = 50 } = {}) {
    const snd = this.snd;
    if (!snd || snd.locked || this.missing.has(key) || !this.has(key)) return;
    const now = this.game.loop.now;
    let s = this.shots.get(key);
    if (s && now - s.last < throttle) return;
    const vol = volume * this.sfxLevel();
    if (overlap) { snd.play(key, { volume: vol, rate }); return; }
    if (!s) { s = { sound: snd.add(key), base: 1, last: 0 }; this.shots.set(key, s); }
    if (s.sound.isPlaying) s.sound.stop();     // never stack the same effect on itself
    s.base = volume; s.last = now;
    s.sound.play({ volume: vol, rate });
  }

  ui(kind = 'click') {
    if (kind === 'move') this.play('sfx-click', { volume: 0.5, rate: 1.3, throttle: 30 });
    else this.play('sfx-click', { throttle: 40 });
  }

  /* ---------- volume + mute ---------- */
  setMusicVolume(v) { this.vol.music = clamp01(v); this.emit(); }
  setSfxVolume(v) {
    this.vol.sfx = clamp01(v);
    this.shots.forEach((s) => { if (s.sound.isPlaying) s.sound.setVolume(s.base * this.sfxLevel()); });
    this.emit();
  }
  setMuted(m) { this.muted = !!m; this.emit(); }
  toggleMute() { this.setMuted(!this.muted); }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { this.listeners.forEach((fn) => fn(this)); }
}

// One AudioManager per game, shared by every scene (so nothing gets duplicated on scene changes).
export function getAudio(scene) {
  const game = scene.game || scene;
  let a = game.registry.get('audio');
  if (!a) { a = new AudioManager(game); game.registry.set('audio', a); }
  return a;
}