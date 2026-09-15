(() => {
  const dialog=document.createElement('dialog');dialog.id='starter-select';dialog.setAttribute('aria-labelledby','starter-title');document.body.append(dialog);
  const labels={matasaburo:'又三郎',mikeke:'ミケケ',sui:'すい',mine_daina:'みねだいな',kanade:'かなで'};
  let selected='matasaburo',onReady,busy=false;
  function draw(){
    dialog.innerHTML='<div class="starter-kicker">GUNMA / NEW ADVENTURE</div><h2 id="starter-title">主人公をえらぼう</h2><p class="starter-intro">あなたは、だれと冒険する？</p><div class="starter-grid">'+STARTERS.map(id=>'<button class="starter-card" data-starter="'+id+'" aria-pressed="'+(id===selected)+'"><img src="'+enemies[id].image+'" alt=""><b>'+labels[id]+'</b><small>通常カラー</small></button>').join('')+'</div><section class="starter-skills"><h3>'+labels[selected]+'のわざ</h3><div>'+movesFor(newMember(selected,'self')).map(m=>'<span>'+m.name+'</span>').join('')+'</div></section><button id="starter-confirm">'+labels[selected]+'ではじめる</button><p class="starter-note">捕まえた仲間はそのまま引き継ぎます。主人公は次の起動時にも選べます。</p><p id="starter-error" role="status"></p>';
  }
  dialog.addEventListener('cancel',e=>e.preventDefault());
  dialog.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Space'&&!e.target.closest('button'))e.preventDefault();});
  dialog.addEventListener('click',async e=>{
    if(busy)return;
    const card=e.target.closest('[data-starter]');
    if(card){selected=card.dataset.starter;draw();dialog.querySelector('[data-starter="'+selected+'"]').focus({preventScroll:true});return;}
    if(!e.target.closest('#starter-confirm'))return;
    busy=true;dialog.querySelectorAll('button').forEach(b=>b.disabled=true);$('starter-confirm').textContent='冒険の準備中…';
    try{await window.GunmaMap.setHero(selected);chooseStarter(selected);dialog.close();busy=false;onReady();}
    catch(err){busy=false;draw();$('starter-error').textContent='準備できませんでした。'+err.message+'。もう一度お試しください。';}
  });
  window.GunmaStarter={open:callback=>{onReady=callback;selected=party[0].species;draw();dialog.showModal();dialog.querySelector('[data-starter="'+selected+'"]').focus({preventScroll:true});}};
})();
