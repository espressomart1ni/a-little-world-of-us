// Small DOM panel: mute button + music and effects sliders. Press M to mute.
export class AudioPanel {
  constructor(audio) {
    this.audio = audio;
    this.el = document.getElementById('audio-panel');
    this.btn = document.getElementById('btn-mute');
    this.music = document.getElementById('vol-music');
    this.sfx = document.getElementById('vol-sfx');

    this.music.addEventListener('input', () => audio.setMusicVolume(this.music.value / 100));
    this.sfx.addEventListener('input', () => audio.setSfxVolume(this.sfx.value / 100));
    [this.music, this.sfx].forEach((el) => el.addEventListener('change', () => { audio.ui('click'); el.blur(); }));
    this.btn.addEventListener('click', () => { audio.toggleMute(); audio.ui('click'); this.btn.blur(); });
    window.addEventListener('keydown', (e) => { if (e.code === 'KeyM' && !e.repeat) audio.toggleMute(); });

    audio.onChange(() => this.refresh());
    this.refresh();
  }

  show() { this.el.classList.remove('hide'); }

  refresh() {
    const a = this.audio;
    this.music.value = Math.round(a.vol.music * 100);
    this.sfx.value = Math.round(a.vol.sfx * 100);
    this.btn.textContent = a.muted ? 'UNMUTE' : 'MUTE';
    this.el.classList.toggle('muted', a.muted);
  }
}