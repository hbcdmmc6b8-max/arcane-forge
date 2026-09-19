(() => {
/* =========================================================
   MULTIPLAYER v0.1
========================================================= */

const SUPABASE_URL =
  "https://pwvsumipvwfejvaknsxl.supabase.co";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3dnN1bWlwdndmZWp2YWtuc3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDM3MzIsImV4cCI6MjEwNTMxOTczMn0.LwKfBcWu8WoN7aqW8QGbLRTa1wfNzzcSGVIekeZx4pA";

const supabaseClient =
  window.supabase &&
  typeof window.supabase.createClient === "function"
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      )
    : null;

let multiplayerChannel = null;
let multiplayerRoom = null;

/* Remote players currently connected to this room. */
const multiplayerPlayers = new Map();

let multiplayerSendTimer = 0;

const multiplayerId =
  crypto.randomUUID();

function makeRoomCode() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += chars[
      Math.floor(
        Math.random() *
        chars.length
      )
    ];
  }

  return code;
}

function connectMultiplayer(roomCode) {
  if(typeof v18Testing!=="undefined" && !v18Testing.active){v18Testing.invincible=false;v18Testing.infiniteMana=false;}
  const code =
    roomCode.trim().toUpperCase();

  if (!code) return;

  if (!supabaseClient) {
    notice("MULTIPLAYER REQUIRES INTERNET");
    return;
  }

  if (multiplayerChannel) {
    supabaseClient.removeChannel(
      multiplayerChannel
    );
  }

  multiplayerPlayers.clear();
  if (typeof afPauseReset === "function") afPauseReset();
  multiplayerRoom = code;
  if (typeof v18ChatReset === "function") v18ChatReset(code);

  multiplayerChannel =
    supabaseClient.channel(
      `arcane-forge:${code}`,
      {
        config: {
          broadcast: {
            self: false
          }
        }
      }
    );

  multiplayerChannel
    .on(
      "broadcast",
      {
        event: "player-state"
      },
      ({ payload }) => {
        if (
          !payload ||
          payload.id === multiplayerId
        ) {
          return;
        }

        const x = Number(payload.x);
        const y = Number(payload.y);
        const hp = Number(payload.hp);

        if (
          !Number.isFinite(x) ||
          !Number.isFinite(y)
        ) {
          return;
        }

        const oldPlayer = multiplayerPlayers.get(payload.id);
        multiplayerPlayers.set(
          payload.id,
          {
            renderX: oldPlayer ? oldPlayer.renderX : x,
            renderY: oldPlayer ? oldPlayer.renderY : y,
            renderFacing: oldPlayer ? oldPlayer.renderFacing : Number(payload.facing) || 0,
            id: payload.id,
            x,
            y,
            hp: Number.isFinite(hp)
              ? Math.max(0, Math.min(100, hp))
              : 100,
            magic:
              typeof payload.magic === "string"
                ? payload.magic
                : "Fire",
            facing: Number.isFinite(Number(payload.facing))
              ? Number(payload.facing) : -Math.PI / 2,
            lastSeen: performance.now()
          }
        );
      }
    )
    .on("broadcast", {event:"af-pause"}, ({payload}) => {
      if (typeof afPauseReceive === "function") afPauseReceive(payload);
    })
    .on("broadcast", {event:"room-chat"}, ({payload}) => {
      if (typeof v18ReceiveChat === "function") v18ReceiveChat(payload);
    })
    .subscribe(
      (status, error) => {
        console.log(
          "MULTIPLAYER:",
          status
        );

        if (error) {
          console.error(
            "MULTIPLAYER ERROR:",
            error
          );
        }

        if (
          status === "SUBSCRIBED"
        ) {
          notice(
            `ROOM ${code} CONNECTED`
          );
        }
      }
    );
}

function createMultiplayerRoom() {
  const code = makeRoomCode();

  connectMultiplayer(code);

  return code;
}

function sendPlayerState() {
  if (
    !multiplayerChannel ||
    !multiplayerRoom
  ) {
    return;
  }

  multiplayerChannel.send({
    type: "broadcast",
    event: "player-state",

    payload: {
      id: multiplayerId,
      x: S.x,
      y: S.y,
      hp: S.hp,
      magic: S.selected,
      facing: playerFacing
    }
  }).catch(() => {});
}
const C = document.querySelector("#c");
const ctx = C.getContext("2d");

let DPR = Math.min(devicePixelRatio || 1, 2);
let vw = 0;
let vh = 0;

function resize() {
  vw = innerWidth;
  vh = innerHeight;
  C.width = vw * DPR;
  C.height = vh * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

addEventListener("resize", resize);
resize();

/* =========================================================
   ARCANE FORGE v1.4
   AWAKENING UPDATE
========================================================= */

/* =========================
   MAGIC
========================= */

const base = {
  Fire: ["#ff6038", ["heat","burn","energy"]],
  Water: ["#3aa9ff", ["fluid","wet","flow","heal"]],
  Wind: ["#9ff1d5", ["air","speed","push"]],
  Earth: ["#a47b50", ["stone","mass","defense"]],
  Lightning: ["#ffe34f", ["shock","speed","energy"]],
  Ice: ["#a9e9ff", ["cold","freeze","solid"]],
  Light: ["#fff0a6", ["radiant","purify","energy","heal"]],
  Shadow: ["#9d6cff", ["dark","drain","conceal"]],
  Force: ["#ff79dd", ["push","impact","control"]]
};

/*
  IMPORTANT:
  Recipe keys must be alphabetically sorted.
*/

const recipes = {

  /* FIRE */

  "Earth+Fire":
    ["Magma","#ff5528",["heat","stone","burn"]],

  "Fire+Wind":
    ["Inferno","#ff3217",["heat","burn","speed"]],

  "Fire+Light":
    ["Solar","#ffd24a",["radiant","heat","energy"]],

  "Fire+Shadow":
    ["Blackflame","#a83fff",["dark","heat","burn","drain"]],

  "Fire+Ice":
    ["Frostfire","#d774ff",["heat","cold","burn","freeze"]],

  "Fire+Lightning":
    ["Thunderflame","#ff9d35",["heat","shock","burn","energy"]],

  "Fire+Force":
    ["Blast","#ff6f72",["heat","impact","push","energy"]],

  "Fire+Water":
    ["Steam","#d7e9ee",["heat","wet","conceal","push"]],

  /* WATER */

  "Lightning+Water":
    ["Storm","#59dcff",["wet","shock","energy"]],

  "Ice+Water":
    ["Glacier","#b8f2ff",["freeze","solid","defense"]],

  "Earth+Water":
    ["Nature","#5de27a",["growth","stone","flow","heal"]],

  "Light+Water":
    ["Holy Tide","#bcefff",["heal","purify","radiant","flow"]],

  "Shadow+Water":
    ["Abyss","#3157a8",["dark","wet","drain","control"]],

  "Force+Water":
    ["Tsunami","#35c9e8",["wet","flow","push","impact"]],

  "Water+Wind":
    ["Monsoon","#62d9da",["wet","air","flow","push"]],

  /* WIND */

  "Force+Wind":
    ["Gravity","#b28aff",["control","mass","push"]],

  "Lightning+Wind":
    ["Thunderstorm","#d9f35b",["air","shock","speed","energy"]],

  "Ice+Wind":
    ["Blizzard","#c6f7ff",["cold","freeze","air","control"]],

  "Shadow+Wind":
    ["Nightstorm","#7156b8",["dark","air","speed","conceal"]],

  "Light+Wind":
    ["Heavenwind","#efffc8",["radiant","air","speed","purify"]],

  "Earth+Wind":
    ["Sandstorm","#d5ad72",["stone","air","conceal","control"]],

  /* EARTH */

  "Earth+Lightning":
    ["Magnetism","#d9ae55",["stone","shock","control","mass"]],

  "Earth+Ice":
    ["Permafrost","#90c9ce",["stone","cold","solid","defense"]],

  "Earth+Shadow":
    ["Obsidian","#553c6e",["stone","dark","solid","defense"]],

  "Earth+Light":
    ["Crystal","#ffe8a3",["stone","radiant","solid","energy"]],

  "Earth+Force":
    ["Quake","#b57d70",["stone","impact","mass","push"]],

  /* LIGHTNING */

  "Light+Lightning":
    ["Plasma","#e8f5ff",["energy","shock","radiant"]],

  "Lightning+Shadow":
    ["Dark Lightning","#8b52ff",["dark","shock","drain","speed"]],

  "Ice+Lightning":
    ["Cryoshock","#99e8ff",["freeze","shock","cold","energy"]],

  "Force+Lightning":
    ["Electromagnetism","#ed91ff",["shock","control","push","energy"]],

  /* ICE */

  "Ice+Shadow":
    ["Black Ice","#6576c7",["cold","dark","freeze","drain"]],

  "Ice+Light":
    ["Prism","#e8ffff",["cold","radiant","solid","purify"]],

  "Force+Ice":
    ["Shatter","#c4ddff",["cold","impact","solid","push"]],

  /* LIGHT / SHADOW / FORCE */

  "Light+Shadow":
    ["Eclipse","#c49aff",["radiant","dark","drain","purify"]],

  "Force+Light":
    ["Divine Force","#ffe9cf",["radiant","impact","defense","push"]],

  "Force+Shadow":
    ["Void","#62418f",["dark","control","drain"]],

  /* =====================================================
     THREE-ELEMENT LEGENDARY RECIPES
  ===================================================== */

  "Fire+Lightning+Wind":
    ["Supercell","#fff16a",["shock","burn","air","speed","energy"]],

  "Earth+Fire+Force":
    ["Meteor","#ff7540",["stone","heat","impact","mass","burn"]],

  "Ice+Water+Wind":
    ["Absolute Blizzard","#d8fbff",["freeze","cold","air","wet","control"]],

  "Force+Light+Shadow":
    ["Singularity","#8d72c9",["dark","radiant","control","mass","drain"]],

  "Fire+Force+Light":
    ["Supernova","#fff083",["heat","radiant","impact","energy","burn"]],

  "Fire+Force+Shadow":
    ["Hellvoid","#872747",["dark","heat","impact","drain","burn"]],

  "Fire+Ice+Lightning":
    ["Chaos Flame","#cf8cff",["heat","cold","shock","burn","freeze"]],

  "Earth+Light+Water":
    ["World Tree","#8cff89",["growth","heal","stone","radiant","flow"]],

  "Earth+Force+Lightning":
    ["Polarity","#e3bd63",["mass","shock","control","impact"]],

  "Light+Lightning+Wind":
    ["Skyborn","#f4ffd2",["radiant","shock","air","speed","energy"]],

  "Shadow+Water+Wind":
    ["Abyssal Storm","#4b5fa8",["dark","wet","air","drain","control"]],

  "Ice+Light+Water":
    ["Sacred Glacier","#dcffff",["freeze","heal","radiant","solid"]],

  "Earth+Fire+Shadow":
    ["Dreadforge","#7d403d",["stone","dark","heat","burn","defense"]],

  "Force+Lightning+Shadow":
    ["Dark Matter","#634eae",["dark","mass","shock","control","energy"]],

  "Fire+Light+Lightning":
    ["Starfire","#fff36c",["radiant","heat","shock","energy","burn"]],

  "Earth+Ice+Shadow":
    ["Night Crystal","#63758e",["stone","cold","dark","solid","drain"]],

  "Force+Water+Wind":
    ["Maelstrom","#47bbcf",["flow","air","control","push","impact"]],

  "Force+Ice+Wind":
    ["Zero Point","#b7e6ff",["cold","control","air","freeze","mass"]],

  "Light+Shadow+Water":
    ["Twilight Tide","#b78ee8",["radiant","dark","heal","drain","flow"]],

  "Earth+Light+Shadow":
    ["Eclipse Crystal","#ae86a8",["stone","radiant","dark","solid","energy"]],

  "Fire+Water+Wind":
    ["Scalding Tempest","#e8d0bd",["heat","wet","air","push","burn"]],

  "Earth+Lightning+Water":
    ["Living Current","#74dd9a",["growth","shock","flow","heal","energy"]],

  "Ice+Lightning+Wind":
    ["Thunderfrost","#b7f4ff",["freeze","shock","air","speed"]],

  "Fire+Ice+Shadow":
    ["Netherfrost","#81559b",["dark","cold","heat","freeze","drain"]],

  "Force+Light+Lightning":
    ["Judgement","#fff4c5",["radiant","shock","impact","energy","push"]],

  "Force+Shadow+Wind":
    ["Event Horizon","#493d79",["dark","air","mass","control","drain"]],

  "Earth+Force+Water":
    ["Continental","#699c74",["stone","mass","flow","impact","defense"]],

  "Fire+Light+Wind":
    ["Phoenix","#ffbc5d",["radiant","heat","air","heal","burn"]],

  "Ice+Light+Wind":
    ["Aurora","#aef7ec",["radiant","cold","air","energy","purify"]],

  "Lightning+Shadow+Water":
    ["Abyss Current","#5664d5",["dark","shock","wet","drain","energy"]],

  "Earth+Ice+Water":
    ["Frozen World","#a5d4da",["stone","freeze","wet","solid","defense"]],

  "Fire+Lightning+Shadow":
    ["Demon Bolt","#bf48aa",["dark","shock","heat","burn","drain"]],

  "Force+Ice+Light":
    ["Diamond Force","#e5ffff",["solid","radiant","impact","defense","cold"]],

  "Light+Water+Wind":
    ["Seraph Tide","#dcffe9",["radiant","heal","flow","air","purify"]],

  "Earth+Shadow+Water":
    ["Swamp","#556d4b",["dark","wet","growth","control","drain"]],

  "Earth+Lightning+Wind":
    ["Dust Thunder","#c8bd74",["stone","air","shock","speed","control"]],

  "Force+Light+Water":
    ["Life Pulse","#8fffc4",["heal","radiant","impact","flow","energy"]],

  "Fire+Ice+Water":
    ["Thermal Rift","#aaadcf",["heat","cold","wet","energy","control"]],

  "Light+Lightning+Shadow":
    ["Eclipse Bolt","#d0b3ff",["radiant","dark","shock","energy","drain"]],

  "Earth+Light+Wind":
    ["Celestial Sand","#eadf9c",["stone","radiant","air","speed","purify"]]
};

/* =========================
   STATE
========================= */

const S = {
  hp: 100,
  mana: 100,

  x: 0,
  y: 0,

  essence: 0,
  xp: 0,
  rank: 1,

  selected: "Fire",
  magic: {},

  shots: [],
  enemyShots: [],
  enemies: [],
  particles: [],
  zones: [],

  forge: [],

  ward: 0,
  armor: 0,

  dead: false,
  deathTimer: 0,
  deathScreen: false,

  powerCooldown: 0,

  awakening: 0,
  awakened: false,
  awakeningTime: 0,

  kills: 0
};

Object.entries(base).forEach(([name, data]) => {
  S.magic[name] = {
    color: data[0],
    traits: data[1],
    parents: []
  };
});

/* =========================
   SAVE
========================= */

try {
  const saved = JSON.parse(
    localStorage.arcaneForge || "null"
  );

  if (saved) {
    S.magic = saved.magic || S.magic;
    S.essence = saved.essence || 0;
    S.xp = saved.xp || 0;
    S.rank = 1 + Math.floor(S.xp / 100);
  }
} catch (e) {}

function saveGame() {
  if (typeof v18Testing !== "undefined" && v18Testing.active) return;
  try {
    localStorage.arcaneForge =
      JSON.stringify({
        magic: S.magic,
        essence: S.essence,
        xp: S.xp
      });
  } catch (e) {}
}

/* =========================
   GENERATION
========================= */

function hash(text) {
  let h = 2166136261;

  for (const char of text) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }

  return h >>> 0;
}

const prefixes = [
  "Astral",
  "Primal",
  "Nova",
  "Rift",
  "Aether",
  "Eclipse",
  "Tempest",
  "Runic",
  "Celestial",
  "Arcane",
  "Ancient",
  "Omega",
  "Phantom",
  "Cosmic",
  "Eternal"
];

const suffixes = [
  "Flare",
  "Surge",
  "Veil",
  "Pulse",
  "Storm",
  "Flux",
  "Wave",
  "Core",
  "Rift",
  "Bloom",
  "Nova",
  "Crown",
  "Fang",
  "Heart",
  "Torrent"
];

function generateMagic(parents) {
  const key =
    [...parents].sort().join("+");

  const h = hash(key);

  const name =
    prefixes[h % prefixes.length] +
    " " +
    suffixes[(h >>> 8) % suffixes.length];

  const traits = [
    ...new Set(
      parents.flatMap(
        parent =>
          S.magic[parent].traits
      )
    )
  ].slice(0, 8);

  return [
    name,
    `hsl(${h % 360} 80% 66%)`,
    traits
  ];
}

/* =========================
   UI
========================= */

function notice(text) {
  const box =
    document.querySelector("#notice");

  if (!box) return;

  box.textContent = text;
  box.classList.add("show");

  clearTimeout(notice.timer);

  notice.timer =
    setTimeout(() => {
      box.classList.remove("show");
    }, 1800);
}


/* =========================
   DAMAGE INDICATOR
========================= */

const damageIndicator =
  document.createElement("div");

damageIndicator.id = "damageIndicator";

Object.assign(
  damageIndicator.style,
  {
    position: "fixed",
    left: "50%",
    top: "22%",
    transform: "translate(-50%, -50%)",
    padding: "10px 16px",
    borderRadius: "14px",
    background: "rgba(20, 5, 10, .82)",
    border: "1px solid rgba(255, 90, 110, .65)",
    color: "#ffffff",
    fontWeight: "900",
    fontSize: "18px",
    textAlign: "center",
    lineHeight: "1.25",
    zIndex: "90",
    pointerEvents: "none",
    opacity: "0",
    transition: "opacity .15s, transform .15s",
    textShadow: "0 0 10px rgba(255,70,90,.75)"
  }
);

document.body.appendChild(
  damageIndicator
);

let pendingDamage = 0;
let damageIndicatorTimer = null;
let damageIndicatorFlush = null;

function showDamageIndicator(
  damage
) {
  if (
    !Number.isFinite(damage) ||
    damage <= 0
  ) {
    return;
  }

  pendingDamage += damage;

  clearTimeout(
    damageIndicatorFlush
  );

  damageIndicatorFlush =
    setTimeout(
      () => {
        const lost =
          Math.max(
            1,
            Math.round(
              pendingDamage
            )
          );

        pendingDamage = 0;

        damageIndicator.innerHTML =
          `<span style="color:#ff6577">-${lost} HP</span>` +
          `<br><span style="font-size:14px">` +
          `${Math.max(0, Math.ceil(S.hp))} HP LEFT</span>`;

        damageIndicator.style.opacity =
          "1";

        damageIndicator.style.transform =
          "translate(-50%, -58%)";

        clearTimeout(
          damageIndicatorTimer
        );

        damageIndicatorTimer =
          setTimeout(
            () => {
              damageIndicator.style.opacity =
                "0";

              damageIndicator.style.transform =
                "translate(-50%, -50%)";
            },
            850
          );
      },
      120
    );
}

function damagePlayer(
  amount
) {
  if (
    S.dead ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return 0;
  }

  const before = S.hp;

  S.hp =
    Math.max(
      0,
      S.hp - amount
    );

  const lost =
    before - S.hp;

  if (lost > 0) {
    showDamageIndicator(
      lost
    );
    if (performance.now() - (damagePlayer.lastSound || 0) > 450) {
      damagePlayer.lastSound = performance.now();
      playSfx("damage");
    }
  }

  return lost;
}

function updateHUD() {
  const hp =
    document.querySelector("#hp");

  const mana =
    document.querySelector("#mana");

  const stats =
    document.querySelector("#stats");

  const spellName =
    document.querySelector("#spellName");

  if (hp)
    hp.style.width =
      Math.max(0, S.hp) + "%";

  if (mana)
    mana.style.width =
      Math.max(0, S.mana) + "%";

  if (stats) {
    stats.textContent =
      `Rank ${S.rank} • Essence ${S.essence} • ` +
      `${Object.keys(S.magic).length} schools`;
  }

  if (spellName) {
    spellName.textContent =
      (S.awakened ? "✦ AWAKENED • " : "✦ ") +
      S.selected;
  }
}


/* =========================
   BOSS HUD
========================= */

const bossHud =
  document.createElement("div");

Object.assign(
  bossHud.style,
  {
    position: "fixed",
    left: "50%",
    top: "155px",
    transform: "translateX(-50%)",
    width: "min(520px, 72vw)",
    zIndex: "56",
    pointerEvents: "none",
    display: "none",
    textAlign: "center"
  }
);

const bossHudName =
  document.createElement("div");

Object.assign(
  bossHudName.style,
  {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: "13px",
    letterSpacing: "1.5px",
    marginBottom: "4px",
    textShadow: "0 0 10px #d68cff"
  }
);

const bossHudTrack =
  document.createElement("div");

Object.assign(
  bossHudTrack.style,
  {
    height: "14px",
    borderRadius: "20px",
    overflow: "hidden",
    background: "rgba(28,5,38,.9)",
    border: "1px solid rgba(255,255,255,.35)",
    boxShadow: "0 0 18px rgba(202,115,255,.25)"
  }
);

const bossHudFill =
  document.createElement("div");

