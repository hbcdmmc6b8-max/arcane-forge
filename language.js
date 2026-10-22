/* Arcane Forge bilingual interface (English / Russian).
   UI strings only: player messages, chat content and spell names stay unchanged. */
(()=>{
"use strict";
const pairs=[
["CAST","АТАКА"],["WARD","ЩИТ"],["DODGE","РЫВОК"],["NEXT","ДАЛЕЕ"],
["Forge","Кузница"],["Tree","Древо"],["Grimoire","Гримуар"],["Close","Закрыть"],["CLOSE","ЗАКРЫТЬ"],
["Arcane Crucible","Магический горн"],["Magic Tree","Древо магии"],["TRANSMUTE","СОЗДАТЬ"],
["Select 2–3 magics. Forged magic can be forged again, creating recursive branches.","Выберите 2–3 вида магии. Созданную магию можно объединять снова."],
["Every node remembers what created it.","Каждый узел хранит историю своего создания."],
["Your discovered schools and their ancestry.","Открытые школы магии и их происхождение."],
["No magic selected.","Магия не выбрана."],["MORE","ЕЩЁ"],["CLOSE","ЗАКРЫТЬ"],
["FUSE","СЛИЯНИЕ"],["DOMAIN","ДОМЕН"],["CAMERA","КАМЕРА"],
["ONLINE FEATURES","ОНЛАЙН"],["ONLINE EXPANSION","ОНЛАЙН-РЕЖИМ"],
["Sign in to use online features. SQL migration required.","Войдите в аккаунт для онлайн-функций. Требуется настройка базы данных."],
["Select a feature. Sign in required.","Выберите функцию. Требуется вход в аккаунт."],
["DUELS","ДУЭЛИ"],["GUILDS","ГИЛЬДИИ"],["TRADING","ОБМЕН"],["CO-OP RAIDS","РЕЙДЫ"],
["STAFF DASHBOARD","ПАНЕЛЬ ПЕРСОНАЛА"],["OWNER SERVER CONTROL","УПРАВЛЕНИЕ СЕРВЕРОМ"],
["Confirmed Duels","Подтверждаемые дуэли"],["Challenge","Вызвать"],
["Refresh duels","Обновить дуэли"],["Guilds","Гильдии"],["Create guild","Создать гильдию"],
["Join guild","Вступить в гильдию"],["Leave guild","Покинуть гильдию"],["My guild","Моя гильдия"],
["Server Token Trading","Обмен серверными жетонами"],
["Trades transfer server-owned primordial spell tokens, not locally forged spells.","Обмен передаёт серверные жетоны базовых заклинаний, а не локально созданную магию."],
["Claim starter tokens (once)","Получить стартовые жетоны"],["My token inventory","Мои жетоны"],
["Offer trade","Предложить обмен"],["Refresh trade inbox","Обновить предложения"],
["No pending trades","Нет ожидающих обменов"],["Shared Boss Raid","Совместный рейд"],
["Join a multiplayer room first. Each signed-in player can deal 100 raid damage every 2 seconds.","Сначала войдите в комнату. Каждый игрок может наносить 100 урона боссу раз в 2 секунды."],
["Start or join raid","Начать рейд"],["Attack raid boss","Атаковать босса"],
["Raid status","Состояние рейда"],["Staff Audit Dashboard","Журнал персонала"],
["Load moderation audit","Загрузить журнал"],["Live Server Control","Управление сервером"],
["Verified owner only. Select an active Arcane Forge room. All actions are logged, rate-limited and limited to safe values.","Только для владельца. Выберите активную комнату. Действия записываются и имеют ограничения."],
["List active rooms","Активные комнаты"],["SEND OWNER COMMAND","ОТПРАВИТЬ КОМАНДУ"],
["Announcement","Объявление"],["Heal","Лечение"],["Restore mana","Восстановить ману"],
["Force respawn","Возродить"],["Freeze (10 sec)","Заморозить (10 с)"],
["Unfreeze","Разморозить"],["Spawn bosses (1–20)","Создать боссов (1–20)"],
["Clear enemies","Убрать врагов"],["Set realm","Изменить мир"],
["Start event","Начать событие"],["Stop event","Завершить событие"],
["COMBAT LOADOUT","БОЕВАЯ ЭКИПИРОВКА"],
["Equip a magic weapon, choose your awakening style and dimension.","Выберите магическое оружие, пробуждение и домен."],
["Weapon","Оружие"],["Awakening","Пробуждение"],["Dimension","Домен"],
["Arcane Staff","Магический посох"],["Rune Blade","Рунный клинок"],
["Spell Gauntlets","Магические перчатки"],["Living Grimoire","Живой гримуар"],
["Sovereign","Властелин"],["Phantom","Призрак"],["Celestial","Небесный"],
["Astral Sanctuary","Астральное святилище"],["Infernal Crucible","Адский горн"],
["Frozen Cathedral","Ледяной собор"],["owned","куплено"],["essence","эссенции"],
["WORLD & EVENTS • LOCAL SANDBOX","МИРЫ И СОБЫТИЯ • ЛОКАЛЬНЫЙ РЕЖИМ"],
["These controls affect this browser only. Events, announcements and custom bosses are not broadcast to other players.","Эти настройки действуют только в вашем браузере. События и боссы не передаются другим игрокам."],
["Elemental Realm","Стихийный мир"],["Spectate nearest enemy","Следить за ближайшим врагом"],
["Live Event Name (local)","Название события (локально)"],
["Start 60-second local event","Начать событие на 60 секунд"],
["Custom Boss Name","Имя своего босса"],["Boss HP","Здоровье босса"],
["Boss Damage","Урон босса"],["Spawn custom boss","Создать своего босса"],
["Announcement (local)","Объявление (локально)"],["Show announcement","Показать объявление"],
["MAGIC SKILL TREES","ДРЕВО НАВЫКОВ"],
["Select a spell, then spend essence to specialize it.","Выберите заклинание и потратьте эссенцию на улучшение."],
["Power +20%","Сила +20%"],["Speed +30%","Скорость +30%"],
["Mana -20%","Мана −20%"],["SETTINGS","НАСТРОЙКИ"],
["CUSTOMIZATION","ВНЕШНИЙ ВИД"],["RANK REWARDS","НАГРАДЫ ЗА РАНГ"],
["ROOM CHAT","ЧАТ КОМНАТЫ"],["ACCOUNT","АККАУНТ"],
["OWNER PANEL","ПАНЕЛЬ ВЛАДЕЛЬЦА"],["STAFF PANEL","ПАНЕЛЬ ПЕРСОНАЛА"],
["OWNER TESTING ROOM","ТЕСТОВАЯ КОМНАТА"],["RESET PASSWORD","СБРОС ПАРОЛЯ"],
["GAMEPLAY & CREATION","ИГРА И СОЗДАНИЕ"],["PLAYERS & MANAGEMENT","ИГРОКИ И УПРАВЛЕНИЕ"],
["1 • GAMEPLAY & CREATION","1 • ИГРА И СОЗДАНИЕ"],
["2 • PLAYERS & MANAGEMENT","2 • ИГРОКИ И УПРАВЛЕНИЕ"],
["STAFF MODERATION","МОДЕРАЦИЯ"],["APPLY MODERATION","ПРИМЕНИТЬ МЕРУ"],
["BACK","НАЗАД"],["SPAWN ENEMY","СОЗДАТЬ ВРАГА"],["SPAWN BOSS","СОЗДАТЬ БОССА"],
["CLEAR ARENA","ОЧИСТИТЬ АРЕНУ"],["POWER","СИЛА"],
["Arcane Forge","Аркейн Фордж"]
];
const dict=new Map(pairs);
const placeholder=new Map([
["Opponent account UUID","UUID противника"],["Guild name (3–32 characters)","Название гильдии (3–32 символа)"],
["Buyer account UUID","UUID получателя"],["Offer spell: Fire, Water…","Отдаёте заклинание: Fire, Water…"],
["Request spell","Хотите получить"],["Six-character room code","Код комнаты из 6 символов"],
["Optional target account UUID","UUID игрока (необязательно)"],
["Message / realm / boss count","Сообщение / мир / число боссов"],
["Event title","Название события"],["Your announcement","Текст объявления"],
["Search this section…","Поиск по разделу…"],
["Target account UUID","UUID игрока"],["Reason (max 200 characters)","Причина (до 200 символов)"]
]);
const dynamic=[
[/^Rank (\d+) • Essence (\d+) • (\d+) schools$/,(_,r,e,n)=>`Ранг ${r} • Эссенция ${e} • Школ: ${n}`],
[/^Rank (\d+) • Essence (\d+)$/,(_,r,e)=>`Ранг ${r} • Эссенция ${e}`],
[/^#(\d+) • (pending|accepted|reported|finished|cancelled) •/, (m)=>m.replace("pending","ожидает").replace("accepted","принята").replace("reported","результат").replace("finished","завершена").replace("cancelled","отменена")],
[/^([A-Za-z]+) Realm$/,(_,name)=>({Arcane:"Магический",Ember:"Огненный",Glacier:"Ледяной",Tempest:"Грозовой",Verdant:"Лесной"}[name]||name)+" мир"],
[/^Current: (.+) · Level (\d+) · XP (\d+) · 3 essence per specialization$/,(_,v,l,x)=>`Улучшение: ${v} · Уровень ${l} · Опыт ${x} · Цена: 3 эссенции`],
[/^Contacting server…$/,()=> "Связь с сервером…"]
];
const original=new WeakMap();
let language="en";
try{language=localStorage.getItem("afLanguage")==="ru"?"ru":"en";}catch(_){}
const ignoredParents=new Set(["SCRIPT","STYLE","TEXTAREA","OPTION","CODE","PRE","CANVAS"]);
function translate(value){
 const trimmed=value.trim();
 if(dict.has(trimmed))return dict.get(trimmed);
 for(const [re,fn] of dynamic){if(re.test(trimmed))return trimmed.replace(re,fn);}
 return null;
}
function walk(root){
 if(!root)return;
 if(root.nodeType===3){
  const parent=root.parentElement;
  if(!parent||ignoredParents.has(parent.tagName)||parent.isContentEditable||parent.closest("[data-no-translate]"))return;
  const current=root.nodeValue||"";
  const prev=original.get(root);
  if(prev===undefined|| (current!==prev&&current!==translate(prev)))original.set(root,current);
  const source=original.get(root);
  const target=language==="ru"?translate(source):null;
  const expected=target===null?source:source.replace(source.trim(),target);
  if(root.nodeValue!==expected)root.nodeValue=expected;
  return;
 }
 if(root.nodeType!==1&&root.nodeType!==9)return;
 if(root.nodeType===1){
  if(ignoredParents.has(root.tagName)||root.closest("[data-no-translate]"))return;
  if(root.matches("input[placeholder],textarea[placeholder]")){
   if(!root.dataset.afOriginalPlaceholder)root.dataset.afOriginalPlaceholder=root.getAttribute("placeholder")||"";
   const source=root.dataset.afOriginalPlaceholder;
   const target=language==="ru"?(placeholder.get(source)||dict.get(source)||source):source;
   if(root.placeholder!==target)root.placeholder=target;
  }
  if(root.matches("button[title]")){
   if(!root.dataset.afOriginalTitle)root.dataset.afOriginalTitle=root.title;
   const source=root.dataset.afOriginalTitle;
   root.title=language==="ru"?(dict.get(source)||source):source;
  }
 }
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes)walk(node);
 if(root.nodeType===1&&root.matches("input[placeholder],textarea[placeholder]"))return;
 if(root.querySelectorAll)for(const input of root.querySelectorAll("input[placeholder],textarea[placeholder],button[title]")){
  if(input!==root){
   if(input.hasAttribute("placeholder")){
    if(!input.dataset.afOriginalPlaceholder)input.dataset.afOriginalPlaceholder=input.getAttribute("placeholder")||"";
    const src=input.dataset.afOriginalPlaceholder;input.placeholder=language==="ru"?(placeholder.get(src)||dict.get(src)||src):src;
   }
   if(input.tagName==="BUTTON"&&input.title){
    if(!input.dataset.afOriginalTitle)input.dataset.afOriginalTitle=input.title;
    const src=input.dataset.afOriginalTitle;input.title=language==="ru"?(dict.get(src)||src):src;
   }
  }
 }
}
const switcher=document.createElement("button");
switcher.type="button";switcher.id="langSwitch";
switcher.setAttribute("aria-label","Change language / Сменить язык");
function apply(){
 document.documentElement.lang=language;
 switcher.textContent=language==="ru"?"EN":"РУ";
 switcher.title=language==="ru"?"Switch to English":"Переключить на русский";
 walk(document.body);
}
switcher.onclick=()=>{
 language=language==="en"?"ru":"en";
 try{localStorage.setItem("afLanguage",language);}catch(_){}
 apply();
};
document.body.append(switcher);
let pending=false;
const observer=new MutationObserver(()=>{
 if(pending)return;
 pending=true;
 queueMicrotask(()=>{pending=false;walk(document.body);});
});
observer.observe(document.body,{subtree:true,childList:true,characterData:true});
apply();
})();
