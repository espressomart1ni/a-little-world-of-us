import Phaser from 'phaser';
import { GAME_W as W, GAME_H as H } from '../utils/isometric.js';
import { FONT, crisp } from '../utils/theme.js';

const CW = 8, LH = 10, X0 = 30, Y0 = 25, ROWS = 12, TERM_ROWS = 5;
const LOVE = 'Arkisha loves Yash very much';
const COL = { text: '#c8d3f5', kw: '#c792ea', str: '#ff9ec4', com: '#5c6a8a', num: '#f7b267', fn: '#7ad7f0',
  dim: '#5c6490', love: '#ff7aa5', ok: '#7dffb0' };
const KW = new Set(['const', 'let', 'var', 'function', 'return', 'while', 'for', 'if', 'else', 'class', 'static', 'void',
  'int', 'char', 'fn', 'def', 'print', 'puts', 'echo', 'SELECT', 'AS', 'True', 'False', 'include', 'public',
  'String', 'main', 'println!', 'true', 'false']);

// Lines stay under ~38 columns so they fit the 336px-wide pixel screen.
const SNIPPETS = [
  { file: 'love.js', run: 'node love.js', lines: ['// love.js', 'const love = () =>', '  "Arkisha loves Yash very much";', 'console.log(love());'] },
  { file: 'love.py', run: 'python love.py', lines: ['# love.py', 'love = "Arkisha loves Yash very much"', 'while True:', '    print(love)'] },
  { file: 'love.c', run: './love', lines: ['// love.c', '#include <stdio.h>', 'int main(void) {', '  char *s =', '    "Arkisha loves Yash very much";', '  puts(s);', '  return 0;', '}'] },
  { file: 'main.rs', run: 'cargo run', lines: ['// main.rs', 'fn main() {', '    println!(', '        "Arkisha loves Yash very much"', '    );', '}'] },
  { file: 'love.sql', run: 'psql -f love.sql', lines: ['-- love.sql', 'SELECT "Arkisha loves Yash very much"', '  AS truth;'] },
  { file: 'love.sh', run: 'bash love.sh', lines: ['# love.sh', 'echo "Arkisha loves Yash very much"'] },
  { file: 'Love.java', run: 'java Love', lines: ['// Love.java', 'class Love {', '  static void main() {', '    System.out.println(', '      "Arkisha loves Yash very much");', '  }', '}'] },
  { file: 'love.html', run: 'open love.html', lines: ['<!-- love.html -->', '<p class="truth">', '  Arkisha loves Yash very much', '</p>'] },
];

