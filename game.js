const $=id=>document.getElementById(id);
const RESORT_ASSET_VERSION=window.RESORT_ASSET_VERSION||'20260915-subarudialog1';
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

let state,epoch=0,audio;
function tone(freq=440){
  if(!window.GunmaAudio?.isEnabled?.())return;
  try{
    audio??=new(window.AudioContext||window.webkitAudioContext)();
    audio.resume();
    const volume=window.GunmaAudio?.getVolume?.()??.35;
    let o=audio.createOscillator(),g=audio.createGain();
    o.type='square';o.frequency.value=freq;
    const gain=.035*Math.min(1.5,volume/.35);
    g.gain.setValueAtTime(Math.max(.001,gain),audio.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);
    o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.16);
  }catch{}
}
function render(){
  for(const side of ['player','enemy']){
    let amount=state[side]/180*100;
    $(side+'-bar').style.width=amount+'%';
    $(side+'-bar').style.background=amount>50?'#59cc79':amount>20?'#efc74f':'#e16a59';
  }
  $('hp').textContent=state.player+' / 180';
  $('turn').textContent='TURN '+String(state.turn).padStart(2,'0');
  $('moves').replaceChildren();
  definitions.forEach((m,i)=>{
    let b=document.createElement('button');
    b.className='move';
    b.disabled=state.busy||state.over||state.pp[i]===0;
    b.setAttribute('aria-label',m.name+'、'+m.description+'、残りPP '+state.pp[i]);
    b.innerHTML='<span class="move-name">'+m.name+'</span><span class="move-meta"><span class="type '+m.css+'">'+m.type+'</span><span>PP '+state.pp[i]+' / '+m.pp+'</span></span>';
    b.onclick=()=>turn(i);
    $('moves').append(b);
  });
  $('moves').hidden=state.over;
  $('retry').hidden=true;
}
function say(text,label){$('message').textContent=text;if(label)$('phase').textContent=label}
function reset(enemyId='matasaburo'){
  epoch++;
  const foe=enemies[enemyId]||enemies.matasaburo;
  state={foe,player:180,enemy:180,pp:definitions.map(m=>m.pp),turn:1,busy:false,over:false};
  $('enemy').classList.remove('faint');
  $('player').classList.remove('faint');
  $('effect').className='';
  $('enemy').src=foe.image;
  $('enemy').alt=foe.title+' '+foe.name;
  document.querySelector('.enemy-status .name').innerHTML=foe.name+' <span class="male">'+(foe.gender||'♂')+'</span><span class="level">Lv.50</span>';
  document.querySelector('.status-foot').textContent=foe.title;
  say(foe.title+' '+foe.name+'が あらわれた！ マタサブロウは どうする？','YOUR TURN');
  render();
}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function animate(id,cls){$(id).classList.remove(cls);void $(id).offsetWidth;$(id).classList.add(cls);setTimeout(()=>$(id).classList.remove(cls),600)}
function finish(won){
  state.over=true;state.busy=false;$(won?'enemy':'player').classList.add('faint');
  const enemyId=Object.keys(enemies).find(key=>enemies[key]===state.foe)||null;
  const winText = won
    ? (enemyId==='subaru'
        ? 'すばるを たおした！\n「次のChill Smokeオーナーは君だ」\n\nクリックでマップへ戻る'
        : state.foe.name+'を たおした！ マップへ戻ります。')
    : 'マタサブロウは たおれた…。ひと休みして マップへ戻ります。';
  say(winText,won?'YOU WIN!':'BATTLE OVER');
  if(won)window.GunmaAudio?.playVictory?.();
  tone(won?880:160);render();
  document.dispatchEvent(new CustomEvent('battle-finished',{detail:{won,enemyId}}));
}
function healSide(side,amount){const before=state[side];state[side]=Math.min(180,state[side]+amount);return state[side]-before}
function applyEnemyMove(opponent){
  const kind=opponent.kind||(opponent.damage?'damage':'status');
  if(opponent.sfx)window.GunmaAudio?.playSfx?.(opponent.sfx);
  if(opponent.effect)animate('effect',opponent.effect);
  if(kind==='damage'){
    const damage=opponent.damage||0;
    state.player=Math.max(0,state.player-damage);
    if(damage)animate('player','hit');
    say(opponent.text||'マタサブロウは '+damage+' ダメージを うけた！');
    return;
  }
  if(kind==='self-heal'){
    const healed=healSide('enemy',opponent.heal||45);
    animate('enemy','heal');
    say(opponent.text+(healed?' HPが '+healed+' かいふくした！':' しかし HPは まんたんだ！'));
    return;
  }
  if(kind==='target-heal'){
    const healed=healSide('player',opponent.heal||45);
    animate('player','heal');
    say(opponent.text+(healed?' マタサブロウの HPが '+healed+' かいふくした！':' しかし HPは まんたんだ！'));
    return;
  }
  if(kind==='self-damage'){
    const damage=Math.min(state.enemy,opponent.damage||0);
    state.enemy=Math.max(0,state.enemy-damage);
    if(damage)animate('enemy','hit');
    say(opponent.text+(damage?' '+state.foe.name+'は '+damage+' ダメージを うけた！':''));
    return;
  }
  if(kind==='ohko'){
    const hit=Math.random()<(opponent.accuracy??0.2);
    if(hit){
      state.player=0;
      animate('player','hit');
      say(opponent.hitText||state.foe.name+'の '+opponent.name+'！ いちげき ひっさつ！');
    }else{
      say(opponent.missText||state.foe.name+'の '+opponent.name+'！ しかし あたらなかった！');
    }
    return;
  }
  say(opponent.text||state.foe.name+'は ようすを みている…');
}
async function turn(i){
  if(state.busy||state.over||!state.pp[i])return;
  const ticket=epoch,m=definitions[i];
  state.busy=true;state.pp[i]--;render();say('マタサブロウの '+m.name+'！','YOUR MOVE');tone(m.power?520:740);animate('player',m.power?'attack':'heal');
  await delay(650); if(ticket!==epoch)return;
  if(m.power){
    const damage=m.power+Math.floor(Math.random()*8);
    state.enemy=Math.max(0,state.enemy-damage);
    animate('enemy','hit');
    if(m.css)animate('effect',m.css==='water'?'water-effect':'fight-effect');
    say(state.foe.name+'に '+damage+' ダメージ！');
  }else{
    let n=Math.min(45,180-state.player); state.player+=n;
    say(n?'リラックスして HPが '+n+' かいふくした！':'HPは まんたんだ！');
  }
  render();
  await delay(950); if(ticket!==epoch)return;
  if(!state.enemy){finish(true);return}
  const opponent=state.foe.moves[(state.turn-1)%state.foe.moves.length];
  say(state.foe.name+'の '+opponent.name+'！','ENEMY TURN');
  animate('enemy','attack'); tone(opponent.kind==='status'?430:260);
  await delay(650); if(ticket!==epoch)return;
  applyEnemyMove(opponent); render();
  await delay(850); if(ticket!==epoch)return;
  if(!state.enemy){finish(true);return}
  if(!state.player){finish(false);return}
  state.turn++; state.busy=false;
  if(state.pp.every(p=>p===0)){
    state.pp=definitions.map(m=>m.pp);
    say('ひと息ついて PPが かいふくした！ つぎの技は？','YOUR TURN');
  }else say('マタサブロウは どうする？','YOUR TURN');
  render();
}
$('retry').onclick=reset;$('reset').onclick=reset;reset();
