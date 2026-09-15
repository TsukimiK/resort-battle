(() => {
  const RESORT_ASSET_VERSION=window.RESORT_ASSET_VERSION||'20260915-subarudialog1';
  const resortAsset=path=>/^(?:data:|blob:)/i.test(path)?path:path+(path.includes('?')?'&':'?')+'v='+encodeURIComponent(RESORT_ASSET_VERSION);
  const battle = document.querySelector('.console');
  const shell = document.createElement('section');
  shell.className = 'overworld console';
  shell.setAttribute('aria-label', 'グンマーの小さなマップ');
  shell.innerHTML = `<div class="screen-top"><span><i></i> GUNMA / はじまりの小道</span><span id="walk-count">0 STEPS</span></div><div class="map-view"><canvas id="world" width="640" height="416" tabindex="0" aria-label="マップ。矢印キーまたはWASDで移動。草むらを歩くとバトル。気になる場所の前でスペースキー。"></canvas><div class="map-badge">グンマーの小道 <small>☀ はれ</small></div><div id="encounter-flash" hidden><span>！</span></div><div id="npc-dialogue" hidden><div class="npc-dialogue-box"><span class="dialogue-label">SUBARU</span><p id="npc-dialogue-text"></p><small>クリック / SPACE でつづける</small></div></div></div><div class="map-bottom"><div class="map-copy"><span class="dialogue-label">LET'S EXPLORE</span><p id="map-message" role="status" aria-live="polite">草むらには 色違いも まざっているみたい。<br>右側には すばるが いるらしい……。</p><div class="map-legend">矢印キー / WASD：いどう　 SPACE：しらべる</div></div><div class="map-pad" aria-label="移動ボタン"><button data-dir="up" aria-label="上へ移動">▲</button><button data-dir="left" aria-label="左へ移動">◀</button><button id="inspect" aria-label="目の前を調べる">A</button><button data-dir="right" aria-label="右へ移動">▶</button><button data-dir="down" aria-label="下へ移動">▼</button></div></div>`;
  battle.before(shell); battle.hidden = true;
  const back = document.createElement('button');
  back.className = 'map-return'; back.textContent = 'にげて マップへ戻る'; back.hidden = true;
  battle.after(back);
  document.querySelector('h1').textContent = '小さな冒険に、出かけよう。';
  document.querySelector('.eyebrow').textContent = 'GUNMA REGION / A LITTLE ADVENTURE';
  document.querySelector('footer > span').innerHTML = '<b>HOW TO PLAY</b> 草むらを歩くとバトル。木と池は通れません。';
  document.title = 'グンマーモンスター｜小さな冒険';

  const canvas = $('world'), ctx = canvas.getContext('2d'), atlas = new Image(), actorAtlas = new Image(), subaruImg = new Image();
  const npc = { id:'subaru', x:17, y:11, dx:-6, dy:-26.6667, w:44, h:58.6667 };
  const encounterPool = ['matasaburo','mikeke','mine_daina','kanade','sui','matasaburo_shiny','mikeke_shiny','mine_daina_shiny','hoshiyomi_sui'];
  let actorSurface;

  function prepareActor(){
    const surface=document.createElement('canvas');surface.width=actorAtlas.naturalWidth;surface.height=actorAtlas.naturalHeight;
    const c=surface.getContext('2d');c.drawImage(actorAtlas,0,0);const pixels=c.getImageData(0,0,surface.width,surface.height),d=pixels.data,w=surface.width,h=surface.height;
    const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
    function add(p){if(seen[p])return;seen[p]=1;const i=p*4,r=d[i],g=d[i+1],b=d[i+2];if(d[i+3]===0||(Math.min(r,g,b)>155&&Math.max(r,g,b)-Math.min(r,g,b)<28)){queue[tail++]=p;d[i+3]=0;}}
    for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}while(head<tail){const p=queue[head++],x=p%w;if(x>0)add(p-1);if(x<w-1)add(p+1);if(p>=w)add(p-w);if(p<w*(h-1))add(p+w);}c.putImageData(pixels,0,0);actorSurface=surface;
  }

  canvas.width=1920;canvas.height=1248;ctx.setTransform(3,0,0,3,0,0);ctx.imageSmoothingEnabled=false;
  const rows=[
    'TTTTTTTTTTTTTTTTTTTT',
    'T....f......f......T',
    'T..TT....ggggg..T..T',
    'T..TT....ggggg..T..T',
    'T........ggggg.....T',
    'TppppppppppppppppppT',
    'T..S..p......p.....T',
    'T.....p..TT..p.WWW.T',
    'T.f...p..TT..p.WWW.T',
    'T..gggp......p.WWW.T',
    'T..gggpppppppp.....T',
    'T.....f.....f..R...T',
    'TTTTTTTTTTTTTTTTTTTT'
  ];
  const dirs={down:[0,1,0],up:[0,-1,1],left:[-1,0,2],right:[1,0,3]};
  let x=6,y=10,px=x,py=y,fromX=x,fromY=y,facing='down',moving=false,began=0;
  let mode='loading',steps=0,grassSteps=0,encounterAt=4,token=0,held=null,last=0,frame=0;
  let battleEndAwaitClick=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  function message(s){$('map-message').textContent=s;}
  function tile(cx,cy){return rows[cy]?.[cx];}
  function isNpc(cx,cy){return cx===npc.x&&cy===npc.y;}
  function blocked(cx,cy){return !tile(cx,cy)||'TRSW'.includes(tile(cx,cy))||isNpc(cx,cy);}
  function cell(n,dx,dy,w=32,h=32){const actor=n>=8,source=actor?actorSurface:atlas,index=actor?n-8:n;const sw=(source.naturalWidth||source.width)/4,sh=(source.naturalHeight||source.height)/(actor?2:4);ctx.imageSmoothingEnabled=actor;ctx.imageSmoothingQuality='high';ctx.drawImage(source,(index%4)*sw,Math.floor(index/4)*sh,sw,sh,Math.round(dx*3)/3,Math.round(dy*3)/3,w,h);ctx.imageSmoothingEnabled=false;}
  function drawNpc(now){
    if(!subaruImg.complete)return;
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    const bob=Math.sin(now/280)*1.2;
    ctx.drawImage(subaruImg,npc.x*32+npc.dx,npc.y*32+npc.dy+bob,npc.w,npc.h);
    ctx.imageSmoothingEnabled=false;
  }
  function paint(now){
    if(mode==='loading'||mode==='error')return;
    if(moving){const t=Math.min(1,(now-began)/145);px=fromX+(x-fromX)*t;py=fromY+(y-fromY)*t;if(t===1){moving=false;onStep();}}
    ctx.clearRect(0,0,640,416);
    rows.forEach((row,cy)=>[...row].forEach((v,cx)=>{cell(v==='p'?1:v==='g'?2:v==='W'?3:0,cx*32,cy*32);if(v==='T')cell(4,cx*32,cy*32);if(v==='R')cell(5,cx*32,cy*32);if(v==='f')cell(6,cx*32,cy*32);if(v==='S')cell(7,cx*32,cy*32);}));
    drawNpc(now);
    const stride = moving && Math.floor((now-began)/75)%2===1;
    cell((stride?12:8)+dirs[facing][2],px*32-6,py*32-24,44,58.6667);
    if(mode==='map'&&held&&!moving&&now-last>165){last=now;move(held);}
    frame=requestAnimationFrame(paint);
  }
  function move(dir){if(mode!=='map'||moving)return;facing=dir;const [dx,dy]=dirs[dir];if(blocked(x+dx,y+dy))return;fromX=x;fromY=y;x+=dx;y+=dy;began=performance.now();moving=true;}
  function onStep(){if(mode!=='map')return;steps++;$('walk-count').textContent=steps+' STEPS';canvas.setAttribute('aria-label',`マップ。現在 ${x+1}列 ${y+1}行。${tile(x,y)==='g'?'草むら':'小道・草地'}。矢印キーで移動。`);if(tile(x,y)==='g'){grassSteps++;if(grassSteps>=encounterAt)encounter();}}

  function showSubaruDialogue(){
    if(mode!=='map'||moving)return;
    mode='dialogue';held=null;
    $('npc-dialogue-text').textContent='「ちょっといいですか？嫌です」';
    $('npc-dialogue').hidden=false;
    tone(620);
  }
  function continueSubaruDialogue(){
    if(mode!=='dialogue')return;
    $('npc-dialogue').hidden=true;
    startBattle('subaru','すばるとの バトルが はじまる！');
  }

  async function startBattle(enemyId, intro){
    mode='transition';held=null;const ticket=++token;$('encounter-flash').hidden=false;
    message(intro || ('あっ！ '+enemies[enemyId].name+'が あらわれた！'));
    tone(760);
    await delay(reduced?180:650);
    if(ticket!==token)return;
    mode='battle';$('encounter-flash').hidden=true;shell.hidden=true;battle.hidden=false;back.hidden=false;back.textContent='にげて マップへ戻る';
    window.GunmaAudio?.playBattle?.(enemyId);
    reset(enemyId);
    $('moves').querySelector('button')?.focus({preventScroll:true});
  }
  function encounter(){
    const enemyId=encounterPool[Math.floor(Math.random()*encounterPool.length)];
    startBattle(enemyId,'あっ！ 草むらから '+enemies[enemyId].name+'が！');
  }
  function returnToMap(){if(mode==='loading'||mode==='error')return;token++;epoch++;held=null;moving=false;mode='map';battleEndAwaitClick=false;px=x;py=y;grassSteps=0;encounterAt=5+Math.floor(Math.random()*4);battle.hidden=true;back.hidden=true;shell.hidden=false;$('encounter-flash').hidden=true;$('npc-dialogue').hidden=true;window.GunmaAudio?.playMap?.();message('ひと休みして HPとPPが まんたんに！ 冒険をつづけよう。');reset();canvas.focus({preventScroll:true});}
  function facingNpc(){const [dx,dy]=dirs[facing];return x+dx===npc.x&&y+dy===npc.y;}
  function inspect(){
    if(mode!=='map'||moving)return;
    const [dx,dy]=dirs[facing];
    if(facingNpc()){
      showSubaruDialogue();
    }else if(tile(x+dx,y+dy)==='S'){
      message('【グンマーの小道】草むらには 色違いも まざっている。右側には すばるが いるようだ。');tone(620);
    }else if(tile(x+dx,y+dy)==='W')message('きれいな池だ。水が きらきらしている。');
    else if(tile(x+dx,y+dy)==='T')message('大きな木が 道をふさいでいる。');
    else message('草むらを歩くと いろいろな相手に会える。右側の すばるにも 話しかけてみよう。');
  }
  const keys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
  window.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(mode==='dialogue'&&(e.code==='Space'||e.key==='Enter')){e.preventDefault();continueSubaruDialogue();return;}
    if(mode!=='map')return;
    const dir=keys[e.key]||keys[e.key.toLowerCase()];
    if(dir){e.preventDefault();held=dir;if(!e.repeat){last=performance.now();move(dir);}}
    else if((e.code==='Space'||e.key==='Enter')&&e.target===canvas){e.preventDefault();inspect();}
  });
  window.addEventListener('keyup',e=>{if((keys[e.key]||keys[e.key.toLowerCase()])===held)held=null;});
  function release(){held=null;}window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);
  shell.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held=b.dataset.dir;last=performance.now();move(held);});['pointerup','pointercancel','lostpointercapture'].forEach(event=>b.addEventListener(event,release));b.addEventListener('click',e=>{if(e.detail===0)move(b.dataset.dir);});});
  $('inspect').onclick=inspect;back.onclick=returnToMap;
  $('retry').onclick=()=>{back.textContent='にげて マップへ戻る';reset();};
  $('reset').onclick=()=>{if(mode==='loading'||mode==='error')return;x=6;y=10;steps=0;facing='down';$('walk-count').textContent='0 STEPS';returnToMap();encounterAt=4;message('草むらでは 色違いも出現する。右側にいる すばるにも 話しかけてみよう！');};
  $('npc-dialogue').addEventListener('click',e=>{e.preventDefault();continueSubaruDialogue();});
  battle.addEventListener('click',e=>{if(mode==='battle'&&battleEndAwaitClick){e.preventDefault();e.stopPropagation();returnToMap();}});
  document.addEventListener('battle-finished',e=>{
    back.textContent='マップへ戻る';
    if(e.detail?.won&&e.detail?.enemyId==='subaru'){
      battleEndAwaitClick=true;
      back.hidden=true;
      return;
    }
    const ticket=token,battleEpoch=epoch,wait=e.detail?.won?3500:1800;
    setTimeout(()=>{if(mode==='battle'&&token===ticket&&epoch===battleEpoch)returnToMap();},wait);
  });
  let loaded=0; const needed=3;
  function ready(){loaded++;if(loaded===needed&&mode!=='error'){prepareActor();mode='map';if(window.GUNMA_GAME_STARTED)window.GunmaAudio?.playMap?.();frame=requestAnimationFrame(paint);}}
  atlas.onload=ready;actorAtlas.onload=ready;subaruImg.onload=ready;
  atlas.onerror=actorAtlas.onerror=subaruImg.onerror=()=>{mode='error';message('マップ画像を読み込めませんでした。assetsフォルダも一緒に配置して、再読み込みしてください。');};
  atlas.src=resortAsset('assets/world-atlas.png');
  actorAtlas.src=resortAsset(window.MATASABURO_SPRITES||'assets/matasaburo-adult.png');
  subaruImg.src=resortAsset('assets/subaru_map.png');
})();
