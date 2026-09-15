(() => {
  const actions=document.createElement('div');actions.id='battle-actions';actions.className='battle-actions';
  actions.innerHTML='<button id="catch-ball" type="button"></button><button id="battle-party" type="button">グンモン / 入れ替え</button>';
  document.querySelector('.move-panel').append(actions);
  const ball=document.createElement('div');ball.id='gunma-ball';ball.hidden=true;ball.setAttribute('aria-hidden','true');$('arena').append(ball);
  const modal=document.createElement('dialog');modal.id='game-menu';modal.setAttribute('aria-labelledby','menu-title');document.body.append(modal);
  let context='map',view='root',selected='self',previousFocus,previousOverflow;
  const isShiny=m=>m.species.endsWith('_shiny')||m.species==='hoshiyomi_sui';
  function close(){if(!modal.open)return;modal.close();}
  modal.addEventListener('close',()=>{document.body.style.overflow=previousOverflow||'';if(context==='map')window.GunmaMap.resume();else previousFocus?.focus({preventScroll:true});});
  modal.addEventListener('keydown',e=>{
    e.stopPropagation();
    if(e.code==='Space'&&!e.target.closest('button'))e.preventDefault();
    if(e.key==='Escape'){e.preventDefault();if(view==='root')close();else{view='root';draw();}}
  });
  function draw(){
    const count=party.length-1;
    modal.innerHTML='<div class="menu-top"><span>GUNMA / ADVENTURE</span><span>捕獲 '+count+' / 5</span></div><div class="menu-heading"><h2 id="menu-title">'+(view==='root'?'メニュー':view==='items'?'どうぐ':'グンモン')+'</h2>'+(view==='root'?'':'<button class="menu-back" data-action="back">メニューへ戻る</button>')+'</div><div id="menu-content"></div><p class="save-warning" role="status"></p>';
    modal.querySelector('.save-warning').textContent=saveWarning;
    const content=modal.querySelector('#menu-content');
    if(view==='root'){
      content.innerHTML='<div class="menu-root"><button data-action="party"><b>グンモン</b><span>仲間を見る・入れ替える</span></button><button data-action="items"><b>どうぐ</b><span>持っているどうぐ</span></button><button data-action="close"><b>とじる</b><span>冒険にもどる</span></button></div>';
    }else if(view==='items'){
      content.innerHTML='<section class="item-card"><div class="item-ball" aria-hidden="true"></div><div><h3>グンマーボール <small>個数制限なし</small></h3><p>HPが少ないほど捕まえやすくなるボール。<br>捕まえられる仲間は最大5体です。</p><p>捕獲率：HP満タンで20%、HPが少ないと最大約85%。</p>'+(context==='battle'?'<button data-action="throw" '+(party.length>=6||!state.player?'disabled':'')+'>ボールを投げる'+(party.length>=6?'（捕獲枠がいっぱい）':'')+'</button>':'<p class="menu-muted">バトル中に使えます。</p>')+'</div></section>';
    }else{
      const m=party.find(m=>m.uid===selected)||party[0];selected=m.uid;const data=enemies[m.species];
      content.innerHTML='<div class="party-layout"><nav class="party-list" aria-label="仲間の一覧">'+party.map(member=>{const sp=enemies[member.species];return '<button data-member="'+member.uid+'" aria-pressed="'+(member.uid===selected)+'"><img src="'+sp.image+'" alt=""><span><b>'+sp.name+(isShiny(member)?' ✦':'')+'</b><small>'+(member.uid==='self'?'最初の主人公':isShiny(member)?'色違い':'仲間')+(member.uid===activeUid?'・先頭':'')+'</small><small>HP '+member.hp+' / 180</small></span></button>';}).join('')+'</nav><section class="member-detail" aria-label="'+data.name+'のつよさ"><div class="member-portrait"><span class="member-tag">'+(isShiny(m)?'✦ 色違い':'GUNMON')+'</span><img src="'+data.image+'" alt="'+data.name+'"></div><div class="member-info"><span class="menu-muted">Lv.50 / '+(m.uid==='self'?'自分':data.title)+'</span><h3>'+data.name+'</h3><div class="member-hp">HP <b>'+m.hp+' / 180</b><progress value="'+m.hp+'" max="180"></progress></div><h4>わざ</h4><div class="member-moves">'+movesFor(m).map((move,i)=>'<div><b>'+move.name+'</b><small>PP '+m.pp[i]+' / '+move.pp+'</small><p>'+move.description+'</p></div>').join('')+'</div><div class="member-buttons"><button data-action="switch" '+(m.uid===activeUid||m.hp===0?'disabled':'')+'>'+(m.uid===activeUid?'いま選択中':context==='battle'?'この仲間に入れ替える':'先頭にする')+'</button>'+(m.uid==='self'?'<small>最初の主人公は逃がせません</small>':'<button class="release-button" data-action="release" '+(context==='battle'?'disabled':'')+'>逃がす</button>')+'</div><p class="menu-muted">'+(context==='battle'?'入れ替えると相手のターンになります。倒れた仲間の交代はターンを消費しません。逃がす操作はマップで行えます。':'先頭のグンモンがバトルに出ます。マップでは最初に選んだ主人公を操作します。')+'</p><div id="release-confirm"></div></div></section></div>';
    }
    modal.querySelector('[data-action], [data-member]')?.focus({preventScroll:true});
  }
  modal.addEventListener('click',e=>{
    const memberButton=e.target.closest('[data-member]');if(memberButton){selected=memberButton.dataset.member;draw();modal.querySelector('[data-member="'+selected+'"]')?.focus();return;}
    const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
    if(action==='close')close();
    if(action==='back'){view='root';draw();}
    if(action==='party'){view='party';selected=activeUid;draw();}
    if(action==='items'){view='items';draw();}
    if(action==='throw'){close();throwBall();}
    if(action==='switch'){void switchMember(selected);close();}
    if(action==='release'&&context==='map'){
      const confirm=modal.querySelector('#release-confirm');confirm.innerHTML='<div class="release-confirm" role="alert"><p>この仲間を逃がしますか？<br>一覧からいなくなります。</p><button data-action="cancel-release">やめる</button><button class="release-button" data-action="confirm-release">逃がす</button></div>';confirm.querySelector('button').focus();
    }
    if(action==='cancel-release'){draw();}
    if(action==='confirm-release'&&context==='map'){releaseMember(selected);selected=activeUid;draw();}
  });
  function open(page='root'){
    if(modal.open)return;
    const mode=window.GunmaMap?.mode();
    if(mode==='map'){if(!window.GunmaMap.pause())return;context='map';}
    else if(mode==='battle'&&!state.busy&&!state.over)context='battle';else return;
    previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';view=page;selected=activeUid;draw();modal.showModal();modal.querySelector('button')?.focus({preventScroll:true});
  }
  $('catch-ball').onclick=throwBall;$('battle-party').onclick=()=>open('party');
  window.GunmaMenu={open,close};render();
})();