const TOKEN = /(\/\/.*|#(?!include).*|--.*|<!--.*-->)|("[^"]*"?)|(\b\d+\b)|([A-Za-z_][A-Za-z0-9_]*!?)|(\s+)|(.)/g;
function tokenize(line) {
  const out = [];
  for (const m of line.matchAll(TOKEN)) {
    const t = m[0]; let c = COL.text;
    if (m[1]) c = COL.com;
    else if (m[2]) c = COL.str;
    else if (m[3]) c = COL.num;
    else if (m[4]) c = KW.has(t) ? COL.kw : line[m.index + t.length] === '(' ? COL.fn : COL.text;
    out.push({ t, c });
  }
  return out;
}

// Mode 1: an editor that types "Arkisha loves Yash very much" in language after language, then "runs" it.
export class CodingExperience {
  constructor(scene, audio) {
    this.s = scene; this.audio = audio;
    this.n = -1; this.love = 0; this.clock = 0; this.lastKey = -9999; this.sec = -1;
    this.rows = []; this.term = []; this.row = null;
    this.mode = 'idle'; this.wait = 0; this.lineNo = 0; this.li = 0; this.ci = 0; this.snip = null; this.flick = 0;
  }

  T(x, y, str, color, depth = 5) {
    return crisp(this.s.add.text(x, y, str, { fontFamily: FONT, fontSize: '8px', color }).setDepth(depth));
  }

  start() {
    this.buildChrome();
    this.buildOverlay();
    this.audio.setDuck(0.3, 600);                 // room music drops while you code
    this.nextSnippet(true);
  }

  buildChrome() {
    const s = this.s, T = this.T.bind(this);
    s.cameras.main.setBackgroundColor('#0e1021');
    const g = s.add.graphics().setDepth(0);
    g.fillStyle(0x0e1021).fillRect(0, 0, W, H);
    g.fillStyle(0x181a30).fillRect(0, 0, W, 12);                                   // title bar
    [0xff5f56, 0xffbd2e, 0x27c93f].forEach((c, i) => g.fillStyle(c).fillRect(5 + i * 8, 4, 4, 4));
    g.fillStyle(0x13152a).fillRect(0, 12, 10, H - 22);                             // activity bar
    [0xff7aa5, 0x7ad7f0, 0xc792ea, 0xf7b267].forEach((c, i) => g.fillStyle(c, 0.75).fillRect(3, 18 + i * 12, 4, 4));
    g.fillStyle(0x1b1e3a).fillRect(10, 12, W - 10, 11);                            // tab strip
    g.fillStyle(0x0e1021).fillRect(10, 12, 92, 11);
    g.fillStyle(0xff7aa5).fillRect(10, 12, 92, 1);
    g.fillStyle(0x151831).fillRect(10, 150, W - 10, 64);                           // terminal
    g.fillStyle(0x2a2f55).fillRect(10, 150, W - 10, 1);
    g.fillStyle(0x8e2f5c).fillRect(0, H - 10, W, 10);                              // status bar

    T((W - 160) / 2, 2, 'A Little World of Us', '#8a90b8');
    T(W - 4, 2, 'ESC: BACK', '#5c6490').setOrigin(1, 0);
    this.tab = T(14, 14, '', '#e8ecff');
    T(14, 153, 'TERMINAL', COL.dim);

    this.heart = s.add.image(6, H - 5, 'heart').setDepth(6);
    this.loveText = T(13, H - 9, 'LOVE 000', '#ffe9f0', 6);
    this.clockText = T(W / 2 - 32, H - 9, '00:00:00', '#ffe9f0', 6);
    this.pos = T(W - 4, H - 9, 'Ln 1, Col 1', '#ffe9f0', 6).setOrigin(1, 0);

    this.lineHl = s.add.rectangle(10, Y0 - 1, W - 10, LH, 0xffffff, 0.04).setOrigin(0).setDepth(1);
    this.cursor = s.add.rectangle(X0, Y0 - 1, CW - 1, LH - 1, 0xff7aa5, 0.85).setOrigin(0).setDepth(6);
  }

  buildOverlay() {                                 // makes the screen feel alive
    const s = this.s;
    s.add.image(0, 0, 'vignette').setOrigin(0).setDepth(49);
    s.add.tileSprite(0, 0, W, H, 'scan').setOrigin(0).setDepth(50).setAlpha(0.5);
    this.band = s.add.rectangle(0, -40, W, 36, 0xffffff, 0.035).setOrigin(0).setDepth(51);   // CRT refresh band
    this.flash = s.add.rectangle(0, 0, W, H, 0xffffff, 0).setOrigin(0).setDepth(52);         // faint flicker
  }

  update(time, delta) {
    const dt = Math.min(delta, 50);
    this.clock += dt;
    this.wait -= dt;
    let guard = 0;
    while (this.wait <= 0 && guard++ < 6) this.step();

    const typing = this.clock - this.lastKey < 220;
    this.cursor.setVisible(typing || ((this.clock / 480) | 0) % 2 === 0);
    this.audio.setLoop('sfx-typing', typing ? 1 : 0, 120);

    this.band.y += dt * 0.035; if (this.band.y > H) this.band.y = -40;
    this.flick -= dt;
    if (this.flick <= 0) { this.flick = 70 + Math.random() * 90; this.flash.setAlpha(Math.random() * 0.03); }

    const sec = (this.clock / 1000) | 0;
    if (sec !== this.sec) { this.sec = sec; this.clockText.setText(new Date().toTimeString().slice(0, 8)); }
  }

  step() {
    switch (this.mode) {
      case 'type': this.typeChar(); return;
      case 'run1': this.print('$ ' + this.snip.run, COL.ok); this.mode = 'run2'; this.wait += 520; return;
      case 'run2':
        this.print('> ' + LOVE, COL.love);
        this.love++;
        this.loveText.setText(`LOVE ${String(this.love).padStart(3, '0')}`);
        this.s.tweens.add({ targets: this.heart, scale: { from: 2.6, to: 1 }, duration: 380 });
        this.mode = 'hold'; this.wait += 2200; return;
      case 'hold': this.fadeRows(); this.mode = 'clear'; this.wait += 380; return;
      case 'clear': this.nextSnippet(false); return;
      default: this.wait += 200;
    }
  }

  nextSnippet(first) {
    this.clearRows();
    this.n = (this.n + 1) % SNIPPETS.length;
    this.snip = SNIPPETS[this.n];
    this.lineNo = 0; this.li = 0;
    this.tab.setText(this.snip.file);
    this.beginLine();
    this.mode = 'type';
    this.wait += first ? 600 : 250;
  }

  beginLine() {
    this.row = this.makeRow(this.snip.lines[this.li]);
    this.ci = 0;
    this.updateRow();
  }

  makeRow(line) {
    const s = this.s, y = Y0 + this.rows.length * LH;
    const tokens = []; let col = 0;
    for (const tk of tokenize(line)) {
      if (tk.t.trim() !== '') {
        tokens.push({ start: col, full: tk.t, obj: crisp(s.add.text(X0 + col * CW, y, '', { fontFamily: FONT, fontSize: '8px', color: tk.c }).setDepth(5)) });
      }
      col += tk.t.length;
    }
    this.lineNo++;
    const gut = this.T(12, y, String(this.lineNo).padStart(2, ' '), '#4a5078');
    const row = { y, tokens, gut };
    this.rows.push(row);
    if (this.rows.length > ROWS) {                 // scroll
      const old = this.rows.shift();
      old.gut.destroy(); old.tokens.forEach((t) => t.obj.destroy());
      this.rows.forEach((r) => { r.y -= LH; r.gut.y -= LH; r.tokens.forEach((t) => { t.obj.y -= LH; }); });
    }
    return row;
  }

  updateRow() {
    const r = this.row;
    r.tokens.forEach((t) => {
      const n = Phaser.Math.Clamp(this.ci - t.start, 0, t.full.length);
      const str = t.full.slice(0, n);
      if (t.obj.text !== str) t.obj.setText(str);
    });
    this.cursor.setPosition(X0 + this.ci * CW, r.y - 1);
    this.lineHl.y = r.y - 1;
    this.pos.setText(`Ln ${this.lineNo}, Col ${this.ci + 1}`);
  }

  typeChar() {
    const line = this.snip.lines[this.li];
    if (this.ci < line.length) {
      this.ci++;
      this.updateRow();
      this.lastKey = this.clock;
      if (this.ci % 5 === 0) this.spark(X0 + this.ci * CW, this.row.y);
      this.wait += (line[this.ci - 1] === ' ' ? 30 : 45) + Math.random() * 60 + (Math.random() < 0.04 ? 220 : 0);
    } else {
      this.li++;
      if (this.li >= this.snip.lines.length) { this.mode = 'run1'; this.wait += 650; }
      else { this.beginLine(); this.wait += 170 + Math.random() * 140; }
    }
  }

  spark(x, y) {
    const r = this.s.add.rectangle(x, y + 4, 2, 2, Math.random() < 0.5 ? 0xff7aa5 : 0xffd35a).setDepth(7);
    this.s.tweens.add({ targets: r, x: x + Phaser.Math.Between(-8, 8), y: y - Phaser.Math.Between(6, 16), alpha: 0, duration: 420, onComplete: () => r.destroy() });
  }

  print(str, color) {
    this.term.push(this.T(14, 164 + this.term.length * LH, str, color));
    if (this.term.length > TERM_ROWS) { this.term.shift().destroy(); this.term.forEach((t) => { t.y -= LH; }); }
  }

  fadeRows() {
    this.rows.forEach((r) => this.s.tweens.add({ targets: [r.gut, ...r.tokens.map((t) => t.obj)], alpha: 0, duration: 300 }));
  }

  clearRows() {
    this.rows.forEach((r) => { r.gut.destroy(); r.tokens.forEach((t) => t.obj.destroy()); });
    this.rows = [];
  }

  destroy() { this.audio.setLoop('sfx-typing', 0, 100); }
}