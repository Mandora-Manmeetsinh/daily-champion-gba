// Daily Champion UI (GBA edition). Needs engine.js loaded first.
const $=s=>document.querySelector(s);

// ---------- storage ----------
const store={mem:null,get(){try{const r=localStorage.getItem('dailychampion.v1');return r?JSON.parse(r):null}catch(e){return this.mem}},
  set(v){try{localStorage.setItem('dailychampion.v1',JSON.stringify(v))}catch(e){this.mem=v}}};
const DEF=()=>({stats:{played:0,wins:0,winStreak:0,best:0,dayStreak:0,lastDay:0},daily:{},cur:null,badges:{},ach:{},history:[],
  settings:{sound:true,speed:'normal',hints:false,anim:true},trainer:{name:'TRAINER'},gauntlet:{best:0,runs:0,clears:0}});
let DB=(()=>{const d=DEF(),s=store.get()||{};
  Object.keys(d).forEach(k=>{const dv=d[k];
    if(dv&&typeof dv==='object'&&!Array.isArray(dv)&&s[k]&&typeof s[k]==='object')d[k]=Object.assign(dv,s[k]);
    else if(s[k]!==undefined)d[k]=s[k];});
  return d})();
function persist(){store.set(DB)}
const RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const animOn=()=>DB.settings.anim&&!RM;

// ---------- day / state ----------
function todayNo(){const d=new Date();const n=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(2026,9,13))/864e5)+1;return Math.max(1,n)}
let DAY=todayNo(),T=dayInfo(DAY);
const UI={view:'home',tab:'daily',lead:0,pr:null,gr:null,S:null,menu:'main',playing:false,skip:false,playId:0,cancelSay:null,cur:{p:-1,o:-1},res:null,pickItem:false,resetArm:false};
const rndSeed=()=>(Math.random()*4294967296)>>>0;
function newPractice(c){UI.pr={champ:c==null?(T.champ+1)%CHAMPS.length:c,team:pickTeam(Math.random),lead:0}}
function newGTeam(){UI.gr={team:pickTeam(Math.random),lead:0}}
newPractice();newGTeam();

// ---------- helpers ----------
function lum(hex){const n=parseInt(hex.slice(1),16),f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(n>>16&255)+.7152*f(n>>8&255)+.0722*f(n&255)}
const inkFor=hex=>lum(hex)>0.3?'#0B0B14':'#FFFFFF';
function setAccent(c){const r=document.documentElement.style;r.setProperty('--accent',c.color);r.setProperty('--accent-ink',inkFor(c.color))}
const chip=t=>`<span class="chip" style="background:${TC[t]};color:${inkFor(TC[t])}">${t}</span>`;
const chipS=t=>`<span style="background:${TC[t]};color:${inkFor(TC[t])}">${t.slice(0,3).toUpperCase()}</span>`;
const pct=(h,m)=>Math.round(h/m*100);
const hpCls=p=>p>50?'':p>20?'mid':'lo';
const modeName={daily:'Daily',practice:'Practice',gauntlet:'Gauntlet'};

