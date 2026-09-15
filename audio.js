(() => {
  const VERSION = window.RESORT_ASSET_VERSION || '20260915-subarudialog1';
  const asset = path => path + (path.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(VERSION);
  const TRACKS = {
    opening: { src: asset('assets/audio/opening.mp3'), loop: true },
    map: { src: asset('assets/audio/map.mp3'), loop: true },
    battle: { src: asset('assets/audio/battle.mp3'), loop: true },
    boss: { src: asset('assets/audio/boss.mp3'), loop: true },
    victory: { src: asset('assets/audio/victory.mp3'), loop: false }
  };
  const SFX = {
    mine_daina_greeting: asset('assets/audio/mine_daina_greeting.mp3')
  };

  const readBool = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value === 'true';
    } catch { return fallback; }
  };
  const readNumber = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const value = Number(raw);
      return Number.isFinite(value) ? value : fallback;
    } catch { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, String(value)); } catch {}
  };

  let enabled = readBool('gunma-audio-enabled', true);
  let volume = Math.min(1, Math.max(0, readNumber('gunma-audio-volume-v2', 0.05)));
  let desiredTrack = 'opening';
  let currentTrack = null;
  let blockedByAutoplay = false;
  const bgm = new Audio();
  bgm.preload = 'auto';
  bgm.volume = volume;

  function syncUi() {
    const sound = document.getElementById('sound');
    const slider = document.getElementById('volume');
    const label = document.getElementById('volume-label');
    if (sound) {
      sound.textContent = '♪ サウンド ' + (enabled ? 'ON' : 'OFF');
      sound.setAttribute('aria-pressed', String(enabled));
    }
    if (slider) slider.value = String(Math.round(volume * 100));
    if (label) label.textContent = 'VOL ' + Math.round(volume * 100) + '%';
  }

  async function tryPlay() {
    if (!enabled || !desiredTrack) return;
    const config = TRACKS[desiredTrack];
    if (!config) return;
    if (currentTrack !== desiredTrack) {
      bgm.pause();
      bgm.src = config.src;
      bgm.loop = config.loop;
      currentTrack = desiredTrack;
      bgm.currentTime = 0;
    }
    bgm.volume = volume;
    try {
      await bgm.play();
      blockedByAutoplay = false;
    } catch {
      blockedByAutoplay = true;
    }
  }

  function play(track, { restart = false } = {}) {
    if (!TRACKS[track]) return;
    desiredTrack = track;
    if (restart && currentTrack === track) {
      try { bgm.currentTime = 0; } catch {}
    }
    if (enabled) tryPlay();
  }

  function playOpening() { play('opening'); }
  function playMap() { play('map'); }
  function playBattle(enemyId) { play(['subaru','tsukimi_subaru'].includes(enemyId) ? 'boss' : 'battle', { restart: true }); }
  function playVictory() { play('victory', { restart: true }); }

  function playSfx(name) {
    const src = SFX[name];
    if (!enabled || !src) return;
    try {
      const sfx = new Audio(src);
      sfx.volume = volume;
      sfx.play().catch(() => {});
    } catch {}
  }

  function setEnabled(next) {
    enabled = Boolean(next);
    save('gunma-audio-enabled', enabled);
    if (enabled) tryPlay();
    else bgm.pause();
    syncUi();
  }

  function toggle() { setEnabled(!enabled); }

  function setVolume(next) {
    volume = Math.min(1, Math.max(0, Number(next) || 0));
    bgm.volume = volume;
    save('gunma-audio-volume-v2', volume);
    syncUi();
  }

  function unlockAudio() {
    if (enabled && (blockedByAutoplay || bgm.paused)) tryPlay();
  }

  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });

  document.addEventListener('DOMContentLoaded', () => {
    const sound = document.getElementById('sound');
    const slider = document.getElementById('volume');
    if (sound) sound.addEventListener('click', toggle);
    if (slider) slider.addEventListener('input', e => setVolume(Number(e.target.value) / 100));
    syncUi();
  });

  window.GunmaAudio = {
    playOpening,
    playMap,
    playBattle,
    playVictory,
    playSfx,
    toggle,
    setEnabled,
    setVolume,
    isEnabled: () => enabled,
    getVolume: () => volume,
    getTrack: () => desiredTrack,
    element: bgm
  };
})();