Object.assign(
  bossHudFill.style,
  {
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(90deg,#7b35b7,#e09cff,#ffffff)",
    transition: "width .12s"
  }
);

const bossHudHp =
  document.createElement("div");

Object.assign(
  bossHudHp.style,
  {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: "11px",
    marginTop: "3px"
  }
);

bossHudTrack.appendChild(
  bossHudFill
);

bossHud.append(
  bossHudName,
  bossHudTrack,
  bossHudHp
);

document.body.appendChild(
  bossHud
);

function updateBossHUD() {
  const boss =
    S.enemies.find(
      enemy =>
        enemy.boss &&
        enemy.hp > 0
    );

  if (!boss) {
    bossHud.style.display =
      "none";
    return;
  }

  bossHud.style.display =
    "block";

  bossHudName.textContent =
    boss.type + (boss.phase === 2 ? " — PHASE II" : "");

  bossHudFill.style.width =
    Math.max(
      0,
      boss.hp / boss.maxHp * 100
    ) + "%";

  bossHudHp.textContent =
    `${Math.max(0, Math.ceil(boss.hp)).toLocaleString()} / ` +
    `${Math.ceil(boss.maxHp).toLocaleString()} HP`;
}

/* =========================
   AWAKENING UI
========================= */

const awakenBox =
  document.createElement("div");

awakenBox.id = "awakenBox";

Object.assign(
  awakenBox.style,
  {
    position: "fixed",
    right: "16px",
    top: "82px",
    width: "180px",
    height: "13px",
    background: "rgba(8,10,20,.85)",
    border: "1px solid rgba(255,255,255,.25)",
    borderRadius: "20px",
    overflow: "hidden",
    zIndex: "55",
    pointerEvents: "none"
  }
);

const awakenFill =
  document.createElement("div");

Object.assign(
  awakenFill.style,
  {
    width: "0%",
    height: "100%",
    background:
      "linear-gradient(90deg,#7c4dff,#ffffff)",
    transition: "width .15s"
  }
);

awakenBox.appendChild(awakenFill);
document.body.appendChild(awakenBox);

const awakenButton =
  document.createElement("button");

awakenButton.id = "awaken";
awakenButton.textContent = "AWAKEN";

Object.assign(
  awakenButton.style,
  {
    position: "fixed",
    right: "16px",
    top: "105px",
    width: "130px",
    height: "48px",
    borderRadius: "18px",
    border: "1px solid #ffffff88",
    background: "rgba(115,70,220,.94)",
    color: "#fff",
    fontWeight: "900",
    zIndex: "61",
    display: "none",
    touchAction: "none"
  }
);

document.body.appendChild(
  awakenButton
);

function addAwakening(amount) {
  if (
    S.dead ||
    S.awakened
  ) {
    return;
  }

  S.awakening =
    Math.min(
      100,
      S.awakening + amount
    );
}

function awakeningName() {
  const names = {
    Fire: "HELLFIRE",
    Water: "OCEAN SOUL",
    Wind: "SKY SOVEREIGN",
    Earth: "WORLD TITAN",
    Lightning: "THUNDER GOD",
    Ice: "ABSOLUTE ZERO",
    Light: "DIVINE ASCENSION",
    Shadow: "NIGHT INCARNATE",
    Force: "UNBOUND FORCE",

    Magma: "PLANETARY FURNACE",
    Inferno: "ETERNAL INFERNO",
    Storm: "TEMPEST KING",
    Glacier: "FROZEN WORLD",
    Solar: "STARBORN",
    Blackflame: "ABYSSAL SUN",
    Gravity: "GRAVITY SOVEREIGN",
    Plasma: "PLASMA ASCENSION",
    Nature: "WORLD BLOOM",
    Void: "EVENT HORIZON",

    Supernova: "STAR DEATH",
    Singularity: "FINAL SINGULARITY",
    Phoenix: "PHOENIX ASCENSION",
    "Event Horizon": "BLACK HORIZON"
  };

  return (
    names[S.selected] ||
    "ARCANE ASCENSION"
  );
}

function awaken() {
  if (
    S.dead ||
    S.awakened ||
    S.awakening < 100
  ) {
    return;
  }

  S.awakening = 0;
  S.awakened = true;
  S.awakeningTime = 7;

  S.mana = Math.min(100,S.mana + 50);
  playSfx("awaken",S.selected);

  const magic =
    S.magic[S.selected];

  burst(
    S.x,
    S.y,
    magic.color,
    160,
    65,
    2.8
  );

  burst(
    S.x,
    S.y,
    "#ffffff",
    90,
    55,
    2
  );

  damageArea(
    240,
    20,
    magic.color
  );

  notice(
    "AWAKENING — " +
    awakeningName()
  );
}

/* =========================
   FORGE
========================= */

function renderForge() {
  const grid =
    document.querySelector("#forgeGrid");

  const slots =
    document.querySelector("#forgeSlots");

  if (!grid || !slots) return;

  grid.innerHTML = "";

  Object.entries(S.magic)
    .forEach(([name, magic]) => {
      const button =
        document.createElement("button");

      button.className =
        "magic" +
        (
          S.forge.includes(name)
            ? " sel"
            : ""
        );

      button.innerHTML = `
        <span
          class="dot"
          style="
            background:${magic.color};
            color:${magic.color}
          "
        ></span>

        <b>${name}</b><br>

        <small>
          ${magic.traits.join(" · ")}
        </small>
      `;

      button.addEventListener(
        "click",
        () => {
          const index =
            S.forge.indexOf(name);

          if (index >= 0) {
            S.forge.splice(index, 1);
          }

          else if (
            S.forge.length < 3
          ) {
            S.forge.push(name);
          }

          renderForge();
        }
      );

      grid.appendChild(button);
    });

  slots.textContent =
    S.forge.length
      ? S.forge.join(" + ")
      : "No magic selected.";
}

function transmute() {
  if (S.dead) return;

  if (S.forge.length < 2) {
    notice(
      "Select at least 2 magics"
    );

    return;
  }

  const parents =
    [...S.forge].sort();

  const key =
    parents.join("+");

  const result =
    recipes[key] ||
    generateMagic(parents);

  let name =
    result[0];

  const color =
    result[1];

  const traits =
    result[2];

  if (
    S.magic[name] &&
    JSON.stringify(
      S.magic[name].parents
    ) !==
    JSON.stringify(parents)
  ) {
    name +=
      " " +
      (hash(key) % 97);
  }

  if (!S.magic[name]) {
    S.magic[name] = {
      color,
      traits,
      parents
    };

    S.essence++;
    S.xp +=
      parents.length === 3
        ? 45
        : 25;

    S.rank =
      1 +
      Math.floor(
        S.xp / 100
      );

    saveGame();

    burst(
      S.x,
      S.y,
      color,
      parents.length === 3
        ? 90
        : 45
    );

    notice(
      parents.length === 3
        ? "LEGENDARY MAGIC: " + name
        : "NEW MAGIC: " + name
    );
  }

  else {
    notice(
      name +
      " already discovered"
    );
  }

  S.selected = name;
  S.forge = [];

  renderForge();
  renderBook();
  renderTree();
  updateHUD();
}

function renderBook() {
  const entries =
    document.querySelector("#entries");

  if (!entries) return;

  entries.innerHTML = "";

  Object.entries(S.magic)
    .sort()
    .forEach(([name, magic]) => {
      const item =
        document.createElement("div");

      item.className =
        "entry";

      const origin =
        magic.parents.length
          ? magic.parents.join(" + ")
          : "Primordial school";

      item.innerHTML = `
        <span
          class="dot"
          style="
            background:${magic.color};
            color:${magic.color}
          "
        ></span>

        <b>${name}</b>

        <small>
          Origin: ${origin}<br>
          Traits:
          ${magic.traits.join(", ")}
        </small>
      `;

      entries.appendChild(item);
    });
}

function renderTree() {
  const tree =
    document.querySelector("#treeWrap");

  if (!tree) return;

  tree.innerHTML = "";

  const magics =
    Object.entries(S.magic);

  const centerX = 380;
  const centerY = 250;

  magics.forEach(
    ([name, magic], index) => {
      const generated =
        magic.parents.length > 0;

      const angle =
        Math.PI *
        2 *
        index /
        magics.length;

      const radius =
        generated
          ? 210
          : 115;

      const x =
        centerX +
        Math.cos(angle) *
        radius;

      const y =
        centerY +
        Math.sin(angle) *
        radius;

      const node =
        document.createElement("div");

      node.className =
        "node";

      node.style.left =
        x - 45 + "px";

      node.style.top =
        y - 45 + "px";

      node.style.background =
        magic.color;

      node.textContent =
        name;

      tree.appendChild(node);
    }
  );
}

const transmuteButton =
  document.querySelector("#transmute");

if (transmuteButton) {
  transmuteButton.addEventListener(
    "click",
    transmute
  );
}

document
  .querySelectorAll("[data-open]")
  .forEach(button => {
    button.addEventListener(
      "click",
      () => {
        if (S.dead) return;

        const modal =
          document.querySelector(
            "#" +
            button.dataset.open
          );

        if (modal) {
          modal.classList.add("open");
        }

        renderForge();
        renderTree();
        renderBook();
      }
    );
  });

document
  .querySelectorAll(".close")
  .forEach(button => {
    button.addEventListener(
      "click",
      () => {
        const modal =
          button.closest(".modal");

        if (modal) {
          modal.classList.remove("open");
        }
      }
    );
  });

/* =========================
   JOYSTICK
   KEEP v1.3 MULTITOUCH
========================= */

const joystick = {
  x: 0,
  y: 0
};

/* Character faces movement, or the latest cast direction while aiming. */
let playerFacing = -Math.PI / 2;
let playerAimUntil = 0;

function facePlayer(dx, dy, aiming = false) {
  if (Math.hypot(dx, dy) < 0.1) return;
  playerFacing = Math.atan2(dy, dx) + Math.PI / 2;
  if (aiming) playerAimUntil = performance.now() + 450;
}


const stick =
  document.querySelector("#stick");

const knob =
  document.querySelector("#knob");

let joystickPointer = null;

if (stick) {
  stick.style.touchAction =
    "none";

  stick.style.userSelect =
    "none";

  stick.style.webkitUserSelect =
    "none";

  stick.style.webkitTouchCallout =
    "none";
}

function resetJoystick() {
  joystickPointer = null;

  joystick.x = 0;
  joystick.y = 0;

  if (knob) {
    knob.style.transform =
      "translate(0px, 0px)";
  }
}

function updateJoystick(
  clientX,
  clientY
) {
  if (!stick || !knob) return;

  const rect =
    stick.getBoundingClientRect();

  let x =
    clientX -
    (
      rect.left +
      rect.width / 2
    );

  let y =
    clientY -
    (
      rect.top +
      rect.height / 2
    );

  const limit = 36;

  const distance =
    Math.hypot(x, y);

  if (distance > limit) {
    x *= limit / distance;
    y *= limit / distance;
  }

  joystick.x =
    x / limit;

  joystick.y =
    y / limit;

  knob.style.transform =
    `translate(${x}px, ${y}px)`;
}

if (stick) {
  stick.addEventListener(
    "pointerdown",
    event => {
      if (
        S.dead ||
        joystickPointer !== null
      ) {
        return;
      }

      joystickPointer =
        event.pointerId;

      event.preventDefault();

      updateJoystick(
        event.clientX,
        event.clientY
      );
    },
    { passive: false }
  );
}

window.addEventListener(
  "pointermove",
  event => {
    if (
      event.pointerId !==
      joystickPointer
    ) {
      return;
    }

    event.preventDefault();

    updateJoystick(
      event.clientX,
      event.clientY
    );
  },
  { passive: false }
);

window.addEventListener(
  "pointerup",
  event => {
    if (
      event.pointerId ===
      joystickPointer
    ) {
      resetJoystick();
    }
  }
);

window.addEventListener(
  "pointercancel",
  event => {
    if (
      event.pointerId ===
      joystickPointer
    ) {
      resetJoystick();
    }
  }
);

/* =========================
   PARTICLES
========================= */

function burst(
  x,
  y,
  color,
  amount,
  life = 25,
  speedBoost = 1
) {
  for (
    let i = 0;
    i < amount;
    i++
  ) {
    const angle =
      Math.random() *
      Math.PI *
      2;

    const speed =
      (
        Math.random() *
        3 +
        1
      ) *
      speedBoost;

    S.particles.push({
      x,
      y,

      vx:
        Math.cos(angle) *
        speed,

      vy:
        Math.sin(angle) *
        speed,

      life,
      maxLife: life,
      color
    });
  }
}

/* =========================
   V1.7 AUDIO AND IMPACT VFX
========================= */
let audioContext = null;
let soundEnabled = localStorage.arcaneForgeSound !== "off";
let lastImpactSound = 0;
const gameSettings = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem("arcaneForgeSettingsV18") || "{}");
    return {
      sfxVolume: Number.isFinite(saved.sfxVolume) ? Math.max(0, Math.min(1, saved.sfxVolume)) : .238,
      musicVolume: Number.isFinite(saved.musicVolume) ? Math.max(0, Math.min(1, saved.musicVolume)) : .18,
      vfx: saved.vfx !== false,
      screenShake: saved.screenShake !== false,
      showOtherPlayers: saved.showOtherPlayers !== false
    };
  } catch (_) {
    return {sfxVolume:.238,musicVolume:.18,vfx:true,screenShake:true,showOtherPlayers:true};
  }
})();
function saveGameSettings() {
  try { localStorage.setItem("arcaneForgeSettingsV18",JSON.stringify(gameSettings)); } catch (_) {}
}

function playSfx(kind = "cast", element = "Fire") {
  if (!soundEnabled) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioContext) audioContext = new AC();
    if (audioContext.state === "suspended") audioContext.resume();
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const tones = {Fire:190,Water:320,Wind:410,Earth:115,Lightning:660,
      Ice:570,Light:780,Shadow:95,Force:260};
    const baseTone = tones[element] || 300;
    const duration = kind === "boss" ? .65 : kind === "awaken" ? .45 : .10;
    osc.type = element === "Lightning" ? "sawtooth" :
      element === "Shadow" ? "triangle" : "sine";
    const pitch = kind === "damage" ? 95 : kind === "boss" ? 75 :
      kind === "impact" ? baseTone * .7 : baseTone;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(35,pitch*.55),now+duration);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime((kind === "boss" ? .44 : .238) * gameSettings.sfxVolume / .238,now+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain); gain.connect(audioContext.destination);
    osc.start(now); osc.stop(now+duration+.01);
  } catch (_) {}
}
const soundToggle = document.createElement("button");
soundToggle.textContent = soundEnabled ? "SFX ON" : "SFX OFF";
Object.assign(soundToggle.style, {position:"fixed",left:"12px",bottom:"170px",
  zIndex:"62",fontSize:"11px",padding:"7px",borderRadius:"9px",
  background:"#151a30",color:"white",border:"1px solid #59617f"});
soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  localStorage.arcaneForgeSound = soundEnabled ? "on" : "off";
  soundToggle.textContent = soundEnabled ? "SFX ON" : "SFX OFF";
  if (soundEnabled) playSfx("cast");
});
/* SFX is controlled from the V1.8 main-menu Settings panel. */
soundToggle.style.display = "none";
function impactVfx(x,y,color,element="Fire",large=false) {
  const amount = large ? 32 : 9;
  burst(x,y,color,amount,large ? 38 : 18,large ? 2 : 1);
  if (element === "Ice" || element === "Earth" || element === "Lightning") {
    burst(x,y,"#ffffff",large ? 12 : 4,14,1.7);
  }
  if (element === "Shadow") burst(x,y,"#31203e",large ? 15 : 5,25,1.2);
}
/* =========================
   ENEMY TYPES
========================= */

const enemyTypes = {

  Grunt: {
    hp: 42,
    speed: 48,
    damage: 12,
    radius: 18,
    color: "#bd334d",
    xp: 10,
    essence: 1
  },

  Runner: {
    hp: 24,
    speed: 92,
    damage: 8,
    radius: 13,
    color: "#ff7957",
    xp: 12,
    essence: 1
  },

  Tank: {
    hp: 125,
    speed: 25,
    damage: 20,
    radius: 27,
    color: "#852b3c",
    xp: 25,
    essence: 2
  },

  Mage: {
    hp: 38,
    speed: 34,
    damage: 9,
    radius: 17,
    color: "#d54fff",
    xp: 18,
    essence: 2,
    ranged: true
  },

  Dasher: {
    hp: 48,
    speed: 42,
    damage: 18,
    radius: 16,
    color: "#ff3f76",
    xp: 18,
    essence: 2,
    dash: true
  },

  Warden: {
    hp: 85,
    speed: 30,
    damage: 13,
    radius: 22,
    color: "#6374c7",
    xp: 22,
    essence: 2,
    shield: true
  },

  Leech: {
    hp: 55,
    speed: 55,
    damage: 10,
    radius: 17,
    color: "#8d294f",
    xp: 18,
    essence: 2,
    leech: true
  },

  FireElemental: {
    hp: 60,
    speed: 45,
    damage: 14,
    radius: 20,
    color: "#ff6334",
    xp: 20,
    essence: 2,
    element: "Fire"
  },

  IceElemental: {
    hp: 65,
    speed: 36,
    damage: 12,
    radius: 20,
    color: "#83e7ff",
    xp: 20,
    essence: 2,
    element: "Ice"
  },

  LightningElemental: {
    hp: 45,
    speed: 75,
    damage: 12,
    radius: 16,
    color: "#ffe74f",
    xp: 22,
    essence: 2,
    element: "Lightning"
  },

  ShadowElemental: {
    hp: 58,
    speed: 58,
    damage: 14,
    radius: 19,
    color: "#8454df",
    xp: 22,
    essence: 2,
    element: "Shadow"
  }
};

function randomEnemyType() {
  const roll =
    Math.random();

  if (S.rank < 2) {
    return roll < 0.7
      ? "Grunt"
      : "Runner";
  }

  if (S.rank < 4) {
    const pool = [
      "Grunt",
      "Runner",
      "Tank",
      "Mage",
      "Dasher"
    ];

    return pool[
      Math.floor(
        Math.random() *
        pool.length
      )
    ];
  }

  const pool = [
    "Grunt",
    "Runner",
    "Tank",
    "Mage",
    "Dasher",
    "Warden",
    "Leech",
    "FireElemental",
    "IceElemental",
    "LightningElemental",
    "ShadowElemental"
  ];

  return pool[
    Math.floor(
      Math.random() *
      pool.length
    )
  ];
}

function spawnEnemy() {
  if (S.dead) return;

  const angle =
    Math.random() *
    Math.PI *
    2;

  const distance =
    380 +
    Math.random() *
    180;

  const typeName =
    randomEnemyType();

  const type =
    enemyTypes[typeName];

  const elite =
    S.rank >= 3 &&
    Math.random() < 0.08;

  const hp =
    type.hp *
    (elite ? 1.8 : 1);

  S.enemies.push({
    type: typeName,

    x:
      S.x +
      Math.cos(angle) *
      distance,

    y:
      S.y +
      Math.sin(angle) *
      distance,

    hp,
    maxHp: hp,

    r:
      type.radius *
      (elite ? 1.2 : 1),

    speed:
      type.speed *
      (elite ? 1.12 : 1),

    damage:
      type.damage *
      (elite ? 1.4 : 1),

    color:
      elite
        ? "#ffd66f"
        : type.color,

    xp:
      Math.round(
        type.xp *
        (elite ? 2 : 1)
      ),

    essence:
      type.essence *
      (elite ? 2 : 1),

    ranged:
      !!type.ranged,

    dash:
      !!type.dash,

    shieldType:
      !!type.shield,

    leech:
      !!type.leech,

    element:
      type.element || null,

    elite,

    burn: 0,
    slow: 0,
    wet: 0,

    shield: 0,

    attackTimer:
      Math.random() * 2,

    dashTimer:
      2 + Math.random() * 2
  });
}

/* =========================
   MINI BOSS
========================= */

const bossRoster = [
  {name:"ARCANE SENTINEL",hp:3000,r:48,speed:28,damage:26,color:"#e09cff",style:"sentinel",ranged:true,dash:true,shield:true},
  {name:"FROST WYRM",hp:4500,r:54,speed:40,damage:19,color:"#a9e9ff",style:"wyrm",ranged:true,dash:true},
  {name:"INFERNO GOLEM",hp:6000,r:58,speed:23,damage:30,color:"#ff6334",style:"golem",ranged:true,shield:true},
  {name:"ABYSS REAPER",hp:8000,r:46,speed:55,damage:23,color:"#9d6cff",style:"reaper",ranged:true,dash:true},
  {name:"CELESTIAL TITAN",hp:10000,r:64,speed:32,damage:32,color:"#fff0a6",style:"titan",ranged:true,shield:true}
];
let bossesSpawned = 0;
function spawnMiniBoss() {
  if (S.dead || S.enemies.some(enemy => enemy.boss)) return;
  const config = bossRoster[Math.min(bossesSpawned,bossRoster.length-1)];
  bossesSpawned++;
  const angle = Math.random()*Math.PI*2;
  const boss = {
    type:config.name,boss:true,bossStyle:config.style,
    x:S.x+Math.cos(angle)*440,y:S.y+Math.sin(angle)*440,
    hp:config.hp,maxHp:config.hp,r:config.r,
    speed:config.speed,damage:config.damage,color:config.color,
    xp:Math.round(config.hp/7),essence:Math.round(config.hp/120),
    ranged:!!config.ranged,dash:!!config.dash,shieldType:!!config.shield,
    elite:false,burn:0,slow:0,wet:0,shield:config.shield?80:0,
    attackTimer:1.5,dashTimer:4,phase:1,phasePulse:0
  };
  S.enemies.push(boss);
  playSfx("boss");
  impactVfx(boss.x,boss.y,boss.color,"Light",true);
  notice("BOSS — " + boss.type);
}

/* =========================
   HEALING
========================= */

function heal(amount) {
  if (S.dead) return 0;

  const before = S.hp;

  S.hp =
    Math.min(
      100,
      S.hp + amount
    );

  const gained =
    Math.round(
      S.hp - before
    );

  if (gained > 0) {
    burst(
      S.x,
      S.y,
      "#8dffb0",
      25,
      35,
      1
    );
  }

  return gained;
}

/* =========================
   DAMAGE ENEMY
========================= */

function hurtEnemy(
  enemy,
  damage,
  color
) {
  if (
    enemy.shield > 0
  ) {
    const absorbed =
      Math.min(
        enemy.shield,
        damage
      );

    enemy.shield -= absorbed;
    damage -= absorbed;
  }

  if (damage > 0) {
    enemy.hp -= damage;
  }

  if (color) {
    burst(
      enemy.x,
      enemy.y,
      color,
      10
    );
  }
}

/* =========================
   POWER HELPERS
========================= */

function damageArea(
  radius,
  damage,
  color
) {
  for (
    const enemy of S.enemies
  ) {
    const distance =
      Math.hypot(
        enemy.x - S.x,
        enemy.y - S.y
      );

    if (
      distance <= radius
    ) {
      hurtEnemy(
        enemy,
        damage *
        (S.awakened ? 1.25 : 1),
        color
      );
    }
  }
}

function pushEnemies(
  radius,
  strength
) {
  for (
    const enemy of S.enemies
  ) {
    let dx =
      enemy.x - S.x;

    let dy =
      enemy.y - S.y;

    const distance =
      Math.hypot(dx, dy) || 1;

    if (
      distance <= radius
    ) {
      dx /= distance;
      dy /= distance;

      const resistance =
        enemy.type === "Tank" ||
        enemy.boss
          ? 0.35
          : 1;

      enemy.x +=
        dx *
        strength *
        resistance;

      enemy.y +=
        dy *
        strength *
        resistance;
    }
  }
}

function pullEnemies(
  radius,
  strength
) {
  for (
    const enemy of S.enemies
  ) {
    let dx =
      S.x - enemy.x;

    let dy =
      S.y - enemy.y;

    const distance =
      Math.hypot(dx, dy) || 1;

    if (
      distance <= radius
    ) {
      dx /= distance;
      dy /= distance;

      const resistance =
        enemy.boss
          ? 0.35
          : 1;

      enemy.x +=
        dx *
        strength *
        resistance;

      enemy.y +=
        dy *
        strength *
        resistance;
    }
  }
}

function createZone(
  type,
  color,
  radius,
  duration
) {
  S.zones.push({
    x: S.x,
    y: S.y,

    type,
    color,
    radius,

    life: duration,
    maxLife: duration,

    tick: 0
  });
}

/* =========================
   GENERATED POWER
========================= */

function generatedPower(magic) {
  const traits =
    magic.traits;

  let didSomething = false;

  if (
    traits.includes("heal") ||
    traits.includes("growth") ||
    traits.includes("purify")
  ) {
    heal(
      S.awakened
        ? 40
        : 25
    );

    didSomething = true;
  }

  if (
    traits.includes("burn") ||
    traits.includes("heat")
  ) {
    damageArea(
      180,
      13,
      magic.color
    );

    for (
      const enemy of S.enemies
    ) {
      if (
        Math.hypot(
          enemy.x - S.x,
          enemy.y - S.y
        ) < 180
      ) {
        enemy.burn =
          S.awakened
            ? 9
            : 5;
      }
    }

    didSomething = true;
  }

  if (
    traits.includes("push") ||
    traits.includes("impact")
  ) {
    pushEnemies(
      200,
      S.awakened
        ? 180
        : 100
    );

    didSomething = true;
  }

  if (
    traits.includes("control") ||
    traits.includes("mass")
  ) {
    pullEnemies(
      240,
      S.awakened
        ? 120
        : 70
    );

    didSomething = true;
  }

  if (
    traits.includes("freeze") ||
    traits.includes("cold")
  ) {
    for (
      const enemy of S.enemies
    ) {
      if (
        Math.hypot(
          enemy.x - S.x,
          enemy.y - S.y
        ) < 210
      ) {
        enemy.slow =
          S.awakened
            ? 9
            : 5;
      }
    }

    didSomething = true;
  }

  if (
    traits.includes("shock") ||
    traits.includes("energy")
  ) {
    damageArea(
      200,
      12,
      magic.color
    );

    didSomething = true;
  }

  if (
    traits.includes("drain") ||
    traits.includes("dark")
  ) {
    damageArea(
      165,
      10,
      magic.color
    );

    heal(
      S.awakened
        ? 18
        : 10
    );

    didSomething = true;
  }

  if (
    traits.includes("defense") ||
    traits.includes("solid")
  ) {
    S.ward =
      Math.max(
        S.ward,
        S.awakened
          ? 240
          : 120
      );

    didSomething = true;
  }

  if (!didSomething) {
    damageArea(
      170,
      16,
      magic.color
    );
  }

  burst(
    S.x,
    S.y,
    magic.color,
    70,
    40,
    1.8
  );

  notice(
    S.awakened
      ? "AWAKENED ARCANE POWER"
      : "ARCANE POWER"
  );
}

/* =========================
   POWER
========================= */

