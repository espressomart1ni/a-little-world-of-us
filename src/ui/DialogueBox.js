// Pixel-art dialogue box (HTML element styled in style.css). Typewriter text; E advances/closes.
export class DialogueBox {
  constructor() {
    this.el = document.getElementById('dialogue');
    this.nameEl = this.el.querySelector('.dlg-name');
    this.textEl = this.el.querySelector('.dlg-text');
    this.queue = []; this.full = ''; this.timer = null; this.isOpen = false;
  }

  show(name, lines) {
    this.nameEl.textContent = name;
    this.queue = [...lines];
    this.isOpen = true;
    this.el.classList.remove('hide');
    this.next();
  }

  next() {
    this.full = this.queue.shift();
    let i = 0;
    this.textEl.textContent = '';
    this.el.classList.add('typing');
    this.timer = setInterval(() => {
      i++;
      this.textEl.textContent = this.full.slice(0, i);
      if (i >= this.full.length) this.finishTyping();
    }, 28);
  }

  finishTyping() {
    clearInterval(this.timer); this.timer = null;
    this.textEl.textContent = this.full;
    this.el.classList.remove('typing');
  }

  advance() {
    if (this.timer) this.finishTyping();
    else if (this.queue.length) this.next();
    else this.close();
  }

  close() {
    clearInterval(this.timer); this.timer = null;
    this.queue = []; this.isOpen = false;
    this.el.classList.add('hide');
  }
}
