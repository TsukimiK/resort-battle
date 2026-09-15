(() => {
  const RESORT_ASSET_VERSION=window.RESORT_ASSET_VERSION||'20260915-tsukimiboss1';
  const resortAsset=path=>/^(?:data:|blob:)/i.test(path)?path:path+(path.includes('?')?'&':'?')+'v='+encodeURIComponent(RESORT_ASSET_VERSION);
  const battle = document.querySelector('.console');
  const shell = document.createElement('section');
  shell.className = 'overworld console';
  shell.setAttribute('aria-label', 'グンマーの小さなマップ');
  shell.innerHTML = `<div class="screen-top"><span><i></i> GUNMA / はじまりの小道</span><span id="walk-count">0 STEPS</span></div><div class="map-view"><canvas id="world" width="640" height="416" tabindex="0" aria-label="マップ。矢印キーまたはWASDで移動。草むらを歩くとバトル。気になる場所の前でスペースキー。"></canvas><div class="map-badge">グンマーの小道 <small>☀ はれ</small></div><div id="encounter-flash" hidden><span>！</span></div><div id="npc-dialogue" hidden><div class="npc-dialogue-box"><span class="dialogue-label">SUBARU</span><p id="npc-dialogue-text"></p><small>クリック / SPACE でつづける</small></div></div></div><div class="map-bottom"><div class="map-copy"><span class="dialogue-label">LET'S EXPLORE</span><p id="map-message" role="status" aria-live="polite">草むらには 5種類のグンモンがいるよ。<br>右の道から 色違いの花園へ行けます。</p><div class="map-legend">矢印キー / WASD：いどう　 SPACE：しらべる</div></div><div class="map-pad" aria-label="移動ボタン"><button data-dir="up" aria-label="上へ移動">▲</button><button data-dir="left" aria-label="左へ移動">◀</button><button id="inspect" aria-label="目の前を調べる">A</button><button data-dir="right" aria-label="右へ移動">▶</button><button data-dir="down" aria-label="下へ移動">▼</button></div></div>`;
  battle.before(shell); battle.hidden = true;
  const back = document.createElement('button');
  back.className = 'map-return'; back.textContent = 'にげて マップへ戻る'; back.hidden = true;
  battle.after(back);
  document.querySelector('h1').textContent = '小さな冒険に、出かけよう。';
  document.querySelector('.eyebrow').textContent = 'GUNMA REGION / A LITTLE ADVENTURE';
  document.querySelector('footer > span').innerHTML = '<b>HOW TO PLAY</b> 草むらを歩くとバトル。木と池は通れません。';
  document.title = 'グンマーモンスター｜小さな冒険';

  const canvas = $('world'), ctx = canvas.getContext('2d'), atlas = new Image(), actorAtlas = new Image(), subaruImg = new Image(), tsukimiImg = new Image();
  // Match the visible height and foot position of the player's standing sprite, excluding transparent padding.
  const npc = { id:'subaru', x:17, y:11, sx:55, sy:89, sw:72, sh:131, dx:2.62, dy:-18.27, w:26.76, h:48.70 };
  const tsukimiNpc={id:'tsukimi_subaru',x:17,y:10,sx:320,sy:510,sw:104,sh:200,dx:3.34,dy:-18.27,w:25.32,h:48.70};
  const currentNpc=()=>area==='start'?npc:tsukimiNpc;
  const encounterPool = ['matasaburo','mikeke','sui','mine_daina','kanade'];
  let actorSurface,heroSpecies='matasaburo',heroFrames=[];
  let resolveMapReady,rejectMapReady;
  const mapReady=new Promise((resolve,reject)=>{resolveMapReady=resolve;rejectMapReady=reject;});
  mapReady.catch(()=>{});

  function prepareActor(sourceImage=actorAtlas){
    const surface=document.createElement('canvas');surface.width=sourceImage.naturalWidth;surface.height=sourceImage.naturalHeight;
    const c=surface.getContext('2d');c.drawImage(sourceImage,0,0);const pixels=c.getImageData(0,0,surface.width,surface.height),d=pixels.data,w=surface.width,h=surface.height;
    const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
    function add(p){if(seen[p])return;seen[p]=1;const i=p*4,r=d[i],g=d[i+1],b=d[i+2];if(d[i+3]===0||(Math.min(r,g,b)>155&&Math.max(r,g,b)-Math.min(r,g,b)<28)){queue[tail++]=p;d[i+3]=0;}}
    for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}while(head<tail){const p=queue[head++],x=p%w;if(x>0)add(p-1);if(x<w-1)add(p+1);if(p>=w)add(p-w);if(p<w*(h-1))add(p+w);}c.putImageData(pixels,0,0);actorSurface=surface;
    heroFrames=[];
    if(heroSpecies!=='matasaburo'){
      const cw=w/4,ch=h/2;
      for(let n=0;n<8;n++){
        const ox=(n%4)*cw,oy=Math.floor(n/4)*ch;let minX=cw,minY=ch,maxX=-1,maxY=-1;
        for(let yy=0;yy<ch;yy++)for(let xx=0;xx<cw;xx++)if(d[((oy+yy)*w+ox+xx)*4+3]>20){minX=Math.min(minX,xx);minY=Math.min(minY,yy);maxX=Math.max(maxX,xx);maxY=Math.max(maxY,yy);}
        heroFrames.push(maxX<0?{sx:ox,sy:oy,sw:cw,sh:ch}:{sx:ox+minX,sy:oy+minY,sw:maxX-minX+1,sh:maxY-minY+1});
      }
    }
  }

  canvas.width=1920;canvas.height=1248;ctx.setTransform(3,0,0,3,0,0);ctx.imageSmoothingEnabled=false;
  const originalRows=[
    'TTTTTTTTTTTTTTTTTTTT',
    'T....f......f......T',
    'T..TT....ggggg..T..T',
    'T..TT....ggggg..T..T',
    'T........ggggg.....T',
    'Tppppppppppppppppppp',
    'T..S..p......p.....T',
    'T.....p..TT..p.WWW.T',
    'T.f...p..TT..p.WWW.T',
    'T..gggp......p.WWW.T',
    'T..gggpppppppp.....T',
    'T.....f.....f..R...T',
    'TTTTTTTTTTTTTTTTTTTT'
  ];
  const shinyRows=[
    'TTTTTTTTTTTTTTTTTTTT',
    'T.f.....f......f...T',
    'T.ggggg...gggggg...T',
    'T.ggggg...gggggg...T',
    'T...S.....p........T',
    'pppppppppppppppppppT',
    'T.....p...p....f...T',
    'T.WWW.p...p.gggggg.T',
    'T.WWW.p...p.gggggg.T',
    'T.....ppppp.gggggg.T',
    'T.gggg....p........T',
    'T.gggg.f..p..f.....T',
    'TTTTTTTTTTTTTTTTTTTT'
  ];
  const shinyPool=['matasaburo_shiny','mikeke_shiny','mine_daina_shiny','hoshiyomi_sui'];
  let area='start',rows=originalRows;
  function updateArea(){
    rows=area==='start'?originalRows:shinyRows;
    const name=area==='start'?'グンマーの小道':'色違いの花園';
    shell.setAttribute('aria-label',name);
    shell.querySelector('.screen-top > span').innerHTML='<i></i> GUNMA / '+name;
    shell.querySelector('.map-badge').innerHTML=name+' <small>☀ はれ</small>';
  }
  function travel(destination){
    area=destination;updateArea();
    x=area==='start'?18:1;y=5;px=fromX=x;py=fromY=y;
    moving=false;held=null;grassSteps=0;encounterAt=4;
    message(area==='start'?'グンマーの小道に 戻ってきた！ 右の道は 色違いの花園へ。':'色違いの花園に 到着！ 草むらには 色違いだけが出現。左の道で戻れます。右側には つきみ すばるがいます。');
  }
  const dirs={down:[0,1,0],up:[0,-1,1],left:[-1,0,2],right:[1,0,3]};
  let x=6,y=10,px=x,py=y,fromX=x,fromY=y,facing='down',moving=false,began=0;
  let mode='loading',steps=0,grassSteps=0,encounterAt=4,token=0,held=null,last=0,frame=0;
  let battleEndAwaitClick=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  function message(s){$('map-message').textContent=s;}
  function tile(cx,cy){return rows[cy]?.[cx];}
  function isNpc(cx,cy){const target=currentNpc();return cx===target.x&&cy===target.y;}
  function blocked(cx,cy){return !tile(cx,cy)||'TRSW'.includes(tile(cx,cy))||isNpc(cx,cy);}
  function cell(n,dx,dy,w=32,h=32){const actor=n>=8,source=actor?actorSurface:atlas,index=actor?n-8:n;const sw=(source.naturalWidth||source.width)/4,sh=(source.naturalHeight||source.height)/(actor?2:4);ctx.imageSmoothingEnabled=actor;ctx.imageSmoothingQuality='high';ctx.drawImage(source,(index%4)*sw,Math.floor(index/4)*sh,sw,sh,Math.round(dx*3)/3,Math.round(dy*3)/3,w,h);ctx.imageSmoothingEnabled=false;}
  function drawNpc(now){
    const target=currentNpc(),img=area==='start'?subaruImg:tsukimiImg;
    if(!img.complete)return;
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    const bob=Math.sin(now/280)*1.2;
    ctx.drawImage(img,target.sx,target.sy,target.sw,target.sh,target.x*32+target.dx,target.y*32+target.dy+bob,target.w,target.h);
    ctx.imageSmoothingEnabled=false;
  }
  function paint(now){
    if(mode==='loading'||mode==='error')return;
    if(moving){const t=Math.min(1,(now-began)/145);px=fromX+(x-fromX)*t;py=fromY+(y-fromY)*t;if(t===1){moving=false;onStep();}}
    ctx.clearRect(0,0,640,416);
    rows.forEach((row,cy)=>[...row].forEach((v,cx)=>{cell(v==='p'?1:v==='g'?2:v==='W'?3:0,cx*32,cy*32);if(v==='T')cell(4,cx*32,cy*32);if(v==='R')cell(5,cx*32,cy*32);if(v==='f')cell(6,cx*32,cy*32);if(v==='S')cell(7,cx*32,cy*32);}));
    drawNpc(now);
    const stride = moving && Math.floor((now-began)/75)%2===1;
    if(heroSpecies==='matasaburo')cell((stride?12:8)+dirs[facing][2],px*32-6,py*32-24,44,58.6667);
    else{
      const direction=dirs[facing][2];
      const column=heroSpecies==='mikeke'&&direction>=2?5-direction:direction;
      const f=heroFrames[(stride?4:0)+column],height=48.7,width=f.sw/f.sh*height;
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      ctx.drawImage(actorSurface,f.sx,f.sy,f.sw,f.sh,px*32+16-width/2,py*32+30.43-height,width,height);
      ctx.imageSmoothingEnabled=false;
    }
    if(mode==='map'&&held&&!moving&&now-last>165){last=now;move(held);}
    frame=requestAnimationFrame(paint);
  }
  function move(dir){if(mode!=='map'||moving)return;facing=dir;const [dx,dy]=dirs[dir];if(blocked(x+dx,y+dy))return;fromX=x;fromY=y;x+=dx;y+=dy;began=performance.now();moving=true;}
  function onStep(){if(mode!=='map')return;steps++;$('walk-count').textContent=steps+' STEPS';if(area==='start'&&x===19&&y===5){travel('shiny');return;}if(area==='shiny'&&x===0&&y===5){travel('start');return;}canvas.setAttribute('aria-label',`マップ。現在 ${x+1}列 ${y+1}行。${tile(x,y)==='g'?'草むら':'小道・草地'}。矢印キーで移動。`);if(tile(x,y)==='g'){grassSteps++;if(grassSteps>=encounterAt)encounter();}}

  function showSubaruDialogue(){
    if(mode!=='map'||moving)return;
    mode='dialogue';held=null;
    $('npc-dialogue-text').textContent=area==='start'?'「ちょっといいですか？嫌です」':'「あぁ゛？！」';
    shell.querySelector('.npc-dialogue-box .dialogue-label').textContent=area==='start'?'すばる':'つきみ すばる';
    $('npc-dialogue').hidden=false;
    tone(620);
  }
  function continueSubaruDialogue(){
    if(mode!=='dialogue')return;
    $('npc-dialogue').hidden=true;
    const target=currentNpc();startBattle(target.id,enemies[target.id].name+'との バトルが はじまる！');
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
    const pool=area==='shiny'?shinyPool:encounterPool;
    const enemyId=pool[Math.floor(Math.random()*pool.length)];
    startBattle(enemyId,'あっ！ 草むらから '+enemies[enemyId].name+'が！');
  }
  function returnToMap(){if(mode==='loading'||mode==='error')return;healParty();token++;epoch++;held=null;moving=false;mode='map';battleEndAwaitClick=false;px=x;py=y;grassSteps=0;encounterAt=5+Math.floor(Math.random()*4);battle.hidden=true;back.hidden=true;shell.hidden=false;$('encounter-flash').hidden=true;$('npc-dialogue').hidden=true;window.GunmaAudio?.playMap?.();message('ひと休みして HPとPPが まんたんに！ 冒険をつづけよう。');reset();canvas.focus({preventScroll:true});}
  function facingNpc(){const [dx,dy]=dirs[facing];return isNpc(x+dx,y+dy);}
  function inspect(){
    if(mode!=='map'||moving)return;
    const [dx,dy]=dirs[facing];
    if(facingNpc()){
      showSubaruDialogue();
    }else if(tile(x+dx,y+dy)==='S'){
      message(area==='start'?'【グンマーの小道】右の道から 色違いの花園へ。すばるは 右下にいる。':'【色違いの花園】草むらには 色違いだけが出現！ 左の道で グンマーの小道へ戻れます。');tone(620);
    }else if(tile(x+dx,y+dy)==='W')message('きれいな池だ。水が きらきらしている。');
    else if(tile(x+dx,y+dy)==='T')message('大きな木が 道をふさいでいる。');
    else message(area==='start'?'右の道は 色違いの花園へ。右下の すばるにも 話しかけてみよう。':'ここは 色違いの花園。草むらで 色違いに会おう！ 左の道で戻れます。右側には つきみ すばるがいます。');
  }
  const keys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
  window.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(!window.GUNMA_GAME_STARTED)return;
    if(e.target.matches?.('input,textarea,select,[contenteditable="true"]'))return;
    if(mode==='menu')return;
    if(e.code==='Space'&&(mode==='map'||mode==='dialogue'||!e.target.closest?.('button')))e.preventDefault();
    if(mode==='map'&&(e.key==='Escape'||e.key.toLowerCase()==='m')){e.preventDefault();window.GunmaMenu.open();return;}
    if(mode==='dialogue'&&(e.code==='Space'||e.key==='Enter')){e.preventDefault();continueSubaruDialogue();return;}
    if(mode!=='map')return;
    const dir=keys[e.key]||keys[e.key.toLowerCase()];
    if(dir){e.preventDefault();held=dir;if(!e.repeat){last=performance.now();move(dir);}}
    else if(e.code==='Space'||(e.key==='Enter'&&e.target===canvas)){e.preventDefault();if(!e.repeat)inspect();}
  });
  window.addEventListener('keyup',e=>{if((keys[e.key]||keys[e.key.toLowerCase()])===held)held=null;});
  function release(){held=null;}window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);
  shell.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held=b.dataset.dir;last=performance.now();move(held);});['pointerup','pointercancel','lostpointercapture'].forEach(event=>b.addEventListener(event,release));b.addEventListener('click',e=>{if(e.detail===0)move(b.dataset.dir);});});
  $('inspect').onclick=inspect;back.onclick=returnToMap;
  window.GunmaMap={
    mode:()=>mode,
    setHero:async species=>{
      await mapReady;
      if(!STARTERS.includes(species)||window.GUNMA_GAME_STARTED)throw Error('主人公を変更できません');
      if(species==='matasaburo'){heroSpecies=species;prepareActor();return;}
      const data=window.GUNMA_WALKING?.[species];if(!data)throw Error('歩行画像が見つかりません');
      const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('歩行画像を読み込めません'));img.src=data;});
      heroSpecies=species;prepareActor(img);
    },
    pause:()=>{if(mode!=='map'||moving||!window.GUNMA_GAME_STARTED)return false;mode='menu';held=null;return true;},
    resume:()=>{if(mode==='menu'){mode='map';held=null;canvas.focus({preventScroll:true});}}
  };
  const menuButton=document.createElement('button');
  menuButton.id='map-menu';menuButton.className='map-menu-button';menuButton.textContent='メニュー';
  menuButton.onclick=()=>window.GunmaMenu.open();shell.querySelector('.map-bottom').prepend(menuButton);
  $('retry').onclick=()=>{back.textContent='にげて マップへ戻る';reset();};
  $('reset').onclick=()=>{if(mode==='loading'||mode==='error'||mode==='menu')return;area='start';updateArea();x=6;y=10;steps=0;facing='down';$('walk-count').textContent='0 STEPS';returnToMap();encounterAt=4;message('草むらでは 通常のグンモンに出会える。右の道から 色違いの花園へ行ってみよう！');};
  $('npc-dialogue').addEventListener('click',e=>{e.preventDefault();continueSubaruDialogue();});
  battle.addEventListener('click',e=>{if(mode==='battle'&&battleEndAwaitClick){e.preventDefault();e.stopPropagation();returnToMap();}});
  document.addEventListener('battle-finished',e=>{
    back.textContent='マップへ戻る';
    if(e.detail?.won&&!e.detail?.captured&&['subaru','tsukimi_subaru'].includes(e.detail?.enemyId)){
      battleEndAwaitClick=true;
      back.hidden=true;
      return;
    }
    const ticket=token,battleEpoch=epoch,wait=e.detail?.won?3500:1800;
    setTimeout(()=>{if(mode==='battle'&&token===ticket&&epoch===battleEpoch)returnToMap();},wait);
  });
  let loaded=0; const needed=4;
  function ready(){loaded++;if(loaded===needed&&mode!=='error'){prepareActor();mode='map';resolveMapReady();if(window.GUNMA_GAME_STARTED)window.GunmaAudio?.playMap?.();frame=requestAnimationFrame(paint);}}
  atlas.onload=ready;actorAtlas.onload=ready;subaruImg.onload=ready;tsukimiImg.onload=ready;
  atlas.onerror=actorAtlas.onerror=subaruImg.onerror=tsukimiImg.onerror=()=>{mode='error';rejectMapReady(Error('マップ画像を読み込めません'));message('マップ画像を読み込めませんでした。assetsフォルダも一緒に配置して、再読み込みしてください。');};
  atlas.src=resortAsset('assets/world-atlas.png');
  actorAtlas.src=resortAsset(window.MATASABURO_SPRITES||'assets/matasaburo-adult.png');
  subaruImg.src=resortAsset('assets/subaru_map.png');
  tsukimiImg.src=window.TSUKIMI_SHEET;
})();
