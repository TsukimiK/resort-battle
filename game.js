const $=id=>document.getElementById(id);
const RESORT_ASSET_VERSION=window.RESORT_ASSET_VERSION||'20260915-party1';
const resortAsset=path=>path+(path.includes('?')?'&':'?')+'v='+encodeURIComponent(RESORT_ASSET_VERSION);

const definitions=[
  {name:'ハッピーアタック',type:'ノーマル',css:'',pp:15,power:29,description:'気分を上げて攻撃'},
  {name:'ダンシングビート',type:'かくとう',css:'fight',pp:10,power:39,description:'ダンスで強く攻撃'},
  {name:'トロピカルウェーブ',type:'みず',css:'water',pp:10,power:34,description:'波で攻撃'},
  {name:'リラックスタイム',type:'ノーマル',css:'',pp:5,power:0,description:'HPを45回復'}
];

const mikekeMoves=[
  {name:'しゃしんをとる',damage:0,text:'パシャッ！ 写真をとっている。',effect:'photo-effect'},
  {name:'だきつく',damage:50,text:'ぎゅーっ！ 50 ダメージを うけた！'},
  {name:'ポーズをとる',damage:0,text:'ミケケは かっこよく ポーズをとった！'},
  {name:'めっちゃいい～',damage:0,text:'「めっちゃいい～！」 ミケケは よろこんでいる！'}
];

const mineDainaMoves=[
  {name:'だいこんを投げる',kind:'damage',damage:80,text:'だいこんが ちょくげき！ 80 ダメージを うけた！'},
  {name:'だいこんを食べる',kind:'self-heal',heal:45,text:'みね だいなは だいこんを たべた！'},
  {name:'だいこんを食べさせる',kind:'target-heal',heal:45,text:'みね だいなは だいこんを たべさせた！'},
  {name:'あいさつする',kind:'status',damage:0,text:'「おはようございま～す」',sfx:'mine_daina_greeting'}
];

const kanadeMoves=[
  {name:'たばこを吸う',kind:'self-heal',heal:45,text:'かなでは たばこを すった。'},
  {name:'こんじょうやき',kind:'damage',damage:42,text:'こんじょうやき！ 42 ダメージを うけた！'},
  {name:'ステーキをたべる',kind:'self-damage',damage:30,text:'かなでは ステーキを たべた！'},
  {name:'しかる',kind:'damage',damage:35,text:'かなでに しかられた！ 35 ダメージを うけた！'}
];

const suiMoves=[
  {name:'みずのはどう',kind:'damage',damage:36,text:'みずのはどう！ 36 ダメージを うけた！',effect:'water-effect'},
  {name:'れいとうビーム',kind:'damage',damage:44,text:'れいとうビーム！ 44 ダメージを うけた！'},
  {name:'うずしお',kind:'damage',damage:32,text:'うずしおに まきこまれた！ 32 ダメージを うけた！',effect:'water-effect'},
  {name:'ナイトフォール',kind:'damage',damage:55,text:'ナイトフォール！ 55 ダメージを うけた！'}
];

const subaruMoves=[
  {name:'殺す',kind:'ohko',accuracy:0.2,hitText:'「殺す」 いちげき ひっさつ！ マタサブロウは たおれた！',missText:'「殺す」 しかし うまく あたらなかった！'},
  {name:'キレる',kind:'damage',damage:40,text:'すばるが キレた！ 40 ダメージを うけた！'},
  {name:'煙草を吸う',kind:'self-heal',heal:45,text:'すばるは けむりを くゆらせた。'},
  {name:'銃を打つ',kind:'damage',damage:55,text:'バンッ！ 55 ダメージを うけた！'}
];

