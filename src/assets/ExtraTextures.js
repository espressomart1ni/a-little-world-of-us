// Tiny props drawn in code (can, laptop, heart, small slice, sparkle, scanlines)
function tex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export function generateExtraTextures(scene) {
  tex(scene, 'can', 4, 7, (g) => {
    g.fillStyle(0xc9d1c3).fillRect(0, 0, 4, 1);
    g.fillStyle(0x7ed957).fillRect(0, 1, 4, 5);
    g.fillStyle(0xb8f08f).fillRect(1, 2, 1, 3);
    g.fillStyle(0xc9d1c3).fillRect(0, 6, 4, 1);
  });
  tex(scene, 'laptop', 9, 6, (g) => {
    g.fillStyle(0x2a1b26).fillRect(1, 0, 7, 4);
    g.fillStyle(0x8fd3ff).fillRect(2, 1, 5, 2);
    g.fillStyle(0xbfb7c9).fillRect(0, 4, 9, 2);
  });
  tex(scene, 'heart', 5, 5, (g) => {
    g.fillStyle(0xff7aa5);
    g.fillRect(0, 0, 2, 2); g.fillRect(3, 0, 2, 2);
    g.fillRect(0, 1, 5, 2); g.fillRect(1, 3, 3, 1); g.fillRect(2, 4, 1, 1);
  });
  tex(scene, 'slice', 5, 4, (g) => {                 // tiny slice Arkisha holds in her own loop
    g.fillStyle(0xf3d9a4).fillRect(0, 0, 5, 3);
    g.fillStyle(0xd94a4a).fillRect(1, 1, 1, 1).fillRect(3, 1, 1, 1);
    g.fillStyle(0xf3b04a).fillRect(1, 3, 3, 1);
  });
  tex(scene, 'sparkle', 5, 5, (g) => {
    g.fillStyle(0xfff1d6).fillRect(2, 0, 1, 5).fillRect(0, 2, 5, 1);
    g.fillStyle(0xffffff).fillRect(2, 2, 1, 1);
  });
  tex(scene, 'scan', 2, 3, (g) => {                  // CRT scanline tile
    g.fillStyle(0x000000, 0.22).fillRect(0, 2, 2, 1);
  });
  // White bedside table (20x26)
makeTex(scene, 'sidetable', 20, 26, (g) => {
  g.fillStyle(0xffffff).fillRect(0, 0, 20, 4);          // top
  g.fillStyle(0xd9dde0).fillRect(0, 4, 20, 1);          // top shadow edge
  g.fillStyle(0xf2f4f5).fillRect(1, 5, 18, 14);         // body
  g.fillStyle(0xdfe3e6).fillRect(3, 7, 14, 10);         // drawer panel
  g.fillStyle(0xb8bec3).fillRect(8, 11, 4, 2);          // handle
  g.fillStyle(0xffffff).fillRect(1, 19, 2, 7);          // legs
  g.fillRect(17, 19, 2, 7);
});

// Open mini fridge with stacks of green elderflower Red Bull (24x34)
makeTex(scene, 'fridge-open', 24, 34, (g) => {        // ADJUST: match your closed fridge's size
  g.fillStyle(0xdfe6ea).fillRect(0, 0, 24, 34);         // outer shell
  g.fillStyle(0xf4f8fa).fillRect(2, 2, 20, 30);         // bright interior
  g.fillStyle(0xcfd8dc).fillRect(2, 2, 20, 1);          // top inner shadow
  // shelves
  [12, 22, 32].forEach((y) => g.fillStyle(0xb0bec5).fillRect(2, y, 20, 1));
  // cans: 3 shelves x 5 columns x 2 stacked
  [12, 22, 32].forEach((shelfY) => {
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 2; row++) {
        const x = 3 + col * 4;
        const y = shelfY - 5 - row * 5;
        g.fillStyle(0xa5d66b).fillRect(x, y, 3, 5);     // green elderflower can
        g.fillStyle(0xe8f5d0).fillRect(x, y + 2, 3, 1); // label stripe
        g.fillStyle(0xcfd8dc).fillRect(x, y, 3, 1);     // silver top
      }
    }
  });
});
}

function makeTex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;          // lets real art override later
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}