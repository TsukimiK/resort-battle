(() => {
  let started = false;
  let selecting = false;
  let openingAudioStarted = false;

  const markAudioStarted = () => {
    if (openingAudioStarted || started) return;
    openingAudioStarted = true;
    window.GunmaAudio?.playOpening?.();
    const opening = document.getElementById('opening-screen');
    const hint = document.querySelector('.opening-hint');
    if (opening) opening.classList.add('audio-ready');
    if (hint) hint.textContent = 'PRESS START / ENTER / SPACE ではじめる';
  };

  const enterMap = () => {
    if (started || !openingAudioStarted) return;
    started = true;
    window.GUNMA_GAME_STARTED = true;
    const opening = document.getElementById('opening-screen');
    if (opening) {
      opening.classList.add('leaving');
      opening.setAttribute('aria-hidden','true');
      setTimeout(() => opening.remove(), 420);
    }
    window.GunmaAudio?.playMap?.();
    const canvas = document.getElementById('world');
    setTimeout(() => canvas?.focus?.({preventScroll:true}), 460);
    document.dispatchEvent(new Event('gunma-game-started'));
  };

  const startGame = () => {
    if(started||selecting||!openingAudioStarted)return;
    selecting=true;
    window.GunmaStarter.open(()=>{selecting=false;enterMap();});
  };
  const handleStartAction = () => {
    if(selecting)return;
    if (!openingAudioStarted) {
      markAudioStarted();
      return;
    }
    startGame();
  };

  document.addEventListener('DOMContentLoaded', () => {
    const opening = document.getElementById('opening-screen');
    const button = document.getElementById('opening-start');
    if (!opening) return;
    opening.focus({preventScroll:true});

    button?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      handleStartAction();
    });

    opening.addEventListener('click', e => {
      if (e.target === button || button?.contains?.(e.target)) return;
      markAudioStarted();
    });
  });

  window.addEventListener('keydown', e => {
    if (started) return;
    if (e.code === 'Enter' || e.code === 'Space' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleStartAction();
    }
  });

  window.GunmaOpening = {
    start: startGame,
    startAudio: markAudioStarted,
    isStarted: () => started,
    isAudioStarted: () => openingAudioStarted
  };
})();