function usePower() {
  if (S.dead) return;

  if (
    S.powerCooldown > 0
  ) {
    notice(
      "Power recharging: " +
      Math.ceil(
        S.powerCooldown
      ) +
      "s"
    );

    return;
  }

  const manaCost =
    S.awakened
      ? 10
      : 25;

  if (
    S.mana < manaCost
  ) {
    notice(
      "Not enough mana"
    );

    return;
  }

  const name =
    S.selected;

  const magic =
    S.magic[name];

  S.mana -= manaCost;

  S.powerCooldown =
    S.awakened
      ? 2.5
      : 7;

  addAwakening(8);

  if (name === "Fire") {
    damageArea(
      S.awakened ? 230 : 150,
      S.awakened ? 24 : 10,
      magic.color
    );

    for (
      const enemy of S.enemies
    ) {
      if (
        Math.hypot(
          enemy.x - S.x,
          enemy.y - S.y
        ) <
        (
          S.awakened
            ? 230
            : 150
        )
      ) {
        enemy.burn =
          S.awakened
            ? 10
            : 5;
      }
    }

    burst(
      S.x,
      S.y,
      magic.color,
      S.awakened ? 100 : 50,
      40,
      2
    );

    notice(
      S.awakened
        ? "HELLFIRE BURST"
        : "FLAME BURST"
    );
  }

  else if (
    name === "Water"
  ) {
    const gained =
      heal(
        S.awakened
          ? 55
          : 30
      );

    notice(
      `RESTORING TIDE +${gained}`
    );
  }

  else if (
    name === "Wind"
  ) {
    pushEnemies(
      S.awakened ? 280 : 190,
      S.awakened ? 240 : 130
    );

    damageArea(
      180,
      S.awakened ? 18 : 5,
      magic.color
    );

    burst(
      S.x,
      S.y,
      magic.color,
      55,
      30,
      2
    );

    notice(
      S.awakened
        ? "SOVEREIGN GALE"
        : "GALE FORCE"
    );
  }

  else if (
    name === "Earth"
  ) {
    S.armor =
      S.awakened
        ? 14
        : 8;

    S.ward =
      Math.max(
        S.ward,
        S.awakened
          ? 420
          : 240
      );

    damageArea(
      130,
      S.awakened
        ? 20
        : 6,
      magic.color
    );

    notice(
      S.awakened
        ? "TITAN ARMOR"
        : "STONE ARMOR"
    );
  }

  else if (
    name === "Lightning"
  ) {
    const targets =
      [...S.enemies]
        .sort(
          (a,b) =>
            Math.hypot(
              a.x - S.x,
              a.y - S.y
            ) -
            Math.hypot(
              b.x - S.x,
              b.y - S.y
            )
        )
        .slice(
          0,
          S.awakened ? 8 : 4
        );

    targets.forEach(
      enemy => {
        hurtEnemy(
          enemy,
          S.awakened
            ? 32
            : 18,
          magic.color
        );
      }
    );

    notice(
      S.awakened
        ? "THUNDER GOD CHAIN"
        : "CHAIN LIGHTNING"
    );
  }

  else if (
    name === "Ice"
  ) {
    const radius =
      S.awakened
        ? 280
        : 180;

    for (
      const enemy of S.enemies
    ) {
      if (
        Math.hypot(
          enemy.x - S.x,
          enemy.y - S.y
        ) < radius
      ) {
        enemy.slow =
          S.awakened
            ? 12
            : 5;
      }
    }

    damageArea(
      radius,
      S.awakened
        ? 22
        : 8,
      magic.color
    );

    notice(
      S.awakened
        ? "ABSOLUTE ZERO"
        : "FROST NOVA"
    );
  }

  else if (
    name === "Light"
  ) {
    const gained =
      heal(
        S.awakened
          ? 70
          : 45
      );

    S.ward =
      Math.max(
        S.ward,
        S.awakened
          ? 300
          : 120
      );

    damageArea(
      180,
      S.awakened
        ? 20
        : 5,
      magic.color
    );

    notice(
      `RADIANT RESTORATION +${gained}`
    );
  }

  else if (
    name === "Shadow"
  ) {
    let drained = 0;

    for (
      const enemy of S.enemies
    ) {
      if (
        Math.hypot(
          enemy.x - S.x,
          enemy.y - S.y
        ) <
        (
          S.awakened
            ? 230
            : 160
        )
      ) {
        hurtEnemy(
          enemy,
          S.awakened
            ? 25
            : 12,
          magic.color
        );

        drained +=
          S.awakened
            ? 8
            : 4;
      }
    }

    heal(
      Math.min(
        drained,
        S.awakened
          ? 50
          : 25
      )
    );

    notice(
      S.awakened
        ? "NIGHT DEVOURER"
        : "SHADOW DRAIN"
    );
  }

  else if (
    name === "Force"
  ) {
    damageArea(
      S.awakened ? 240 : 170,
      S.awakened ? 22 : 8,
      magic.color
    );

    pushEnemies(
      S.awakened ? 240 : 170,
      S.awakened ? 300 : 180
    );

    notice(
      S.awakened
        ? "UNBOUND REPULSE"
        : "FORCE REPULSE"
    );
  }

  else if (
    name === "Magma"
  ) {
    createZone(
      "damage",
      magic.color,
      S.awakened ? 170 : 105,
      S.awakened ? 12 : 8
    );

    notice(
      "MOLTEN DOMAIN"
    );
  }

  else if (
    name === "Inferno"
  ) {
    damageArea(
      S.awakened ? 280 : 200,
      S.awakened ? 32 : 18,
      magic.color
    );

    for (
      const enemy of S.enemies
    ) {
      if (
        Math.hypot(
          enemy.x - S.x,
          enemy.y - S.y
        ) <
        (
          S.awakened
            ? 280
            : 200
        )
      ) {
        enemy.burn =
          S.awakened
            ? 12
            : 7;
      }
    }

    pullEnemies(
      250,
      S.awakened ? 100 : 45
    );

    notice(
      "INFERNO VORTEX"
    );
  }

  else if (
    name === "Storm"
  ) {
    for (
      const enemy of S.enemies
    ) {
      if (
        Math.hypot(
          enemy.x - S.x,
          enemy.y - S.y
        ) <
        (
          S.awakened
            ? 320
            : 240
        )
      ) {
        enemy.wet = 8;

        hurtEnemy(
          enemy,
          S.awakened
            ? 30
            : 16,
          magic.color
        );
      }
    }

    notice(
      "TEMPEST CHAIN"
    );
  }

  else if (
    name === "Glacier"
  ) {
    damageArea(
      S.awakened ? 300 : 220,
      S.awakened ? 26 : 12,
      magic.color
    );

    for (
      const enemy of S.enemies
    ) {
      if (
        Math.hypot(
          enemy.x - S.x,
          enemy.y - S.y
        ) <
        (
          S.awakened
            ? 300
            : 220
        )
      ) {
        enemy.slow =
          S.awakened
            ? 14
            : 8;
      }
    }

    notice(
      "GLACIAL PRISON"
    );
  }

  else if (
    name === "Solar"
  ) {
    damageArea(
      S.awakened ? 330 : 240,
      S.awakened ? 50 : 30,
      magic.color
    );

    burst(
      S.x,
      S.y,
      magic.color,
      S.awakened ? 160 : 100,
      45,
      2.5
    );

    notice(
      S.awakened
        ? "STARBORN ERUPTION"
        : "SOLAR ERUPTION"
    );
  }

  else if (
    name === "Blackflame"
  ) {
    let drained = 0;

    for (
      const enemy of S.enemies
    ) {
      if (
        Math.hypot(
          enemy.x - S.x,
          enemy.y - S.y
        ) <
        (
          S.awakened
            ? 260
            : 190
        )
      ) {
        hurtEnemy(
          enemy,
          S.awakened
            ? 30
            : 14,
          magic.color
        );

        enemy.burn =
          S.awakened
            ? 14
            : 8;

        drained += 5;
      }
    }

    heal(
      Math.min(
        drained,
        S.awakened
          ? 50
          : 30
      )
    );

    notice(
      "ABYSSAL FLAME"
    );
  }

  else if (
    name === "Gravity"
  ) {
    pullEnemies(
      S.awakened ? 380 : 280,
      S.awakened ? 220 : 150
    );

    createZone(
      "gravity",
      magic.color,
      S.awakened ? 210 : 140,
      S.awakened ? 10 : 6
    );

    notice(
      "GRAVITY WELL"
    );
  }

  else if (
    name === "Plasma"
  ) {
    const targets =
      [...S.enemies]
        .sort(
          (a,b) =>
            Math.hypot(
              a.x - S.x,
              a.y - S.y
            ) -
            Math.hypot(
              b.x - S.x,
              b.y - S.y
            )
        )
        .slice(
          0,
          S.awakened ? 9 : 5
        );

    targets.forEach(
      enemy => {
        hurtEnemy(
          enemy,
          S.awakened
            ? 45
            : 26,
          magic.color
        );
      }
    );

    notice(
      "PLASMA LANCE"
    );
  }

  else if (
    name === "Nature"
  ) {
    createZone(
      "heal",
      magic.color,
      S.awakened ? 180 : 120,
      S.awakened ? 15 : 10
    );

    for (
      const enemy of S.enemies
    ) {
      if (
        Math.hypot(
          enemy.x - S.x,
          enemy.y - S.y
        ) < 220
      ) {
        enemy.slow = 7;
      }
    }

    notice(
      "LIVING SANCTUARY"
    );
  }

  else if (
    name === "Void"
  ) {
    pullEnemies(
      S.awakened ? 380 : 260,
      S.awakened ? 220 : 120
    );

    createZone(
      "void",
      magic.color,
      S.awakened ? 200 : 130,
      S.awakened ? 11 : 7
    );

    notice(
      S.awakened
        ? "EVENT HORIZON"
        : "VOID COLLAPSE"
    );
  }

  else {
    generatedPower(
      magic
    );
  }
}

/* =========================
   DEATH + REAL RESPAWN UI
========================= */

const deathOverlay =
  document.createElement("div");

deathOverlay.id =
  "deathOverlay";

Object.assign(
  deathOverlay.style,
  {
    position: "fixed",
    inset: "0",
    zIndex: "500",
    background: "rgba(5,4,12,.86)",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    textAlign: "center",
    color: "white",
    touchAction: "none"
  }
);

const deathTitle =
  document.createElement("div");

deathTitle.textContent =
  "YOU DIED";

Object.assign(
  deathTitle.style,
  {
    fontSize: "42px",
    fontWeight: "900",
    textShadow:
      "0 0 30px #9d6cff"
  }
);

const deathSubtitle =
  document.createElement("div");

deathSubtitle.textContent =
  "Your magic awaits rebirth";

Object.assign(
  deathSubtitle.style,
  {
    marginTop: "10px",
    color: "#c8c0df",
    fontSize: "17px"
  }
);

const respawnButton =
  document.createElement("button");

respawnButton.textContent =
  "RESPAWN";

Object.assign(
  respawnButton.style,
  {
    marginTop: "38px",
    width: "180px",
    height: "56px",
    border: "1px solid #bda9ff",
    borderRadius: "16px",
    background: "#6f48c9",
    color: "#fff",
    fontWeight: "900",
    fontSize: "18px",
    boxShadow:
      "0 0 25px #9d6cff88",
    touchAction: "none"
  }
);

deathOverlay.appendChild(
  deathTitle
);

deathOverlay.appendChild(
  deathSubtitle
);

deathOverlay.appendChild(
  respawnButton
);

document.body.appendChild(
  deathOverlay
);

function die() {
  if (S.dead) return;

  S.hp = 0;
  S.dead = true;

  S.deathTimer = 0;
  S.deathScreen = false;

  resetJoystick();

  S.shots = [];
  S.enemyShots = [];

  S.ward = 0;

  const magic =
    S.magic[S.selected];

  burst(
    S.x,
    S.y,
    magic.color,
    85,
    55,
    2.2
  );

  burst(
    S.x,
    S.y,
    "#ffffff",
    40,
    45,
    1.5
  );
}

function respawn() {
  S.hp = 100;
  S.mana = 100;

  S.x = 0;
  S.y = 0;

  S.dead = false;

  S.deathTimer = 0;
  S.deathScreen = false;

  S.enemies = [];
  S.enemyShots = [];
  S.shots = [];
  S.zones = [];

  S.ward = 0;
  S.armor = 0;

  S.powerCooldown = 0;

  S.awakening = 0;
  S.awakened = false;
  S.awakeningTime = 0;

  deathOverlay.style.display =
    "none";

  resetJoystick();

  const magic =
    S.magic[S.selected];

  burst(
    S.x,
    S.y,
    magic.color,
    90,
    50,
    2
  );

  burst(
    S.x,
    S.y,
    "#ffffff",
    35,
    40,
    1.3
  );

  notice(
    "MAGIC REFORMED"
  );
}

respawnButton.addEventListener(
  "pointerdown",
  event => {
    event.preventDefault();
    event.stopPropagation();

    if (
      S.deathScreen
    ) {
      respawn();
    }
  },
  { passive: false }
);

/* =========================
   NORMAL COMBAT
========================= */

function castSpell() {
  if (S.dead) return;

  const cost =
    S.awakened
      ? 7
      : 10;

  if (
    S.mana < cost
  ) {
    notice(
      "Not enough mana"
    );

    return;
  }

  S.mana -= cost;

  addAwakening(3);

  let target = null;
  let closest = Infinity;

  for (
    const enemy of S.enemies
  ) {
    const distance =
      Math.hypot(
        enemy.x - S.x,
        enemy.y - S.y
      );

    if (
      distance < closest
    ) {
      closest = distance;
      target = enemy;
    }
  }

  let dx = joystick.x;
  let dy = joystick.y;

  if (target) {
    dx =
      target.x - S.x;

    dy =
      target.y - S.y;
  }

  if (
    Math.abs(dx) +
    Math.abs(dy) <
    0.1
  ) {
    dx = 1;
    dy = 0;
  }

  const distance =
    Math.hypot(dx, dy) || 1;

  dx /= distance;
  dy /= distance;
  facePlayer(dx, dy, true);
  playSfx("cast",S.selected);
  impactVfx(S.x,S.y,S.magic[S.selected].color,S.selected);

  const magic =
    S.magic[S.selected];

  const count =
    S.awakened
      ? 2
      : 1;

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const spread =
      count === 1
        ? 0
        : (i - 1) * 0.16;

    const cos =
      Math.cos(spread);

    const sin =
      Math.sin(spread);

    const sx =
      dx * cos -
      dy * sin;

    const sy =
      dx * sin +
      dy * cos;

    S.shots.push({
      x: S.x,
      y: S.y,

      vx:
        sx *
        (S.awakened ? 11 : 9),

      vy:
        sy *
        (S.awakened ? 11 : 9),

      life:
        S.awakened
          ? 80
          : 65,

      power:
        S.awakened
          ? 18
          : 14,

      color:
        magic.color,

      magicName:
        S.selected,

      traits:
        [...magic.traits]
    });
  }

  burst(
    S.x,
    S.y,
    magic.color,
    S.awakened
      ? 18
      : 8
  );
}

function activateWard() {
  if (S.dead) return;

  if (S.mana < 15) {
    notice(
      "Not enough mana"
    );

    return;
  }

  S.mana -= 15;

  S.ward =
    S.awakened
      ? 220
      : 120;

  addAwakening(2);

  burst(
    S.x,
    S.y,
    "#b8a8ff",
    16
  );
}

function dodge() {
  if (S.dead) return;

  let dx =
    joystick.x;

  let dy =
    joystick.y;

  if (
    Math.abs(dx) +
    Math.abs(dy) <
    0.1
  ) {
    dx = 1;
    dy = 0;
  }

  const distance =
    Math.hypot(dx, dy) || 1;

  dx /= distance;
  dy /= distance;

  S.x +=
    dx *
    (
      S.awakened
        ? 130
        : 90
    );

  S.y +=
    dy *
    (
      S.awakened
        ? 130
        : 90
    );

  addAwakening(1);
  playSfx("dodge",S.selected);
  impactVfx(S.x,S.y,S.magic[S.selected].color,S.selected);

  burst(
    S.x,
    S.y,
    "#ffffff",
    10
  );
}

function nextMagic() {
  if (S.dead) return;

  const magics =
    Object.keys(S.magic);

  if (!magics.length) return;

  let index =
    magics.indexOf(
      S.selected
    );

  index =
    (index + 1) %
    magics.length;

  S.selected =
    magics[index];

  updateHUD();
}

/* =========================
   POWER BUTTON
========================= */

let powerButton =
  document.querySelector("#power");

if (!powerButton) {
  powerButton =
    document.createElement("button");

  powerButton.id =
    "power";

  powerButton.textContent =
    "POWER";

  Object.assign(
    powerButton.style,
    {
      position: "fixed",
      right: "22px",
      bottom: "205px",
      width: "88px",
      height: "52px",
      borderRadius: "18px",
      border:
        "1px solid rgba(255,255,255,.25)",
      background:
        "rgba(111,72,201,.85)",
      color: "white",
      fontWeight: "800",
      zIndex: "61"
    }
  );

  document.body.appendChild(
    powerButton
  );
}

/* =========================
   MULTITOUCH BUTTONS
========================= */

function bindGameButton(
  element,
  action
) {
  if (!element) return;

  element.style.touchAction =
    "none";

  element.style.userSelect =
    "none";

  element.style.webkitUserSelect =
    "none";

  element.style.webkitTouchCallout =
    "none";

  element.addEventListener(
    "pointerdown",
    event => {
      event.preventDefault();
      event.stopPropagation();

      if (S.dead) return;

      action();
    },
    { passive: false }
  );
}

bindGameButton(
  document.querySelector("#cast"),
  castSpell
);

bindGameButton(
  document.querySelector("#ward"),
  activateWard
);

bindGameButton(
  document.querySelector("#dodge"),
  dodge
);

bindGameButton(
  document.querySelector("#cycle"),
  nextMagic
);

bindGameButton(
  powerButton,
  usePower
);

bindGameButton(
  awakenButton,
  awaken
);

/* =========================
   ENEMY PROJECTILES
========================= */

function enemyShoot(enemy) {
  const dx =
    S.x - enemy.x;

  const dy =
    S.y - enemy.y;

  const distance =
    Math.hypot(dx, dy) || 1;

  S.enemyShots.push({
    x: enemy.x,
    y: enemy.y,

    vx:
      dx /
      distance *
      (enemy.boss ? 5 : 4),

    vy:
      dy /
      distance *
      (enemy.boss ? 5 : 4),

    life: 130,

    damage:
      enemy.boss
        ? 16
        : 9,

    color:
      enemy.color,

    r:
      enemy.boss
        ? 9
        : 6
  });
}

/* =========================
   GAME UPDATE
========================= */

let previousTime =
  performance.now();

let enemyTimer = 0;

let bossKillTarget = 20;

