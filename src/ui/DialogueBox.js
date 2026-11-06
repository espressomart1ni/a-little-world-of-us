// Typewriter dialogue + choice menu. say() and choose() return Promises so conversations read top to bottom.
export class DialogueBox {
  constructor(audio = null) {
    this.audio = audio;
    this.el = document.getElementById('dialogue');
    this.nameEl = this.el.querySelector('.dlg-name');
    this.textEl = this.el.querySelector('.dlg-text');
    this.choicesEl = document.getElementById('choices');
    this.full = ''; this.timer = null; this.isOpen = false;
    this.choosing = false; this.sel = 0; this.options = [];
    this.resolveSay = null; this.resolveChoice = null;
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  open() { this.isOpen = true; this.el.classList.remove('hide'); }

  show(name, lines) {            // simple one-way lines (objects)
    (async () => {
      for (const l of lines) if (!(await this.say(name, l))) return;
      this.close();
    })();
  }

  say(name, text) {              // resolves true when advanced, false if closed
    this.open(); this.hideChoices();
    this.nameEl.textContent = name;
    return new Promise((res) => { this.resolveSay = res; this.type(text); });
  }

  type(text) {
    clearInterval(this.timer);
    this.full = text; let i = 0;
    this.textEl.textContent = '';
    this.el.classList.add('typing');
    this.timer = setInterval(() => {
      i++; this.textEl.textContent = this.full.slice(0, i);
      if (i >= this.full.length) this.finishTyping();
    }, 28);
  }

  finishTyping() {
    clearInterval(this.timer); this.timer = null;
    this.textEl.textContent = this.full;
    this.el.classList.remove('typing');
  }

  choose(options, name = 'Yash', prompt = '(What do you say?)') {   // resolves with index, or -1 if closed
    this.open();
    clearInterval(this.timer); this.timer = null;
    this.el.classList.add('typing');
    this.nameEl.textContent = name; this.textEl.textContent = prompt;
    this.options = options; this.sel = 0; this.choosing = true;
    this.renderChoices();
    return new Promise((res) => { this.resolveChoice = res; });
  }

  renderChoices() {
    this.choicesEl.innerHTML = '';
    this.options.forEach((o, i) => {
      const d = document.createElement('div');
      d.className = 'choice' + (i === this.sel ? ' sel' : '');
      d.textContent = `${i === this.sel ? '\u25B6' : '\u00A0'} ${o}`;
      d.addEventListener('pointerdown', () => this.pick(i));
      this.choicesEl.appendChild(d);
    });
    this.choicesEl.classList.remove('hide');
  }

  hideChoices() { this.choicesEl.classList.add('hide'); }

  pick(i) {
    if (!this.choosing) return;
    this.choosing = false; this.hideChoices();
    if (this.audio) this.audio.ui('click');
    const r = this.resolveChoice; this.resolveChoice = null;
    if (r) r(i);
  }

  onKey(e) {
    if (!this.choosing) return;
    const n = this.options.length;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') { this.sel = (this.sel - 1 + n) % n; this.renderChoices(); if (this.audio) this.audio.ui('move'); e.preventDefault(); }
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') { this.sel = (this.sel + 1) % n; this.renderChoices(); if (this.audio) this.audio.ui('move'); e.preventDefault(); }
    else if (/^Digit[1-9]$/.test(e.code)) { const i = Number(e.code.slice(5)) - 1; if (i < n) this.pick(i); }
  }

  advance() {                    // called when E is pressed
    if (this.audio) this.audio.ui('click');
    if (this.choosing) { this.pick(this.sel); return; }
    if (this.timer) { this.finishTyping(); return; }
    if (this.resolveSay) { const r = this.resolveSay; this.resolveSay = null; r(true); }
  }

  close() {
    clearInterval(this.timer); this.timer = null;
    this.isOpen = false; this.choosing = false;
    this.el.classList.add('hide'); this.hideChoices();
    const s = this.resolveSay, c = this.resolveChoice;
    this.resolveSay = null; this.resolveChoice = null;
    if (s) s(false);
    if (c) c(-1);
  }
}