// A slice that can be carried and eaten. Four states: whole, 2/3, 1/3, crust, then gone.
export class PizzaSlice {
  constructor(scene) {
    this.bites = 0;
    this.alive = true;
    this.img = scene.add.image(0, 0, 'slice-1').setOrigin(0.5).setDepth(20);
  }

  setPos(x, y, depth = 20) { this.img.setPosition(Math.round(x), Math.round(y)).setDepth(depth); }

  bite() {                       // returns true when nothing is left
    this.bites++;
    if (this.bites >= 4) { this.alive = false; this.img.destroy(); return true; }
    this.img.setTexture(`slice-${this.bites + 1}`);
    return false;
  }
}