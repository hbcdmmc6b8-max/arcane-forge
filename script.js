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
  multiplayerRoom = code;

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

        multiplayerPlayers.set(
          payload.id,
          {
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
            lastSeen: performance.now()
          }
        );
      }
    )
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
      magic: S.selected
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
    boss.type;

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
  S.awakeningTime = 10;

  S.mana = 100;

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

function spawnMiniBoss() {
  if (
    S.dead ||
    S.enemies.some(
      enemy => enemy.boss
    )
  ) {
    return;
  }

  const angle =
    Math.random() *
    Math.PI *
    2;

  const distance = 520;

  S.enemies.push({
    type: "ARCANE SENTINEL",

    boss: true,

    x:
      S.x +
      Math.cos(angle) *
      distance,

    y:
      S.y +
      Math.sin(angle) *
      distance,

    hp: 3000,
    maxHp: 3000,

    r: 48,

    speed: 28,
    damage: 26,

    color: "#e09cff",

    xp: 450,
    essence: 25,

    ranged: true,
    dash: true,
    shieldType: true,

    elite: false,

    burn: 0,
    slow: 0,
    wet: 0,

    shield: 80,

    attackTimer: 1,
    dashTimer: 4
  });

  notice(
    "MINI-BOSS — ARCANE SENTINEL"
  );
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
        (S.awakened ? 1.65 : 1),
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
      ? 5
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

  const magic =
    S.magic[S.selected];

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
          ? 22
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
if (typeof menuOpen !== "undefined" && menuOpen) {
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
        ? 230
        : 180;

    S.x +=
      joystick.x *
      moveSpeed *
      delta;

    S.y +=
      joystick.y *
      moveSpeed *
      delta;

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
            10 *
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

    enemyTimer += delta;

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
      bossKillTarget
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

          enemy.attackTimer =
            enemy.boss
              ? 1.1
              : 2.2;
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

        if (
          enemy.boss
        ) {
          notice(
            "ARCANE SENTINEL DEFEATED"
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
      drawArcaneSentinel(
        enemy,
        enemyColor
      );
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

      ctx.fillText(
        "ARCANE SENTINEL",
        enemy.x,
        enemy.y -
          enemy.r -
          20
      );
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

    ctx.shadowBlur = 24;
    ctx.shadowColor = playerColor;
    ctx.fillStyle = "#dff6ff";

    ctx.beginPath();
    ctx.arc(
      player.x,
      player.y,
      14,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = playerColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle =
      "rgba(20,8,18,.9)";
    ctx.fillRect(
      player.x - 22,
      player.y - 31,
      44,
      5
    );

    ctx.fillStyle = playerColor;
    ctx.fillRect(
      player.x - 22,
      player.y - 31,
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

    ctx.shadowBlur =
      S.awakened
        ? 50
        : 30;

    ctx.shadowColor =
      playerColor;

    ctx.fillStyle =
      "#f5f1ff";

    ctx.beginPath();

    ctx.arc(
      S.x,
      S.y,
      S.awakened ? 17 : 14,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
      playerColor;

    ctx.lineWidth =
      S.awakened
        ? 5
        : 3;

    ctx.stroke();

    ctx.shadowBlur = 0;

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

    <button id="menuSettings" class="menuButton">
      SETTINGS
    </button>

    <div class="menuVersion">
      v1.4 • MOBILE + DESKTOP
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

  overflow: hidden;
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
      30px
      22px
      22px;
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
   SETTINGS
========================================================= */

document
  .getElementById(
    "menuSettings"
  )
  .addEventListener(
    "click",
    () => {

      /*
        Settings screen comes next.

        For now this confirms
        the button works.
      */

      notice(
        "SETTINGS — COMING NEXT"
      );

    }
  );


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


/* =========================
   START
========================= */

renderForge();
renderBook();
renderTree();
updateHUD();

notice(
  "ARCANE FORGE v1.4 — AWAKENING"
);

requestAnimationFrame(
  update
);

})();