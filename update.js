/* Arcane Forge — November 2026 update hub and local progression.
   All challenges and statistics are local to this device. */
const AF33_VERSION="3.5";
const af33Notes=[
 {version:"3.5",date:"November 10, 2026",title:"The Forge Awakens",items:[
  "NEW: In-game changelog with update history.",
  "NEW: Combat statistics — track total damage and successful forges.",
  "NEW: Three rotating daily challenges with essence rewards.",
  "IMPROVED: Quick access to update information from the HUD.",
  "IMPROVED: Russian interface support for the update hub."
 ]},
 {version:"3.4",date:"November 2026",title:"Owner Sorcerer",items:[
  "Owner-exclusive Gojo character with Blue, Red and Hollow Purple.",
  "Improved simultaneous movement and button controls.",
  "Language selector moved into Settings."
 ]},
 {version:"3.3",date:"November 2026",title:"Interface Update",items:[
  "Mobile controls reorganized into combat and MORE sections.",
  "English / Russian interface switching.",
  "Online features interface improvements."
 ]},
 {version:"3.2",date:"October 2026",title:"Multiplayer Expansion Prototypes",items:[
  "Initial duels, guilds, trading, co-op raid and staff tools.",
  "Owner live-server command interface (server migration required).",
  "Server-backed features require Supabase setup and further testing."
 ]},
 {version:"3.1",date:"October 2026",title:"Worlds & Magic",items:[
  "Elemental realm prototypes, custom bosses, events and announcements.",
  "Spell fusion, magic weapons, awakenings, and dimensions.",
  "Spell evolution, skill trees, catalysts and discoveries."
 ]}
];
const af33State={damage:0,forges:0,claimed:{},day:""};
try{Object.assign(af33State,JSON.parse(localStorage.getItem("af33Progress")||"{}"));}catch(_){}
function af33Today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
function af33Persist(){try{localStorage.setItem("af33Progress",JSON.stringify(af33State));}catch(_){}}
function af33Day(){
 const today=af33Today();
 if(af33State.day!==today){af33State.day=today;af33State.dailyDamage=0;af33State.dailyForges=0;af33State.claimed={};af33Persist();}
}
function af33RecordDamage(damage){
 if(!Number.isFinite(damage)||damage<=0)return;
 af33Day();af33State.damage=(Number(af33State.damage)||0)+damage;
 af33State.dailyDamage=(Number(af33State.dailyDamage)||0)+damage;af33Persist();
}
function af33RecordForge(){
 af33Day();af33State.forges=(Number(af33State.forges)||0)+1;
 af33State.dailyForges=(Number(af33State.dailyForges)||0)+1;af33Persist();
}
function af33ChallengeList(){
 af33Day();
 const seed=Array.from(af33State.day).reduce((n,c)=>n+c.charCodeAt(0),0);
 return [
  {id:"damage",title:"Arcane Assault",description:"Deal 1,500 damage today",progress:Math.floor(af33State.dailyDamage||0),goal:1500,reward:2},
  {id:"forge",title:"Forge Master",description:"Create 2 new spells today",progress:Math.floor(af33State.dailyForges||0),goal:2,reward:3},
  {id:"schools",title:"Spell Collector",description:"Own "+(15+seed%5)+" schools",progress:Object.keys(S.magic).length,goal:15+seed%5,reward:2}
 ];
}
function af33Open(tab="notes"){
 const existing=document.getElementById("af33Overlay");if(existing)existing.remove();
 const overlay=document.createElement("div");overlay.id="af33Overlay";
 const panel=document.createElement("section");panel.id="af33Panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-label","Arcane Forge update hub");
 const head=document.createElement("div");head.className="af33Head";
 const title=document.createElement("h2");title.textContent="ARCANE FORGE • UPDATE "+AF33_VERSION;
 const close=document.createElement("button");close.type="button";close.textContent="✕";close.setAttribute("aria-label","Close");close.onclick=()=>overlay.remove();
 head.append(title,close);panel.append(head);
 const tabs=document.createElement("nav");tabs.className="af33Tabs";
 const body=document.createElement("div");body.id="af33Body";
 function button(label,fn,host=tabs){const b=document.createElement("button");b.type="button";b.textContent=label;b.onclick=fn;host.append(b);return b;}
 const notesBtn=button("CHANGELOG",()=>render("notes"));
 const challengesBtn=button("DAILY CHALLENGES",()=>render("challenges"));
 const statsBtn=button("BATTLE STATS",()=>render("stats"));
 panel.append(tabs,body);overlay.append(panel);document.body.append(overlay);
 overlay.addEventListener("pointerdown",e=>{if(e.target===overlay)overlay.remove();});
 function el(tag,text,parent){const n=document.createElement(tag);n.textContent=text;parent.append(n);return n;}
 function render(which){
  for(const [name,b] of [["notes",notesBtn],["challenges",challengesBtn],["stats",statsBtn]])b.classList.toggle("selected",name===which);
  body.replaceChildren();
  if(which==="notes"){
   for(const release of af33Notes){
    const section=el("section","",body);section.className="af33Release";
    el("h3","v"+release.version+" — "+release.title,section);
    el("small",release.date,section);
    const ul=document.createElement("ul");section.append(ul);
    for(const line of release.items)el("li",line,ul);
   }
  }else if(which==="challenges"){
   el("p","Local daily challenges reset at midnight on your device. Rewards are saved to this browser.",body);
   for(const challenge of af33ChallengeList()){
    const card=el("section","",body);card.className="af33Challenge";
    el("strong",challenge.title,card);
    el("p",challenge.description,card);
    el("small",Math.min(challenge.progress,challenge.goal)+" / "+challenge.goal+" • +"+challenge.reward+" essence",card);
    const progress=document.createElement("progress");progress.max=challenge.goal;progress.value=Math.min(challenge.goal,challenge.progress);card.append(progress);
    const claim=button(af33State.claimed[challenge.id]?"CLAIMED":"CLAIM REWARD",()=>{
     af33Day();
     const latest=af33ChallengeList().find(c=>c.id===challenge.id);
     if(!latest||latest.progress<latest.goal||af33State.claimed[latest.id])return;
     af33State.claimed[latest.id]=true;
     S.essence+=latest.reward;saveGame();updateHUD();af33Persist();
     notice("CHALLENGE COMPLETE • +"+latest.reward+" ESSENCE");render("challenges");
    },card);
    claim.disabled=!!af33State.claimed[challenge.id]||challenge.progress<challenge.goal;
   }
  }else{
   af33Day();
   el("p","Total damage dealt: "+Math.floor(af33State.damage||0).toLocaleString(),body);
   el("p","Successful new forges: "+Math.floor(af33State.forges||0),body);
   el("p","Discovered magic schools: "+Object.keys(S.magic).length,body);
   el("p","Current rank: "+S.rank,body);
   el("small","Stats are tracked on this device from update 3.5 onward.",body);
  }
 }
 render(tab);
}
function af33Install(){
 const btn=document.createElement("button");btn.id="af33Updates";btn.type="button";btn.textContent="WHAT'S NEW";btn.title="Changelog and daily challenges";btn.onclick=()=>af33Open("notes");
 document.body.append(btn);
 try{
  if(localStorage.getItem("af33SeenVersion")!==AF33_VERSION){
   btn.classList.add("af33New");
   btn.textContent="NEW UPDATE • 3.5";
  }
 }catch(_){}
 btn.addEventListener("click",()=>{btn.classList.remove("af33New");btn.textContent="WHAT'S NEW";try{localStorage.setItem("af33SeenVersion",AF33_VERSION);}catch(_){}});
 af33Day();
}
af33Install();