const enemies={
  matasaburo:{name:'マタサブロウ',title:'やせいの リゾートポケモン',image:resortAsset('assets/matasaburo.png'),moves:[{name:'ハッピーアタック',damage:27},{name:'ダンシングビート',damage:32},{name:'トロピカルウェーブ',damage:29}]},
  mikeke:{name:'ミケケ',title:'カメラこぞう',image:resortAsset('assets/mikeke.png'),moves:mikekeMoves},
  mine_daina:{name:'みね だいな',title:'だいこんトレーナー',image:resortAsset('assets/mine_daina.png'),moves:mineDainaMoves},
  kanade:{name:'かなで',title:'けむりのトレーナー',image:resortAsset('assets/kanade.png'),moves:kanadeMoves},
  sui:{name:'ほしよみすい',gender:'♀',title:'みずのトレーナー',image:resortAsset('assets/sui.png'),moves:suiMoves},
  matasaburo_shiny:{name:'マタサブロウ',title:'いろちがいの リゾートポケモン',image:resortAsset('assets/matasaburo_shiny.png'),moves:[{name:'ハッピーアタック',damage:27},{name:'ダンシングビート',damage:32},{name:'トロピカルウェーブ',damage:29}]},
  mikeke_shiny:{name:'ミケケ',title:'いろちがいの カメラこぞう',image:resortAsset('assets/mikeke_shiny.png'),moves:mikekeMoves},
  mine_daina_shiny:{name:'みね だいな',title:'いろちがいの だいこんトレーナー',image:resortAsset('assets/mine_daina_shiny.png'),moves:mineDainaMoves},
  hoshiyomi_sui:{name:'ほしよみすい',gender:'♀',title:'いろちがいの みずのトレーナー',image:resortAsset('assets/hoshiyomi_sui.png'),moves:suiMoves},
  subaru:{name:'すばる',title:'あおい けむりのトレーナー',image:resortAsset('assets/subaru.png'),moves:subaruMoves}
};

