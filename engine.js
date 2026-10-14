// Daily Champion battle engine. Pure logic, no DOM, so it runs in the browser and in Node tests.
const TYPES=['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];
const TC={Normal:'#A8A77A',Fire:'#EE8130',Water:'#6390F0',Electric:'#F7D02C',Grass:'#7AC74C',Ice:'#96D9D6',Fighting:'#C22E28',Poison:'#A33EA1',Ground:'#E2BF65',Flying:'#A98FF3',Psychic:'#F95587',Bug:'#A6B91A',Rock:'#B6A136',Ghost:'#735797',Dragon:'#6F35FC',Dark:'#705746',Steel:'#B7B7CE',Fairy:'#D685AD'};
const RAW={
Normal:['','Rock Steel','Ghost'],
Fire:['Grass Ice Bug Steel','Fire Water Rock Dragon',''],
Water:['Fire Ground Rock','Water Grass Dragon',''],
Electric:['Water Flying','Electric Grass Dragon','Ground'],
Grass:['Water Ground Rock','Fire Grass Poison Flying Bug Dragon Steel',''],
Ice:['Grass Ground Flying Dragon','Fire Water Ice Steel',''],
Fighting:['Normal Ice Rock Dark Steel','Poison Flying Psychic Bug Fairy','Ghost'],
Poison:['Grass Fairy','Poison Ground Rock Ghost','Steel'],
Ground:['Fire Electric Poison Rock Steel','Grass Bug','Flying'],
Flying:['Grass Fighting Bug','Electric Rock Steel',''],
Psychic:['Fighting Poison','Psychic Steel','Dark'],
Bug:['Grass Psychic Dark','Fire Fighting Poison Flying Ghost Steel Fairy',''],
Rock:['Fire Ice Flying Bug','Fighting Ground Steel',''],
Ghost:['Psychic Ghost','Dark','Normal'],
Dragon:['Dragon','Steel','Fairy'],
Dark:['Psychic Ghost','Fighting Dark Fairy',''],
Steel:['Ice Rock Fairy','Fire Water Electric Steel',''],
Fairy:['Fighting Dragon Dark','Fire Poison Steel','']
};
const E={};
TYPES.forEach(a=>{E[a]={};TYPES.forEach(d=>E[a][d]=1);const r=RAW[a];
  r[0].split(' ').filter(Boolean).forEach(d=>E[a][d]=2);
  r[1].split(' ').filter(Boolean).forEach(d=>E[a][d]=0.5);
  r[2].split(' ').filter(Boolean).forEach(d=>E[a][d]=0);});
const MV={Normal:['Body Slam','Hyper Voice'],Fire:['Flare Blitz','Flamethrower'],Water:['Waterfall','Surf'],Electric:['Wild Charge','Thunderbolt'],Grass:['Power Whip','Energy Ball'],Ice:['Icicle Crash','Ice Beam'],Fighting:['Close Combat','Aura Sphere'],Poison:['Poison Jab','Sludge Bomb'],Ground:['Earthquake','Earth Power'],Flying:['Brave Bird','Air Slash'],Psychic:['Zen Headbutt','Psychic'],Bug:['X-Scissor','Bug Buzz'],Rock:['Stone Edge','Power Gem'],Ghost:['Shadow Claw','Shadow Ball'],Dragon:['Dragon Claw','Dragon Pulse'],Dark:['Crunch','Dark Pulse'],Steel:['Iron Head','Flash Cannon'],Fairy:['Play Rough','Moonblast']};

// Name|Type1|Type2|base hp,atk,def,spa,spd,spe|coverage types
const DEX_RAW=`
Pidgeot|Normal|Flying|83,80,75,70,70,101|Fighting,Fire,Ground
Alakazam|Psychic||55,50,45,135,95,120|Ghost,Fighting,Electric
Rhydon|Ground|Rock|105,130,120,45,45,40|Ice,Fire,Fighting
Arcanine|Fire||90,110,80,100,80,95|Normal,Electric,Fighting
Exeggutor|Grass|Psychic|95,95,85,125,75,55|Poison,Ghost,Fire
Blastoise|Water||79,83,100,85,105,78|Ice,Fighting,Dark
Pikachu|Electric||35,55,40,50,50,90|Water,Grass,Fighting
Espeon|Psychic||65,65,60,130,95,110|Ghost,Dark,Grass
Snorlax|Normal||160,110,65,65,110,30|Ground,Dark,Fighting
Venusaur|Grass|Poison|80,82,83,100,100,80|Ground,Dark,Normal
Charizard|Fire|Flying|78,84,78,109,85,100|Dragon,Ground,Fighting
Gyarados|Water|Flying|95,125,79,60,100,81|Dark,Dragon,Ground
Aerodactyl|Rock|Flying|80,105,65,60,75,130|Ground,Fire,Dark
Dragonite|Dragon|Flying|91,134,95,100,100,80|Fire,Ground,Normal
Kingdra|Water|Dragon|75,95,95,95,95,85|Ice,Fire,Ground
Salamence|Dragon|Flying|95,135,80,110,80,100|Fire,Ground,Dark
Skarmory|Steel|Flying|65,80,140,40,70,70|Ground,Fighting,Rock
Claydol|Ground|Psychic|60,70,105,70,120,75|Ice,Rock,Fire
Aggron|Steel|Rock|70,110,180,60,60,50|Fire,Ground,Fighting
Cradily|Rock|Grass|86,81,97,81,107,43|Ground,Poison,Fighting
Armaldo|Rock|Bug|75,125,100,70,80,45|Ground,Fighting,Steel
Metagross|Steel|Psychic|80,135,130,95,90,70|Ground,Fire,Ice
Wailord|Water||170,90,45,90,45,60|Ice,Dark,Normal
Tentacruel|Water|Poison|80,70,65,80,120,100|Ice,Psychic,Dark
Ludicolo|Water|Grass|80,70,70,90,100,70|Ice,Fighting,Psychic
Whiscash|Water|Ground|110,78,73,76,71,60|Ice,Dark,Rock
Milotic|Water||95,60,79,100,125,81|Ice,Psychic,Dragon
Spiritomb|Ghost|Dark|50,92,108,92,108,35|Psychic,Fighting,Poison
Roserade|Grass|Poison|60,70,65,125,105,90|Dark,Ghost,Fighting
Togekiss|Fairy|Flying|85,50,95,120,115,80|Fire,Fighting,Dragon
Lucario|Fighting|Steel|70,110,70,115,70,90|Dragon,Dark,Psychic
Garchomp|Dragon|Ground|108,130,95,80,85,102|Fire,Rock,Steel
Accelgor|Bug||80,70,40,100,60,145|Grass,Fighting,Poison
Bouffalant|Normal||95,110,95,40,95,55|Fighting,Rock,Fire
Druddigon|Dragon||77,120,90,60,90,48|Fire,Fighting,Steel
Vanilluxe|Ice||71,95,85,110,95,79|Water,Steel,Electric
Escavalier|Bug|Steel|70,135,105,60,105,20|Fighting,Dark,Rock
Volcarona|Bug|Fire|85,60,65,135,105,100|Psychic,Fighting,Rock
Hydreigon|Dark|Dragon|92,105,90,125,90,98|Fire,Ground,Fighting
Archeops|Rock|Flying|75,140,65,112,65,110|Dragon,Fighting,Ground
Lapras|Water|Ice|130,85,80,85,95,60|Electric,Dragon,Psychic
Haxorus|Dragon||76,147,90,60,70,97|Fighting,Steel,Ground
Hawlucha|Fighting|Flying|78,92,75,74,63,118|Poison,Steel,Dragon
Tyrantrum|Rock|Dragon|82,121,119,69,59,71|Ground,Steel,Fire
Aurorus|Rock|Ice|123,77,72,99,92,58|Fairy,Electric,Ground
Gourgeist|Ghost|Grass|65,90,122,58,75,84|Fighting,Dark,Fire
Goodra|Dragon||90,100,70,110,150,80|Fire,Steel,Fighting
Gardevoir|Psychic|Fairy|68,65,65,125,115,80|Ghost,Fighting,Electric
Lycanroc|Rock||75,115,65,55,65,112|Fighting,Ground,Dark
Alolan Ninetales|Ice|Fairy|73,67,75,81,100,109|Psychic,Dark,Electric
Braviary|Normal|Flying|100,123,75,57,75,80|Fighting,Rock,Steel
Magnezone|Electric|Steel|70,70,115,130,90,60|Fighting,Fire,Water
Incineroar|Fire|Dark|95,115,90,80,90,60|Fighting,Ground,Ghost
Aegislash|Steel|Ghost|60,90,100,90,100,60|Fighting,Dark,Psychic
Dragapult|Dragon|Ghost|88,120,75,100,75,142|Fire,Steel,Dark
Mr. Rime|Ice|Psychic|80,85,75,110,100,70|Ghost,Fighting,Ground
Rillaboom|Grass||100,125,90,60,70,85|Fighting,Ground,Dark
Espathra|Psychic||95,60,60,101,60,105|Fairy,Dark,Fighting
Gogoat|Grass||123,100,62,97,81,68|Ground,Rock,Normal
Veluza|Water|Psychic|90,102,73,78,65,70|Dark,Fighting,Ice
Avalugg|Ice||95,117,184,44,46,28|Ground,Rock,Steel
Kingambit|Dark|Steel|100,135,120,60,85,50|Fighting,Ground,Ghost
Glimmora|Rock|Poison|83,55,90,130,81,86|Ground,Fairy,Fire
Gengar|Ghost|Poison|60,65,60,130,75,110|Psychic,Fire,Electric
Jolteon|Electric||65,65,60,110,95,130|Ghost,Grass,Ice
Scizor|Bug|Steel|70,130,100,55,80,65|Fighting,Rock,Fire
Houndoom|Dark|Fire|75,90,50,110,80,95|Poison,Fighting,Grass
Manectric|Electric||70,75,60,105,60,105|Fire,Grass,Ice
Tyranitar|Rock|Dark|100,134,110,95,100,61|Fire,Fighting,Ground
Blissey|Normal||255,10,10,75,135,55|Fire,Ice,Electric
Machamp|Fighting||90,130,80,65,85,55|Rock,Ground,Poison
Gliscor|Ground|Flying|75,95,125,45,75,95|Fighting,Ice,Poison
Heracross|Bug|Fighting|80,125,75,40,95,85|Rock,Ground,Flying
Starmie|Water|Psychic|60,75,85,100,85,115|Ice,Electric,Grass
Swampert|Water|Ground|100,110,90,85,90,60|Ice,Fighting,Rock
Blaziken|Fire|Fighting|80,120,70,110,70,80|Flying,Ground,Rock
Sceptile|Grass||70,85,65,105,85,120|Dragon,Fighting,Rock
Infernape|Fire|Fighting|76,104,71,104,71,108|Rock,Dark,Ground
Empoleon|Water|Steel|84,86,88,111,101,60|Ice,Ground,Dark
Torterra|Grass|Ground|95,109,105,75,85,56|Rock,Fighting,Steel
Greninja|Water|Dark|72,95,67,103,71,122|Ice,Grass,Fighting
`;
const DEX={};
DEX_RAW.trim().split('\n').forEach(l=>{const p=l.split('|');const b=p[3].split(',').map(Number);
  DEX[p[0]]={name:p[0],types:[p[1],p[2]].filter(Boolean),b:{hp:b[0],atk:b[1],def:b[2],spa:b[3],spd:b[4],spe:b[5]},cov:p[4].split(',')};});
const IDS={'Pidgeot':18,'Alakazam':65,'Rhydon':112,'Arcanine':59,'Exeggutor':103,'Blastoise':9,'Pikachu':25,'Espeon':196,'Snorlax':143,'Venusaur':3,'Charizard':6,'Gyarados':130,'Aerodactyl':142,'Dragonite':149,'Kingdra':230,'Salamence':373,'Skarmory':227,'Claydol':344,'Aggron':306,'Cradily':346,'Armaldo':348,'Metagross':376,'Wailord':321,'Tentacruel':73,'Ludicolo':272,'Whiscash':340,'Milotic':350,'Spiritomb':442,'Roserade':407,'Togekiss':468,'Lucario':448,'Garchomp':445,'Accelgor':617,'Bouffalant':626,'Druddigon':621,'Vanilluxe':584,'Escavalier':589,'Volcarona':637,'Hydreigon':635,'Archeops':567,'Lapras':131,'Haxorus':612,'Hawlucha':701,'Tyrantrum':697,'Aurorus':699,'Gourgeist':711,'Goodra':706,'Gardevoir':282,'Lycanroc':745,'Alolan Ninetales':10104,'Braviary':628,'Magnezone':462,'Incineroar':727,'Aegislash':681,'Dragapult':887,'Mr. Rime':866,'Rillaboom':812,'Espathra':956,'Gogoat':673,'Veluza':976,'Avalugg':713,'Kingambit':983,'Glimmora':970,'Gengar':94,'Jolteon':135,'Scizor':212,'Houndoom':229,'Manectric':310,'Tyranitar':248,'Blissey':242,'Machamp':68,'Gliscor':472,'Heracross':214,'Starmie':121,'Swampert':260,'Blaziken':257,'Sceptile':254,'Infernape':392,'Empoleon':395,'Torterra':389,'Greninja':658};
Object.keys(DEX).forEach(k=>{DEX[k].id=IDS[k]});
const POOL=Object.keys(DEX);

const CHAMPS=[
{name:'Blue',region:'Kanto',sub:'Kanto League Champion',color:'#4F8DF5',team:['Pidgeot','Alakazam','Rhydon','Arcanine','Exeggutor','Blastoise']},
{name:'Red',region:'Kanto',sub:'Champion of Mt. Silver',color:'#E5483B',team:['Pikachu','Espeon','Snorlax','Venusaur','Charizard','Blastoise']},
{name:'Lance',region:'Johto',sub:'Johto League Champion',color:'#F0902E',team:['Gyarados','Charizard','Aerodactyl','Dragonite','Kingdra','Salamence']},
{name:'Steven',region:'Hoenn',sub:'Hoenn League Champion',color:'#8FA3B8',team:['Skarmory','Claydol','Aggron','Cradily','Armaldo','Metagross']},
{name:'Wallace',region:'Hoenn',sub:'Hoenn Champion of the tides',color:'#2BB7C4',team:['Wailord','Tentacruel','Ludicolo','Whiscash','Gyarados','Milotic']},
{name:'Cynthia',region:'Sinnoh',sub:'Sinnoh League Champion',color:'#A98BEA',team:['Spiritomb','Roserade','Togekiss','Lucario','Milotic','Garchomp']},
{name:'Alder',region:'Unova',sub:'Unova League Champion',color:'#B58A3A',team:['Accelgor','Bouffalant','Druddigon','Vanilluxe','Escavalier','Volcarona']},
{name:'Iris',region:'Unova',sub:'Unova Champion and dragon master',color:'#C2418E',team:['Hydreigon','Archeops','Aggron','Lapras','Druddigon','Haxorus']},
{name:'Diantha',region:'Kalos',sub:'Kalos League Champion',color:'#F4B4D0',team:['Hawlucha','Tyrantrum','Aurorus','Gourgeist','Goodra','Gardevoir']},
{name:'Kukui',region:'Alola',sub:'First Champion of Alola',color:'#FF8A5B',team:['Lycanroc','Alolan Ninetales','Braviary','Magnezone','Snorlax','Incineroar']},
{name:'Leon',region:'Galar',sub:'Undefeated Galar Champion',color:'#5B5BD6',team:['Aegislash','Dragapult','Haxorus','Charizard','Mr. Rime','Rillaboom']},
{name:'Geeta',region:'Paldea',sub:'Paldea Top Champion',color:'#2FA37A',team:['Espathra','Gogoat','Veluza','Avalugg','Kingambit','Glimmora']}
];
const ARENAS=['kanto','silver','johto','hoenn','sea','sinnoh','unova','unova','kalos','alola','galar','paldea'];
CHAMPS.forEach((c,i)=>{c.arena=ARENAS[i]});

function effOf(type,types){let m=1;types.forEach(t=>{m*=E[type][t]});return m}
function buildMoves(d,st){
  const phys=st.atk>=st.spa;const list=[];
  d.types.forEach(t=>list.push({t,stab:true}));
  d.cov.forEach(t=>{if(list.length<4&&!list.some(x=>x.t===t))list.push({t,stab:false})});
  return list.slice(0,4).map((m,i)=>{const heavy=i===3;
    return {name:MV[m.t][phys?0:1],type:m.t,pow:heavy?110:(m.stab?90:80),acc:heavy?80:100,phys};});
}
function makeMon(k,hp){
  const d=DEX[k],b=d.b;
  const st={hp:2*b.hp+162,atk:2*b.atk+57,def:2*b.def+57,spa:2*b.spa+57,spd:2*b.spd+57,spe:2*b.spe+57};
  return {k,id:d.id,name:d.name,types:d.types,st,moves:buildMoves(d,st),max:st.hp,hp:hp==null?st.hp:hp};
}
function mkRng(seed){let s=seed>>>0;return {get s(){return s},next(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}}
function hash(x){let h=2166136261;x=String(x);for(let i=0;i<x.length;i++){h^=x.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function pickTeam(r){const a=POOL.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,6)}
function dayInfo(day){
  const n=CHAMPS.length,cycle=Math.floor((day-1)/n),pos=(day-1)%n;
  const r=mkRng(hash('c'+cycle));const order=CHAMPS.map((_,i)=>i);
  for(let i=n-1;i>0;i--){const j=Math.floor(r.next()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
  const tr=mkRng(hash('t'+day));
  return {champ:order[pos],team:pickTeam(()=>tr.next()),seed:hash('b'+day)};
}
function newBattle(mode,day,champ,keys,lead,seed){
  const ks=keys.slice();const l=ks.splice(lead,1)[0];ks.unshift(l);
  const ch=CHAMPS[champ];
  return {mode,day,champ,p:ks.map(k=>makeMon(k)),o:ch.team.map(k=>makeMon(k)),pa:0,oa:0,turn:1,phase:'battle',result:null,bag:2,bag0:2,crits:0,faints:0,gauntlet:null,
    log:[`${ch.name} wants to battle!`,`${ch.name} sends out ${ch.team[0]}!`,`Go, ${l}!`],rng:mkRng(seed)};
}
function serialize(S){return {mode:S.mode,day:S.day,champ:S.champ,p:S.p.map(m=>[m.k,m.hp]),o:S.o.map(m=>[m.k,m.hp]),pa:S.pa,oa:S.oa,turn:S.turn,phase:S.phase,result:S.result,bag:S.bag,bag0:S.bag0,crits:S.crits,faints:S.faints,gauntlet:S.gauntlet,log:S.log.slice(-40),rng:S.rng.s}}
function hydrate(v){return {mode:v.mode,day:v.day,champ:v.champ,p:v.p.map(x=>makeMon(x[0],x[1])),o:v.o.map(x=>makeMon(x[0],x[1])),pa:v.pa,oa:v.oa,turn:v.turn,phase:v.phase,result:v.result,bag:v.bag==null?2:v.bag,bag0:v.bag0==null?2:v.bag0,crits:v.crits||0,faints:v.faints||0,gauntlet:v.gauntlet||null,log:v.log.slice(),rng:mkRng(v.rng)}}
function estimate(att,def,mv){
  const A=mv.phys?att.st.atk:att.st.spa,D=mv.phys?def.st.def:def.st.spd;
  return mv.pow*(mv.acc/100)*(att.types.includes(mv.type)?1.5:1)*effOf(mv.type,def.types)*A/D;
}
function aiMove(att,def){let best=0,bs=-1;att.moves.forEach((m,i)=>{const s=estimate(att,def,m);if(s>bs){bs=s;best=i}});return best}

const POTION_HEAL=120;
function playTurn(S,action){
  const evs=[],R=S.rng,cname=CHAMPS[S.champ].name;
  const L=(side,m)=>side==='p'?'Your '+m.name:cname+"'s "+m.name;
  const ev=(msg,fx)=>{evs.push({msg,fx:fx||null,snap:{pa:S.pa,oa:S.oa,pHp:S.p[S.pa].hp,oHp:S.o[S.oa].hp}});if(msg){S.log.push(msg);if(S.log.length>80)S.log.shift()}};
  const doSwitch=i=>{const old=S.p[S.pa];if(old.hp>0)ev(`${old.name}, come back!`,{k:'out',side:'p'});S.pa=i;ev(`Go, ${S.p[i].name}!`,{k:'in',side:'p'})};
  const attack=side=>{
    const os=side==='p'?'o':'p';
    const att=S[side][side==='p'?S.pa:S.oa],def=S[os][os==='p'?S.pa:S.oa];
    const mv=side==='p'?att.moves[action.i]:att.moves[aiMove(att,def)];
    ev(`${L(side,att)} used ${mv.name}!`,{k:'lunge',side,after:true});
    if(R.next()*100>=mv.acc){ev(`${L(side,att)}'s attack missed!`,{k:'miss',side});return}
    const m=effOf(mv.type,def.types);
    if(m===0){ev(`It doesn't affect ${L(os,def)}...`,{k:'miss',side});return}
    const A=mv.phys?att.st.atk:att.st.spa,D=mv.phys?def.st.def:def.st.spd;
    let dmg=Math.floor(Math.floor(42*mv.pow*A/D)/50)+2;
    if(att.types.includes(mv.type))dmg=Math.floor(dmg*1.5);
    const crit=R.next()<1/16;
    if(crit){dmg=Math.floor(dmg*1.5);if(side==='p')S.crits++}
    dmg=Math.floor(dmg*m);dmg=Math.floor(dmg*(0.85+R.next()*0.15));dmg=Math.max(1,dmg);
    def.hp=Math.max(0,def.hp-dmg);
    let note=crit?'A critical hit! ':'';
    if(m>1)note+="It's super effective!";else if(m<1)note+="It's not very effective...";
    ev(note.trim(),{k:'hit',side:os,type:mv.type,m,crit});
    if(def.hp===0){if(os==='p')S.faints++;ev(`${L(os,def)} fainted!`,{k:'faint',side:os})}
  };
  if(S.phase==='forced'){doSwitch(action.i);S.phase='battle';return evs}
  const p=S.p[S.pa],o=S.o[S.oa];
  if(action.t==='item'){
    const t=S.p[action.i],heal=Math.min(POTION_HEAL,t.max-t.hp);
    t.hp+=heal;S.bag--;
    ev(`You used a Potion on ${t.name}!`,{k:'heal',side:'p',idx:action.i});
    ev(`${t.name} recovered ${heal} HP!`);
    attack('o');
  }else if(action.t==='switch'){doSwitch(action.i);attack('o')}
  else{
    let first='p';const ps=p.st.spe,os=o.st.spe;
    if(os>ps||(os===ps&&R.next()<.5))first='o';
    const second=first==='p'?'o':'p';
    attack(first);
    if(S[second][second==='p'?S.pa:S.oa].hp>0)attack(second);
  }
  if(S.o[S.oa].hp===0){
    const next=S.o.findIndex(m=>m.hp>0);
    if(next<0){S.phase='over';S.result='win';ev(`${cname} has no Pokémon left!`);S.turn++;return evs}
    S.oa=next;ev(`${cname} sends out ${S.o[next].name}!`,{k:'in',side:'o'});
  }
  if(S.p[S.pa].hp===0){
    if(S.p.some(m=>m.hp>0)){S.phase='forced';ev('Choose your next Pokémon.')}
    else{S.phase='over';S.result='lose';ev(`You have no Pokémon left. ${cname} wins!`)}
  }
  S.turn++;
  return evs;
}
function legal(S,a){
  if(S.phase==='over')return false;
  if(a.t==='move')return S.phase==='battle'&&a.i>=0&&a.i<S.p[S.pa].moves.length;
  if(a.t==='switch')return a.i>=0&&a.i<S.p.length&&a.i!==S.pa&&S.p[a.i].hp>0;
  if(a.t==='item')return S.phase==='battle'&&S.bag>0&&a.i>=0&&a.i<S.p.length&&S.p[a.i].hp>0&&S.p[a.i].hp<S.p[a.i].max;
  return false;
}
function makeRec(S){return {mode:S.mode,won:S.result==='win',turns:S.turn-1,p:S.p.map(m=>m.hp>0),o:S.o.map(m=>m.hp>0),champ:S.champ,day:S.day,crits:S.crits,faints:S.faints,potions:S.bag0-S.bag,team:S.p.map(m=>m.k)}}
function newGauntlet(keys,lead,seed){
  const r=mkRng(seed),order=CHAMPS.map((_,i)=>i);
  for(let i=order.length-1;i>0;i--){const j=Math.floor(r.next()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
  const S=newBattle('gauntlet',0,order[0],keys,lead,seed);
  S.bag=4;S.bag0=4;S.gauntlet={order,pos:0};
  return S;
}
function advanceGauntlet(S){
  const g=S.gauntlet;g.pos++;
  const c=g.order[g.pos],ch=CHAMPS[c];
  S.champ=c;S.o=ch.team.map(k=>makeMon(k));S.oa=0;S.phase='battle';S.result=null;
  S.log.push(`Next challenger: ${ch.name} of ${ch.region}!`,`${ch.name} sends out ${ch.team[0]}!`);
}

if(typeof module!=='undefined'&&module.exports){
  module.exports={TYPES,TC,E,MV,DEX,IDS,POOL,CHAMPS,POTION_HEAL,newGauntlet,advanceGauntlet,effOf,buildMoves,makeMon,mkRng,hash,pickTeam,dayInfo,newBattle,serialize,hydrate,estimate,aiMove,playTurn,legal,makeRec};
}