// sprites: files in ./sprites, or inlined data in window.SPRITES (standalone build)
function spriteURL(id,kind){return (window.SPRITES&&window.SPRITES[kind]&&window.SPRITES[kind][id])||`sprites/${kind}/${id}.png`}
function placeholder(d){
  const c=d.types.map(t=>TC[t]),ini=d.name.replace(/^Alolan /,'').replace(/[^A-Za-z]/g,'').slice(0,2);
  return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset=".5" stop-color="${c[0]}"/><stop offset=".5" stop-color="${c[1]||c[0]}"/></linearGradient></defs><rect x="8" y="8" width="80" height="80" rx="14" fill="url(#g)"/><circle cx="48" cy="48" r="28" fill="#fff"/><text x="48" y="58" font-size="28" font-family="monospace" font-weight="700" text-anchor="middle" fill="#222">${ini}</text></svg>`);
}
function spriteFail(img,k){img.onerror=null;img.src=placeholder(DEX[k])}
const thumb=(k,s,kind)=>`<img class="px thumb" style="width:${s}px;height:${s}px" src="${spriteURL(DEX[k].id,kind||'front')}" alt="${DEX[k].name}" onerror="spriteFail(this,'${k}')">`;

function monCard(m,o){
  o=o||{};
  const inner=`${thumb(m.k,64)}<div><div class="nm">${m.name}${o.lead?'<span class="tag">Lead</span>':''}</div><div class="chips">${m.types.map(chip).join('')}</div></div>
  <div class="statline">${[['HP',m.st.hp],['Atk',m.st.atk],['Def',m.st.def],['SpA',m.st.spa],['SpD',m.st.spd],['Spe',m.st.spe]].map(x=>`<span><b>${x[1]}</b>${x[0]}</span>`).join('')}</div>
  <div class="mvlist">${m.moves.map(v=>`<span class="mvl"><i style="background:${TC[v.type]}"></i>${v.name}</span>`).join('')}</div>`;
  return o.btn?`<button class="mon${o.lead?' lead':''}" data-act="lead" data-i="${o.i}" aria-pressed="${!!o.lead}">${inner}</button>`:`<div class="mon">${inner}</div>`;
}
const miniCard=m=>`<div class="mon" style="padding:10px">${thumb(m.k,56)}<div><div class="nm">${m.name}</div><div class="chips">${m.types.map(chip).join('')}</div></div></div>`;

// ---------- achievements ----------
const ACH=[
  {id:'first_win',name:'Rookie Victory',desc:'Beat any champion.',t:r=>r.won},
  {id:'flawless',name:'Flawless',desc:'Win without losing a single Pokémon.',t:r=>r.won&&r.faints===0},
  {id:'close_call',name:'Close Call',desc:'Win with just one Pokémon standing.',t:r=>r.won&&r.p.filter(Boolean).length===1},
  {id:'speedy',name:'Speed Run',desc:'Win in 10 turns or fewer.',t:r=>r.won&&r.turns<=10},
  {id:'crit_trio',name:'Lucky Streak',desc:'Land 3 critical hits in one battle.',t:r=>r.crits>=3},
  {id:'pure',name:'Pure Skill',desc:'Win a daily battle without using a Potion.',t:r=>r.won&&r.mode==='daily'&&r.potions===0},
  {id:'streak3',name:'On a Roll',desc:'Win 3 daily battles in a row.',t:()=>DB.stats.winStreak>=3},
  {id:'week',name:'Regular',desc:'Play 7 daily battles.',t:()=>DB.stats.played>=7},
  {id:'badges6',name:'Half the League',desc:'Earn 6 champion badges.',t:()=>Object.keys(DB.badges).length>=6},
  {id:'badges12',name:'Grand Master',desc:'Earn all 12 champion badges.',t:()=>Object.keys(DB.badges).length>=12},
  {id:'gaunt6',name:'Gauntlet Veteran',desc:'Beat 6 champions in one Gauntlet.',t:()=>DB.gauntlet.best>=6},
  {id:'gaunt12',name:'Undefeated',desc:'Clear the full Gauntlet.',t:()=>DB.gauntlet.best>=12}
];

// ---------- result bookkeeping ----------
function finalize(S){
  const rec=makeRec(S),mode=S.mode,now=Date.now();
  const res={rec,mode,newAch:[],newBadge:false,more:false,beaten:0};
  if(rec.won){const had=!!DB.badges[rec.champ];const b=DB.badges[rec.champ]||(DB.badges[rec.champ]={first:now,wins:0});b.wins++;res.newBadge=!had}
  if(mode==='daily'){
    const st=DB.stats;st.played++;
    if(rec.won){st.wins++;st.winStreak++;st.best=Math.max(st.best,st.winStreak)}else st.winStreak=0;
    st.dayStreak=st.lastDay===S.day-1?st.dayStreak+1:1;st.lastDay=S.day;
    DB.daily[S.day]=rec;DB.cur=null;
  }
  if(mode==='gauntlet'){
    const g=S.gauntlet,beaten=g.pos+(rec.won?1:0);res.beaten=beaten;
    DB.gauntlet.best=Math.max(DB.gauntlet.best,beaten);
    if(rec.won&&g.pos<g.order.length-1)res.more=true;
    else{DB.gauntlet.runs++;if(beaten===g.order.length)DB.gauntlet.clears++}
  }
  if(!res.more){DB.history.unshift({champ:rec.champ,won:rec.won,turns:rec.turns,mode,ts:now,beaten:res.beaten});DB.history=DB.history.slice(0,15)}
  ACH.forEach(a=>{if(!DB.ach[a.id]&&a.t(rec)){DB.ach[a.id]=now;res.newAch.push(a)}});
  persist();
  return res;
}

function shareText(rec,mode,extra){
  const ch=CHAMPS[rec.champ];
  const you=rec.p.map(x=>x?'🟩':'🟥').join(''),them=rec.o.map(x=>x?'⬜':'⬛').join('');
  let t=mode==='gauntlet'?`Daily Champion Gauntlet\n${extra&&extra.beaten===12?'🏆 Cleared all 12':'💀 Beat '+(extra?extra.beaten:0)+' of 12'} champions`
    :`Daily Champion${mode==='daily'?' No. '+rec.day:' practice'} vs ${ch.name} (${ch.region})\n${rec.won?'🏆 Won':'💀 Lost'} in ${rec.turns} turns${rec.potions?' 🧪'+rec.potions:''}`;
  t+=`\nYou   ${you}\nThem ${them}`;
  if(mode==='daily'&&/^https?:/.test(location.href))t+='\n'+location.href;
  return t;
}
function resultCard(rec,mode,extra){
  const ch=CHAMPS[rec.champ],left=rec.p.filter(Boolean).length;
  return `<section class="res box"><h2>${rec.won?'You beat '+ch.name+'!':ch.name+' takes this one'}</h2>
  <p>${rec.won?`Cleared in ${rec.turns} turns with ${left} of your six standing.`:`You fell after ${rec.turns} turns and took out ${rec.o.filter(x=>!x).length} of ${ch.name}'s six.`} ${rec.crits?`Crits: ${rec.crits}. `:''}${rec.potions?`Potions used: ${rec.potions}.`:''}</p>
  <div class="sharebox" id="sharetext">${shareText(rec,mode,extra)}</div>
  <div class="row"><button class="btn primary" data-act="share">Copy result</button></div></section>`;
}

// ---------- home views ----------
const tabsHTML=()=>`<div class="tabs" role="tablist">${[['daily','Today'],['practice','Practice'],['gauntlet','Gauntlet'],['trainer','Trainer']].map(t=>`<button role="tab" data-act="tab" data-v="${t[0]}" aria-selected="${UI.tab===t[0]}">${t[1]}</button>`).join('')}</div>`;
const rosterHTML=(sel,interactive)=>`<div class="roster">${CHAMPS.map((c,i)=>`<button class="rc${i===sel?' on':''}" style="--c:${c.color}" ${interactive?`data-act="pick-champ" data-i="${i}"`:'disabled style="--c:'+c.color+'"'}><i class="dot"></i><b>${c.name}</b><span>${c.region}</span>${DB.badges[i]?'<em class="star" style="font-style:normal">★</em>':''}</button>`).join('')}</div>`;
const infoSection=()=>`
  <section class="sec"><h2>How to play</h2>
    <ol class="how"><li>Check the champion's six and your six. Pick the lead that matches up best against their opener.</li>
    <li>Each turn, use an attack, a Potion, or switch Pokémon. Items and switching cost your turn.</li>
    <li>Faster Pokémon move first. Super effective hits do double damage, and matching your Pokémon's own type adds a bonus.</li>
    <li>Knock out all six of the champion's Pokémon to win, earn their badge, and copy your result grid to share.</li></ol></section>
  <section class="sec"><h2>Questions</h2>
    <details><summary>Is everyone's daily battle the same?</summary><p>Yes. Everyone gets the same champion, the same six and the same random rolls. Make the same choices as a friend and you get the same outcome.</p></details>
    <details><summary>When does the next battle unlock?</summary><p>At midnight in your own time zone.</p></details>
    <details><summary>Can I play more than once a day?</summary><p>Only one official battle counts. Practice runs and the Gauntlet are unlimited and never touch your daily streaks. If you leave a daily battle midway, it waits for you on this device.</p></details>
    <details><summary>What are Potions?</summary><p>Each battle you carry 2 Potions (4 in the Gauntlet). One heals 120 HP on any Pokémon in your party and uses your turn.</p></details>
    <details><summary>How do battles work under the hood?</summary><p>A simplified engine: level 100, the same stat training on both sides, the full 18-type chart, same-type bonus, critical hits and damage rolls. There are no abilities or status moves. Each Pokémon knows four attacks picked from its types plus coverage, and the last slot is a risky heavy hitter.</p></details>
    <details><summary>Where is my progress saved?</summary><p>In this browser only. Clearing site data or switching devices starts you fresh.</p></details>
  </section>`;

function homeHTML(){
  if(UI.tab==='trainer')return tabsHTML()+trainerHTML();
  if(UI.tab==='gauntlet')return gauntletHTML();
  const prac=UI.tab==='practice';
  const ci=prac?UI.pr.champ:T.champ,ch=CHAMPS[ci];
  const keys=prac?UI.pr.team:T.team,lead=prac?UI.pr.lead:UI.lead;
  setAccent(ch);
  const done=!prac&&DB.daily[DAY];
  const resumable=!prac&&DB.cur&&DB.cur.day===DAY&&!done;
  const dateStr=new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
  const st=DB.stats;
  let action;
  if(done)action=(done.team?'':'')+resultCard(done,'daily')+`<p class="note" style="margin-top:10px">Next champion in <b data-cd>--:--:--</b>. Practice and the Gauntlet are open any time.</p>`;
  else action=`<div class="row"><button class="btn primary" data-act="${prac?'start-practice':'start'}">${resumable?'Resume today\'s battle':prac?'Start practice battle':'Start today\'s battle'}</button>${prac?'<button class="btn" data-act="reroll">Reroll my six</button>':''}</div>`;
  return tabsHTML()+`
  <section class="hero">
    <div class="pills">${prac?'<span class="pill">Practice run</span>':`<span class="pill">No. ${DAY}</span><span class="pill">${dateStr}</span><span class="pill">Next in <span data-cd>--:--:--</span></span>`}</div>
    <h1>${ch.name}</h1>
    <p>${ch.sub}. ${prac?'Pick any champion and fight them with a random six. No daily streaks, unlimited rematches.':'Beat their six with the six everyone gets today. One official battle per day.'}</p>
    <div class="herosp">${ch.team.map(k=>thumb(k,56)).join('')}</div>
  </section>
  <section class="sec"><h2>Champions from every region</h2>
    <p class="lede">${prac?'Tap any champion to face them. A star means you already hold their badge.':'Today\'s official champion is highlighted. Tap any champion to battle them in practice instead.'}</p>
    ${rosterHTML(ci,true)}</section>
  <section class="sec"><h2>${ch.name}'s team</h2><p class="lede">Six Pokémon, level 100, always sent out in this order. ${ch.name} always picks the move that hits hardest.</p>
    <div class="grid">${ch.team.map(k=>miniCard(makeMon(k))).join('')}</div></section>
  <section class="sec"><h2>${prac?'Your practice six':'Your six today'}</h2><p class="lede">${done?'Today\'s official battle is finished. Here is the team you had.':'Every Pokémon knows four attacks. Tap one to make it your lead.'}</p>
    <div class="grid">${keys.map((k,i)=>monCard(makeMon(k),{btn:!done,lead:i===lead,i})).join('')}</div></section>
  <section class="sec">${action}</section>
  ${prac?'':`<section class="sec"><h2>Your record</h2><div class="statrow">
    <div class="stat box"><b>${st.played}</b><span>Played</span></div>
    <div class="stat box"><b>${st.played?Math.round(st.wins/st.played*100):0}%</b><span>Win rate</span></div>
    <div class="stat box"><b>${st.winStreak}</b><span>Win streak</span></div>
    <div class="stat box"><b>${st.dayStreak}</b><span>Day streak</span></div></div></section>`}
  ${infoSection()}`;
}

function gauntletHTML(){
  setAccent({color:'#F2C14E'});
  const g=DB.gauntlet;
  return tabsHTML()+`
  <section class="hero">
    <div class="pills"><span class="pill">Best ${g.best} of 12</span><span class="pill">Clears ${g.clears}</span><span class="pill">Runs ${g.runs}</span></div>
    <h1 class="sm">Champion Gauntlet</h1>
    <p>Face all 12 champions back to back, in a random order, with one team. Your Pokémon don't heal between fights, and you carry 4 Potions for the whole run.</p>
  </section>
  <section class="sec"><h2>The 12 champions</h2><p class="lede">Beat any of them to earn their badge. A star means you hold it.</p>${rosterHTML(-1,false)}</section>
  <section class="sec"><h2>Your Gauntlet six</h2><p class="lede">Reroll as many times as you like to find a team you trust, then pick a lead.</p>
    <div class="grid">${UI.gr.team.map((k,i)=>monCard(makeMon(k),{btn:true,lead:i===UI.gr.lead,i})).join('')}</div></section>
  <section class="sec"><div class="row"><button class="btn primary" data-act="start-gauntlet">Start the Gauntlet</button><button class="btn" data-act="reroll">Reroll my six</button></div></section>
  ${infoSection()}`;
}

function trainerHTML(){
  setAccent({color:'#9b8cff'});
  const st=DB.stats,S_=DB.settings,nb=Object.keys(DB.badges).length,na=Object.keys(DB.ach).length;
  const seg=(k,opts)=>`<div class="seg">${opts.map(o=>`<button class="btn sm" data-act="set" data-k="${k}" data-v="${o[0]}" aria-pressed="${String(S_[k])===String(o[0])}">${o[1]}</button>`).join('')}</div>`;
  return `
  <section class="hero"><h1 class="sm">Trainer card</h1>
    <p>Badges, achievements, recent battles and settings. Everything is saved in this browser.</p></section>
  <section class="sec box set"><div class="line"><label for="trainerName">Trainer name</label><input class="name" id="trainerName" maxlength="12" value="${esc(DB.trainer.name)}" autocomplete="off"></div></section>
  <section class="sec"><h2>Daily record</h2><div class="statrow">
    <div class="stat box"><b>${st.played}</b><span>Played</span></div>
    <div class="stat box"><b>${st.played?Math.round(st.wins/st.played*100):0}%</b><span>Win rate</span></div>
    <div class="stat box"><b>${st.best}</b><span>Best win streak</span></div>
    <div class="stat box"><b>${DB.gauntlet.best}/12</b><span>Gauntlet best</span></div></div></section>
  <section class="sec"><h2>Badge case (${nb}/12)</h2><div class="badges">${CHAMPS.map((c,i)=>`<div class="badge${DB.badges[i]?' on':''}" style="--c:${c.color}"><i>${c.name[0]}</i><span>${c.name}</span></div>`).join('')}</div></section>
  <section class="sec"><h2>Achievements (${na}/${ACH.length})</h2><div class="achs">${ACH.map(a=>`<div class="ach${DB.ach[a.id]?' on':''}"><b>${a.name}</b><span>${a.desc}</span></div>`).join('')}</div></section>
  <section class="sec"><h2>Recent battles</h2>${DB.history.length?`<ul class="hist">${DB.history.map(h=>`<li class="box"><span class="${h.won?'w':'l'}">${h.won?'WIN':'LOSS'}</span><b>${h.mode==='gauntlet'?'Gauntlet, '+(h.beaten||0)+' beaten':CHAMPS[h.champ].name}</b><small>${modeName[h.mode]||h.mode}, ${h.turns} turns, ${new Date(h.ts).toLocaleDateString()}</small></li>`).join('')}</ul>`:'<p class="lede">No battles yet. Go beat a champion.</p>'}</section>
  <section class="sec"><h2>Settings</h2><div class="box set">
    <div class="line"><span>Sound effects</span>${seg('sound',[[true,'On'],[false,'Off']])}</div>
    <div class="line"><span>Text speed</span>${seg('speed',[['slow','Slow'],['normal','Normal'],['fast','Fast']])}</div>
    <div class="line"><span>Battle animations</span>${seg('anim',[[true,'On'],[false,'Off']])}</div>
    <div class="line"><span>Type hints on moves</span>${seg('hints',[[true,'On'],[false,'Off']])}</div>
    <div class="line"><span>Erase all progress</span><button class="btn sm" data-act="reset">${UI.resetArm?'Tap again to confirm':'Reset'}</button></div>
  </div></section>`;
}

// ---------- sound (WebAudio, no files) ----------
const SFX={ctx:null,
  init(){if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume();return}try{const A=window.AudioContext||window.webkitAudioContext;if(A)this.ctx=new A()}catch(e){}},
  tone(f,d,type,v,to,delay){const c=this.ctx;if(!c)return;const t=c.currentTime+(delay||0),o=c.createOscillator(),g=c.createGain();
    o.type=type||'square';o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);
    g.gain.setValueAtTime(v||.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+.02)},
  noise(d,v,delay){const c=this.ctx;if(!c)return;const n=Math.floor(c.sampleRate*d),b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);
    for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const s=c.createBufferSource(),g=c.createGain();g.gain.value=v||.08;s.buffer=b;s.connect(g);g.connect(c.destination);s.start(c.currentTime+(delay||0))},
  play(n){
    if(!DB.settings.sound||!this.ctx)return;
    switch(n){
      case 'select':this.tone(880,.06,'square',.035);break;
      case 'text':this.tone(640,.02,'square',.012);break;
      case 'hit':this.noise(.14,.09);this.tone(180,.12,'square',.05,70);break;
      case 'super':this.noise(.18,.12);this.tone(320,.22,'sawtooth',.06,90);break;
      case 'weak':this.noise(.08,.05);this.tone(150,.1,'square',.03,100);break;
      case 'crit':this.noise(.22,.14);this.tone(900,.16,'square',.06,200);break;
      case 'faint':this.tone(440,.5,'square',.06,60);break;
      case 'heal':[523,659,784].forEach((f,i)=>this.tone(f,.12,'square',.045,0,i*.09));break;
      case 'switch':this.tone(300,.14,'triangle',.06,900);break;
      case 'win':[523,659,784,1047,784,1047].forEach((f,i)=>this.tone(f,.16,'square',.05,0,i*.13));break;
      case 'lose':[392,330,262,196].forEach((f,i)=>this.tone(f,.28,'square',.05,0,i*.26));break;
    }
  }};

// ---------- battle scene ----------
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const snapOf=S=>({pa:S.pa,oa:S.oa,pHp:S.p[S.pa].hp,oHp:S.o[S.oa].hp});
const infoBox=s=>`<div class="info ${s}"><div class="r1"><b id="${s}-name"></b><span>Lv100</span></div><div class="tys" id="${s}-types"></div><div class="hpl"><i>HP</i><div class="hpbar"><span class="fill" id="${s}-fill"></span></div></div><div class="hpn" id="${s}-num"></div><div class="bench" id="${s}-bench"></div></div>`;
function battleHTML(){
  const S=UI.S,ch=CHAMPS[S.champ];setAccent(ch);
  const label=S.mode==='daily'?`Daily No. ${S.day} vs ${ch.name}`:S.gauntlet?`Gauntlet ${S.gauntlet.pos+1} of 12 vs ${ch.name}`:`Practice vs ${ch.name}`;
  return `<div class="row" style="max-width:720px;margin:6px auto 12px"><button class="btn sm" data-act="home">${S.mode==='daily'?'Pause':'Leave'}</button><span class="note">${label}</span></div>
  <div class="gba"><div class="screen" id="screen" data-arena="${ch.arena}" aria-label="Battle screen. Tap to skip animations.">
    <div class="bg"></div><div class="plat o"></div><div class="plat p"></div>
    <img class="spr o px" id="spr-o" alt=""><img class="spr p px" id="spr-p" alt="">
    <div id="fx"></div>${infoBox('o')}${infoBox('p')}
    <div class="dialog"><span id="dlg"></span></div></div></div>
  <div class="ctl" id="ctl"></div>`;
}
function benchHTML(side,sn){
  const S=UI.S,ai=side==='p'?sn.pa:sn.oa,ah=side==='p'?sn.pHp:sn.oHp;
  return S[side].map((m,i)=>`<i class="${(i===ai?ah:m.hp)>0?'':'ko'}"></i>`).join('');
}
function setSprite(side,idx,hidden){
  const m=UI.S[side][idx],el=$('#spr-'+side);if(!el)return;
  el.className='spr '+side+' px'+(hidden?' gone':'');
  el.onerror=()=>{el.onerror=null;el.src=placeholder(DEX[m.k])};
  el.src=spriteURL(m.id,side==='p'?'back':'front');el.alt=m.name;
  UI.cur[side]=idx;
}
function setInfo(side,m,hp,sn){
  if(!$('#'+side+'-name'))return;
  $('#'+side+'-name').textContent=m.name;
  $('#'+side+'-types').innerHTML=m.types.map(chipS).join('');
  const p=pct(hp,m.max),f=$('#'+side+'-fill');f.style.width=p+'%';f.className='fill '+hpCls(p);
  $('#'+side+'-num').textContent=side==='p'?hp+'/'+m.max:'';
  $('#'+side+'-bench').innerHTML=benchHTML(side,sn);
}
function syncScene(){
  const S=UI.S,sn=snapOf(S);
  ['p','o'].forEach(side=>{
    const idx=side==='p'?S.pa:S.oa,m=S[side][idx];
    setSprite(side,idx,false);setInfo(side,m,m.hp,sn);
    if(m.hp<=0)$('#spr-'+side).classList.add('fainted');
  });
}
function applySnap(sn,fx){
  const S=UI.S;
  ['p','o'].forEach(side=>{
    const idx=side==='p'?sn.pa:sn.oa,hp=side==='p'?sn.pHp:sn.oHp;
    if(UI.cur[side]!==idx)setSprite(side,idx,!!(fx&&fx.k==='in'&&fx.side===side));
    setInfo(side,S[side][idx],hp,sn);
  });
}
function prompt(){const S=UI.S,el=$('#dlg');if(!el)return;el.textContent=S.phase==='forced'?'Choose your next Pokémon.':`What will ${S.p[S.pa].name} do?`}

// ---------- controls ----------
function moveBtn(v,i,foe){
  let h='';
  if(DB.settings.hints){const m=effOf(v.type,foe.types);
    if(m===0)h='<span class="eff no">NO EFFECT</span>';else if(m>1)h=`<span class="eff up">x${m}</span>`;else if(m<1)h=`<span class="eff dn">x${m===.5?'1/2':'1/4'}</span>`}
  return `<button class="mv" style="--t:${TC[v.type]}" data-act="move" data-i="${i}"><span class="n">${v.name}</span><span class="m">${chip(v.type)}<span>Power ${v.pow}</span><span>${v.acc}%</span><span>${v.phys?'Phys':'Spec'}</span>${h}<kbd>${i+1}</kbd></span></button>`;
}
function partyHTML(mode){
  const S=UI.S;
  return `<div class="party">${S.p.map((m,i)=>{
    const p=pct(m.hp,m.max),ok=mode==='item'?(m.hp>0&&m.hp<m.max):(m.hp>0&&i!==S.pa);
    return `<button class="prow${i===S.pa?' cur':''}" data-act="${mode==='item'?'use-item':'switch'}" data-i="${i}" ${ok?'':'disabled'}><img class="px" src="${spriteURL(m.id,'front')}" alt="" onerror="spriteFail(this,'${m.k}')"><span><b>${m.name}${i===S.pa?' (out)':''}</b><span class="hpbar"><span class="fill ${hpCls(p)}" style="width:${p}%"></span></span></span><small>${m.hp>0?m.hp+'/'+m.max:'Fainted'}</small></button>`}).join('')}</div>`;
}
function ctlHTML(){
  const S=UI.S;
  if(UI.playing)return `<div class="skiphint">Tap the screen or press Space to skip.</div>`;
  if(S.phase==='forced')return `<div class="box menu"><h3 class="prompt">Choose your next Pokémon</h3>${partyHTML('switch')}</div>`;
  const pm=S.p[S.pa],foe=S.o[S.oa],back=m=>`<button class="btn sm" data-act="menu" data-m="${m}">Back</button>`;
  if(UI.menu==='fight')return `<div class="box menu"><div class="movegrid">${pm.moves.map((v,i)=>moveBtn(v,i,foe)).join('')}</div>${back('main')}</div>`;
  if(UI.menu==='party')return `<div class="box menu"><h3 class="prompt">Switch Pokémon</h3>${partyHTML('switch')}${back('main')}</div>`;
  if(UI.menu==='bag'){const can=S.bag>0&&S.p.some(m=>m.hp>0&&m.hp<m.max);
    return `<div class="box menu"><h3 class="prompt">Bag</h3><button class="mbtn" data-act="item" ${can?'':'disabled'}>POTION x${S.bag}</button><p class="note">Heals ${POTION_HEAL} HP on one Pokémon and uses your turn.</p>${back('main')}</div>`}
  if(UI.menu==='target')return `<div class="box menu"><h3 class="prompt">Use Potion on</h3>${partyHTML('item')}${back('bag')}</div>`;
  return `<div class="box menu"><p class="prompt">What will ${pm.name} do?</p><div class="menu2"><button class="mbtn" data-act="menu" data-m="fight">FIGHT</button><button class="mbtn" data-act="menu" data-m="bag">BAG</button><button class="mbtn" data-act="menu" data-m="party">POKéMON</button><button class="mbtn" data-act="home">EXIT</button></div><p class="note">Keys: 1-4 attack, F fight, B bag, P party, Esc back.</p></div>`;
}
function renderControls(){const el=$('#ctl');if(el)el.innerHTML=ctlHTML()}

// ---------- playback ----------
const SPEED={slow:{ch:40,pause:650},normal:{ch:18,pause:340},fast:{ch:6,pause:120}};
const wait=ms=>new Promise(r=>{if(UI.skip||ms<=0)return r();const t0=Date.now(),iv=setInterval(()=>{if(UI.skip||Date.now()-t0>=ms){clearInterval(iv);r()}},30)});
function say(msg){
  return new Promise(res=>{
    const el=$('#dlg');if(!el)return res();
    if(UI.skip){el.textContent=msg;return res()}
    const sp=SPEED[DB.settings.speed]||SPEED.normal;let i=0,done=false;
    const t=setInterval(()=>{i++;el.textContent=msg.slice(0,i);if(i%3===0)SFX.play('text');
      if(i>=msg.length){clearInterval(t);if(!done){done=true;UI.cancelSay=null;wait(sp.pause).then(res)}}},sp.ch);
    UI.cancelSay=()=>{if(done)return;done=true;clearInterval(t);el.textContent=msg;UI.cancelSay=null;res()};
  });
}
function burst(side,type){const d=document.createElement('div');d.className='burst '+side;d.style.setProperty('--c',TC[type]||'#fff');$('#fx').appendChild(d);setTimeout(()=>d.remove(),520)}
function shake(){const s=$('#screen');if(!s)return;s.classList.remove('shake');void s.offsetWidth;s.classList.add('shake');setTimeout(()=>s.classList.remove('shake'),400)}
function plus(){const fx=$('#fx');for(let i=0;i<3;i++)setTimeout(()=>{const d=document.createElement('div');d.className='plus';d.textContent='+';d.style.left=(14+Math.random()*22)+'%';d.style.top=(42+Math.random()*16)+'%';fx.appendChild(d);setTimeout(()=>d.remove(),750)},i*120)}
async function runFx(f){
  const el=$('#spr-'+f.side);if(!el)return;
  if(!animOn()||UI.skip){
    if(f.k==='faint')el.classList.add('fainted');
    if(f.k==='out')el.classList.add('gone');
    if(f.k==='in')el.classList.remove('gone');
    return wait(f.k==='hit'||f.k==='faint'?220:0);
  }
  const cls=(c,ms)=>{el.classList.remove(c);void el.offsetWidth;el.classList.add(c);setTimeout(()=>el.classList.remove(c),ms+30)};
  switch(f.k){
    case 'lunge':SFX.play('select');cls('lunge-'+f.side,240);await wait(240);break;
    case 'hit':SFX.play(f.crit?'crit':f.m>1?'super':f.m<1?'weak':'hit');burst(f.side,f.type);cls('hit',440);if(f.crit||f.m>1)shake();await wait(440);break;
    case 'faint':SFX.play('faint');el.classList.add('fainted');await wait(520);break;
    case 'out':SFX.play('switch');el.classList.add('popout');await wait(320);el.classList.remove('popout');el.classList.add('gone');break;
    case 'in':el.classList.remove('gone');SFX.play('switch');cls('popin',360);await wait(380);break;
    case 'heal':SFX.play('heal');plus();cls('heal',520);await wait(520);break;
    case 'miss':await wait(160);break;
  }
}
async function playEvents(evs){
  const id=++UI.playId;UI.playing=true;UI.skip=false;renderControls();
  for(const e of evs){
    if(id!==UI.playId)return;
    applySnap(e.snap,e.fx);
    if(e.fx&&e.fx.after){if(e.msg)await say(e.msg);if(id!==UI.playId)return;await runFx(e.fx)}
    else{if(e.fx)await runFx(e.fx);if(id!==UI.playId)return;if(e.msg)await say(e.msg)}
  }
  if(id!==UI.playId)return;
  endPlay();
}
function skipPlay(){if(!UI.playing)return;UI.skip=true;if(UI.cancelSay)UI.cancelSay()}
function endPlay(){
  UI.playing=false;UI.skip=false;UI.cancelSay=null;
  const S=UI.S;syncScene();
  if(S.phase==='over'){
    const res=UI.res;
    if(res.more){advanceGauntlet(S);startIntro(S,true);return}
    UI.view='result';render();window.scrollTo(0,0);SFX.play(res.rec.won?'win':'lose');return;
  }
  UI.menu=S.phase==='forced'?'party':'main';
  prompt();renderControls();
}
async function startIntro(S,gaunt){
  UI.S=S;UI.view='battle';UI.menu='main';UI.playing=true;UI.skip=false;UI.cur={p:-1,o:-1};
  const id=++UI.playId;
  render();
  const sn=snapOf(S);
  setSprite('o',S.oa,true);setInfo('o',S.o[S.oa],S.o[S.oa].hp,sn);
  setSprite('p',S.pa,!gaunt);setInfo('p',S.p[S.pa],S.p[S.pa].hp,sn);
  const lines=gaunt?S.log.slice(-2):S.log.slice(0,3);
  await say(lines[0]);if(id!==UI.playId)return;
  await runFx({k:'in',side:'o'});if(id!==UI.playId)return;
  await say(lines[1]);if(id!==UI.playId)return;
  if(!gaunt){await runFx({k:'in',side:'p'});if(id!==UI.playId)return;await say(lines[2]);if(id!==UI.playId)return}
  endPlay();
}
function resumeBattle(S){
  UI.S=S;UI.view='battle';UI.menu=S.phase==='forced'?'party':'main';UI.playing=false;UI.skip=false;UI.cur={p:-1,o:-1};UI.playId++;
  render();syncScene();prompt();renderControls();
}
function act(a){
  const S=UI.S;if(UI.playing||!legal(S,a))return;
  SFX.init();
  const evs=playTurn(S,a);
  if(S.phase==='over')UI.res=finalize(S);
  else if(S.mode==='daily'){DB.cur=serialize(S);persist()}
  UI.menu='main';
  playEvents(evs);
}
function leaveBattle(){UI.playId++;UI.playing=false;UI.skip=false;UI.cancelSay=null;UI.view='home';render();window.scrollTo(0,0)}

// ---------- result view ----------
function resultHTML(){
  const {rec,mode,newAch,newBadge,beaten}=UI.res,ch=CHAMPS[rec.champ],gl=mode==='gauntlet',nm=esc(DB.trainer.name);
  setAccent(ch);
  const title=rec.won?(gl?'GAUNTLET CLEARED':'HALL OF FAME'):(gl?'RUN OVER':'BLACKED OUT');
  const head=gl?(rec.won?`${nm} cleared all 12 champions!`:`${nm} beat ${beaten} of 12 champions.`):rec.won?`${nm} defeated ${ch.name} of ${ch.region}!`:`${ch.name} of ${ch.region} was too strong this time.`;
  const team=(rec.team||[]).map((k,i)=>`<img class="px ${rec.p[i]?'':'ko'}" style="animation-delay:${i*.35}s" src="${spriteURL(DEX[k].id,'front')}" alt="${DEX[k].name}" onerror="spriteFail(this,'${k}')">`).join('');
  const unlocks=[...(newBadge?[ch.name+' badge earned']:[]),...newAch.map(a=>'Achievement: '+a.name)];
  const btns=mode==='daily'?`<button class="btn primary" data-act="to-practice">Practice run</button><button class="btn" data-act="to-gauntlet">Gauntlet</button><button class="btn" data-act="home">Home</button>`
    :mode==='gauntlet'?`<button class="btn primary" data-act="to-gauntlet">Try again</button><button class="btn" data-act="home">Home</button>`
    :`<button class="btn primary" data-act="rematch">Rematch</button><button class="btn" data-act="newteam">New team</button><button class="btn" data-act="home">Home</button>`;
  return `<section class="hof ${rec.won?'win':'lose'}"><h2>${title}</h2><p>${head}</p><div class="hof-team">${team}</div></section>
  ${unlocks.length?`<div class="unlock">${unlocks.map(u=>`<span>${esc(u)}</span>`).join('')}</div>`:''}
  ${resultCard(rec,mode,{beaten})}
  <div class="row">${btns}</div>${mode==='daily'?`<p class="note" style="margin-top:12px">Next champion in <b data-cd>--:--:--</b>.</p>`:''}`;
}

function render(){
  const app=$('#app');
  if(UI.view==='home'){app.innerHTML=homeHTML();tick()}
  else if(UI.view==='battle'){app.innerHTML=battleHTML();renderControls()}
  else{app.innerHTML=resultHTML();tick()}
}
function tick(){
  if(todayNo()!==DAY&&UI.view==='home'&&UI.tab==='daily'){DAY=todayNo();T=dayInfo(DAY);UI.lead=0;render();return}
  const n=new Date(),nx=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1),d=Math.max(0,nx-n),z=v=>String(v).padStart(2,'0');
  const s=`${z(Math.floor(d/36e5))}:${z(Math.floor(d%36e5/6e4))}:${z(Math.floor(d%6e4/1e3))}`;
  document.querySelectorAll('[data-cd]').forEach(e=>e.textContent=s);
}
setInterval(tick,1000);

function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),2600)}
async function copyText(t){
  try{await navigator.clipboard.writeText(t);return true}catch(e){
    try{const a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();const ok=document.execCommand('copy');a.remove();return ok}catch(e2){return false}
  }
}
function updSoundBtn(){const b=$('#soundBtn');if(b)b.textContent='Sound: '+(DB.settings.sound?'On':'Off')}

const H={
  tab(b){UI.tab=b.dataset.v;UI.resetArm=false;render()},
  'pick-champ'(b){UI.pr.champ=+b.dataset.i;UI.tab='practice';render();window.scrollTo(0,0)},
  lead(b){const i=+b.dataset.i;if(UI.tab==='practice')UI.pr.lead=i;else if(UI.tab==='gauntlet')UI.gr.lead=i;else UI.lead=i;render()},
  reroll(){if(UI.tab==='gauntlet')newGTeam();else{UI.pr.team=pickTeam(Math.random);UI.pr.lead=0}render()},
  start(){
    if(DB.daily[DAY])return;
    if(DB.cur&&DB.cur.day===DAY){resumeBattle(hydrate(DB.cur));return}
    const S=newBattle('daily',DAY,T.champ,T.team,UI.lead,T.seed);DB.cur=serialize(S);persist();startIntro(S,false);
  },
  'start-practice'(){startIntro(newBattle('practice',0,UI.pr.champ,UI.pr.team,UI.pr.lead,rndSeed()),false)},
  'start-gauntlet'(){startIntro(newGauntlet(UI.gr.team,UI.gr.lead,rndSeed()),false)},
  menu(b){UI.menu=b.dataset.m;renderControls()},
  move(b){act({t:'move',i:+b.dataset.i})},
  switch(b){act({t:'switch',i:+b.dataset.i})},
  item(){UI.menu='target';renderControls()},
  'use-item'(b){act({t:'item',i:+b.dataset.i})},
  home(){leaveBattle()},
  'to-practice'(){UI.tab='practice';UI.view='home';render();window.scrollTo(0,0)},
  'to-gauntlet'(){newGTeam();UI.tab='gauntlet';UI.view='home';render();window.scrollTo(0,0)},
  rematch(){startIntro(newBattle('practice',0,UI.pr.champ,UI.pr.team,UI.pr.lead,rndSeed()),false)},
  newteam(){UI.pr.team=pickTeam(Math.random);UI.pr.lead=0;UI.tab='practice';UI.view='home';render();window.scrollTo(0,0)},
  async share(){const ok=await copyText($('#sharetext').textContent);toast(ok?'Result copied':'Could not copy. Select the text and copy it.')},
  chart(){$('#chart').showModal()},
  'close-chart'(){$('#chart').close()},
  sound(){DB.settings.sound=!DB.settings.sound;persist();SFX.init();SFX.play('select');updSoundBtn();if(UI.view==='home'&&UI.tab==='trainer')render()},
  set(b){const k=b.dataset.k,v=b.dataset.v;DB.settings[k]=v==='true'?true:v==='false'?false:v;persist();if(k==='sound'){SFX.init();SFX.play('select');updSoundBtn()}render()},
  reset(){
    if(!UI.resetArm){UI.resetArm=true;render();setTimeout(()=>{if(UI.resetArm){UI.resetArm=false;if(UI.view==='home'&&UI.tab==='trainer')render()}},4000);return}
    UI.resetArm=false;DB=DEF();persist();newPractice();newGTeam();updSoundBtn();toast('Progress erased');render();
  }
};
document.addEventListener('click',e=>{
  SFX.init();
  if(UI.playing&&e.target.closest('#screen')){skipPlay();return}
  const b=e.target.closest('[data-act]');if(!b||b.disabled)return;
  const f=H[b.dataset.act];if(f)f(b);
});
document.addEventListener('change',e=>{
  if(e.target.id==='trainerName'){DB.trainer.name=(e.target.value||'').trim().slice(0,12)||'TRAINER';persist()}
});
document.addEventListener('keydown',e=>{
  if(UI.view!=='battle'||e.target.closest&&e.target.closest('input,textarea,select'))return;
  if(UI.playing){if(e.key===' '||e.key==='Enter'){e.preventDefault();skipPlay()}return}
  const S=UI.S;if(S.phase!=='battle')return;
  if(/^[1-4]$/.test(e.key)&&(UI.menu==='main'||UI.menu==='fight'))act({t:'move',i:+e.key-1});
  else if(e.key==='f'||e.key==='F'){UI.menu='fight';renderControls()}
  else if(e.key==='b'||e.key==='B'){UI.menu='bag';renderControls()}
  else if(e.key==='p'||e.key==='P'){UI.menu='party';renderControls()}
  else if(e.key==='Escape'){UI.menu='main';renderControls()}
});
const dlg=$('#chart');if(dlg)dlg.addEventListener('click',e=>{if(e.target.id==='chart')e.target.close()});

(function buildChart(){
  const ab=t=>t.slice(0,3);
  let h='<table class="tc"><tr><th></th>'+TYPES.map(t=>`<th style="background:${TC[t]};color:${inkFor(TC[t])}">${ab(t)}</th>`).join('')+'</tr>';
  TYPES.forEach(a=>{h+=`<tr><th style="background:${TC[a]};color:${inkFor(TC[a])}">${ab(a)}</th>`+TYPES.map(d=>{const v=E[a][d];return v===2?'<td class="x2">2</td>':v===.5?'<td class="x5">½</td>':v===0?'<td class="x0">0</td>':'<td></td>'}).join('')+'</tr>'});
  $('#chartBody').innerHTML=h+'</table>';
})();

// ---------- boot ----------
updSoundBtn();
if(DB.cur&&DB.cur.day!==DAY){DB.cur=null;persist()}
if(DB.cur&&DB.cur.day===DAY&&!DB.daily[DAY]&&DB.cur.phase!=='over')resumeBattle(hydrate(DB.cur));
else render();
