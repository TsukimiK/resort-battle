(() => {
  const battle = document.querySelector('.console');
  const shell = document.createElement('section');
  shell.className = 'overworld console';
  shell.setAttribute('aria-label', 'グンマーの小さなマップ');
  shell.innerHTML = `<div class="screen-top"><span><i></i> GUNMA / はじまりの小道</span><span id="walk-count">0 STEPS</span></div><div class="map-view"><canvas id="world" width="640" height="416" tabindex="0" aria-label="マップ。矢印キーまたはWASDで移動。草むらを歩くとバトル。看板の前でスペースキー。"></canvas><div class="map-badge">グンマーの小道 <small>☀ はれ</small></div><div id="encounter-flash" hidden><span>！</span></div></div><div class="map-bottom"><div class="map-copy"><span class="dialogue-label">LET'S EXPLORE</span><p id="map-message" role="status" aria-live="polite">草むらに 5人の相手が いるみたい。<br>小道を歩いて 探してみよう！</p><div class="map-legend">矢印キー / WASD：いどう　 SPACE：しらべる</div></div><div class="map-pad" aria-label="移動ボタン"><button data-dir="up" aria-label="上へ移動">▲</button><button data-dir="left" aria-label="左へ移動">◀</button><button id="inspect" aria-label="目の前を調べる">A</button><button data-dir="right" aria-label="右へ移動">▶</button><button data-dir="down" aria-label="下へ移動">▼</button></div></div>`;
  battle.before(shell); battle.hidden = true;
  const back = document.createElement('button');
  back.className = 'map-return'; back.textContent = 'にげて マップへ戻る'; back.hidden = true;
  battle.after(back);
  document.querySelector('h1').textContent = '小さな冒険に、出かけよう。';
  document.querySelector('.eyebrow').textContent = 'GUNMA REGION / A LITTLE ADVENTURE';
  document.querySelector('footer > span').innerHTML = '<b>HOW TO PLAY</b> 草むらを歩くとバトル。木と池は通れません。';
  document.title = 'マタサブロウ｜小さな冒険';
  const canvas = $('world'), ctx = canvas.getContext('2d'), atlas = new Image(), actorAtlas = new Image();
  let actorSurface;
  function prepareActor(){
    const surface=document.createElement('canvas');surface.width=actorAtlas.naturalWidth;surface.height=actorAtlas.naturalHeight;
    const c=surface.getContext('2d');c.drawImage(actorAtlas,0,0);const pixels=c.getImageData(0,0,surface.width,surface.height),d=pixels.data,w=surface.width,h=surface.height;
    // Key only neutral background pixels connected to the sheet edges; keep enclosed white costume details.
    const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
    function add(p){if(seen[p])return;seen[p]=1;const i=p*4,r=d[i],g=d[i+1],b=d[i+2];if(d[i+3]===0||(Math.min(r,g,b)>155&&Math.max(r,g,b)-Math.min(r,g,b)<28)){queue[tail++]=p;d[i+3]=0;}}
    for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
    while(head<tail){const p=queue[head++],x=p%w;if(x>0)add(p-1);if(x<w-1)add(p+1);if(p>=w)add(p-w);if(p<w*(h-1))add(p+w);}
    c.putImageData(pixels,0,0);actorSurface=surface;
  }
  canvas.width=1920;canvas.height=1248;ctx.setTransform(3,0,0,3,0,0);ctx.imageSmoothingEnabled = false;
  const rows = [
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
  const dirs = {down:[0,1,0],up:[0,-1,1],left:[-1,0,2],right:[1,0,3]};
  let x=6, y=10, px=x, py=y, fromX=x, fromY=y, facing='down', moving=false, began=0;
  let mode='loading', steps=0, grassSteps=0, encounterAt=4, token=0, held=null, last=0, frame=0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function message(s){$('map-message').textContent=s;}
  function tile(cx,cy){return rows[cy]?.[cx];}
  function blocked(cx,cy){return !tile(cx,cy)||'TRSW'.includes(tile(cx,cy));}
  function cell(n,dx,dy,w=32,h=32){const actor=n>=8,source=actor?actorSurface:atlas,index=actor?n-8:n;const sw=(source.naturalWidth||source.width)/4,sh=(source.naturalHeight||source.height)/(actor?2:4);ctx.imageSmoothingEnabled=actor;ctx.imageSmoothingQuality='high';ctx.drawImage(source,(index%4)*sw,Math.floor(index/4)*sh,sw,sh,Math.round(dx*3)/3,Math.round(dy*3)/3,w,h);ctx.imageSmoothingEnabled=false;}
  function paint(now){
    if(mode==='loading'||mode==='error')return;
    if(moving){const t=Math.min(1,(now-began)/145);px=fromX+(x-fromX)*t;py=fromY+(y-fromY)*t;if(t===1){moving=false;onStep();}}
    ctx.clearRect(0,0,640,416);
    rows.forEach((row,cy)=>[...row].forEach((v,cx)=>{cell(v==='p'?1:v==='g'?2:v==='W'?3:0,cx*32,cy*32);if(v==='T')cell(4,cx*32,cy*32);if(v==='R')cell(5,cx*32,cy*32);if(v==='f')cell(6,cx*32,cy*32);if(v==='S')cell(7,cx*32,cy*32);}));
    const stride = moving && Math.floor((now-began)/75)%2===1;
    cell((stride?12:8)+dirs[facing][2],px*32-6,py*32-24,44,58.6667);
    if(mode==='map'&&held&&!moving&&now-last>165){last=now;move(held);}
    frame=requestAnimationFrame(paint);
  }
  function move(dir){if(mode!=='map'||moving)return;facing=dir;const [dx,dy]=dirs[dir];if(blocked(x+dx,y+dy))return;fromX=x;fromY=y;x+=dx;y+=dy;began=performance.now();moving=true;}
  function onStep(){if(mode!=='map')return;steps++;$('walk-count').textContent=steps+' STEPS';canvas.setAttribute('aria-label',`マップ。現在 ${x+1}列 ${y+1}行。${tile(x,y)==='g'?'草むら':'小道・草地'}。矢印キーで移動。`);if(tile(x,y)==='g'){grassSteps++;if(grassSteps>=encounterAt)encounter();} }
  async function encounter(){mode='transition';held=null;const ticket=++token;$('encounter-flash').hidden=false;const encounterPool=['matasaburo','mikeke','mine_daina','kanade','sui'];const enemyId=encounterPool[Math.floor(Math.random()*encounterPool.length)];message('あっ！ 草むらから '+enemies[enemyId].name+'が！');tone(760);await delay(reduced?200:700);if(ticket!==token)return;mode='battle';$('encounter-flash').hidden=true;shell.hidden=true;battle.hidden=false;back.hidden=false;back.textContent='にげて マップへ戻る';reset(enemyId);$('moves').querySelector('button').focus({preventScroll:true});}
  function returnToMap(){if(mode==='loading'||mode==='error')return;token++;epoch++;held=null;moving=false;mode='map';px=x;py=y;grassSteps=0;encounterAt=5+Math.floor(Math.random()*4);battle.hidden=true;back.hidden=true;shell.hidden=false;$('encounter-flash').hidden=true;message('ひと休みして HPとPPが まんたんに！ 冒険をつづけよう。');reset();canvas.focus({preventScroll:true});}
  function inspect(){if(mode!=='map'||moving)return;const [dx,dy]=dirs[facing];if(tile(x+dx,y+dy)==='S'){message('【グンマーの小道】マタサブロウ、ミケケ、みね だいな、かなで、すいが いるみたい。');tone(620);}else if(tile(x+dx,y+dy)==='W')message('きれいな池だ。水が きらきらしている。');else if(tile(x+dx,y+dy)==='T')message('大きな木が 道をふさいでいる。');else message('草むらを何歩か歩くと 5人のだれかに出会えるよ。');}
  const keys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
  window.addEventListener('keydown',e=>{if(mode!=='map'||e.ctrlKey||e.metaKey||e.altKey)return;const dir=keys[e.key]||keys[e.key.toLowerCase()];if(dir){e.preventDefault();held=dir;if(!e.repeat){last=performance.now();move(dir);}}else if((e.code==='Space'||e.key==='Enter')&&e.target===canvas){e.preventDefault();inspect();}});
  window.addEventListener('keyup',e=>{if((keys[e.key]||keys[e.key.toLowerCase()])===held)held=null;});
  function release(){held=null;}window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);
  shell.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held=b.dataset.dir;last=performance.now();move(held);});['pointerup','pointercancel','lostpointercapture'].forEach(event=>b.addEventListener(event,release));b.addEventListener('click',e=>{if(e.detail===0)move(b.dataset.dir);});});
  $('inspect').onclick=inspect;back.onclick=returnToMap;
  $('retry').onclick=()=>{back.textContent='にげて マップへ戻る';reset();};
  $('reset').onclick=()=>{if(mode==='loading'||mode==='error')return;x=6;y=10;steps=0;facing='down';$('walk-count').textContent='0 STEPS';returnToMap();encounterAt=4;message('小道を歩いて 草むらへ。マタサブロウを探してみよう！');};
  document.addEventListener('battle-finished',()=>{back.textContent='マップへ戻る';const ticket=token,battleEpoch=epoch;setTimeout(()=>{if(mode==='battle'&&token===ticket&&epoch===battleEpoch)returnToMap();},1800);});
  let loaded=0;
  function ready(){loaded++;if(loaded===2&&mode!=='error'){prepareActor();mode='map';frame=requestAnimationFrame(paint);}}
  atlas.onload=actorAtlas.onload=ready;
  atlas.onerror=actorAtlas.onerror=()=>{mode='error';message('マップ画像を読み込めませんでした。assetsフォルダも一緒に配置して、再読み込みしてください。');};
  atlas.src='assets/world-atlas.png';
  actorAtlas.src=window.MATASABURO_SPRITES||'assets/matasaburo-adult.png';
})();
