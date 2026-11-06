import Phaser from 'phaser';

export const FONT = '"Press Start 2P", "Courier New", monospace';

// Keeps Phaser Text objects pixel-sharp when the canvas is scaled up.
export const crisp = (t) => {
  if (t && t.texture && t.texture.setFilter) t.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return t;
};

// Resolves when the pixel font is ready, or after a timeout so the game never hangs offline.
export function whenFontReady(timeout = 1500) {
  const wait = new Promise((r) => setTimeout(r, timeout));
  if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return wait;
  return Promise.race([document.fonts.load('8px "Press Start 2P"').catch(() => {}), wait]);
}