function update(time) {
  if (typeof v18MusicTick === "function") v18MusicTick();
if ((typeof menuOpen !== "undefined" && menuOpen) || (typeof afPauseState !== "undefined" && afPauseState.active)) {
  previousTime = time;
  drawWorld();
  updateHUD();
  requestAnimationFrame(update);
  return;
}
  const delta =
    Math.min(
      0.033,
      (
        time -
        previousTime
      ) /
      1000
    );
    
  previousTime = time;

  if (
    multiplayerChannel &&
    multiplayerRoom
  ) {
    multiplayerSendTimer += delta;

    if (multiplayerSendTimer >= 0.1) {
      multiplayerSendTimer = 0;
      sendPlayerState();
    }

    const now = performance.now();

    for (
      const [id, player] of
        multiplayerPlayers
    ) {
      if (
        now - player.lastSeen >
        10000
      ) {
        multiplayerPlayers.delete(id);
      }
    }
  }

  if ((v18Testing.active || afOwnerLocalAllowed()) && v18Testing.invincible) S.hp = Math.max(1,S.hp);
  if ((v18Testing.active || afOwnerLocalAllowed()) && v18Testing.infiniteMana) S.mana = 100;
  if (
    S.hp <= 0 &&
    !S.dead
  ) {
    die();
  }

  if (S.dead) {
    S.deathTimer +=
      delta;

    if (
      S.deathTimer >= 1.15 &&
      !S.deathScreen
    ) {
      S.deathScreen = true;

      deathOverlay.style.display =
        "flex";
    }
  }

  if (!S.dead) {

    /* MOVEMENT */

    const moveSpeed =
      S.awakened
        ? 205
        : 180;

    S.x +=
      joystick.x *
      moveSpeed *
      delta;

    S.y +=
      joystick.y *
      moveSpeed *
      delta;

    if (performance.now() >= playerAimUntil) {
      facePlayer(joystick.x, joystick.y);
    }

    /* MANA */

    S.mana =
      Math.min(
        100,
        S.mana +
        (
          S.awakened
            ? 15
            : 8
        ) *
        delta
      );

    /* AWAKENING */

    if (S.awakened) {
      S.awakeningTime -=
        delta;

      if (
        S.awakeningTime <= 0
      ) {
        S.awakened = false;
        S.awakeningTime = 0;

        notice(
          "AWAKENING ENDED"
        );
      }
    }

    awakenFill.style.width =
      S.awakened
        ? (
            S.awakeningTime /
            7 *
            100
          ) + "%"
        : S.awakening + "%";

    awakenButton.style.display =
      (
        S.awakening >= 100 &&
        !S.awakened
      )
        ? "block"
        : "none";

    /* POWER COOLDOWN */

    if (
      S.powerCooldown > 0
    ) {
      S.powerCooldown =
        Math.max(
          0,
          S.powerCooldown -
          delta
        );
    }

    powerButton.textContent =
      S.powerCooldown > 0
        ? Math.ceil(
            S.powerCooldown
          )
        : "POWER";

    if (S.ward > 0) {
      S.ward--;
    }

    if (S.armor > 0) {
      S.armor -= delta;
    }

    /* SPAWNING */

    if (!v18Testing.active) enemyTimer += delta;

    const maxEnemies =
      Math.min(
        14,
        7 +
        Math.floor(
          S.rank / 2
        )
      );

    const spawnDelay =
      Math.max(
        1.6,
        3.1 -
        S.rank *
        0.08
      );

    if (
      enemyTimer >
        spawnDelay &&
      S.enemies.length <
        maxEnemies
    ) {
      spawnEnemy();

      enemyTimer = 0;
    }

    if (
      S.kills >=
      !v18Testing.active && bossKillTarget &&
      !S.enemies.some(enemy => enemy.boss)
    ) {
      spawnMiniBoss();

      bossKillTarget += 25;
    }

    /* ENEMIES */

    for (
      const enemy of S.enemies
    ) {
      let dx =
        S.x - enemy.x;

      let dy =
        S.y - enemy.y;

      let distance =
        Math.hypot(
          dx,
          dy
        ) || 1;

      const slowMultiplier =
        enemy.slow > 0
          ? 0.35
          : 1;

      if (enemy.boss && enemy.phase === 1 && enemy.hp <= enemy.maxHp*.5) {
        enemy.phase = 2;
        enemy.speed *= 1.18;
        enemy.phasePulse = 1;
        impactVfx(enemy.x,enemy.y,enemy.color,"Light",true);
        playSfx("boss");
        notice(enemy.type + " — PHASE TWO");
      }
      if (enemy.phasePulse > 0) enemy.phasePulse = Math.max(0,enemy.phasePulse-delta);

      /* WARDEN SHIELD */

      if (
        enemy.shieldType
      ) {
        enemy.attackTimer -=
          delta;

        if (
          enemy.attackTimer <= 0
        ) {
          enemy.shield =
            enemy.boss
              ? 100
              : 35;

          enemy.attackTimer =
            enemy.boss
              ? 5
              : 7;
        }
      }

      /* MAGE / BOSS RANGE */

      if (
        enemy.ranged
      ) {
        enemy.attackTimer -=
          delta;

        if (
          distance > 220
        ) {
          enemy.x +=
            dx /
            distance *
            enemy.speed *
            slowMultiplier *
            delta;

          enemy.y +=
            dy /
            distance *
            enemy.speed *
            slowMultiplier *
            delta;
        }

        else if (
          distance < 150
        ) {
          enemy.x -=
            dx /
            distance *
            enemy.speed *
            0.65 *
            delta;

          enemy.y -=
            dy /
            distance *
            enemy.speed *
            0.65 *
            delta;
        }

        if (
          enemy.attackTimer <= 0
        ) {
          enemyShoot(enemy);

          if (enemy.boss && enemy.phase === 2) {
            const shots = enemy.bossStyle === "titan" ? 7 : 4;
            const velocity = enemy.bossStyle === "wyrm" ? 5.5 : 4;
            for (let i=0;i<shots;i++) {
              const a = Math.atan2(S.y-enemy.y,S.x-enemy.x)+(i-(shots-1)/2)*.20;
              S.enemyShots.push({x:enemy.x,y:enemy.y,
                vx:Math.cos(a)*velocity,vy:Math.sin(a)*velocity,
                life:110,damage:enemy.bossStyle === "titan" ? 14 : 11,
                color:enemy.color,r:7});
            }
            impactVfx(enemy.x,enemy.y,enemy.color,"Lightning");
          }
          enemy.attackTimer = enemy.boss ? (enemy.phase === 2 ? 1.25 : 1.8) : 2.2;
        }
      }

      else {
        enemy.x +=
          dx /
          distance *
          enemy.speed *
          slowMultiplier *
          delta;

        enemy.y +=
          dy /
          distance *
          enemy.speed *
          slowMultiplier *
          delta;
      }

      /* DASHERS */

      if (
        enemy.dash
      ) {
        enemy.dashTimer -=
          delta;

        if (
          enemy.dashTimer <= 0 &&
          distance < 330
        ) {
          enemy.x +=
            dx /
            distance *
            (
              enemy.boss
                ? 150
                : 95
            );

          enemy.y +=
            dy /
            distance *
            (
              enemy.boss
                ? 150
                : 95
            );

          burst(
            enemy.x,
            enemy.y,
            enemy.color,
            15
          );

          enemy.dashTimer =
            enemy.boss
              ? 3
              : 4;
        }
      }

      /* STATUS */

      if (
        enemy.slow > 0
      ) {
        enemy.slow -= delta;
      }

      if (
        enemy.wet > 0
      ) {
        enemy.wet -= delta;
      }

      if (
        enemy.burn > 0
      ) {
        enemy.burn -= delta;

        enemy.hp -=
          (
            enemy.wet > 0
              ? 4
              : 3
          ) *
          delta;
      }

      /* CONTACT */

      dx =
        S.x - enemy.x;

      dy =
        S.y - enemy.y;

      distance =
        Math.hypot(
          dx,
          dy
        );

      if (
        distance <
        enemy.r + 14 &&
        S.ward <= 0
      ) {
        const armorMultiplier =
          S.armor > 0
            ? 0.35
            : 1;

        const damage =
          enemy.damage *
          armorMultiplier *
          delta;

        damagePlayer(
          damage
        );

        addAwakening(
          4 * delta
        );

        if (
          enemy.leech
        ) {
          enemy.hp =
            Math.min(
              enemy.maxHp,
              enemy.hp +
              damage *
              0.6
            );
        }

        if (
          enemy.element ===
          "Ice"
        ) {
          joystick.x *= 0.98;
          joystick.y *= 0.98;
        }
      }
    }

    /* ENEMY PROJECTILES */

    for (
      const shot of
        S.enemyShots
    ) {
      shot.x += shot.vx;
      shot.y += shot.vy;

      shot.life--;

      const distance =
        Math.hypot(
          shot.x - S.x,
          shot.y - S.y
        );

      if (
        distance <
        shot.r + 14
      ) {
        if (
          S.ward <= 0
        ) {
          const armorMultiplier =
            S.armor > 0
              ? 0.35
              : 1;

          damagePlayer(
            shot.damage *
            armorMultiplier
          );

          addAwakening(4);
        }

        shot.life = 0;

        burst(
          shot.x,
          shot.y,
          shot.color,
          12
        );
      }
    }

    S.enemyShots =
      S.enemyShots.filter(
        shot =>
          shot.life > 0
      );

    /* ZONES */

    for (
      const zone of S.zones
    ) {
      zone.life -= delta;
      zone.tick -= delta;

      if (
        zone.type ===
        "gravity"
      ) {
        for (
          const enemy of
            S.enemies
        ) {
          const dx =
            zone.x -
            enemy.x;

          const dy =
            zone.y -
            enemy.y;

          const distance =
            Math.hypot(
              dx,
              dy
            ) || 1;

          if (
            distance <
            zone.radius
          ) {
            enemy.x +=
              dx /
              distance *
              45 *
              delta;

            enemy.y +=
              dy /
              distance *
              45 *
              delta;
          }
        }
      }

      if (
        zone.tick <= 0
      ) {
        zone.tick = 0.5;

        if (
          zone.type ===
            "damage" ||
          zone.type ===
            "void"
        ) {
          for (
            const enemy of
              S.enemies
          ) {
            const distance =
              Math.hypot(
                enemy.x -
                  zone.x,

                enemy.y -
                  zone.y
              );

            if (
              distance <
              zone.radius
            ) {
              hurtEnemy(
                enemy,
                zone.type ===
                  "void"
                  ? 8
                  : 7,
                zone.color
              );
            }
          }
        }

        if (
          zone.type ===
          "heal"
        ) {
          const distance =
            Math.hypot(
              S.x - zone.x,
              S.y - zone.y
            );

          if (
            distance <
            zone.radius
          ) {
            heal(
              S.awakened
                ? 7
                : 4
            );
          }
        }
      }
    }

    S.zones =
      S.zones.filter(
        zone =>
          zone.life > 0
      );

    /* PLAYER SHOTS */

    for (
      const shot of S.shots
    ) {
      shot.x += shot.vx;
      shot.y += shot.vy;

      shot.life--;

      for (
        const enemy of
          S.enemies
      ) {
        const distance =
          Math.hypot(
            shot.x -
              enemy.x,

            shot.y -
              enemy.y
          );

        if (
          distance <
          enemy.r + 8
        ) {
          hurtEnemy(
            enemy,
            shot.power,
            shot.color
          );
          impactVfx(shot.x,shot.y,shot.color,shot.magicName);
          if (performance.now()-lastImpactSound>100) {
            lastImpactSound=performance.now();
            playSfx("impact",shot.magicName);
          }

          shot.life = 0;

          addAwakening(2);

          break;
        }
      }
    }

    /* DEFEATED */

    const defeated =
      S.enemies.filter(
        enemy =>
          enemy.hp <= 0
      );

    if (
      defeated.length
    ) {
      for (
        const enemy of
          defeated
      ) {
        S.essence +=
          enemy.essence || 1;

        S.xp +=
          enemy.xp || 10;

        S.kills++;

        addAwakening(
          enemy.boss
            ? 35
            : enemy.elite
              ? 12
              : 6
        );

        burst(
          enemy.x,
          enemy.y,
          enemy.color ||
            "#ffffff",
          enemy.boss
            ? 100
            : 25,
          enemy.boss
            ? 60
            : 30,
          enemy.boss
            ? 2.5
            : 1
        );

        if (enemy.boss) {
          playSfx("boss");
          impactVfx(enemy.x,enemy.y,enemy.color,"Light",true);
          notice(
            enemy.type + " DEFEATED"
          );
        }
      }

      S.rank =
        1 +
        Math.floor(
          S.xp / 100
        );

      saveGame();
    }

    S.enemies =
      S.enemies.filter(
        enemy =>
          enemy.hp > 0
      );

    S.shots =
      S.shots.filter(
        shot =>
          shot.life > 0
      );

    if (
      S.hp <= 0
    ) {
      die();
    }
  }

  /* PARTICLES */

  for (
    const particle of
      S.particles
  ) {
    particle.x +=
      particle.vx;

    particle.y +=
      particle.vy;

    particle.vx *= 0.96;
    particle.vy *= 0.96;

    particle.life--;
  }

  S.particles =
    S.particles.filter(
      particle =>
        particle.life > 0
    );

  drawWorld();
  updateHUD();
  updateBossHUD();

  requestAnimationFrame(
    update
  );
}

/* =========================
   DRAW WORLD
========================= */


function projectileVisualType(
  shot
) {
  const name =
    shot.magicName || "";

  const traits =
    shot.traits || [];

  if (
    name === "Ice" ||
    traits.includes("freeze") ||
    traits.includes("cold")
  ) return "ice";

  if (
    name === "Shadow" ||
    traits.includes("dark") ||
    traits.includes("drain")
  ) return "shadow";

  if (
    name === "Lightning" ||
    traits.includes("shock")
  ) return "lightning";

  if (
    name === "Earth" ||
    traits.includes("stone") ||
    traits.includes("solid")
  ) return "earth";

  if (
    name === "Wind" ||
    traits.includes("air")
  ) return "wind";

  if (
    name === "Water" ||
    traits.includes("wet") ||
    traits.includes("flow")
  ) return "water";

  if (
    name === "Light" ||
    traits.includes("radiant") ||
    traits.includes("purify")
  ) return "light";

  if (
    name === "Force" ||
    traits.includes("impact") ||
    traits.includes("push") ||
    traits.includes("control")
  ) return "force";

  return "fire";
}

