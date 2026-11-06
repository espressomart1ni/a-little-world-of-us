import { gridToScreen } from '../utils/isometric.js';

// Finds the nearest interactive target in reach and shows a floating "E" bubble over it.
export class InteractionSystem {
  constructor(scene, targets, player) {
    this.targets = targets; this.player = player; this.current = null;
    this.icon = scene.add.image(0, 0, 'prompt').setOrigin(0.5, 1).setDepth(9999).setVisible(false);
  }

  update(time, hidden) {
    let best = null, bestD = Infinity;
    if (!hidden) {
      for (const t of this.targets)
        for (const [x, y] of t.getPoints()) {
          const d = Math.hypot(x - this.player.gx, y - this.player.gy);
          const score = d - (t.priority || 0);
          if (d < t.r && score < bestD) { bestD = score; best = t; }
        }
    }
    this.current = best;
    if (!best) { this.icon.setVisible(false); return; }
    const m = best.getMark(), p = gridToScreen(m.gx, m.gy);
    this.icon.setPosition(Math.round(p.x), Math.round(p.y - m.z + Math.sin(time / 180) * 1.5)).setVisible(true);
  }
}