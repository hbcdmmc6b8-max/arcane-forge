/* Owner-only Gojo character (local gameplay). No multiplayer character entitlement is implied. */
const af32Gojo={active:false,until:{blue:0,red:0,purple:0},effects:[]};
function af32GojoOwnerPage(){
 if(!afOwnerVerified){notice("Owner verification required");return;}
 v18Body.replaceChildren();
 const title=document.createElement("h3");title.textContent="GOJO • OWNER CHARACTER";
 const detail=document.createElement("p");detail.textContent="Local character with three techniques: Blue, Red and Hollow Purple. CAST uses Blue, POWER uses Red, and PURPLE appears in MORE. Owner permission is checked before activation.";
 const toggle=document.createElement("button");toggle.className="menuButton";toggle.style.width="100%";
 const refresh=()=>{toggle.textContent=af32Gojo.active?"DISABLE GOJO":"PLAY AS GOJO";};
 refresh();
 toggle.onclick=async()=>{
  if(!supabaseClient){notice("Sign in as owner");return;}
  toggle.disabled=true;
  try{
   const check=await supabaseClient.rpc("af_is_owner");
   if(check.error||check.data!==true){af32Gojo.active=false;notice("Owner verification failed");}
   else{
    af32Gojo.active=!af32Gojo.active;
    if(af32Gojo.active){S.mana=Math.max(S.mana,80);notice("GOJO EQUIPPED • BLUE / RED / PURPLE");}
    else notice("Gojo unequipped");
    af32GojoSync();
   }
  }catch(e){notice("Could not verify owner");}
  toggle.disabled=false;refresh();
 };
 const back=document.createElement("button");back.className="menuButton";back.textContent="BACK TO OWNER PANEL";back.onclick=()=>v18Open("OWNER PANEL");
 v18Body.append(title,detail,toggle,back);
}
function af32GojoSync(){
 const purple=document.getElementById("af32Purple");
 if(purple){purple.hidden=!af32Gojo.active;purple.style.display=af32Gojo.active?"":"none";}
 const cast=document.getElementById("cast"),power=document.getElementById("power");
 if(cast)cast.textContent=af32Gojo.active?"BLUE":"CAST";
 if(power)power.textContent=af32Gojo.active?"RED":"POWER";
}
function af32GojoCast(type){
 if(!af32Gojo.active||S.dead||performance.now()<af30.freezeUntil)return;
 const config={
  blue:{mana:12,cd:1600,color:"#3c9bff",radius:155,damage:27},
  red:{mana:22,cd:5500,color:"#ff475d",radius:200,damage:55},
  purple:{mana:55,cd:14000,color:"#bd78ff",radius:300,damage:130}
 }[type];
 if(!config)return;
 const now=performance.now();
 if(now<af32Gojo.until[type]){notice(type.toUpperCase()+" cooldown: "+Math.ceil((af32Gojo.until[type]-now)/1000)+"s");return;}
 if(S.mana<config.mana){notice("Not enough mana");return;}
 S.mana-=config.mana;af32Gojo.until[type]=now+config.cd;
 const closest=S.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-S.x,a.y-S.y)-Math.hypot(b.x-S.x,b.y-S.y))[0];
 let dx=joystick.x,dy=joystick.y;
 if(closest){dx=closest.x-S.x;dy=closest.y-S.y;}
 const length=Math.hypot(dx,dy)||1;dx/=length;dy/=length;
 if(!closest&&Math.hypot(joystick.x,joystick.y)<.1){dx=Math.sin(playerFacing);dy=-Math.cos(playerFacing);}
 facePlayer(dx,dy,true);
 const cx=S.x+dx*(type==="purple"?170:105),cy=S.y+dy*(type==="purple"?170:105);
 for(const enemy of S.enemies){
  const distance=Math.hypot(enemy.x-cx,enemy.y-cy);
  if(distance>config.radius)continue;
  const damage=Math.round(config.damage*(1-.3*distance/config.radius));
  hurtEnemy(enemy,damage,config.color);
  if(type==="blue"){enemy.x+=(cx-enemy.x)*.2;enemy.y+=(cy-enemy.y)*.2;}
  if(type==="red"){enemy.x+=(enemy.x-cx)*.3;enemy.y+=(enemy.y-cy)*.3;}
 }
 burst(cx,cy,config.color,type==="purple"?75:35);
 af32Gojo.effects.push({x:cx,y:cy,color:config.color,r:config.radius,type,started:now});
 notice(type==="purple"?"HOLLOW PURPLE":type==="red"?"REVERSAL: RED":"LAPSE: BLUE");
}
function af32DrawGojo(x,y,facing){
 const t=performance.now()*.001;
 ctx.save();ctx.translate(x,y);ctx.rotate(facing);
 ctx.shadowColor="#9deaff";ctx.shadowBlur=17;
 // White-haired, blindfolded sorcerer in a dark high-collar uniform.
 ctx.fillStyle="#111b38";ctx.strokeStyle="#9ec7ff";ctx.lineWidth=1.8;
 ctx.beginPath();ctx.moveTo(-12,15);ctx.lineTo(-14,-8);ctx.quadraticCurveTo(0,-18,14,-8);ctx.lineTo(12,15);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle="#e5c6a9";ctx.beginPath();ctx.arc(0,-11,10,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#111527";ctx.fillRect(-9,-15,18,6);
 ctx.fillStyle="#f4f8ff";ctx.strokeStyle="#d0dfff";ctx.lineWidth=1;
 ctx.beginPath();ctx.moveTo(-11,-17);ctx.lineTo(-9,-26);ctx.lineTo(-4,-22);ctx.lineTo(0,-30);ctx.lineTo(5,-23);ctx.lineTo(10,-26);ctx.lineTo(12,-17);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle="#a9dfff";ctx.fillRect(-3,-3,6,13);
 ctx.strokeStyle="#b7eaff88";ctx.beginPath();ctx.arc(0,0,22+Math.sin(t*3)*2,0,Math.PI*2);ctx.stroke();
 ctx.restore();
}
function af32DrawEffects(){
 const now=performance.now();
 af32Gojo.effects=af32Gojo.effects.filter(e=>now-e.started<650);
 for(const e of af32Gojo.effects){
  const progress=(now-e.started)/650;
  ctx.save();ctx.globalAlpha=Math.max(0,1-progress);ctx.strokeStyle=e.color;ctx.lineWidth=6*(1-progress)+1;
  ctx.shadowBlur=30;ctx.shadowColor=e.color;ctx.beginPath();ctx.arc(e.x,e.y,e.r*progress,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(e.x,e.y,Math.max(4,32*(1-progress)),0,Math.PI*2);ctx.fillStyle=e.color;ctx.fill();
  ctx.restore();
 }
}
function af32AddButton(){
 const tray=document.getElementById("af31Extras");if(!tray)return;
 const b=document.createElement("button");b.id="af32Purple";b.className="action";b.textContent="PURPLE";b.type="button";
 b.onclick=()=>af32GojoCast("purple");tray.append(b);af32GojoSync();
}
af32AddButton();