const PARTY_KEY='gunma-party-v1';
function movesFor(member){
  if(member.uid==='self')return definitions.map(m=>({...m,kind:m.power?'damage':'self-heal',damage:m.power,heal:45,variable:!!m.power}));
  return enemies[member.species].moves.map(m=>({...m,kind:m.kind||(m.damage?'damage':'status'),pp:15,type:'ノーマル',css:'',description:moveDescription(m)}));
}
function moveDescription(m){
  const kind=m.kind||(m.damage?'damage':'status');
  if(kind==='self-heal')return '自分のHPを'+(m.heal||45)+'回復';
  if(kind==='target-heal')return '相手のHPを'+(m.heal||45)+'回復';
  if(kind==='self-damage')return '自分に'+m.damage+'ダメージ';
  if(kind==='ohko')return '命中'+Math.round((m.accuracy??.2)*100)+'%で一撃';
  if(kind==='damage')return m.damage+'ダメージ';
  return m.sfx?'あいさつと鳴き声（ダメージなし）':'ダメージなし';
}
function newMember(species,uid){const m={species,uid,hp:180};m.pp=movesFor(m).map(x=>x.pp);return m;}
let party=[newMember('matasaburo','self')],activeUid='self',saveWarning='';
try{
  const saved=JSON.parse(localStorage.getItem(PARTY_KEY)||'null');
  if(saved&&Array.isArray(saved.caught)){
    const seen=new Set(['self']);
    for(const m of saved.caught.slice(0,5))if(m&&enemies[m.species]&&typeof m.uid==='string'&&!seen.has(m.uid)){party.push(newMember(m.species,m.uid));seen.add(m.uid);}
    if(party.some(m=>m.uid===saved.activeUid))activeUid=saved.activeUid;
  }
}catch{saveWarning='記録を読み込めませんでした。今回の仲間はこの画面を閉じるまで保持します。';}
function saveParty(){try{localStorage.setItem(PARTY_KEY,JSON.stringify({caught:party.filter(m=>m.uid!=='self').map(({species,uid})=>({species,uid})),activeUid}));}catch{saveWarning='保存できません。この画面を閉じると仲間の記録が失われます。';}}
function activeMember(){return party.find(m=>m.uid===activeUid)||party[0];}
function activeName(){return enemies[activeMember().species].name;}
function healParty(){party.forEach(m=>{m.hp=180;m.pp=movesFor(m).map(x=>x.pp)});}
function captureChance(hp){return .2+.65*(1-Math.max(0,Math.min(180,hp))/180);}
function releaseMember(uid){
  if(uid==='self'||!party.some(m=>m.uid===uid))return false;
  if(window.GunmaMap?.mode()!=='menu')return false;
  party=party.filter(m=>m.uid!==uid);if(activeUid===uid)activeUid='self';saveParty();reset();return true;
}
let state,epoch=0,audio;
function tone(freq=440){
  if(!window.GunmaAudio?.isEnabled?.())return;
  try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='square';o.frequency.value=freq;g.gain.setValueAtTime(.035*(window.GunmaAudio.getVolume()/.35),audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.16);}catch{}
}
function render(){
  activeMember().hp=state.player;activeMember().pp=state.pp;
  for(const side of ['player','enemy']){const amount=state[side]/180*100;$(side+'-bar').style.width=amount+'%';$(side+'-bar').style.background=amount>50?'#59cc79':amount>20?'#efc74f':'#e16a59';}
  const member=activeMember(),species=enemies[member.species];
  $('player').src=species.image;$('player').alt='味方の'+species.name;
  document.querySelector('.player-status .name').innerHTML=species.name+' <span class="male">'+(species.gender||'♂')+'</span><span class="level">Lv.50</span>';
  $('hp').textContent=state.player+' / 180';$('turn').textContent='TURN '+String(state.turn).padStart(2,'0');
  $('moves').replaceChildren();
  movesFor(member).forEach((m,i)=>{const b=document.createElement('button');b.className='move';b.disabled=state.busy||state.over||state.player===0||state.pp[i]===0;b.setAttribute('aria-label',m.name+'、'+m.description+'、残りPP '+state.pp[i]);b.innerHTML='<span class="move-name">'+m.name+'</span><span class="move-meta"><span class="type '+(m.css||'')+'">'+m.type+'</span><span>PP '+state.pp[i]+' / '+m.pp+'</span></span>';b.onclick=()=>turn(i);$('moves').append(b);});
  $('moves').hidden=state.over;$('retry').hidden=true;
  if($('catch-ball')){
    $('catch-ball').disabled=state.busy||state.over||state.player===0||party.length>=6;
    $('catch-ball').textContent=party.length>=6?'捕獲枠がいっぱい（5 / 5）':'グンマーボールを投げる（'+Math.round(captureChance(state.enemy)*100)+'%）';
    $('battle-party').disabled=state.busy||state.over;
    $('battle-actions').hidden=state.over;
  }
}
function say(text,label){$('message').textContent=text;if(label)$('phase').textContent=label;}
function reset(enemyId='matasaburo'){
  epoch++;const foe=enemies[enemyId]||enemies.matasaburo,member=activeMember();
  state={foe,enemyId,player:member.hp,enemy:180,pp:member.pp,turn:1,busy:false,over:false};
  $('enemy').classList.remove('faint');$('player').classList.remove('faint');$('effect').className='';
  $('enemy').src=foe.image;$('enemy').alt=foe.title+' '+foe.name;
  document.querySelector('.enemy-status .name').innerHTML=foe.name+' <span class="male">'+(foe.gender||'♂')+'</span><span class="level">Lv.50</span>';
  document.querySelector('.status-foot').textContent=foe.title;
  say(foe.title+' '+foe.name+'が あらわれた！ '+activeName()+'は どうする？','YOUR TURN');render();
}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function animate(id,cls){$(id).classList.remove(cls);void $(id).offsetWidth;$(id).classList.add(cls);setTimeout(()=>$(id).classList.remove(cls),600);}
function finish(won,captured=false){
  state.over=true;state.busy=false;$(won?'enemy':'player').classList.add('faint');
  say(captured?state.foe.name+'を つかまえた！\n捕まえた仲間 '+(party.length-1)+' / 5体\nマップへ戻ります。':won?(state.enemyId==='subaru'?'すばるを たおした！\n「次のChill Smokeオーナーは君だ」\n\nクリックでマップへ戻る':state.foe.name+'を たおした！ マップへ戻ります。'):activeName()+'は たおれた…。ひと休みして マップへ戻ります。',captured?'GOTCHA!':won?'YOU WIN!':'BATTLE OVER');
  if(won)window.GunmaAudio?.playVictory?.();tone(won?880:160);render();
  document.dispatchEvent(new CustomEvent('battle-finished',{detail:{won,enemyId:state.enemyId,captured}}));
}
function healSide(side,amount){const before=state[side];state[side]=Math.min(180,state[side]+amount);return state[side]-before;}
function applyMove(m,side){
  const other=side==='player'?'enemy':'player',name=side==='player'?activeName():state.foe.name,target=other==='player'?activeName():state.foe.name;
  const kind=m.kind||(m.damage?'damage':'status');
  if(m.sfx)window.GunmaAudio?.playSfx?.(m.sfx);if(m.effect)animate('effect',m.effect);
  if(kind==='damage'){const damage=(m.damage||0)+(m.variable?Math.floor(Math.random()*8):0);state[other]=Math.max(0,state[other]-damage);if(damage)animate(other,'hit');if(m.css)animate('effect',m.css==='water'?'water-effect':'fight-effect');say(target+'に '+damage+' ダメージ！');}
  else if(kind==='self-heal'||kind==='target-heal'){const who=kind==='self-heal'?side:other,n=healSide(who,m.heal||45);animate(who,'heal');say((who===side?name:target)+'の HPが '+n+' かいふくした！');}
  else if(kind==='self-damage'){state[side]=Math.max(0,state[side]-(m.damage||0));animate(side,'hit');say(name+'は '+m.name+'！ 自分に '+m.damage+' ダメージ！');}
  else if(kind==='ohko'){if(Math.random()<(m.accuracy??.2)){state[other]=0;animate(other,'hit');say('いちげき ひっさつ！ '+target+'は たおれた！');}else say('しかし うまく あたらなかった！');}
  else say(m.text||name+'は ようすを みている…。');
}
function checkEnd(){
  if(state.enemy===0){finish(true);return true;}
  if(state.player===0){
    if(party.some(m=>m.uid!==activeUid&&m.hp>0)){state.busy=false;$('player').classList.add('faint');say(activeName()+'は たおれた！「グンモン」で次の仲間を選ぼう。','CHANGE');render();}
    else finish(false);
    return true;
  }return false;
}
async function enemyTurn(ticket){
  if(ticket!==epoch||state.over)return;
  if(checkEnd())return;
  const m=state.foe.moves[(state.turn-1)%state.foe.moves.length];
  say(state.foe.name+'の '+m.name+'！','ENEMY TURN');animate('enemy','attack');tone(260);
  await delay(650);if(ticket!==epoch)return;applyMove(m,'enemy');render();
  await delay(850);if(ticket!==epoch)return;state.turn++;
  if(checkEnd())return;
  state.busy=false;
  if(state.pp.every(p=>p===0))state.pp=movesFor(activeMember()).map(m=>m.pp);
  say(activeName()+'は どうする？','YOUR TURN');render();
}
async function turn(i){
  if(state.busy||state.over||!state.player||!state.pp[i])return;
  const ticket=epoch,m=movesFor(activeMember())[i];
  state.busy=true;state.pp[i]--;render();say(activeName()+'の '+m.name+'！','YOUR MOVE');tone(520);animate('player','attack');
  await delay(650);if(ticket!==epoch)return;applyMove(m,'player');render();
  await delay(950);if(ticket!==epoch)return;await enemyTurn(ticket);
}
async function throwBall(){
  if(window.GunmaMap?.mode()!=='battle'||state.busy||state.over||!state.player)return;
  if(party.length>=6){say('捕まえられるのは5体までです。マップのグンモンから逃がすと、枠が空きます。');return;}
  const ticket=epoch,chance=captureChance(state.enemy);state.busy=true;render();say('グンマーボールを 投げた！','CATCH');
  $('gunma-ball').hidden=false;
  await delay(1000);$('gunma-ball').hidden=true;if(ticket!==epoch)return;
  if(Math.random()<chance){
    party.push(newMember(state.enemyId,'caught-'+Date.now()+'-'+Math.random().toString(36).slice(2)));saveParty();finish(true,true);
  }else{say('あっ！ ボールから 出てしまった！');await delay(800);if(ticket!==epoch)return;await enemyTurn(ticket);}
}
async function switchMember(uid){
  const next=party.find(m=>m.uid===uid),mode=window.GunmaMap?.mode();
  if(!next||uid===activeUid||!['menu','battle'].includes(mode))return false;
  if(mode==='battle'&&(state.busy||state.over||next.hp===0))return false;
  const wasFainted=state.player===0;
  activeMember().hp=state.player;activeMember().pp=state.pp;
  activeUid=uid;saveParty();state.player=next.hp;state.pp=next.pp;$('player').classList.remove('faint');
  if(state.pp.every(p=>p===0))state.pp=movesFor(next).map(m=>m.pp);
  if(mode==='battle'){
    state.busy=true;render();say('いけっ！ '+activeName()+'！','CHANGE');const ticket=epoch;
    await delay(650);if(ticket!==epoch)return true;
    if(wasFainted){state.busy=false;render();say(activeName()+'は どうする？','YOUR TURN');}else await enemyTurn(ticket);
  }else render();return true;
}
$('retry').onclick=()=>reset();$('reset').onclick=()=>reset();reset();