function drawSpellProjectile(
  shot
) {
  const size =
    S.awakened ? 12 : 9;

  const angle =
    Math.atan2(
      shot.vy,
      shot.vx
    );

  const type =
    projectileVisualType(
      shot
    );

  ctx.save();

  ctx.translate(
    shot.x,
    shot.y
  );

  ctx.rotate(angle);

  ctx.shadowBlur = 25;
  ctx.shadowColor =
    shot.color;

  ctx.fillStyle =
    shot.color;

  ctx.strokeStyle =
    shot.color;

  ctx.lineWidth = 3;

  if (type === "ice") {
    ctx.beginPath();
    ctx.moveTo(size * 1.8, 0);
    ctx.lineTo(-size * .7, -size * .65);
    ctx.lineTo(-size * .25, 0);
    ctx.lineTo(-size * .7, size * .65);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#ffffffaa";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  else if (
    type === "shadow"
  ) {
    ctx.globalAlpha = .85;

    ctx.beginPath();
    ctx.moveTo(size * 1.2, 0);
    ctx.bezierCurveTo(
      size * .25,
      -size * 1.15,
      -size * .7,
      -size * .65,
      -size * 1.35,
      -size * .2
    );
    ctx.bezierCurveTo(
      -size * .6,
      0,
      -size * 1.15,
      size * .65,
      -size * .25,
      size * .8
    );
    ctx.bezierCurveTo(
      size * .45,
      size * .65,
      size * .8,
      size * .35,
      size * 1.2,
      0
    );
    ctx.fill();

    ctx.globalAlpha = .35;
    ctx.beginPath();
    ctx.arc(
      -size * .8,
      0,
      size * .75,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  else if (
    type === "lightning"
  ) {
    ctx.lineWidth =
      S.awakened ? 5 : 4;

    ctx.beginPath();
    ctx.moveTo(-size * 1.5, 0);
    ctx.lineTo(-size * .55, -size * .55);
    ctx.lineTo(-size * .1, size * .25);
    ctx.lineTo(size * .55, -size * .45);
    ctx.lineTo(size * 1.55, 0);
    ctx.stroke();

    ctx.strokeStyle =
      "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  else if (
    type === "earth"
  ) {
    ctx.beginPath();
    ctx.moveTo(size * 1.15, 0);
    ctx.lineTo(size * .45, size * .85);
    ctx.lineTo(-size * .55, size * .7);
    ctx.lineTo(-size * 1.1, size * .05);
    ctx.lineTo(-size * .55, -size * .8);
    ctx.lineTo(size * .45, -size * .65);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle =
      "#ffffff55";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  else if (
    type === "wind"
  ) {
    ctx.lineWidth =
      S.awakened ? 5 : 3;

    ctx.beginPath();
    ctx.arc(
      0,
      0,
      size,
      -.85,
      .85
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(
      -size * .35,
      0,
      size * .7,
      -.8,
      .8
    );
    ctx.stroke();
  }

  else if (
    type === "water"
  ) {
    ctx.beginPath();
    ctx.moveTo(size * 1.25, 0);
    ctx.bezierCurveTo(
      size * .2,
      -size * 1.1,
      -size,
      -size * .65,
      -size * .9,
      0
    );
    ctx.bezierCurveTo(
      -size,
      size * .65,
      size * .2,
      size * 1.1,
      size * 1.25,
      0
    );
    ctx.fill();

    ctx.fillStyle =
      "#ffffff77";
    ctx.beginPath();
    ctx.arc(
      size * .2,
      -size * .25,
      size * .22,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  else if (
    type === "light"
  ) {
    ctx.beginPath();

    for (
      let i = 0;
      i < 8;
      i++
    ) {
      const a =
        i * Math.PI / 4;

      const r =
        i % 2 === 0
          ? size * 1.4
          : size * .45;

      const x =
        Math.cos(a) * r;

      const y =
        Math.sin(a) * r;

      if (i === 0)
        ctx.moveTo(x, y);
      else
        ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();

    ctx.fillStyle =
      "#ffffff";
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      size * .35,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  else if (
    type === "force"
  ) {
    ctx.lineWidth =
      S.awakened ? 5 : 3;

    ctx.beginPath();
    ctx.arc(
      0,
      0,
      size,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.globalAlpha = .45;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      size * .55,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  else {
    /* FIRE */
    ctx.beginPath();
    ctx.moveTo(size * 1.35, 0);
    ctx.bezierCurveTo(
      size * .45,
      -size * 1.05,
      -size * .15,
      -size * .55,
      -size * 1.25,
      -size * .85
    );
    ctx.bezierCurveTo(
      -size * .85,
      -size * .15,
      -size * 1.35,
      size * .15,
      -size * .7,
      size * .75
    );
    ctx.bezierCurveTo(
      0,
      size * 1.05,
      size * .65,
      size * .65,
      size * 1.35,
      0
    );
    ctx.fill();
  }

  ctx.restore();
}

function drawArcaneSentinel(
  enemy,
  enemyColor
) {
  ctx.save();

  ctx.translate(
    enemy.x,
    enemy.y
  );

  ctx.shadowBlur = 35;
  ctx.shadowColor =
    enemyColor;

  /* floating lower crystal */
  ctx.fillStyle =
    enemyColor;

  ctx.beginPath();
  ctx.moveTo(0, 54);
  ctx.lineTo(-15, 26);
  ctx.lineTo(0, 8);
  ctx.lineTo(15, 26);
  ctx.closePath();
  ctx.fill();

  /* armored torso */
  ctx.fillStyle =
    "#321d4d";

  ctx.beginPath();
  ctx.moveTo(-34, -18);
  ctx.lineTo(-23, 27);
  ctx.lineTo(0, 42);
  ctx.lineTo(23, 27);
  ctx.lineTo(34, -18);
  ctx.lineTo(0, -38);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle =
    enemyColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  /* shoulders */
  ctx.fillStyle =
    "#5c337d";

  ctx.beginPath();
  ctx.moveTo(-30, -13);
  ctx.lineTo(-57, -4);
  ctx.lineTo(-43, 16);
  ctx.lineTo(-22, 10);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(30, -13);
  ctx.lineTo(57, -4);
  ctx.lineTo(43, 16);
  ctx.lineTo(22, 10);
  ctx.closePath();
  ctx.fill();

  /* horned head */
  ctx.fillStyle =
    "#171020";

  ctx.beginPath();
  ctx.moveTo(-20, -35);
  ctx.lineTo(-31, -62);
  ctx.lineTo(-8, -50);
  ctx.lineTo(0, -59);
  ctx.lineTo(8, -50);
  ctx.lineTo(31, -62);
  ctx.lineTo(20, -35);
  ctx.lineTo(0, -22);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle =
    enemyColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  /* arcane core */
  ctx.fillStyle =
    "#ffffff";

  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(10, 4);
  ctx.lineTo(0, 17);
  ctx.lineTo(-10, 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/* =========================
   V1.6 ELEMENT PLAYER SHAPES
========================= */

function playerElement(magicName) {
  const magic = S.magic[magicName] || S.magic.Fire;
  const parents = magic.parents || [];
  const schools = ["Fire", "Water", "Wind", "Earth", "Lightning", "Ice", "Light", "Shadow", "Force"];
  const elements = parents.length
    ? parents.flatMap(parent => {
        const m = S.magic[parent];
        return m && m.parents && m.parents.length ? m.parents : [parent];
      })
    : [magicName];
  const unique = [...new Set(elements.filter(name => schools.includes(name)))];
  return { primary: unique[0] || "Fire", secondary: unique[1] || null,
    tertiary: unique[2] || null, color: magic.color };
}

function drawBossBody(enemy,color) {
  if (enemy.bossStyle === "sentinel") {
    drawArcaneSentinel(enemy,color);
    return;
  }
  const t = performance.now()*.001;
  const r = enemy.r;
  ctx.save(); ctx.translate(enemy.x,enemy.y);
  ctx.shadowBlur=28;ctx.shadowColor=color;
  ctx.strokeStyle=color;ctx.lineWidth=3;
  const phase = enemy.phase===2 ? 1.22 : 1;
  ctx.scale(phase,phase);
  function poly(points,fill,stroke=true) {
    ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke)ctx.stroke();
  }
  if (enemy.bossStyle === "wyrm") {
    for(let i=5;i>=0;i--) {
      const x=-i*12,y=Math.sin(t*3-i*.65)*12;
      poly([[x-13,y],[x,y-12],[x+14,y],[x,y+12]],i%2?"#24465f":"#3d7792");
    }
    poly([[-15,-17],[12,-31],[35,-14],[43,0],[24,20],[-15,17]],"#b7f4ff");
    poly([[7,-22],[3,-49],[20,-30]],"#e5ffff");
    poly([[24,-17],[35,-40],[35,-8]],"#e5ffff");
    poly([[25,3],[39,8],[21,12]],"#17354a",false);
  } else if(enemy.bossStyle === "golem") {
    poly([[-32,-32],[27,-36],[39,14],[18,38],[-25,35],[-40,7]],"#59352c");
    poly([[-40,-28],[-63,-17],[-59,18],[-38,27],[-28,2]],"#805345");
    poly([[37,-29],[62,-17],[60,18],[39,27],[28,2]],"#805345");
    poly([[-20,-48],[22,-48],[26,-25],[-23,-22]],"#302c32");
    poly([[-14,-6],[0,-21],[16,-3],[0,18]],"#ffb05b");
  } else if(enemy.bossStyle === "reaper") {
    poly([[0,-45],[-28,-17],[-36,34],[0,51],[36,34],[28,-17]],"#170d29");
    poly([[0,-48],[-23,-22],[0,-7],[23,-22]],"#48336a");
    poly([[-14,-19],[14,-19],[0,-10]],"#b49aff");
    ctx.beginPath();ctx.moveTo(27,22);ctx.lineTo(51,-42);ctx.lineTo(56,-35);
    ctx.strokeStyle="#c3b2e8";ctx.lineWidth=4;ctx.stroke();
    poly([[51,-42],[20,-58],[40,-68],[68,-56]],"#d7c8ff");
  } else {
    poly([[-35,-42],[35,-42],[44,20],[0,55],[-44,20]],"#45475d");
    poly([[-45,-36],[-69,-24],[-57,14],[-33,1]],"#a5a7c4");
    poly([[45,-36],[69,-24],[57,14],[33,1]],"#a5a7c4");
    poly([[-21,-59],[21,-59],[26,-29],[0,-20],[-26,-29]],"#d7d7ee");
    poly([[0,-20],[14,0],[0,23],[-14,0]],"#fff7a8");
    ctx.beginPath();ctx.ellipse(0,-73,35,9,0,0,Math.PI*2);
    ctx.strokeStyle="#fff0a6";ctx.lineWidth=5;ctx.stroke();
  }
  if (enemy.phase===2) {
    ctx.globalAlpha=.6+.3*Math.sin(t*8);
    ctx.strokeStyle=color;ctx.lineWidth=2;
    ctx.strokeRect(-r*.7,-r*.7,r*1.4,r*1.4);
  }
  ctx.restore();
}

function drawPlayerElement(x, y, magicName, awakened = false, facing = -Math.PI / 2) {
  const element = playerElement(magicName);
  const r = awakened ? 17 : 14;
  const t = performance.now() * .001;
  const c = element.color;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);
  ctx.shadowBlur = awakened ? 50 : 30;
  ctx.shadowColor = c;
  ctx.fillStyle = c;
  ctx.strokeStyle = "#f5f1ff";
  ctx.lineWidth = 2;

  function polygon(points) {
    ctx.beginPath();
    points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  function ring(radius, alpha = .65) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  function shard(px, py, size) {
    polygon([[px, py-size], [px+size*.55, py], [px, py+size], [px-size*.55, py]]);
  }
  function accessory(type, scale = 1) {
    ctx.save(); ctx.scale(scale, scale);
    if (type === "Fire") {
      for (let i = -1; i <= 1; i++) {
        const px = i * 12;
        polygon([[px-5,-r+3],[px-4,-r-9],[px+2,-r-17-(i===0?5:0)],
          [px+6,-r-7],[px+5,-r+3]]);
      }
    } else if (type === "Water") {
      ctx.beginPath(); ctx.ellipse(0, 0, r+8, r*.42, -.35, 0, Math.PI*2); ctx.stroke();
      shard(r+8, -r-7, 4);
    } else if (type === "Wind") {
      ctx.beginPath(); ctx.arc(0, 0, r+9, -.8+t*.3, 1.1+t*.3); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r+13, 2.3-t*.2, 4.1-t*.2); ctx.stroke();
    } else if (type === "Earth") {
      for (const [px,py] of [[-r-9,-r],[r+9,-r+3],[0,r+12]])
        polygon([[px-5,py-4],[px+4,py-7],[px+7,py+3],[px-3,py+6]]);
    } else if (type === "Lightning") {
      for (const side of [-1,1]) {
        ctx.beginPath(); ctx.moveTo(side*(r-2),-r-6);
        ctx.lineTo(side*(r+10),-r+1); ctx.lineTo(side*(r+3),-r+6);
        ctx.lineTo(side*(r+13),r+5); ctx.stroke();
      }
    } else if (type === "Ice") {
      for (const a of [-Math.PI/2, Math.PI/6, 5*Math.PI/6])
        shard(Math.cos(a)*(r+9), Math.sin(a)*(r+9), 6);
    } else if (type === "Light") {
      ctx.beginPath(); ctx.ellipse(0,-r-10,r+5,4,0,0,Math.PI*2); ctx.stroke();
      shard(0,-r-20,5);
    } else if (type === "Shadow") {
      for (const side of [-1,1]) {
        ctx.beginPath(); ctx.moveTo(side*r,-r*.4);
        ctx.quadraticCurveTo(side*(r+19),-r-10,side*(r+9),-r-23);
        ctx.quadraticCurveTo(side*(r+3),-r-6,side*(r+3),r*.6);
        ctx.fill();
      }
    } else if (type === "Force") {
      ring(r+8); ring(r+13,.3);
      shard(0,-r-13,4);
    }
    ctx.restore();
  }

  switch (element.primary) {
    case "Fire":
      polygon([[r+3,2],[r*.55,r*.75],[-r*.5,r*.85],[-r-2,1],
        [-r*.55,-r*.4],[-r*.7,-r-5],[0,-r*.8],[r*.3,-r-9],[r*.7,-r*.45]]);
      break;
    case "Water":
      polygon([[0,-r-4],[r*.85,-r*.1],[r*.75,r*.6],[0,r+2],[-r*.75,r*.6],[-r*.85,-r*.1]]);
      break;
    case "Wind":
      ctx.beginPath(); ctx.arc(0,0,r,-1.15,1.3); ctx.arc(-r*.32,0,r*.63,1.3,-1.15,true);
      ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    case "Earth":
      polygon([[0,-r-3],[r*.85,-r*.6],[r+2,r*.4],[r*.3,r+3],[-r*.7,r*.8],[-r-2,-r*.2]]);
      break;
    case "Lightning":
      polygon([[r*.15,-r-4],[-r*.8,1],[-r*.1,1],[-r*.4,r+5],[r*.85,-r*.15],[r*.1,-r*.15]]);
      break;
    case "Ice": shard(0,0,r+3); break;
    case "Light":
      polygon(Array.from({length: 10},(_,i)=>{
        const a=-Math.PI/2+i*Math.PI/5, rr=i%2===0?r+4:r*.55;
        return [Math.cos(a)*rr,Math.sin(a)*rr];
      })); break;
    case "Shadow":
      ctx.beginPath(); ctx.moveTo(0,-r-4);
      ctx.bezierCurveTo(r*1.5,-r*.3,r*.7,r*.3,r*.8,r);
      ctx.quadraticCurveTo(0,r*.4,-r*.7,r+3);
      ctx.bezierCurveTo(-r*.8,r*.2,-r*1.5,-r*.5,0,-r-4);
      ctx.fill(); ctx.stroke(); break;
    case "Force":
      polygon(Array.from({length:6},(_,i)=>{
        const a=Math.PI/6+i*Math.PI/3;
        return [Math.cos(a)*(r+2),Math.sin(a)*(r+2)];
      })); break;
  }
  ctx.fillStyle = "#ffffffbb";
  ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = c; ctx.strokeStyle = c;
  accessory(element.primary);
  if (element.secondary) {
    ctx.save(); ctx.rotate(t*.3); accessory(element.secondary,.78); ctx.restore();
  }
  if (element.tertiary) {
    ctx.save(); ctx.rotate(-t*.25); accessory(element.tertiary,.58); ctx.restore();
  }
  ctx.restore();
}

function drawWorld() {
  ctx.clearRect(
    0,
    0,
    vw,
    vh
  );

  const background =
    ctx.createRadialGradient(
      vw * 0.5,
      vh * 0.45,
      20,

      vw * 0.5,
      vh * 0.45,

      Math.max(
        vw,
        vh
      )
    );

  if (S.awakened) {
    const magic =
      S.magic[
        S.selected
      ];

    background.addColorStop(
      0,
      magic.color
    );

    background.addColorStop(
      1,
      "#05040d"
    );
  }

  else {
    background.addColorStop(
      0,
      "#172847"
    );

    background.addColorStop(
      1,
      "#070912"
    );
  }

  ctx.fillStyle =
    background;

  ctx.fillRect(
    0,
    0,
    vw,
    vh
  );

  const offsetX =
    vw / 2 - S.x;

  const offsetY =
    vh / 2 - S.y;

  ctx.save();

  ctx.translate(
    offsetX,
    offsetY
  );

  /* GRID */

  ctx.strokeStyle =
    S.awakened
      ? "#ffffff18"
      : "#2c395633";

  ctx.lineWidth = 1;

  const gridX =
    Math.floor(
      (S.x - vw) /
      100
    ) * 100;

  const gridY =
    Math.floor(
      (S.y - vh) /
      100
    ) * 100;

  for (
    let x = gridX;
    x < S.x + vw;
    x += 100
  ) {
    ctx.beginPath();

    ctx.moveTo(
      x,
      S.y - vh
    );

    ctx.lineTo(
      x,
      S.y + vh
    );

    ctx.stroke();
  }

  for (
    let y = gridY;
    y < S.y + vh;
    y += 100
  ) {
    ctx.beginPath();

    ctx.moveTo(
      S.x - vw,
      y
    );

    ctx.lineTo(
      S.x + vw,
      y
    );

    ctx.stroke();
  }

  /* TERRAIN */

  for (
    let i = -4;
    i <= 4;
    i++
  ) {
    const x =
      i * 320;

    const y =
      Math.sin(i * 3) *
      250;

    ctx.fillStyle =
      "#182f2b";

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      85,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
      "#6b7790";

    ctx.lineWidth = 2;

    ctx.strokeRect(
      x - 30,
      y - 18,
      60,
      36
    );
  }

  /* ZONES */

  for (
    const zone of S.zones
  ) {
    ctx.globalAlpha =
      0.18 +
      0.18 *
      Math.sin(
        performance.now() /
        120
      );

    ctx.fillStyle =
      zone.color;

    ctx.beginPath();

    ctx.arc(
      zone.x,
      zone.y,
      zone.radius,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.globalAlpha =
      0.8;

    ctx.strokeStyle =
      zone.color;

    ctx.lineWidth = 3;

    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  /* ENEMIES */

  for (
    const enemy of S.enemies
  ) {
    let enemyColor =
      enemy.color;

    if (
      enemy.slow > 0
    ) {
      enemyColor =
        "#8edfff";
    }

    if (
      enemy.burn > 0
    ) {
      enemyColor =
        "#ff7038";
    }

    ctx.shadowBlur =
      enemy.boss
        ? 35
        : enemy.elite
          ? 28
          : 18;

    ctx.shadowColor =
      enemyColor;

    ctx.fillStyle =
      enemyColor;

    if (
      enemy.boss
    ) {
      drawBossBody(enemy,enemyColor);
    }

    else {
      ctx.beginPath();

      ctx.arc(
        enemy.x,
        enemy.y,
        enemy.r,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }

    if (
      enemy.elite ||
      enemy.boss
    ) {
      ctx.strokeStyle =
        "#ffe49c";

      ctx.lineWidth =
        enemy.boss
          ? 4
          : 2;

      if (!enemy.boss) {
        ctx.stroke();
      }
    }

    if (
      enemy.shield > 0
    ) {
      ctx.strokeStyle =
        "#a7b7ff";

      ctx.lineWidth = 3;

      ctx.beginPath();

      ctx.arc(
        enemy.x,
        enemy.y,
        enemy.r + 7,
        0,
        Math.PI * 2
      );

      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    const barWidth =
      enemy.boss
        ? 70
        : 40;

    ctx.fillStyle =
      "#310812";

    ctx.fillRect(
      enemy.x -
        barWidth / 2,

      enemy.y -
        enemy.r -
        14,

      barWidth,
      5
    );

    ctx.fillStyle =
      enemy.boss
        ? "#e7a0ff"
        : "#ff536c";

    ctx.fillRect(
      enemy.x -
        barWidth / 2,

      enemy.y -
        enemy.r -
        14,

      barWidth *
        Math.max(
          0,
          enemy.hp
        ) /
        enemy.maxHp,

      5
    );

    if (
      enemy.boss
    ) {
      ctx.fillStyle =
        "#ffffff";

      ctx.font =
        "bold 11px sans-serif";

      ctx.textAlign =
        "center";

      /* The fixed boss HUD already shows the boss name. Drawing it
         above the world sprite overlaps the mobile action buttons. */
    }
  }

  /* PLAYER SHOTS */

  for (
    const shot of S.shots
  ) {
    drawSpellProjectile(
      shot
    );
  }

  /* ENEMY SHOTS */

  for (
    const shot of
      S.enemyShots
  ) {
    ctx.shadowBlur = 18;

    ctx.shadowColor =
      shot.color;

    ctx.fillStyle =
      shot.color;

    ctx.beginPath();

    ctx.arc(
      shot.x,
      shot.y,
      shot.r,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.shadowBlur = 0;

  /* PARTICLES */

  for (
    const particle of
      S.particles
  ) {
    ctx.globalAlpha =
      Math.max(
        0,
        particle.life /
        (
          particle.maxLife ||
          25
        )
      );

    ctx.fillStyle =
      particle.color;

    ctx.fillRect(
      particle.x - 2,
      particle.y - 2,
      4,
      4
    );
  }

  ctx.globalAlpha = 1;

  /* MULTIPLAYER PLAYERS */

  for (
    const player of
      multiplayerPlayers.values()
  ) {
    const remoteMagic =
      S.magic[player.magic];

    const playerColor =
      remoteMagic
        ? remoteMagic.color
        : "#8fd3ff";

    const smoothing = 0.17;
    player.renderX += (player.x - player.renderX) * smoothing;
    player.renderY += (player.y - player.renderY) * smoothing;
    const angleDiff = Math.atan2(
      Math.sin(player.facing - player.renderFacing),
      Math.cos(player.facing - player.renderFacing)
    );
    player.renderFacing += angleDiff * smoothing;
    drawPlayerElement(
      player.renderX,
      player.renderY,
      player.magic || "Fire",
      false,
      player.renderFacing
    );

    ctx.fillStyle =
      "rgba(20,8,18,.9)";
    ctx.fillRect(
      player.renderX - 22,
      player.renderY - 31,
      44,
      5
    );

    ctx.fillStyle = playerColor;
    ctx.fillRect(
      player.renderX - 22,
      player.renderY - 31,
      44 *
        Math.max(0, player.hp) /
        100,
      5
    );

    ctx.fillStyle = "#ffffff";
    ctx.font =
      "bold 10px sans-serif";
    ctx.textAlign = "center";

    ctx.fillText(
      player.magic,
      player.x,
      player.y - 38
    );
  }

  /* PLAYER */

  if (!S.dead) {
    const playerColor =
      S.magic[
        S.selected
      ].color;

    /* AWAKENING RINGS */

    if (S.awakened) {
      const pulse =
        45 +
        Math.sin(
          performance.now() /
          100
        ) *
        6;

      ctx.globalAlpha =
        0.35;

      ctx.fillStyle =
        playerColor;

      ctx.beginPath();

      ctx.arc(
        S.x,
        S.y,
        pulse,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.globalAlpha = 1;

      ctx.strokeStyle =
        "#ffffff";

      ctx.lineWidth = 2;

      ctx.beginPath();

      ctx.arc(
        S.x,
        S.y,
        pulse + 12,
        0,
        Math.PI * 2
      );

      ctx.stroke();
    }

    /* V1.8 equipped rank cosmetics */
    if (typeof v18DrawAura === "function") v18DrawAura(S.x, S.y);

    drawPlayerElement(
      S.x,
      S.y,
      S.selected,
      S.awakened,
      playerFacing
    );

    if (typeof v18DrawTrimAndTitle === "function") v18DrawTrimAndTitle(S.x, S.y);

    if (
      S.ward > 0
    ) {
      ctx.strokeStyle =
        "#b8a8ff";

      ctx.lineWidth = 3;

      ctx.beginPath();

      ctx.arc(
        S.x,
        S.y,
        30,
        0,
        Math.PI * 2
      );

      ctx.stroke();
    }
  }

  ctx.restore();

  /* AWAKENING TEXT */

  if (
    S.awakened &&
    S.awakeningTime > 8.7
  ) {
    ctx.textAlign =
      "center";

    ctx.shadowBlur = 30;

    ctx.shadowColor =
      S.magic[
        S.selected
      ].color;

    ctx.fillStyle =
      "#ffffff";

    ctx.font =
      "900 25px sans-serif";

    ctx.fillText(
      awakeningName(),
      vw / 2,
      vh * 0.28
    );

    ctx.shadowBlur = 0;
  }
}


/* =========================================================
   DESKTOP SUPPORT PATCH
========================================================= */

const desktopMode =
  matchMedia("(hover: hover) and (pointer: fine)").matches;

const desktopKeys = {
  up: false,
  down: false,
  left: false,
  right: false
};

const mouseAim = {
  x: innerWidth / 2,
  y: innerHeight / 2
};

if (desktopMode) {

  /* =========================
     HIDE MOBILE CONTROLS
  ========================= */

  if (stick) {
    stick.style.display = "none";
  }

  const mobileControls =
    document.querySelector(".controls");

  if (mobileControls) {
    mobileControls.style.display = "none";
  }

  /* =========================
     DESKTOP CONTROL GUIDE
  ========================= */

  const desktopGuide =
    document.createElement("div");

  desktopGuide.id =
    "desktopControls";

  desktopGuide.innerHTML = `
    <b>DESKTOP CONTROLS</b><br>
    WASD — Move<br>
    LMB — Cast<br>
    RMB — Ward<br>
    SPACE — Dodge<br>
    Q — Power<br>
    E — Next Magic<br>
    R — Awaken
  `;

  Object.assign(
    desktopGuide.style,
    {
      position: "fixed",
      left: "16px",
      bottom: "16px",

      padding: "11px 14px",

      background:
        "rgba(8,10,19,.82)",

      border:
        "1px solid rgba(180,160,255,.35)",

      borderRadius: "14px",

      color: "#d9dcf1",

      fontSize: "11px",
      lineHeight: "1.55",

      zIndex: "30",

      pointerEvents: "none",

      backdropFilter:
        "blur(8px)"
    }
  );

  document.body.appendChild(
    desktopGuide
  );

  /* =========================
     KEYBOARD
  ========================= */

  function isTyping() {
    const active =
      document.activeElement;

    return (
      active &&
      (
        active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.isContentEditable
      )
    );
  }

  function updateDesktopMovement() {
    let x = 0;
    let y = 0;

    if (desktopKeys.left) {
      x -= 1;
    }

    if (desktopKeys.right) {
      x += 1;
    }

    if (desktopKeys.up) {
      y -= 1;
    }

    if (desktopKeys.down) {
      y += 1;
    }

    const distance =
      Math.hypot(x, y);

    if (distance > 0) {
      x /= distance;
      y /= distance;
    }

    joystick.x = x;
    joystick.y = y;
  }

  window.addEventListener(
    "keydown",
    event => {

      if (isTyping()) {
        return;
      }

      const key =
        event.key.toLowerCase();

      if (
        key === "w" ||
        key === "arrowup"
      ) {
        desktopKeys.up = true;
        event.preventDefault();
      }

      if (
        key === "s" ||
        key === "arrowdown"
      ) {
        desktopKeys.down = true;
        event.preventDefault();
      }

      if (
        key === "a" ||
        key === "arrowleft"
      ) {
        desktopKeys.left = true;
        event.preventDefault();
      }

      if (
        key === "d" ||
        key === "arrowright"
      ) {
        desktopKeys.right = true;
        event.preventDefault();
      }

      updateDesktopMovement();

      /*
        Don't repeatedly activate abilities
        when a key is held down.
      */

      if (event.repeat) {
        return;
      }

      if (key === " ") {
        event.preventDefault();
        dodge();
      }

      if (key === "q") {
        event.preventDefault();
        usePower();
      }

      if (key === "e") {
        event.preventDefault();
        nextMagic();
      }

      if (key === "r") {
        event.preventDefault();

        if (
          S.awakening >= 100 &&
          !S.awakened
        ) {
          awaken();
        }
      }
    }
  );

  window.addEventListener(
    "keyup",
    event => {

      const key =
        event.key.toLowerCase();

      if (
        key === "w" ||
        key === "arrowup"
      ) {
        desktopKeys.up = false;
      }

      if (
        key === "s" ||
        key === "arrowdown"
      ) {
        desktopKeys.down = false;
      }

      if (
        key === "a" ||
        key === "arrowleft"
      ) {
        desktopKeys.left = false;
      }

      if (
        key === "d" ||
        key === "arrowright"
      ) {
        desktopKeys.right = false;
      }

      updateDesktopMovement();
    }
  );

  window.addEventListener(
    "blur",
    () => {
      desktopKeys.up = false;
      desktopKeys.down = false;
      desktopKeys.left = false;
      desktopKeys.right = false;

      updateDesktopMovement();
    }
  );

  /* =========================
     MOUSE AIM
  ========================= */

  window.addEventListener(
    "mousemove",
    event => {
      mouseAim.x =
        event.clientX;

      mouseAim.y =
        event.clientY;
    }
  );

  /* =========================
     DESKTOP CAST
  ========================= */

  function desktopCast() {
    if (S.dead) {
      return;
    }

    const cost =
      S.awakened
        ? 5
        : 10;

    if (S.mana < cost) {
      notice(
        "Not enough mana"
      );

      return;
    }

    S.mana -= cost;

    addAwakening(3);

    /*
      Player is always rendered
      in the center of the screen.

      Therefore cursor direction
      can be calculated from the
      screen center.
    */

    let dx =
      mouseAim.x -
      vw / 2;

    let dy =
      mouseAim.y -
      vh / 2;

    const distance =
      Math.hypot(
        dx,
        dy
      ) || 1;

    dx /= distance;
    dy /= distance;
    facePlayer(dx, dy, true);

    const magic =
      S.magic[
        S.selected
      ];

    const count =
      S.awakened
        ? 3
        : 1;

    for (
      let i = 0;
      i < count;
      i++
    ) {

      const spread =
        count === 1
          ? 0
          : (i - 1) * 0.16;

      const cos =
        Math.cos(spread);

      const sin =
        Math.sin(spread);

      const sx =
        dx * cos -
        dy * sin;

      const sy =
        dx * sin +
        dy * cos;

      S.shots.push({
        x: S.x,
        y: S.y,

        vx:
          sx *
          (
            S.awakened
              ? 11
              : 9
          ),

        vy:
          sy *
          (
            S.awakened
              ? 11
              : 9
          ),

        life:
          S.awakened
            ? 80
            : 65,

        power:
          S.awakened
            ? 22
            : 14,

        color:
          magic.color
      });
    }

    burst(
      S.x,
      S.y,
      magic.color,
      S.awakened
        ? 18
        : 8
    );
  }

  /* =========================
     MOUSE BUTTONS
  ========================= */

  window.addEventListener(
    "mousedown",
    event => {

      /*
        Ignore clicks on UI.
      */

      if (
        event.target.closest(
          "button, .modal, .nav"
        )
      ) {
        return;
      }

      /*
        LEFT CLICK
        Cast toward mouse.
      */

      if (event.button === 0) {
        desktopCast();
      }

      /*
        RIGHT CLICK
        Ward.
      */

      if (event.button === 2) {
        event.preventDefault();
        activateWard();
      }
    }
  );

  /* Disable browser right-click menu */

  window.addEventListener(
    "contextmenu",
    event => {

      if (
        !event.target.closest(
          ".modal"
        )
      ) {
        event.preventDefault();
      }
    }
  );

  /* =========================
     DESKTOP CURSOR
  ========================= */

  document.body.style.cursor =
    "crosshair";

  document
    .querySelectorAll(
      "button, .magic"
    )
    .forEach(element => {
      element.style.cursor =
        "pointer";
    });

  notice(
    "DESKTOP CONTROLS ENABLED"
  );
}

/* =========================================================
   MAIN MENU
========================================================= */

const mainMenu = document.createElement("div");
mainMenu.id = "mainMenu";

mainMenu.innerHTML = `
  <div class="menuParticles"></div>

  <div class="menuPanel">

    <div class="menuRune">✦</div>

    <h1>ARCANE FORGE</h1>

    <div class="menuSubtitle">
      FORGE YOUR MAGIC. BECOME SOMETHING GREATER.
    </div>

    <button id="menuPlay" class="menuButton menuPrimary">
      PLAY
    </button>

    <button id="menuMultiplayer" class="menuButton">
      MULTIPLAYER
    </button>

    <button id="menuForge" class="menuButton">
      FORGE
    </button>

    <button id="menuCustomization" class="menuButton">CUSTOMIZATION</button>
    <button id="menuRankRewards" class="menuButton">RANK REWARDS</button>
    <button id="menuChat" class="menuButton">ROOM CHAT</button>
    <button id="menuAccount" class="menuButton">ACCOUNT</button>
    <button id="menuAdmin" class="menuButton">OWNER PANEL</button>
    <button id="menuSettings" class="menuButton">SETTINGS</button>

    <div class="menuVersion">
      v1.8 • BUILD 3.1
    </div>

  </div>
`;

document.body.appendChild(mainMenu);


/* =========================================================
   MENU STYLE
========================================================= */

const mainMenuStyle = document.createElement("style");

mainMenuStyle.textContent = `

#mainMenu {
  position: fixed;
  inset: 0;

  z-index: 1000;

  display: flex;
  align-items: center;
  justify-content: center;

  background:
    radial-gradient(
      circle at 50% 35%,
      #242c52 0%,
      #101425 38%,
      #05060b 75%
    );

  opacity: 1;

  transition:
    opacity .45s ease;

  overflow-y: auto;
  touch-action: pan-y;
}


/* magical background glow */

#mainMenu::before {
  content: "";

  position: absolute;

  width: 620px;
  height: 620px;

  border-radius: 50%;

  background:
    radial-gradient(
      circle,
      rgba(150,110,255,.18),
      rgba(80,60,180,.06) 45%,
      transparent 70%
    );

  animation:
    menuPulse 4s ease-in-out infinite;
}


/* rotating magical ring */

#mainMenu::after {
  content: "";

  position: absolute;

  width: 430px;
  height: 430px;

  border-radius: 50%;

  border:
    1px solid rgba(190,170,255,.13);

  box-shadow:
    0 0 70px rgba(120,90,255,.08),
    inset 0 0 70px rgba(120,90,255,.05);

  animation:
    menuRotate 18s linear infinite;
}


.menuPanel {
  position: relative;

  z-index: 2;

  width: min(88vw, 410px);

  padding:
    36px
    28px
    25px;

  text-align: center;

  background:
    linear-gradient(
      145deg,
      rgba(18,22,40,.92),
      rgba(8,10,20,.95)
    );

  border:
    1px solid rgba(165,145,255,.32);

  border-radius: 25px;

  box-shadow:
    0 30px 100px rgba(0,0,0,.65),
    0 0 60px rgba(110,80,255,.10);

  backdrop-filter:
    blur(14px);
}


.menuRune {
  margin-bottom: 8px;

  font-size: 34px;

  color: #c5b1ff;

  text-shadow:
    0 0 12px #9e7cff,
    0 0 35px #7656ff;

  animation:
    runeFloat 2.5s ease-in-out infinite;
}


.menuPanel h1 {
  margin:
    0
    0
    7px;

  font-size:
    clamp(
      30px,
      8vw,
      48px
    );

  letter-spacing: .12em;

  color: #f5f2ff;

  text-shadow:
    0 0 15px rgba(180,150,255,.65),
    0 0 40px rgba(110,70,255,.35);
}


.menuSubtitle {
  margin-bottom: 30px;

  color: #9da5c8;

  font-size: 10px;

  font-weight: 800;

  letter-spacing: .16em;
}


.menuButton {
  display: block;

  width: 100%;

  height: 54px;

  margin: 10px 0;

  border:
    1px solid #454d72;

  border-radius: 14px;

  background:
    rgba(24,29,50,.88);

  color: #f3f4ff;

  font-weight: 900;

  letter-spacing: .12em;

  cursor: pointer;

  touch-action: manipulation;

  transition:
    transform .12s,
    background .2s,
    border-color .2s,
    box-shadow .2s;
}


.menuButton:hover {
  background: #282e50;

  border-color: #8276bd;

  box-shadow:
    0 0 20px rgba(150,120,255,.15);
}


.menuButton:active {
  transform: scale(.97);
}


.menuPrimary {
  border:
    1px solid #bca45e;

  background:
    linear-gradient(
      135deg,
      #664711,
      #8a6420
    );

  box-shadow:
    0 0 25px rgba(255,205,90,.08);
}


.menuPrimary:hover {
  background:
    linear-gradient(
      135deg,
      #795617,
      #9e7428
    );

  border-color: #e1c56d;
}


.menuVersion {
  margin-top: 24px;

  color: #646b8d;

  font-size: 9px;

  letter-spacing: .13em;
}


@keyframes menuPulse {

  0%,
  100% {
    transform: scale(.92);
    opacity: .65;
  }

  50% {
    transform: scale(1.08);
    opacity: 1;
  }

}


@keyframes menuRotate {

  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }

}


@keyframes runeFloat {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-6px);
  }

}


/* phone adjustments */

@media(max-width:600px) {

  .menuPanel {
    width: 88vw;

    padding:
      22px
      22px
      18px;
    margin: 20px 0;
  }

  .menuButton {
    height: 52px;
  }

}

`;

document.head.appendChild(mainMenuStyle);


/* =========================================================
   MENU STATE
========================================================= */

let menuOpen = true;

function openMainMenu() {

  menuOpen = true;

  mainMenu.style.display =
    "flex";

  requestAnimationFrame(() => {
    mainMenu.style.opacity = "1";
  });

}


function closeMainMenu() {

  mainMenu.style.opacity = "0";

  setTimeout(() => {

    mainMenu.style.display =
      "none";

    menuOpen = false;

  }, 450);

}


/* =========================================================
   PLAY
========================================================= */

/* =========================================================
   MULTIPLAYER MENU
========================================================= */

const multiplayerMenu =
  document.createElement("div");

multiplayerMenu.id =
  "multiplayerMenu";

multiplayerMenu.style.display =
  "none";

multiplayerMenu.innerHTML = `
  <div class="menuPanel">

    <div class="menuRune">✦</div>

    <h1>MULTIPLAYER</h1>

    <div class="menuSubtitle">
      ENTER THE ARCANE WORLD TOGETHER
    </div>

    <button
      id="createRoom"
      class="menuButton menuPrimary"
    >
      CREATE ROOM
    </button>

    <button
      id="joinRoom"
      class="menuButton"
    >
      JOIN ROOM
    </button>

    <button
      id="multiplayerBack"
      class="menuButton"
    >
      BACK
    </button>

    <div
      id="multiplayerStatus"
      class="menuVersion"
    >
      NOT CONNECTED
    </div>

  </div>
`;

Object.assign(
  multiplayerMenu.style,
  {
    position: "fixed",
    inset: "0",
    zIndex: "1100",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(circle at 50% 35%, #242c52 0%, #101425 38%, #05060b 75%)"
  }
);

document.body.appendChild(
  multiplayerMenu
);


/* OPEN MULTIPLAYER */

document
  .getElementById(
    "menuMultiplayer"
  )
  .addEventListener(
    "click",
    () => {

      mainMenu.style.display =
        "none";

      multiplayerMenu.style.display =
        "flex";
    }
  );


/* BACK */

document
  .getElementById(
    "multiplayerBack"
  )
  .addEventListener(
    "click",
    () => {

      multiplayerMenu.style.display =
        "none";

      mainMenu.style.display =
        "flex";

      mainMenu.style.opacity =
        "1";
    }
  );


/* CREATE ROOM */

document
  .getElementById(
    "createRoom"
  )
  .addEventListener(
    "click",
    () => {

      const code =
        createMultiplayerRoom();

      document
        .getElementById(
          "multiplayerStatus"
        )
        .textContent =
          `ROOM: ${code}`;

      notice(
        `ROOM ${code} CREATED`
      );

      multiplayerMenu.style.display =
        "none";

      closeMainMenu();
    }
  );


/* JOIN ROOM */

document
  .getElementById(
    "joinRoom"
  )
  .addEventListener(
    "click",
    () => {

      const code =
        prompt(
          "ENTER 6-DIGIT ROOM CODE"
        );

      if (!code) return;

      connectMultiplayer(
        code
      );

      document
        .getElementById(
          "multiplayerStatus"
        )
        .textContent =
          `ROOM: ${code
            .trim()
            .toUpperCase()}`;

      notice(
        "JOINING ROOM..."
      );

      multiplayerMenu.style.display =
        "none";

      closeMainMenu();
    }
  );

document
  .getElementById("menuPlay")
  .addEventListener(
    "click",
    () => {

      closeMainMenu();
      v18MusicStart();

      notice(
        "ENTERING THE ARCANE WORLD"
      );

    }
  );


/* =========================================================
   FORGE
========================================================= */

document
  .getElementById("menuForge")
  .addEventListener(
    "click",
    () => {

      /*
        Temporarily hide menu
        but KEEP menuOpen true.

        This means gameplay
        remains paused.
      */

      mainMenu.style.display =
        "none";

      const forge =
        document.getElementById(
          "forgeModal"
        );

      if (forge) {

        forge.classList.add(
          "open"
        );

        renderForge();

      }

    }
  );


/* =========================================================
   RETURN TO MENU AFTER FORGE
========================================================= */

const forgeModal =
  document.getElementById(
    "forgeModal"
  );

if (forgeModal) {

  const forgeClose =
    forgeModal.querySelector(
      ".close"
    );

  if (forgeClose) {

    forgeClose.addEventListener(
      "click",
      () => {

        if (menuOpen) {

          setTimeout(() => {

            mainMenu.style.display =
              "flex";

            mainMenu.style.opacity =
              "1";

          }, 50);

        }

      }
    );

  }

}


/* =========================================================
   V1.8 MAIN-MENU PANELS — FIRST BUILD
   Local-only settings and cosmetic preview. No account rewards
   or background music are claimed until those systems exist.
========================================================= */
const v18Panel = document.createElement("div");
v18Panel.id = "v18Panel";
v18Panel.setAttribute("role", "dialog");
v18Panel.setAttribute("aria-modal", "true");
v18Panel.style.cssText = "position:fixed;inset:0;z-index:1100;display:none;align-items:center;justify-content:center;background:rgba(3,5,13,.94);padding:18px;touch-action:pan-y";
v18Panel.innerHTML = `<section style="width:min(440px,100%);max-height:88dvh;overflow:auto;padding:22px;border:1px solid #7765b1;border-radius:22px;background:#101426;color:#f4f5ff;font-family:system-ui;box-shadow:0 20px 65px #000">
  <button id="v18Back" class="menuButton" style="width:auto;float:right;padding:9px 15px">BACK</button>
  <h2 id="v18Title" style="margin:6px 0 18px">SETTINGS</h2>
  <div id="v18Body"></div>
</section>`;
document.body.appendChild(v18Panel);
const v18Body = document.getElementById("v18Body");
const v18Title = document.getElementById("v18Title");
function v18Open(title) {
  v18Title.textContent = title;
  v18Panel.style.display = "flex";
  if (title === "SETTINGS") v18Settings();
  if (title === "CUSTOMIZATION") v18Customization();
  if (title === "RANK REWARDS") v18Rewards();
  if (title === "ROOM CHAT") v18ShowChat(true);
  if (title === "ACCOUNT") v18ShowAccount();
  if (title === "OWNER PANEL") v18ShowAdmin();
  if (title === "OWNER TESTING ROOM") v18ShowTestingControls();
  if (title === "RESET PASSWORD") v18ShowResetPassword();
}
document.getElementById("v18Back").addEventListener("click", () => {
  if (v18RecoveryPending) { v18Open("RESET PASSWORD"); return; }
  v18Panel.style.display = "none";
});
function v18Settings() {
  v18Body.innerHTML = `
    <label style="display:block;margin:15px 0">SFX <strong id="v18SfxValue"></strong><input id="v18Sfx" type="range" min="0" max="1" step="0.001" style="display:block;width:100%;margin-top:9px;touch-action:pan-x"></label>
    <label style="display:block;margin:15px 0">MUSIC <strong id="v18MusicValue"></strong><input id="v18Music" type="range" min="0" max="1" step="0.01" style="display:block;width:100%;margin-top:9px;touch-action:pan-x"></label>
    <p style="font-size:12px;color:#adb5d5">Original synthesized exploration and boss loops. Music starts after you tap PLAY or enable it here.</p><button id="v18MusicStart" class="menuButton" style="width:100%">START MUSIC</button>
    <label style="display:block;margin:14px 0"><input id="v18SoundOn" type="checkbox"> Sound effects enabled</label>
    <label style="display:block;margin:14px 0"><input id="v18Vfx" type="checkbox"> Extra visual effects (coming in a later build)</label>
    <label style="display:block;margin:14px 0"><input id="v18Shake" type="checkbox"> Screen shake (coming in a later build)</label>
    <label style="display:block;margin:14px 0"><input id="v18Others" type="checkbox"> Show other players (coming in a later build)</label>
    <button id="v18Mute" class="menuButton" style="width:100%">MUTE SFX</button>`;
  const sfx = document.getElementById("v18Sfx");
  sfx.value = gameSettings.sfxVolume;
  const sfxLabel = document.getElementById("v18SfxValue");
  const refreshSfx = () => { sfxLabel.textContent = Number(sfx.value).toFixed(3); };
  refreshSfx();
  sfx.addEventListener("input", () => { gameSettings.sfxVolume = Number(sfx.value); refreshSfx(); saveGameSettings(); });
  const music = document.getElementById("v18Music");
  music.value = gameSettings.musicVolume;
  const musicLabel = document.getElementById("v18MusicValue");
  const refreshMusic = () => { musicLabel.textContent = Math.round(Number(music.value)*100)+"%"; };
  refreshMusic();
  music.addEventListener("input", () => { gameSettings.musicVolume = Number(music.value); refreshMusic(); saveGameSettings(); v18MusicStart(); });
  document.getElementById("v18MusicStart").addEventListener("click",v18MusicStart);
  const enabled = document.getElementById("v18SoundOn");
  enabled.checked = soundEnabled;
  enabled.addEventListener("change", () => {
    soundEnabled = enabled.checked;
    localStorage.arcaneForgeSound = soundEnabled ? "on" : "off";
    soundToggle.textContent = soundEnabled ? "SFX ON" : "SFX OFF";
    if (soundEnabled) playSfx("cast");
  });
  document.getElementById("v18Mute").addEventListener("click", () => { enabled.checked = false; enabled.dispatchEvent(new Event("change")); });
  for (const [id,key] of [["v18Vfx","vfx"],["v18Shake","screenShake"],["v18Others","showOtherPlayers"]]) {
    const input = document.getElementById(id);
    input.checked = gameSettings[key];
    input.addEventListener("change", () => { gameSettings[key] = input.checked; saveGameSettings(); });
  }
}
const v18CosmeticKey = "arcaneForgeCosmeticsV18";
const v18RankRewards = [
  {rank:1,  title:"Initiate",        aura:"Arcane Spark", trim:"Silver Edge", color:"#b9c6ff"},
  {rank:2,  title:"Spellbinder",     aura:"Ember Ring",   trim:"Crimson Edge",color:"#ff756b"},
  {rank:3,  title:"Runeborn",        aura:"Rune Orbit",   trim:"Violet Edge", color:"#b58cff"},
  {rank:5,  title:"Arcane Adept",    aura:"Aether Pulse", trim:"Azure Edge",  color:"#75c8ff"},
  {rank:8,  title:"Rift Walker",     aura:"Rift Halo",    trim:"Rift Edge",   color:"#d08cff"},
  {rank:12, title:"Forge Master",    aura:"Forge Crown",  trim:"Golden Edge", color:"#ffd86b"},
  {rank:16, title:"Arcane Sovereign",aura:"Sovereign",    trim:"Royal Edge",  color:"#f2b8ff"},
  {rank:20, title:"Ascendant",       aura:"Ascendant",    trim:"Prismatic",   color:"#ffffff"}
];
let v18Cosmetics = {title:"None",aura:"None",trim:"None"};
try { v18Cosmetics = {...v18Cosmetics,...JSON.parse(localStorage.getItem(v18CosmeticKey)||"{}")}; } catch (_) {}
function v18SaveCosmetics() {
  try { localStorage.setItem(v18CosmeticKey,JSON.stringify(v18Cosmetics)); } catch (_) {}
}
function v18UnlockedRewards() { return v18RankRewards.filter(r => S.rank >= r.rank); }
function v18RewardBy(field,value) { return v18RankRewards.find(r => r[field] === value); }
function v18ValidateCosmetics() {
  for (const key of ["title","aura","trim"]) {
    if (v18Cosmetics[key] !== "None") {
      const reward = v18RewardBy(key,v18Cosmetics[key]);
      if (!reward || S.rank < reward.rank) v18Cosmetics[key] = "None";
    }
  }
  v18SaveCosmetics();
}
v18ValidateCosmetics();
function v18OptionList(field) {
  return [`<option value="None">None</option>`].concat(v18RankRewards.map(r =>
    `<option value="${r[field]}" ${S.rank < r.rank ? "disabled" : ""}>${r[field]}${S.rank < r.rank ? ` — Rank ${r.rank}` : ""}</option>`
  )).join("");
}
function v18Customization() {
  v18ValidateCosmetics();
  v18Body.innerHTML = `<p style="color:#adb5d5">Equip rewards unlocked by your current rank. Locked cosmetics show the rank required.</p>
    <label style="display:block;margin:16px 0">TITLE<select id="v18TitleSelect" style="display:block;width:100%;padding:12px;margin-top:6px;background:#222944;color:white;border:1px solid #58618c;border-radius:10px">${v18OptionList("title")}</select></label>
    <label style="display:block;margin:16px 0">AURA<select id="v18AuraSelect" style="display:block;width:100%;padding:12px;margin-top:6px;background:#222944;color:white;border:1px solid #58618c;border-radius:10px">${v18OptionList("aura")}</select></label>
    <label style="display:block;margin:16px 0">CHARACTER TRIM<select id="v18TrimSelect" style="display:block;width:100%;padding:12px;margin-top:6px;background:#222944;color:white;border:1px solid #58618c;border-radius:10px">${v18OptionList("trim")}</select></label>
    <p id="v18Equipped" style="color:#b9a8ff;line-height:1.55"></p>`;
  const fields = [["v18TitleSelect","title"],["v18AuraSelect","aura"],["v18TrimSelect","trim"]];
  const display = () => { document.getElementById("v18Equipped").textContent = `Equipped: ${v18Cosmetics.title} • ${v18Cosmetics.aura} • ${v18Cosmetics.trim}`; };
  for (const [id,key] of fields) {
    const el=document.getElementById(id); el.value=v18Cosmetics[key];
    el.addEventListener("change",()=>{v18Cosmetics[key]=el.value;v18SaveCosmetics();display();});
  }
  display();
}
function v18Rewards() {
  v18ValidateCosmetics();
  v18Body.innerHTML = `<p style="color:#cbd1ed">Current rank: <b>${S.rank}</b>. Rewards unlock automatically as your rank increases.</p>`;
  for (const reward of v18RankRewards) {
    const unlocked=S.rank>=reward.rank;
    const card=document.createElement("div");
    card.style.cssText=`margin:12px 0;padding:14px;border-radius:14px;border:1px solid ${unlocked?reward.color:"#353b55"};background:${unlocked?"rgba(35,39,70,.9)":"rgba(18,21,34,.8)"};opacity:${unlocked?1:.58}`;
    card.innerHTML=`<div style="font-weight:900;color:${unlocked?reward.color:"#9aa0b7"}">RANK ${reward.rank} ${unlocked?"— UNLOCKED":"— LOCKED"}</div><div style="margin-top:7px;line-height:1.55">Title: <b>${reward.title}</b><br>Aura: <b>${reward.aura}</b><br>Trim: <b>${reward.trim}</b></div>${unlocked?'<button class="menuButton v18EquipSet" style="width:100%;margin-top:10px">EQUIP SET</button>':""}`;
    if (unlocked) card.querySelector(".v18EquipSet").addEventListener("click",()=>{v18Cosmetics={title:reward.title,aura:reward.aura,trim:reward.trim};v18SaveCosmetics();notice(`EQUIPPED — ${reward.title}`);v18Rewards();});
    v18Body.appendChild(card);
  }
}
function v18DrawAura(x,y) {
  if (v18Cosmetics.aura === "None") return;
  const reward=v18RewardBy("aura",v18Cosmetics.aura); if(!reward||S.rank<reward.rank)return;
  const t=performance.now()*.001;
  ctx.save(); ctx.translate(x,y); ctx.strokeStyle=reward.color; ctx.fillStyle=reward.color;
  ctx.shadowColor=reward.color; ctx.shadowBlur=18; ctx.lineWidth=2;
  const pulse=25+Math.sin(t*4)*3;
  ctx.globalAlpha=.34; ctx.beginPath(); ctx.arc(0,0,pulse,0,Math.PI*2); ctx.stroke();
  ctx.globalAlpha=.7;
  for(let i=0;i<4;i++){const a=t*(.7+reward.rank*.01)+i*Math.PI/2;const rr=31+(i%2)*5;ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,2.2,0,Math.PI*2);ctx.fill();}
  if(reward.rank>=8){ctx.globalAlpha=.22;ctx.beginPath();ctx.arc(0,0,pulse+10,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}
function v18DrawTrimAndTitle(x,y) {
  ctx.save();
  if(v18Cosmetics.trim!=="None"){
    const reward=v18RewardBy("trim",v18Cosmetics.trim);
    if(reward&&S.rank>=reward.rank){ctx.strokeStyle=reward.color;ctx.shadowColor=reward.color;ctx.shadowBlur=12;ctx.lineWidth=2;ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(x,y,19,0,Math.PI*2);ctx.stroke();}
  }
  if(v18Cosmetics.title!=="None"){
    const reward=v18RewardBy("title",v18Cosmetics.title);
    if(reward&&S.rank>=reward.rank){ctx.globalAlpha=1;ctx.fillStyle=reward.color;ctx.font="bold 10px system-ui";ctx.textAlign="center";ctx.textBaseline="bottom";ctx.shadowColor="#000";ctx.shadowBlur=5;ctx.fillText(v18Cosmetics.title,x,y-27);}
  }
  ctx.restore();
}

/* V1.8 ROOM CHAT + ACCOUNT + SERVER-VERIFIED OWNER TITLE GRANTS.
   Chat broadcasts are ephemeral and visible to everyone with the room code.
   Owner permissions and title grants MUST be checked by the SQL RPC, never JS. */
const v18ChatLog=[];
const v18ChatBlocked=new Set();
const v18ChatMuted=new Set();
let v18ChatLastSent=0;
let v18ChatName="Guest-"+multiplayerId.slice(0,5);
let v18ChatHidden=false;
const v18ChatUI=document.createElement("aside");
v18ChatUI.id="v18ChatUI";
v18ChatUI.style.cssText="position:fixed;right:10px;top:190px;width:min(320px,calc(100vw - 20px));max-height:35vh;z-index:65;background:#101426ee;border:1px solid #7363a3;border-radius:12px;color:white;font:12px system-ui;display:none;flex-direction:column;overflow:hidden";
v18ChatUI.innerHTML=`<button id="v18ChatCollapse" style="background:#292d50;color:white;border:0;padding:7px">ROOM CHAT ▾</button><div id="v18ChatInner"><div id="v18ChatFeed" role="log" aria-live="polite" style="height:100px;overflow:auto;padding:7px;overflow-wrap:anywhere"></div><form id="v18ChatForm" style="display:flex;padding:5px;gap:4px"><input id="v18ChatInput" maxlength="160" autocomplete="off" aria-label="Chat message" placeholder="Message (160 max)" style="min-width:0;flex:1;background:#20263e;color:white;border:1px solid #5a6386;border-radius:6px;padding:7px"><button style="background:#343e76;color:white;border:0;border-radius:6px">SEND</button></form></div>`;
document.body.appendChild(v18ChatUI);
const v18ChatFeed=document.getElementById("v18ChatFeed");
function v18ChatReset(code){v18ChatLog.length=0;v18ChatFeed.replaceChildren();v18ChatUI.style.display="flex";v18ChatAdd({id:"system",name:"Room",text:`Connected to ${code}`});}
function v18ChatAdd(msg){
  if(v18ChatBlocked.has(msg.id)||v18ChatMuted.has(msg.id))return;
  v18ChatLog.push(msg);if(v18ChatLog.length>80)v18ChatLog.shift();
  const row=document.createElement("div");row.style.cssText="margin:5px 0;border-bottom:1px solid #33394e;padding-bottom:4px";
  const who=document.createElement("b");who.textContent=msg.name+": ";
  const body=document.createElement("span");body.textContent=msg.text;
  row.append(who,body);
  if(msg.id!==multiplayerId&&msg.id!=="system"){
    const controls=document.createElement("button");controls.textContent="⋯";controls.title="Chat controls";
    controls.style.cssText="float:right;background:#282e48;color:white;border:0";
    controls.addEventListener("click",()=>{
      const choice=prompt("Type M to mute, B to block, or R to report this player. No personal information.","M");
      if(!choice)return;
      const action=choice.trim().toUpperCase();
      if(action==="M")v18ChatMuted.add(msg.id);
      if(action==="B")v18ChatBlocked.add(msg.id);
      if(action==="R")notice("REPORT NOT SUBMITTED: MODERATION SERVICE NOT CONNECTED");
      if(action==="M"||action==="B")v18ChatRender();
    });row.append(controls);
  }
  v18ChatFeed.append(row);while(v18ChatFeed.children.length>80)v18ChatFeed.firstChild.remove();
  v18ChatFeed.scrollTop=v18ChatFeed.scrollHeight;
}
function v18ChatRender(){v18ChatFeed.replaceChildren();const copy=[...v18ChatLog];v18ChatLog.length=0;copy.forEach(v18ChatAdd);}
function v18ReceiveChat(p){
  if(!p||typeof p.id!=="string"||p.id===multiplayerId||typeof p.text!=="string"||typeof p.name!=="string")return;
  const text=p.text.trim().slice(0,160),name=p.name.trim().slice(0,24);
  if(!text||!name||v18ChatBlocked.has(p.id))return;
  v18ChatAdd({id:p.id.slice(0,64),name,text});
}
async function v18SendChat(text){
  text=String(text).trim().slice(0,160);
  if(!text||!multiplayerChannel||!multiplayerRoom){notice("JOIN A ROOM TO CHAT");return;}
  if(Date.now()-v18ChatLastSent<2500){notice("CHAT: WAIT 2.5 SECONDS");return;}
  v18ChatLastSent=Date.now();
  const payload={id:multiplayerId,name:v18ChatName,text};
  try{const status=await multiplayerChannel.send({type:"broadcast",event:"room-chat",payload});
    if(status==="ok")v18ChatAdd(payload);else notice("CHAT SEND FAILED");
  }catch(_){notice("CHAT SEND FAILED");}
}
document.getElementById("v18ChatForm").addEventListener("submit",e=>{e.preventDefault();const input=document.getElementById("v18ChatInput");v18SendChat(input.value);input.value="";});
document.getElementById("v18ChatCollapse").addEventListener("click",()=>{v18ChatHidden=!v18ChatHidden;document.getElementById("v18ChatInner").style.display=v18ChatHidden?"none":"block";});
function v18ShowChat(full){
  v18Body.replaceChildren();
  const status=document.createElement("p");status.textContent=multiplayerRoom?`Room: ${multiplayerRoom}`:"Join a multiplayer room to chat.";v18Body.append(status);
  const log=document.createElement("div");log.style.cssText="height:220px;overflow:auto;border:1px solid #414766;border-radius:8px;padding:8px;overflow-wrap:anywhere";
  const refresh=()=>{log.replaceChildren();v18ChatLog.filter(m=>!v18ChatBlocked.has(m.id)&&!v18ChatMuted.has(m.id)).forEach(m=>{const line=document.createElement("p");line.textContent=m.name+": "+m.text;log.append(line);});log.scrollTop=log.scrollHeight;};
  refresh();v18Body.append(log);
  const form=document.createElement("form");form.style.cssText="display:flex;gap:5px;margin-top:10px";
  const input=document.createElement("input");input.maxLength=160;input.placeholder="Message";input.style.cssText="flex:1;min-width:0;padding:9px";
  const send=document.createElement("button");send.textContent="SEND";send.className="menuButton";send.style.width="auto";form.append(input,send);v18Body.append(form);
  form.addEventListener("submit",e=>{e.preventDefault();v18SendChat(input.value);input.value="";setTimeout(refresh,200);});
  const hint=document.createElement("p");hint.style.fontSize="12px";hint.textContent="Room chat is public to anyone with the room code. Do not share personal details. Mute/block work on this device; reporting needs a moderation backend.";v18Body.append(hint);
}
/* Password recovery: use the same GitHub Pages origin for the emailed link. */
let v18RecoveryPending = false;
const v18RecoveryRedirect = location.origin + location.pathname;
function v18ShowResetPassword(){
  v18Body.innerHTML = `<p>Enter a new password for your Arcane Forge account.</p>
    <form id="v18ResetForm"><input id="v18NewPassword" type="password" autocomplete="new-password" minlength="8" required placeholder="New password (8+ characters)" style="width:100%;padding:10px;margin:5px 0">
    <input id="v18ConfirmPassword" type="password" autocomplete="new-password" minlength="8" required placeholder="Confirm new password" style="width:100%;padding:10px;margin:5px 0">
    <button class="menuButton" type="submit" style="width:100%">SET NEW PASSWORD</button></form><p id="v18ResetStatus" role="status"></p>`;
  document.getElementById("v18ResetForm").addEventListener("submit",async e=>{
    e.preventDefault();const status=document.getElementById("v18ResetStatus");
    const password=document.getElementById("v18NewPassword").value;
    if(password!==document.getElementById("v18ConfirmPassword").value){status.textContent="Passwords do not match.";return;}
    if(!supabaseClient){status.textContent="Supabase is unavailable.";return;}
    status.textContent="Updating password…";
    try{const {error}=await supabaseClient.auth.updateUser({password});
      if(error){status.textContent=error.message;return;}
      v18RecoveryPending=false;
      history.replaceState(null,"",v18RecoveryRedirect);
      v18Open("ACCOUNT");
      const accountStatus=document.getElementById("v18AuthStatus");
      if(accountStatus)accountStatus.textContent="Password updated. You can sign in with your new password.";
    }catch(err){status.textContent="Could not update password. Request a new reset email.";}
  });
}
function v18HandleRecoveryLink(){
  if(!supabaseClient)return;
  const params=new URLSearchParams(location.hash.replace(/^#/,""));
  const query=new URLSearchParams(location.search);
  const recovery=params.get("type")==="recovery"||query.get("type")==="recovery";
  if(recovery){v18RecoveryPending=true;v18Open("RESET PASSWORD");}
  supabaseClient.auth.onAuthStateChange((event)=>{
    if(event==="PASSWORD_RECOVERY"){
      v18RecoveryPending=true;
      setTimeout(()=>v18Open("RESET PASSWORD"),0);
    }
  });
}
let v18Account=null;
async function v18RefreshAccount(){if(!supabaseClient)return null;try{const {data}=await supabaseClient.auth.getUser();v18Account=data.user||null;}catch(_){v18Account=null;}if(v18Account)v18ChatName="Player-"+v18Account.id.slice(0,5);return v18Account;}
function v18ShowAccount(){
  v18Body.innerHTML=`<p id="v18AuthStatus">Checking account…</p><form id="v18AuthForm"><input id="v18AuthEmail" type="email" autocomplete="email" required placeholder="Email" style="width:100%;padding:10px;margin:5px 0"><input id="v18AuthPassword" type="password" autocomplete="current-password" required minlength="8" placeholder="Password" style="width:100%;padding:10px;margin:5px 0"><button class="menuButton" type="submit" style="width:100%">SIGN IN</button></form><button id="v18AuthSignup" class="menuButton" style="width:100%">CREATE ACCOUNT</button><button id="v18AuthForgot" class="menuButton" style="width:100%">FORGOT PASSWORD?</button><button id="v18AuthSignout" class="menuButton" style="width:100%">SIGN OUT</button><p style="font-size:12px;color:#adb5d5">Guest play remains available. Accounts require Supabase Auth email/password to be enabled. Do not enter a password in chat.</p>`;
  const status=document.getElementById("v18AuthStatus");
  const update=async()=>{await v18RefreshAccount();status.textContent=v18Account?`Signed in: ${v18Account.email}`:"Playing as guest";};update();
  const auth=async(signup)=>{if(!supabaseClient){status.textContent="Supabase is not connected";return;}
    const email=document.getElementById("v18AuthEmail").value,password=document.getElementById("v18AuthPassword").value;
    if(!email||password.length<8){status.textContent="Enter an email and password (8+ characters)";return;}
    const result=signup?await supabaseClient.auth.signUp({email,password}):await supabaseClient.auth.signInWithPassword({email,password});
    status.textContent=result.error?result.error.message:(signup?"Account created. Check email if confirmation is required.":"Signed in.");
    document.getElementById("v18AuthPassword").value="";await v18RefreshAccount();
  };
  document.getElementById("v18AuthForm").addEventListener("submit",e=>{e.preventDefault();auth(false);});
  document.getElementById("v18AuthSignup").addEventListener("click",()=>auth(true));
  document.getElementById("v18AuthForgot").addEventListener("click",async()=>{
    const email=document.getElementById("v18AuthEmail").value.trim();
    if(!email||!document.getElementById("v18AuthEmail").checkValidity()){status.textContent="Enter your account email above first.";return;}
    if(!supabaseClient){status.textContent="Supabase is unavailable.";return;}
    status.textContent="Requesting reset email…";
    try{const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:v18RecoveryRedirect});
      status.textContent=error?error.message:"If this account exists, check your email for a NEW reset link.";
    }catch(_){status.textContent="Could not request reset email. Try again.";}
  });
  document.getElementById("v18AuthSignout").addEventListener("click",async()=>{if(supabaseClient)await supabaseClient.auth.signOut();v18Account=null;afOwnerVerified=false;v18ChatName="Guest-"+multiplayerId.slice(0,5);status.textContent="Playing as guest";});
}
/* BUILD 5: TWO-PART OWNER COMMAND CENTER.
   Every entry shown here performs an existing action; future privileges are
   deliberately not presented as working buttons. Owner status is verified
   against the database whenever the panel is opened. */
let v18OwnerPage="creation";
let afOwnerVerified=false;
function afOwnerLocalAllowed(){return afOwnerVerified && !multiplayerRoom && !multiplayerChannel;}
function v18OwnerButton(label,action){
  const button=document.createElement("button");
  button.className="menuButton";button.style.width="100%";
  button.textContent=label;button.addEventListener("click",action);
  return button;
}
async function v18ShowAdmin(){
  afOwnerVerified=false;
  v18Body.replaceChildren();
  const status=document.createElement("p");
  status.textContent="Verifying owner permission…";v18Body.append(status);
  if(!supabaseClient||!await v18RefreshAccount()){
    status.textContent="Sign in to check owner access.";return;
  }
  let check;
  try{check=await supabaseClient.rpc("af_is_owner");}
  catch(_){status.textContent="Could not verify owner access. Check your connection.";return;}
  if(check.error||check.data!==true){
    status.textContent="Owner access unavailable for this account.";return;
  }
  afOwnerVerified=true;
  status.textContent="VERIFIED OWNER • Choose a section";
  const nav=document.createElement("div");
  nav.style.cssText="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0";
  const content=document.createElement("div");
  const creation=v18OwnerButton("1 • GAMEPLAY & CREATION",()=>{
    v18OwnerPage="creation";render();
  });
  const management=v18OwnerButton("2 • PLAYERS & MANAGEMENT",()=>{
    v18OwnerPage="management";render();
  });
  creation.style.fontSize=management.style.fontSize="11px";
  creation.style.padding=management.style.padding="12px 5px";
  nav.append(creation,management);v18Body.append(nav,content);
  function render(){
    creation.style.outline=v18OwnerPage==="creation"?"2px solid #d2b4ff":"none";
    management.style.outline=v18OwnerPage==="management"?"2px solid #d2b4ff":"none";
    content.replaceChildren();
    const heading=document.createElement("h3");
    heading.textContent=v18OwnerPage==="creation"?"GAMEPLAY & CREATION":"PLAYERS & MANAGEMENT";
    heading.style.margin="12px 0";content.append(heading);
    const search=document.createElement("input");
    search.type="search";search.placeholder="Search this section…";
    search.setAttribute("aria-label","Search owner controls");
    search.style.cssText="width:100%;padding:11px;border-radius:10px;margin:0 0 12px;background:#202942;color:white;border:1px solid #777";
    const items=document.createElement("div");
    content.append(search,items);
    const entries=[];
    if(v18OwnerPage==="creation"){
      entries.push({label:"ENTER PRIVATE TESTING ROOM",node:v18OwnerButton("ENTER PRIVATE TESTING ROOM",v18EnterTesting)});
      if(v18Testing.active)entries.push({label:"TEST LAB CONTROLS",node:v18OwnerButton("TEST LAB CONTROLS",()=>v18Open("OWNER TESTING ROOM"))});
      entries.push({label:"LAB SPELL LABORATORY",node:v18OwnerButton("SPELL LABORATORY • PRIVATE",()=>v18OwnerLabPage("spells"))});
      entries.push({label:"LAB WORLD DIRECTOR",node:v18OwnerButton("WORLD DIRECTOR • PRIVATE",()=>v18OwnerLabPage("world"))});
      entries.push({label:"LAB ENEMY DIRECTOR",node:v18OwnerButton("ENEMY DIRECTOR • PRIVATE",()=>v18OwnerLabPage("enemies"))});
      entries.push({label:"LAB PRESET VAULT",node:v18OwnerButton("PRESET VAULT • PRIVATE",()=>v18OwnerLabPage("presets"))});
      entries.push({label:"COMBAT DIRECTOR",node:v18OwnerButton("COMBAT DIRECTOR • LOCAL",()=>afOwnerExtras("combat"))});
      entries.push({label:"BOSS DIRECTOR",node:v18OwnerButton("BOSS DIRECTOR • LOCAL",()=>afOwnerExtras("boss"))});
      entries.push({label:"MAGIC WORKSHOP",node:v18OwnerButton("MAGIC WORKSHOP • LOCAL",()=>afOwnerExtras("magic"))});
      entries.push({label:"ARENA TOOLS",node:v18OwnerButton("ARENA TOOLS • LOCAL",()=>afOwnerExtras("arena"))});
      const info=document.createElement("p");info.style.cssText="font-size:12px;color:#aeb8d8;line-height:1.5";
      info.textContent="Combat Director, Boss Director, Magic Workshop and Arena Tools work in single-player or the private Testing Room. In single-player, changes affect your current run and normal progress may be saved. The other lab pages remain Testing Room only. These controls cannot be used while connected to multiplayer.";
      entries.push({label:"LAB DETAILS",node:info});
    }else{
      const info=document.createElement("p");info.style.cssText="font-size:12px;color:#aeb8d8;line-height:1.5";
      info.textContent="Title grants are checked by Supabase. Enter the recipient’s account UUID; do not use an email address or password.";
      entries.push({label:"TITLE GRANTS",node:info});
      const form=document.createElement("form");
      form.innerHTML=`<label>Player account UUID<input name="player" required pattern="[0-9a-fA-F-]{36}" maxlength="36" placeholder="Player UUID" style="width:100%;padding:10px;margin:6px 0"></label><label>Title<input name="title" required maxlength="40" placeholder="Title" style="width:100%;padding:10px;margin:6px 0"></label><button class="menuButton" style="width:100%">GRANT TITLE</button><p class="v18GrantStatus" role="status" style="font-size:12px;overflow-wrap:anywhere"></p>`;
      form.addEventListener("submit",async e=>{
        e.preventDefault();const message=form.querySelector(".v18GrantStatus");
        const player=form.elements.player.value.trim(),title=form.elements.title.value.trim();
        message.textContent="Granting title…";
        try{const {error}=await supabaseClient.rpc("af_grant_title",{target_user:player,grant_title:title});
          message.textContent=error?`Grant failed: ${error.message}`:"Title granted on server.";
        }catch(_){message.textContent="Could not grant title. Check your connection.";}
      });
      entries.push({label:"GRANT TITLE",node:form});
      entries.push({label:"ACCOUNT",node:v18OwnerButton("MY ACCOUNT",()=>v18Open("ACCOUNT"))});
      entries.push({label:"ROOM CHAT",node:v18OwnerButton("ROOM CHAT",()=>v18Open("ROOM CHAT"))});
      entries.push({label:"ROOM INSPECTOR",node:v18OwnerButton("ROOM INSPECTOR",()=>v18OwnerRoomInspector())});
      entries.push({label:"CHAT DISPLAY",node:v18OwnerButton("CHAT DISPLAY SETTINGS",()=>v18OwnerChatSettings())});
      entries.push({label:"OWNER AUDIT",node:v18OwnerButton("LOCAL OWNER ACTION HISTORY",()=>v18OwnerAuditView())});
    }
    function filter(){
      const term=search.value.trim().toLowerCase();items.replaceChildren();
      let count=0;
      for(const entry of entries){
        if(!term||entry.label.toLowerCase().includes(term)){
          items.append(entry.node);count++;
        }
      }
      if(!count){const empty=document.createElement("p");empty.textContent="No matching controls in this section.";items.append(empty);}
    }
    search.addEventListener("input",filter);filter();
  }
  render();
}
document.getElementById("menuChat").addEventListener("click",()=>v18Open("ROOM CHAT"));
document.getElementById("menuAccount").addEventListener("click",()=>v18Open("ACCOUNT"));
document.getElementById("menuAdmin").addEventListener("click",()=>v18Open("OWNER PANEL"));

document.getElementById("menuSettings").addEventListener("click", () => v18Open("SETTINGS"));
document.getElementById("menuCustomization").addEventListener("click", () => v18Open("CUSTOMIZATION"));
document.getElementById("menuRankRewards").addEventListener("click", () => v18Open("RANK REWARDS"));


/* BUILD 4: OWNER-ONLY LOCAL TESTING ARENA.
   Access is checked against the existing server-side owner RPC before entry.
   This arena is LOCAL, not a synchronized multiplayer room. No rewards or
   progress are saved while testing. Exit restores the original game state. */
/* Build 6: owner-only local lab tools. No server-wide powers are implied. */
const v18OwnerAudit=[];
function v18OwnerLog(message){v18OwnerAudit.unshift(new Date().toLocaleTimeString()+" • "+message);v18OwnerAudit.length=Math.min(v18OwnerAudit.length,50);}
const v18Lab={speed:1,damage:1,enemyHp:200,spawnCount:1,spawnType:"Grunt",bossIndex:0,ambient:"#0b1022",autoSpawn:false};
function v18OwnerField(parent,label,type,value,min,max){
  const row=document.createElement("label");row.style.cssText="display:block;margin:10px 0;font-size:13px";row.textContent=label+" ";
  const input=document.createElement("input");input.type=type;input.value=value;input.style.cssText="display:block;width:100%;padding:9px;border-radius:8px;background:#19233a;color:white;border:1px solid #8c8cb5";
  if(min!==undefined)input.min=min;if(max!==undefined)input.max=max;row.append(input);parent.append(row);return input;
}
function v18OwnerLabPage(page){
  if(!v18Testing.active){v18Body.textContent="Enter the verified private Testing Room before using these controls.";return;}
  v18Body.replaceChildren();const title=document.createElement("h3");title.textContent=page.toUpperCase()+" • PRIVATE TEST LAB";v18Body.append(title);
  const note=document.createElement("p");note.textContent="Local testing only. No shared multiplayer changes, XP, essence, or permanent spell unlocks.";v18Body.append(note);
  const add=(label,fn)=>v18Body.append(v18OwnerButton(label,fn));
  if(page==="spells"){
    const magic=document.createElement("select");magic.style.cssText="width:100%;padding:10px;background:#182139;color:white";
    Object.keys(S.magic).sort().forEach(name=>magic.add(new Option(name,name)));magic.value=S.selected;v18Body.append(magic);
    add("EQUIP SELECTED MAGIC",()=>{S.selected=magic.value;updateHUD();v18OwnerLog("Equipped lab magic: "+magic.value);notice("LAB MAGIC EQUIPPED");});
    add("RESTORE FULL MANA",()=>{S.mana=100;updateHUD();});
    add("CHARGE AWAKENING",()=>{S.awakening=100;notice("AWAKENING CHARGED");});
    add("HEAL TO FULL",()=>{S.hp=100;S.dead=false;updateHUD();});
    add("CLEAR MY PROJECTILES",()=>{S.shots.length=0;S.enemyShots.length=0;S.zones.length=0;});
    const color=v18OwnerField(v18Body,"Spell impact color (hex)","color","#ad83ff");
    add("PREVIEW SPELL IMPACT",()=>{burst(S.x,S.y,color.value,65,32,2);impactVfx(S.x,S.y,color.value,"Light",true);});
  }else if(page==="world"){
    const bg=v18OwnerField(v18Body,"Arena background color","color",v18Lab.ambient);
    bg.onchange=()=>{v18Lab.ambient=bg.value;v18OwnerLog("Changed lab background");};
    const speed=v18OwnerField(v18Body,"Enemy speed multiplier (0.1–3)","number",v18Lab.speed,.1,3);
    const damage=v18OwnerField(v18Body,"Enemy damage multiplier (0–3)","number",v18Lab.damage,0,3);
    add("APPLY TO CURRENT ENEMIES",()=>{const nextSpeed=Math.max(.1,Math.min(3,Number(speed.value)||1));const nextDamage=Math.max(0,Math.min(3,Number(damage.value)||0));
      for(const e of S.enemies){e.speed=(e.speed||0)/v18Lab.speed*nextSpeed;e.damage=(e.damage||0)/Math.max(.001,v18Lab.damage)*nextDamage;}
      v18Lab.speed=nextSpeed;v18Lab.damage=nextDamage;v18OwnerLog("Updated lab enemy multipliers");notice("LAB ENEMIES UPDATED");});
    add("RESET WORLD SETTINGS",()=>{v18Lab.speed=1;v18Lab.damage=1;v18Lab.ambient="#0b1022";bg.value=v18Lab.ambient;speed.value=1;damage.value=1;notice("WORLD SETTINGS RESET");});
  }else if(page==="enemies"){
    const type=document.createElement("select");type.style.cssText="width:100%;padding:10px;background:#182139;color:white";
    Object.keys(enemyTypes).forEach(n=>type.add(new Option(n,n)));type.value=v18Lab.spawnType;v18Body.append(type);
    const count=v18OwnerField(v18Body,"Enemy count (1–20)","number",v18Lab.spawnCount,1,20);
    const hp=v18OwnerField(v18Body,"Enemy HP (1–100000)","number",v18Lab.enemyHp,1,100000);
    add("SPAWN SELECTED ENEMIES",()=>{v18Lab.spawnType=type.value;v18Lab.spawnCount=Math.max(1,Math.min(20,Number(count.value)||1));v18Lab.enemyHp=Math.max(1,Math.min(100000,Number(hp.value)||200));
      const cfg=enemyTypes[type.value];let made=0;
      for(let i=0;i<v18Lab.spawnCount&&S.enemies.length<40;i++){spawnEnemy();const e=S.enemies[S.enemies.length-1];if(!e)break;
        Object.assign(e,{type:type.value,hp:v18Lab.enemyHp,maxHp:v18Lab.enemyHp,r:cfg.radius,speed:cfg.speed*v18Lab.speed,damage:cfg.damage*v18Lab.damage,color:cfg.color,boss:false,ranged:!!cfg.ranged,dash:!!cfg.dash,shieldType:!!cfg.shield,leech:!!cfg.leech,element:cfg.element||null,x:S.x+180+Math.cos(i*2.4)*90,y:S.y+Math.sin(i*2.4)*90});made++;}
      v18OwnerLog("Spawned "+made+" lab "+type.value);notice("SPAWNED "+made+" LAB ENEMIES");});
    const boss=document.createElement("select");boss.style.cssText=type.style.cssText;bossRoster.forEach((b,i)=>boss.add(new Option(b.name,String(i))));v18Body.append(boss);
    add("SPAWN SELECTED BOSS",()=>{if(S.enemies.some(e=>e.boss)){notice("CLEAR EXISTING BOSS FIRST");return;}const old=bossesSpawned;bossesSpawned=Number(boss.value);spawnMiniBoss();bossesSpawned=old;v18OwnerLog("Spawned lab boss");});
    add("CLEAR ALL ENEMIES & PROJECTILES",()=>{S.enemies.length=0;S.shots.length=0;S.enemyShots.length=0;S.zones.length=0;v18OwnerLog("Cleared lab arena");notice("LAB CLEARED");});
  }else if(page==="presets"){
    const name=v18OwnerField(v18Body,"Preset name (local to this device)","text","My Lab");name.maxLength=30;
    add("SAVE LAB PRESET",()=>{const key="arcaneForgeOwnerLabPresets";let data={};try{data=JSON.parse(localStorage.getItem(key)||"{}");}catch(_){}
      const label=name.value.trim().slice(0,30);if(!label)return;if(Object.keys(data).length>=12&&!data[label]){notice("MAX 12 PRESETS");return;}
      data[label]={...v18Lab,invincible:v18Testing.invincible,infiniteMana:v18Testing.infiniteMana};localStorage.setItem(key,JSON.stringify(data));v18OwnerLog("Saved lab preset");notice("LAB PRESET SAVED");});
    const select=document.createElement("select");select.style.cssText="width:100%;padding:10px;background:#182139;color:white";let data={};try{data=JSON.parse(localStorage.getItem("arcaneForgeOwnerLabPresets")||"{}");}catch(_){}
    Object.keys(data).forEach(n=>select.add(new Option(n,n)));v18Body.append(select);
    add("LOAD SELECTED PRESET",()=>{if(!data[select.value])return;Object.assign(v18Lab,data[select.value]);v18Testing.invincible=!!data[select.value].invincible;v18Testing.infiniteMana=!!data[select.value].infiniteMana;v18OwnerLog("Loaded lab preset");notice("LAB PRESET LOADED");});
    add("DELETE SELECTED PRESET",()=>{if(!data[select.value])return;delete data[select.value];localStorage.setItem("arcaneForgeOwnerLabPresets",JSON.stringify(data));select.remove(select.selectedIndex);notice("PRESET DELETED");});
  }
  add("BACK TO OWNER PANEL",()=>v18Open("OWNER PANEL"));
}
function v18OwnerRoomInspector(){v18Body.replaceChildren();const p=document.createElement("p");p.textContent=multiplayerRoom?"Current room: "+multiplayerRoom+" • Other players recently seen: "+multiplayerPlayers.size:"Not connected to a multiplayer room.";v18Body.append(p);v18Body.append(v18OwnerButton("BACK TO OWNER PANEL",()=>v18Open("OWNER PANEL")));}
function v18OwnerChatSettings(){v18Body.replaceChildren();const p=document.createElement("p");p.textContent="Local chat display controls. These do not mute or ban other players on the server.";v18Body.append(p);
  const top=v18OwnerField(v18Body,"Chat top position (% of screen, 8–65)","number",Number(localStorage.getItem("afChatTopPct")||22),8,65);
  v18Body.append(v18OwnerButton("SAVE CHAT POSITION",()=>{const n=Math.max(8,Math.min(65,Number(top.value)||22));localStorage.setItem("afChatTopPct",String(n));if(typeof v18ChatUI!=="undefined")v18ChatUI.style.top=n+"vh";afLayoutSafeZones();notice("CHAT POSITION SAVED");}));
  v18Body.append(v18OwnerButton("BACK TO OWNER PANEL",()=>v18Open("OWNER PANEL")));
}
function v18OwnerAuditView(){v18Body.replaceChildren();const p=document.createElement("p");p.textContent="This-device owner actions only; not a server moderation audit log.";v18Body.append(p);const log=document.createElement("pre");log.style.cssText="white-space:pre-wrap;font-size:12px";log.textContent=v18OwnerAudit.join("\n")||"No local actions yet.";v18Body.append(log);v18Body.append(v18OwnerButton("BACK TO OWNER PANEL",()=>v18Open("OWNER PANEL")));}
/* BUILD 10 — Owner-verified local single-player and private-lab tools.
   Owner status is verified when opening the Owner Panel; these pages never send room broadcasts.
   Single-player changes affect the current run; private lab changes are discarded on exit. */
function afOwnerExtras(page){
  if(!afOwnerLocalAllowed()){v18Body.textContent="Owner verification required. Disconnect from multiplayer and reopen the Owner Panel.";return;}
  v18Body.replaceChildren();
  const h=document.createElement("h3");h.textContent=({combat:"COMBAT DIRECTOR",boss:"BOSS DIRECTOR",magic:"MAGIC WORKSHOP",arena:"ARENA TOOLS"})[page]+" • LOCAL";v18Body.append(h);
  const note=document.createElement("p");note.textContent=v18Testing.active?"Private Testing Room • Changes and rewards discarded on exit.":"Single-player • Changes affect this run; normal progression may be saved. No multiplayer changes.";v18Body.append(note);
  const btn=(label,fn)=>v18Body.append(v18OwnerButton(label,()=>{if(!afOwnerLocalAllowed()){notice("OWNER LOCAL MODE REQUIRED");return;}fn();v18OwnerLog(label+(v18Testing.active?" (private lab)":" (single player)"));}));
  const field=(label,value,min,max)=>v18OwnerField(v18Body,label,"number",value,min,max);
  const clamp=(el,min,max,fallback)=>{const n=Number(el.value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;};
  const select=(values)=>{const el=document.createElement("select");el.style.cssText="display:block;width:100%;padding:10px;margin:10px 0;background:#182139;color:white;border-radius:8px";values.forEach(([label,value])=>el.add(new Option(label,value)));v18Body.append(el);return el;};
  const clear=()=>{S.enemies.length=0;S.shots.length=0;S.enemyShots.length=0;S.zones.length=0;S.particles.length=0;};
  if(page==="combat"){
    const target=select([["All enemies","all"],["Normal enemies","normal"],["Bosses","boss"]]);
    const amount=field("Amount / multiplier",100,0,100000);
    const chosen=()=>S.enemies.filter(e=>target.value==="all"||(target.value==="boss"?!!e.boss:!e.boss));
    btn("SET TARGET HP",()=>{const hp=Math.max(1,clamp(amount,1,100000,100));chosen().forEach(e=>{e.hp=hp;e.maxHp=hp;});notice("TARGET HP SET");});
    btn("HEAL TARGETS TO FULL",()=>{chosen().forEach(e=>e.hp=e.maxHp);notice("TARGETS HEALED");});
    btn("SET TARGET SPEED MULTIPLIER",()=>{const m=clamp(amount,0,10,1);chosen().forEach(e=>{if(e.afBaseSpeed===undefined)e.afBaseSpeed=e.speed;e.speed=e.afBaseSpeed*m;});notice("TARGET SPEED UPDATED");});
    btn("SET TARGET DAMAGE MULTIPLIER",()=>{const m=clamp(amount,0,10,1);chosen().forEach(e=>{if(e.afBaseDamage===undefined)e.afBaseDamage=e.damage;e.damage=e.afBaseDamage*m;});notice("TARGET DAMAGE UPDATED");});
    btn("FREEZE TARGETS",()=>{chosen().forEach(e=>{if(e.afBaseSpeed===undefined)e.afBaseSpeed=e.speed;e.speed=0;});notice("TARGETS FROZEN");});
    btn("UNFREEZE TARGETS",()=>{chosen().forEach(e=>{if(e.afBaseSpeed!==undefined)e.speed=e.afBaseSpeed;});notice("TARGETS UNFROZEN");});
    btn("CLEAR TARGETS",()=>{const remove=new Set(chosen());for(let i=S.enemies.length-1;i>=0;i--)if(remove.has(S.enemies[i]))S.enemies.splice(i,1);notice("TARGETS CLEARED");});
    btn("RESTORE PLAYER HP & MANA",()=>{S.hp=100;S.mana=100;S.dead=false;S.deathScreen=false;deathOverlay.style.display="none";updateHUD();});
    btn("RESET AWAKENING",()=>{S.awakening=0;S.awakened=false;S.awakeningTime=0;notice("AWAKENING RESET");});
    btn("FILL AWAKENING",()=>{S.awakening=100;notice("AWAKENING READY");});
  }else if(page==="boss"){
    const roster=select(bossRoster.map((b,i)=>[b.name,String(i)]));
    const hp=field("Boss HP",3000,1,1000000);
    const distance=field("Spawn distance",440,120,1200);
    btn("SPAWN SELECTED BOSS",()=>{if(S.enemies.some(e=>e.boss)){notice("CLEAR CURRENT BOSS FIRST");return;}const old=bossesSpawned;bossesSpawned=Number(roster.value);spawnMiniBoss();bossesSpawned=old;const b=S.enemies.find(e=>e.boss);if(b){b.hp=b.maxHp=clamp(hp,1,1000000,3000);b.x=S.x+clamp(distance,120,1200,440);b.y=S.y;}notice("LAB BOSS SPAWNED");});
    btn("SET CURRENT BOSS HP",()=>{const b=S.enemies.find(e=>e.boss);if(!b){notice("NO BOSS");return;}b.hp=b.maxHp=clamp(hp,1,1000000,3000);updateBossHUD();});
    btn("HEAL CURRENT BOSS",()=>{const b=S.enemies.find(e=>e.boss);if(b)b.hp=b.maxHp;else notice("NO BOSS");});
    btn("MOVE BOSS TO SPAWN DISTANCE",()=>{const b=S.enemies.find(e=>e.boss);if(!b){notice("NO BOSS");return;}b.x=S.x+clamp(distance,120,1200,440);b.y=S.y;});
    btn("REMOVE CURRENT BOSS",()=>{for(let i=S.enemies.length-1;i>=0;i--)if(S.enemies[i].boss)S.enemies.splice(i,1);S.enemyShots.length=0;updateBossHUD();});
    btn("CLEAR BOSS PROJECTILES",()=>{S.enemyShots.length=0;S.zones.length=0;notice("BOSS PROJECTILES CLEARED");});
    btn("RESET BOSS ROTATION",()=>{bossesSpawned=0;notice("BOSS ROTATION RESET");});
  }else if(page==="magic"){
    const magic=select(Object.keys(S.magic).sort().map(name=>[name,name]));magic.value=S.selected;
    const count=field("Particle count",45,1,250);
    const radius=field("Preview distance",90,0,400);
    btn("EQUIP SELECTED MAGIC",()=>{S.selected=magic.value;updateHUD();notice("LAB MAGIC EQUIPPED");});
    btn("PREVIEW MAGIC BURST",()=>{const m=S.magic[magic.value];if(m)burst(S.x,S.y,m.color,clamp(count,1,250,45),35,2);});
    btn("PREVIEW MAGIC IMPACT",()=>{const m=S.magic[magic.value];if(m)impactVfx(S.x+clamp(radius,0,400,90),S.y,m.color,magic.value,true);});
    btn("PREVIEW ELEMENTAL DASH",()=>{const m=S.magic[magic.value];if(m)for(let i=0;i<6;i++)burst(S.x+i*16,S.y,m.color,Math.min(20,clamp(count,1,250,45)),18,1.3);});
    btn("FILL MANA",()=>{S.mana=100;updateHUD();});
    btn("EMPTY MANA",()=>{S.mana=0;updateHUD();});
    btn("CHARGE AWAKENING",()=>{S.awakening=100;notice("AWAKENING READY");});
    btn("CLEAR SPELL EFFECTS",()=>{S.shots.length=0;S.enemyShots.length=0;S.zones.length=0;S.particles.length=0;});
  }else if(page==="arena"){
    const x=field("Move player X (relative)",0,-1000,1000);
    const y=field("Move player Y (relative)",0,-1000,1000);
    btn("MOVE PLAYER BY OFFSET",()=>{S.x+=clamp(x,-1000,1000,0);S.y+=clamp(y,-1000,1000,0);notice("PLAYER MOVED");});
    btn("RESET PLAYER POSITION",()=>{S.x=0;S.y=0;resetJoystick();notice("POSITION RESET");});
    btn("CLEAR ENEMIES",()=>{S.enemies.length=0;updateBossHUD();});
    btn("CLEAR ALL PROJECTILES",()=>{S.shots.length=0;S.enemyShots.length=0;S.zones.length=0;});
    btn("CLEAR PARTICLES",()=>{S.particles.length=0;});
    btn("CLEAR ENTIRE ARENA",()=>{clear();updateBossHUD();notice("LAB ARENA CLEARED");});
    btn("RESET PLAYER COMBAT STATE",()=>{S.hp=100;S.mana=100;S.ward=0;S.armor=0;S.awakening=0;S.awakened=false;S.awakeningTime=0;S.dead=false;S.deathScreen=false;deathOverlay.style.display="none";updateHUD();});
    btn("TOGGLE INVINCIBILITY",()=>{v18Testing.invincible=!v18Testing.invincible;notice("INVINCIBILITY "+(v18Testing.invincible?"ON":"OFF"));});
    btn("TOGGLE INFINITE MANA",()=>{v18Testing.infiniteMana=!v18Testing.infiniteMana;notice("INFINITE MANA "+(v18Testing.infiniteMana?"ON":"OFF"));});
  }
  btn("BACK TO OWNER PANEL",()=>v18Open("OWNER PANEL"));
}
const v18Testing={active:false,invincible:false,infiniteMana:false,snapshot:null};
const v18TestHud=document.createElement("button");
v18TestHud.textContent="TEST LAB • CONTROLS";
v18TestHud.style.cssText="position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:90;display:none;background:#24164a;color:#fff;border:1px solid #c5aaff;border-radius:12px;padding:10px;font-weight:800";
document.body.appendChild(v18TestHud);
v18TestHud.addEventListener("click",()=>v18Open("OWNER TESTING ROOM"));
async function v18EnterTesting(){
  if(v18Testing.active){v18Open("OWNER TESTING ROOM");return;}
  if(!supabaseClient||!await v18RefreshAccount()){notice("SIGN IN AS OWNER FIRST");return;}
  const {data,error}=await supabaseClient.rpc("af_is_owner");
  if(error||data!==true){notice("OWNER PERMISSION REQUIRED");return;}
  if(multiplayerChannel){await supabaseClient.removeChannel(multiplayerChannel);multiplayerChannel=null;multiplayerRoom=null;multiplayerPlayers.clear();v18ChatUI.style.display="none";}
  v18Testing.snapshot={hp:S.hp,mana:S.mana,x:S.x,y:S.y,essence:S.essence,xp:S.xp,rank:S.rank,selected:S.selected,magic:structuredClone(S.magic),kills:S.kills,bossesSpawned,bossKillTarget,enemyTimer,awakening:S.awakening,awakened:S.awakened,awakeningTime:S.awakeningTime};
  v18Testing.active=true;v18Testing.invincible=true;v18Testing.infiniteMana=true;
  S.enemies.length=0;S.shots.length=0;S.enemyShots.length=0;S.zones.length=0;S.particles.length=0;
  S.hp=100;S.mana=100;S.dead=false;S.deathScreen=false;S.deathTimer=0;deathOverlay.style.display="none";
  v18Panel.style.display="none";closeMainMenu();v18TestHud.style.display="block";v18MusicStart();notice("OWNER TESTING ROOM — NO REWARDS SAVED");
}
function v18ExitTesting(){
  if(!v18Testing.active)return;
  const b=v18Testing.snapshot;
  S.hp=b.hp;S.mana=b.mana;S.x=b.x;S.y=b.y;S.essence=b.essence;S.xp=b.xp;S.rank=b.rank;S.selected=b.selected;S.magic=b.magic;S.kills=b.kills;
  S.awakening=b.awakening;S.awakened=b.awakened;S.awakeningTime=b.awakeningTime;
  bossesSpawned=b.bossesSpawned;bossKillTarget=b.bossKillTarget;enemyTimer=b.enemyTimer;
  S.enemies.length=0;S.shots.length=0;S.enemyShots.length=0;S.zones.length=0;S.particles.length=0;
  S.dead=false;S.deathScreen=false;S.deathTimer=0;deathOverlay.style.display="none";
  v18Testing.active=false;v18Testing.invincible=false;v18Testing.infiniteMana=false;v18Testing.snapshot=null;v18TestHud.style.display="none";v18Panel.style.display="none";
  renderForge();renderBook();renderTree();updateHUD();openMainMenu();notice("TEST LAB CLOSED — NORMAL SAVE RESTORED");
}
function v18ShowTestingControls(){
  if(!v18Testing.active){v18Body.textContent="Enter from the verified Owner Panel first.";return;}
  v18Body.innerHTML=`<p>PRIVATE LOCAL LAB • Progress and rewards are discarded on exit. Multiplayer is disconnected on entry.</p>
  <label style="display:block;margin:12px 0"><input id="v18TestGod" type="checkbox"> Invincible</label>
  <label style="display:block;margin:12px 0"><input id="v18TestMana" type="checkbox"> Infinite mana</label>
  <label>Enemy HP <input id="v18TestHp" type="number" min="1" max="100000" value="200" style="width:100%;padding:8px"></label>
  <label>Enemy type <select id="v18TestEnemy" style="width:100%;padding:8px"></select></label>
  <button id="v18TestSpawn" class="menuButton" style="width:100%">SPAWN ENEMY</button>
  <label>Boss <select id="v18TestBoss" style="width:100%;padding:8px"></select></label>
  <button id="v18TestSpawnBoss" class="menuButton" style="width:100%">SPAWN BOSS</button>
  <button id="v18TestClear" class="menuButton" style="width:100%">CLEAR ARENA</button>
  <button id="v18TestExit" class="menuButton" style="width:100%;background:#67304b">EXIT LAB • RESTORE NORMAL GAME</button>`;
  const god=document.getElementById("v18TestGod"),mana=document.getElementById("v18TestMana");
  god.checked=v18Testing.invincible;mana.checked=v18Testing.infiniteMana;
  god.onchange=()=>v18Testing.invincible=god.checked;
  mana.onchange=()=>v18Testing.infiniteMana=mana.checked;
  const enemySelect=document.getElementById("v18TestEnemy"),bossSelect=document.getElementById("v18TestBoss");
  Object.keys(enemyTypes).forEach(n=>enemySelect.add(new Option(n,n)));
  bossRoster.forEach((b,i)=>bossSelect.add(new Option(b.name,String(i))));
  const hp=()=>Math.max(1,Math.min(100000,Number(document.getElementById("v18TestHp").value)||200));
  document.getElementById("v18TestSpawn").onclick=()=>{
    if(S.enemies.length>=30){notice("LAB LIMIT: 30 ENEMIES");return;}
    const type=enemySelect.value;spawnEnemy();const e=S.enemies[S.enemies.length-1];
    if(e){const config=enemyTypes[type];Object.assign(e,{type,hp:hp(),maxHp:hp(),r:config.radius,speed:config.speed,damage:config.damage,color:config.color,x:S.x+210,y:S.y-100,boss:false,ranged:!!config.ranged,dash:!!config.dash,shieldType:!!config.shield,leech:!!config.leech,element:config.element||null});}
    v18Panel.style.display="none";
  };
  document.getElementById("v18TestSpawnBoss").onclick=()=>{
    if(S.enemies.some(e=>e.boss)){notice("CLEAR CURRENT BOSS FIRST");return;}
    const index=Number(bossSelect.value);const old=bossesSpawned;bossesSpawned=index;spawnMiniBoss();bossesSpawned=old;
    const boss=S.enemies.find(e=>e.boss);if(boss){boss.hp=hp();boss.maxHp=hp();}
    v18Panel.style.display="none";
  };
  document.getElementById("v18TestClear").onclick=()=>{S.enemies.length=0;S.shots.length=0;S.enemyShots.length=0;S.zones.length=0;S.particles.length=0;notice("LAB CLEARED");};
  document.getElementById("v18TestExit").onclick=v18ExitTesting;
}
/* Original, synthesized, looping background music; no external audio files.
   iOS playback is initiated only from a user tap. Music and SFX have
   independent volume controls. */
let v18MusicOn=false,v18MusicNext=0,v18MusicStep=0,v18MusicMode="explore";
const v18MusicNotes={explore:[220,0,261.63,329.63,0,293.66,261.63,0,196,0,246.94,293.66,0,261.63,246.94,0],boss:[110,164.81,220,164.81,123.47,185,246.94,185,130.81,196,261.63,196,123.47,185,246.94,185]};
function v18MusicStart(){
  try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    if(!audioContext)audioContext=new AC();
    if(audioContext.state==="suspended")audioContext.resume();
    v18MusicOn=true;v18MusicNext=audioContext.currentTime+.06;
  }catch(_){notice("MUSIC UNAVAILABLE");}
}
function v18MusicTick(){
  if(!v18MusicOn||!audioContext||audioContext.state!=="running"||document.hidden||gameSettings.musicVolume<=0)return;
  const mode=S.enemies.some(e=>e.boss)?"boss":"explore";
  if(mode!==v18MusicMode){v18MusicMode=mode;v18MusicStep=0;v18MusicNext=audioContext.currentTime+.1;}
  const interval=mode==="boss"?.18:.29;
  if(v18MusicNext<audioContext.currentTime-.5)v18MusicNext=audioContext.currentTime+.03;
  while(v18MusicNext<audioContext.currentTime+.13){
    const note=v18MusicNotes[mode][v18MusicStep++%16];
    if(note){
      const osc=audioContext.createOscillator(),gain=audioContext.createGain();
      osc.type=mode==="boss"?"triangle":"sine";
      osc.frequency.setValueAtTime(note,v18MusicNext);
      const volume=Math.max(.0001,gameSettings.musicVolume*(mode==="boss"?.075:.06));
      gain.gain.setValueAtTime(.0001,v18MusicNext);
      gain.gain.linearRampToValueAtTime(volume,v18MusicNext+.025);
      gain.gain.exponentialRampToValueAtTime(.0001,v18MusicNext+interval*.93);
      osc.connect(gain);gain.connect(audioContext.destination);
      osc.start(v18MusicNext);osc.stop(v18MusicNext+interval);
    }
    v18MusicNext+=interval;
  }
}

/* =========================================================
   BUILD 7 — IN-GAME PAUSE + ROOM-WIDE PAUSE
   Realtime broadcast is room-scoped, not a persistent server lock.
========================================================= */
const afPauseState={active:false,seq:0,by:"",room:"",lastSeen:0};
const afPauseOverlay=document.createElement("div");
afPauseOverlay.id="afPauseOverlay";
afPauseOverlay.style.cssText="position:fixed;inset:0;z-index:1050;display:none;align-items:center;justify-content:center;background:#050715d9;padding:16px;color:#fff;font-family:system-ui";
afPauseOverlay.innerHTML=`<section style="width:min(410px,100%);max-height:88dvh;overflow:auto;background:#101426;border:1px solid #8b79c5;border-radius:20px;padding:20px;box-shadow:0 20px 60px #000"><h2 style="margin:0 0 8px">GAME PAUSED</h2><p id="afPauseWho" style="font-size:12px;color:#d6caff"></p><div id="afPauseActions" style="display:grid;gap:9px"></div></section>`;
document.body.appendChild(afPauseOverlay);
const afPauseWho=document.getElementById("afPauseWho");
const afPauseActions=document.getElementById("afPauseActions");
const afPauseButton=document.createElement("button");
afPauseButton.id="afPauseButton";afPauseButton.textContent="☰ PAUSE";
afPauseButton.style.cssText="position:fixed;left:12px;top:12px;z-index:72;border:1px solid #9985d9;border-radius:12px;background:#171c37;color:white;padding:10px 13px;font:800 12px system-ui;touch-action:manipulation";
document.body.appendChild(afPauseButton);
function afPauseReset(){
  afPauseState.active=false;afPauseState.seq=0;afPauseState.by="";afPauseState.room="";
  afPauseOverlay.style.display="none";
}
function afPauseRender(){
  afPauseOverlay.style.display=afPauseState.active?"flex":"none";
  afPauseButton.textContent=afPauseState.active?"☰ MENU":"☰ PAUSE";
  if(!afPauseState.active)return;
  afPauseWho.textContent=multiplayerRoom?"Shared pause • "+(afPauseState.by==="me"?"You": "Another player")+" opened the menu. Room and chat stay connected.":"Single-player pause";
  afPauseActions.replaceChildren();
  const add=(label,fn)=>{const b=document.createElement("button");b.textContent=label;b.style.cssText="background:#282f57;color:white;border:1px solid #5b6598;border-radius:12px;padding:12px;font:700 14px system-ui";b.addEventListener("click",fn);afPauseActions.appendChild(b);};
  add("RESUME FOR EVERYONE",()=>afPauseSet(false));
  add("SETTINGS",()=>v18Open("SETTINGS"));
  add("MAGIC BOOK",()=>{const modal=(document.getElementById("bookModal")||document.getElementById("book"));if(modal){modal.classList.add("open");renderBook();afPauseOverlay.style.display="none";}else notice("BOOK UNAVAILABLE");});
  add("FORGE",()=>{const modal=(document.getElementById("forgeModal")||document.getElementById("forge"));if(modal){modal.classList.add("open");renderForge();afPauseOverlay.style.display="none";}else notice("FORGE UNAVAILABLE");});
  add("OWNER PANEL (VERIFIED OWNERS)",()=>v18Open("OWNER PANEL"));
  if(multiplayerRoom)add("LEAVE ROOM",async()=>{
    afPauseSet(false);
    if(multiplayerChannel&&supabaseClient)await supabaseClient.removeChannel(multiplayerChannel);
    multiplayerChannel=null;multiplayerRoom=null;multiplayerPlayers.clear();
    if(typeof v18ChatUI!=="undefined")v18ChatUI.style.display="none";
    notice("LEFT MULTIPLAYER ROOM");
  });
}
function afPauseBroadcast(active){
  if(!multiplayerRoom||!multiplayerChannel)return;
  multiplayerChannel.send({type:"broadcast",event:"af-pause",payload:{
    room:multiplayerRoom,active,seq:afPauseState.seq,from:multiplayerId,
    sentAt:Date.now()
  }}).catch(()=>notice("PAUSE SYNC FAILED — CHECK CONNECTION"));
}
function afPauseSet(active){
  if(menuOpen){notice("START THE GAME FIRST");return;}
  afPauseState.seq=Math.max(Date.now(),afPauseState.seq+1);
  afPauseState.active=!!active;afPauseState.by="me";afPauseState.room=multiplayerRoom||"";
  if(!active){v18Panel.style.display="none";document.querySelectorAll(".modal.open").forEach(m=>m.classList.remove("open"));}
  afPauseRender();afPauseBroadcast(!!active);
}
function afPauseReceive(payload){
  if(!payload||!multiplayerRoom||payload.room!==multiplayerRoom||payload.from===multiplayerId)return;
  if(typeof payload.active!=="boolean"||!Number.isSafeInteger(payload.seq)||Math.abs(Date.now()-payload.sentAt)>30000)return;
  if(payload.seq<afPauseState.seq)return;
  afPauseState.seq=payload.seq;afPauseState.active=payload.active;
  afPauseState.by="other";afPauseState.room=multiplayerRoom;
  if(!payload.active){v18Panel.style.display="none";document.querySelectorAll(".modal.open").forEach(m=>m.classList.remove("open"));}
  afPauseRender();
}
afPauseButton.addEventListener("click",()=>{
  if(menuOpen){notice("START THE GAME FIRST");return;}
  if(afPauseState.active){afPauseOverlay.style.display="flex";return;}
  afPauseSet(true);
});
// Keep pause overlay visible when closing Settings / Owner Panel.
document.getElementById("v18Back").addEventListener("click",()=>{
  if(afPauseState.active)setTimeout(()=>{if(v18Panel.style.display==="none")afPauseOverlay.style.display="flex";},0);
});
for(const id of ["forgeModal","bookModal","forge","book"]){
  const modal=document.getElementById(id);
  if(modal)modal.querySelectorAll(".close").forEach(b=>b.addEventListener("click",()=>{
    if(afPauseState.active)afPauseOverlay.style.display="flex";
  }));
}

/* =========================================================
   PAUSE GAME WHILE MENU IS OPEN
========================================================= */

/*
  Other systems can check:

      if (menuOpen) return;

  We'll connect this to the main
  game loop if your current loop
  doesn't already support pausing.
*/


/* ========================
   START
========================= */

renderForge();
renderBook();
renderTree();
updateHUD();

/* =========================================================
   BUILD 8 — MOBILE HUD SAFE ZONES
   Keeps persistent controls in separate screen areas. No gameplay
   state, multiplayer synchronization, or owner permissions changed.
========================================================= */
function afLayoutSafeZones(){
  const narrow = innerWidth < 700;
  const topInset = Math.max(0, window.visualViewport ? window.visualViewport.offsetTop : 0);
  if(narrow){
    /* The title/HP/mana occupy the top strip; avoid that entire row. */
    afPauseButton.style.left="12px";
    afPauseButton.style.right="auto";
    afPauseButton.style.top="calc(env(safe-area-inset-top, 0px) + 188px)";
    afPauseButton.style.padding="9px 11px";
    afPauseButton.style.fontSize="11px";
    afPauseButton.style.maxWidth="110px";
    v18TestHud.style.left="auto";
    v18TestHud.style.right="12px";
    v18TestHud.style.top="calc(env(safe-area-inset-top, 0px) + 188px)";
    v18TestHud.style.transform="none";
    v18TestHud.style.maxWidth="min(185px, 48vw)";
    v18TestHud.style.fontSize="10px";
    v18TestHud.style.padding="10px 8px";
    v18TestHud.style.whiteSpace="normal";
    v18TestHud.style.lineHeight="1.2";
    bossHud.style.top="calc(env(safe-area-inset-top, 0px) + 260px)";
    bossHud.style.width="min(520px, calc(100vw - 36px))";
    /* Damage messages stay below the boss HUD, not on its HP bar. */
    damageIndicator.style.top="calc(env(safe-area-inset-top, 0px) + 370px)";
    damageIndicator.style.maxWidth="calc(100vw - 44px)";
    /* Chat uses the upper-right area, never the movement/action pads. */
    v18ChatUI.style.maxHeight="min(30dvh, 240px)";
    v18ChatUI.style.width="min(280px, calc(100vw - 24px))";
    const chatTop=Math.max(310,Math.min(innerHeight*.45,Number(localStorage.getItem("afChatTopPct")||22)*innerHeight/100));
    v18ChatUI.style.top=chatTop+"px";
  }else{
    afPauseButton.style.left="12px";afPauseButton.style.right="auto";
    afPauseButton.style.top="calc(env(safe-area-inset-top, 0px) + 12px)";
    afPauseButton.style.maxWidth="";afPauseButton.style.fontSize="12px";
    v18TestHud.style.left="50%";v18TestHud.style.right="auto";
    v18TestHud.style.top="calc(env(safe-area-inset-top, 0px) + 12px)";
    v18TestHud.style.transform="translateX(-50%)";
    v18TestHud.style.maxWidth="";v18TestHud.style.fontSize="";
    bossHud.style.top="155px";bossHud.style.width="min(520px, 72vw)";
    damageIndicator.style.top="32%";
    v18ChatUI.style.top=(Number(localStorage.getItem("afChatTopPct")||22))+"vh";
    v18ChatUI.style.maxHeight="35vh";v18ChatUI.style.width="min(320px,calc(100vw - 20px))";
  }
}
addEventListener("resize",afLayoutSafeZones);
if(window.visualViewport)window.visualViewport.addEventListener("resize",afLayoutSafeZones);
afLayoutSafeZones();

v18HandleRecoveryLink();

notice(
  "ARCANE FORGE v1.8 — BUILD 6"
);

requestAnimationFrame(
  update
);

})();