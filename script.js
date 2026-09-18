(() => {
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

const recipes = {
  "Earth+Fire": ["Magma","#ff5528",["heat","stone","burn"]],
  "Fire+Wind": ["Inferno","#ff3217",["heat","burn","speed"]],
  "Lightning+Water": ["Storm","#59dcff",["wet","shock","energy"]],
  "Ice+Water": ["Glacier","#b8f2ff",["freeze","solid","defense"]],
  "Fire+Light": ["Solar","#ffd24a",["radiant","heat","energy"]],
  "Fire+Shadow": ["Blackflame","#a83fff",["dark","heat","burn","drain"]],
  "Force+Wind": ["Gravity","#b28aff",["control","mass","push"]],
  "Light+Lightning": ["Plasma","#e8f5ff",["energy","shock","radiant"]],
  "Earth+Water": ["Nature","#5de27a",["growth","stone","flow","heal"]],
  "Force+Shadow": ["Void","#62418f",["dark","control","drain"]]
};

let S = {
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
  enemies: [],
  particles: [],
  zones: [],

  forge: [],
  ward: 0,

  dead: false,
  deathTimer: 0,
  deathScreen: false,

  powerCooldown: 0,
  armor: 0
};

Object.entries(base).forEach(([name,data]) => {
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
  const saved =
    JSON.parse(localStorage.arcaneForge || "null");

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
    h = Math.imul(h,16777619);
  }

  return h >>> 0;
}

const prefixes = [
  "Astral","Primal","Nova","Rift","Aether",
  "Eclipse","Tempest","Runic","Celestial","Arcane"
];

const suffixes = [
  "Flare","Surge","Veil","Pulse","Storm",
  "Flux","Wave","Core","Rift","Bloom"
];

function generateMagic(parents) {
  const key = [...parents].sort().join("+");
  const h = hash(key);

  const name =
    prefixes[h % prefixes.length] +
    " " +
    suffixes[(h >>> 8) % suffixes.length];

  const traits = [
    ...new Set(
      parents.flatMap(p => S.magic[p].traits)
    )
  ].slice(0,8);

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
  const box = document.querySelector("#notice");

  box.textContent = text;
  box.classList.add("show");

  setTimeout(() => {
    box.classList.remove("show");
  },1800);
}

function updateHUD() {
  document.querySelector("#hp").style.width =
    S.hp + "%";

  document.querySelector("#mana").style.width =
    S.mana + "%";

  document.querySelector("#stats").textContent =
    `Rank ${S.rank} • Essence ${S.essence} • ` +
    `${Object.keys(S.magic).length} schools`;

  document.querySelector("#spellName").textContent =
    "✦ " + S.selected;
}

function renderForge() {
  const grid = document.querySelector("#forgeGrid");
  grid.innerHTML = "";

  Object.entries(S.magic).forEach(([name,magic]) => {
    const button = document.createElement("button");

    button.className =
      "magic" +
      (S.forge.includes(name) ? " sel" : "");

    button.innerHTML = `
      <span class="dot"
      style="background:${magic.color};color:${magic.color}">
      </span>
      <b>${name}</b><br>
      <small>${magic.traits.join(" · ")}</small>
    `;

    button.addEventListener("click",() => {
      const i = S.forge.indexOf(name);

      if (i >= 0) {
        S.forge.splice(i,1);
      } else if (S.forge.length < 3) {
        S.forge.push(name);
      }

      renderForge();
    });

    grid.appendChild(button);
  });

  document.querySelector("#forgeSlots").textContent =
    S.forge.length
      ? S.forge.join(" + ")
      : "No magic selected.";
}

function transmute() {
  if (S.dead) return;

  if (S.forge.length < 2) {
    notice("Select at least 2 magics");
    return;
  }

  const parents = [...S.forge].sort();
  const key = parents.join("+");

  let result =
    recipes[key] || generateMagic(parents);

  let name = result[0];
  const color = result[1];
  const traits = result[2];

  if (
    S.magic[name] &&
    JSON.stringify(S.magic[name].parents) !==
    JSON.stringify(parents)
  ) {
    name += " " + (hash(key) % 97);
  }

  if (!S.magic[name]) {
    S.magic[name] = {
      color,
      traits,
      parents
    };

    S.essence++;
    S.xp += 25;
    S.rank = 1 + Math.floor(S.xp / 100);

    notice("NEW MAGIC: " + name);
    saveGame();
  } else {
    notice(name + " already discovered");
  }

  S.selected = name;
  S.forge = [];

  renderForge();
  renderBook();
  renderTree();
  updateHUD();
}

function renderBook() {
  const entries = document.querySelector("#entries");
  entries.innerHTML = "";

  Object.entries(S.magic)
    .sort()
    .forEach(([name,magic]) => {
      const item = document.createElement("div");
      item.className = "entry";

      const origin =
        magic.parents.length
          ? magic.parents.join(" + ")
          : "Primordial school";

      item.innerHTML = `
        <span class="dot"
        style="background:${magic.color};color:${magic.color}">
        </span>
        <b>${name}</b>
        <small>
        Origin: ${origin}<br>
        Traits: ${magic.traits.join(", ")}
        </small>
      `;

      entries.appendChild(item);
    });
}

function renderTree() {
  const tree = document.querySelector("#treeWrap");
  tree.innerHTML = "";

  const magics = Object.entries(S.magic);

  const centerX = 380;
  const centerY = 250;

  magics.forEach(([name,magic],index) => {
    const generated = magic.parents.length > 0;

    const angle =
      Math.PI * 2 * index / magics.length;

    const radius = generated ? 210 : 115;

    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    const node = document.createElement("div");

    node.className = "node";
    node.style.left = x - 45 + "px";
    node.style.top = y - 45 + "px";
    node.style.background = magic.color;
    node.textContent = name;

    tree.appendChild(node);
  });
}

document.querySelector("#transmute")
  .addEventListener("click",transmute);

document.querySelectorAll("[data-open]")
  .forEach(button => {
    button.addEventListener("click",() => {
      if (S.dead) return;

      document
        .querySelector("#" + button.dataset.open)
        .classList.add("open");

      renderForge();
      renderTree();
      renderBook();
    });
  });

document.querySelectorAll(".close")
  .forEach(button => {
    button.addEventListener("click",() => {
      button.closest(".modal").classList.remove("open");
    });
  });

/* =========================
   JOYSTICK — v1.3 MULTITOUCH
========================= */

let joystick = {x:0,y:0};

const stick = document.querySelector("#stick");
const knob = document.querySelector("#knob");

let pointerID = null;

stick.style.touchAction = "none";

function resetJoystick() {
  pointerID = null;
  joystick.x = 0;
  joystick.y = 0;

  knob.style.transform = "translate(0px,0px)";
}

function moveStick(event) {
  if (S.dead) return;

  const rect = stick.getBoundingClientRect();

  let x =
    event.clientX -
    (rect.left + rect.width / 2);

  let y =
    event.clientY -
    (rect.top + rect.height / 2);

  const distance = Math.hypot(x,y);
  const limit = 36;

  if (distance > limit) {
    x *= limit / distance;
    y *= limit / distance;
  }

  joystick.x = x / limit;
  joystick.y = y / limit;

  knob.style.transform =
    `translate(${x}px,${y}px)`;
}

/*
  IMPORTANT:
  We DON'T capture the pointer anymore.

  Finger 1 can stay on the joystick while
  Finger 2 presses CAST / POWER / WARD /
  DODGE / NEXT.
*/

stick.addEventListener("pointerdown", event => {
  if (S.dead || pointerID !== null) return;

  pointerID = event.pointerId;
  moveStick(event);
});

window.addEventListener("pointermove", event => {
  if (
    event.pointerId === pointerID &&
    !S.dead
  ) {
    moveStick(event);
  }
});

window.addEventListener("pointerup", event => {
  if (event.pointerId === pointerID) {
    resetJoystick();
  }
});

window.addEventListener("pointercancel", event => {
  if (event.pointerId === pointerID) {
    resetJoystick();
  }
});


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
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;

    const speed =
      (Math.random() * 3 + 1) * speedBoost;

    S.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      color
    });
  }
}

/* =========================
   ENEMIES
========================= */

function spawnEnemy() {
  if (S.dead) return;

  const angle = Math.random() * Math.PI * 2;
  const distance = 380 + Math.random() * 180;

  S.enemies.push({
    x: S.x + Math.cos(angle) * distance,
    y: S.y + Math.sin(angle) * distance,

    hp: 40,
    maxHp: 40,
    r: 18,

    burn: 0,
    slow: 0,
    wet: 0
  });
}

/* =========================
   HEALING
========================= */

function heal(amount) {
  if (S.dead) return;

  const before = S.hp;

  S.hp = Math.min(
    100,
    S.hp + amount
  );

  const gained =
    Math.round(S.hp - before);

  if (gained > 0) {
    burst(
      S.x,
      S.y,
      "#8dffb0",
      25,
      35,
      1
    );

    notice("HEALED +" + gained);
  } else {
    notice("HP already full");
  }
}

/* =========================
   MAGIC POWERS
========================= */

function damageArea(radius,damage,color) {
  for (const enemy of S.enemies) {
    const d = Math.hypot(
      enemy.x - S.x,
      enemy.y - S.y
    );

    if (d <= radius) {
      enemy.hp -= damage;

      burst(
        enemy.x,
        enemy.y,
        color,
        12
      );
    }
  }
}

function pushEnemies(radius,strength) {
  for (const enemy of S.enemies) {
    let dx = enemy.x - S.x;
    let dy = enemy.y - S.y;

    const d = Math.hypot(dx,dy) || 1;

    if (d <= radius) {
      dx /= d;
      dy /= d;

      enemy.x += dx * strength;
      enemy.y += dy * strength;
    }
  }
}

function pullEnemies(radius,strength) {
  for (const enemy of S.enemies) {
    let dx = S.x - enemy.x;
    let dy = S.y - enemy.y;

    const d = Math.hypot(dx,dy) || 1;

    if (d <= radius) {
      dx /= d;
      dy /= d;

      enemy.x += dx * strength;
      enemy.y += dy * strength;
    }
  }
}

function createZone(type,color,radius,duration) {
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

function usePower() {
  if (S.dead) return;

  if (S.powerCooldown > 0) {
    notice(
      "Power recharging: " +
      Math.ceil(S.powerCooldown) +
      "s"
    );

    return;
  }

  if (S.mana < 25) {
    notice("Not enough mana");
    return;
  }

  const name = S.selected;
  const magic = S.magic[name];

  S.mana -= 25;
  S.powerCooldown = 7;

  /* BASE POWERS */

  if (name === "Fire") {
    damageArea(150,10,magic.color);

    for (const enemy of S.enemies) {
      if (
        Math.hypot(
          enemy.x-S.x,
          enemy.y-S.y
        ) < 150
      ) {
        enemy.burn = 5;
      }
    }

    burst(S.x,S.y,magic.color,50,35,1.5);
    notice("FLAME BURST");
  }

  else if (name === "Water") {
    heal(30);
    notice("RESTORING TIDE");
  }

  else if (name === "Wind") {
    pushEnemies(190,130);
    burst(S.x,S.y,magic.color,45,30,2);
    notice("GALE FORCE");
  }

  else if (name === "Earth") {
    S.armor = 8;
    S.ward = Math.max(S.ward,240);

    burst(S.x,S.y,magic.color,40,40,1);
    notice("STONE ARMOR");
  }

  else if (name === "Lightning") {
    const targets = [...S.enemies]
      .sort((a,b) =>
        Math.hypot(a.x-S.x,a.y-S.y) -
        Math.hypot(b.x-S.x,b.y-S.y)
      )
      .slice(0,4);

    targets.forEach(enemy => {
      enemy.hp -= 18;
      burst(enemy.x,enemy.y,magic.color,20);
    });

    notice("CHAIN LIGHTNING");
  }

  else if (name === "Ice") {
    for (const enemy of S.enemies) {
      if (
        Math.hypot(
          enemy.x-S.x,
          enemy.y-S.y
        ) < 180
      ) {
        enemy.slow = 5;
      }
    }

    damageArea(180,8,magic.color);
    notice("FROST NOVA");
  }

  else if (name === "Light") {
    heal(45);

    S.ward =
      Math.max(S.ward,120);

    notice("RADIANT RESTORATION");
  }

  else if (name === "Shadow") {
    let drained = 0;

    for (const enemy of S.enemies) {
      if (
        Math.hypot(
          enemy.x-S.x,
          enemy.y-S.y
        ) < 160
      ) {
        enemy.hp -= 12;
        drained += 4;

        burst(
          enemy.x,
          enemy.y,
          magic.color,
          12
        );
      }
    }

    heal(Math.min(drained,25));
    notice("SHADOW DRAIN");
  }

  else if (name === "Force") {
    damageArea(170,8,magic.color);
    pushEnemies(170,180);

    burst(S.x,S.y,magic.color,55,30,2);
    notice("FORCE REPULSE");
  }

  /* SIGNATURE COMBINATIONS */

  else if (name === "Magma") {
    createZone(
      "damage",
      magic.color,
      105,
      8
    );

    notice("MOLTEN DOMAIN");
  }

  else if (name === "Inferno") {
    damageArea(200,18,magic.color);

    for (const enemy of S.enemies) {
      if (
        Math.hypot(
          enemy.x-S.x,
          enemy.y-S.y
        ) < 200
      ) {
        enemy.burn = 7;
      }
    }

    pullEnemies(200,45);

    burst(S.x,S.y,magic.color,80,45,2);
    notice("INFERNO VORTEX");
  }

  else if (name === "Storm") {
    for (const enemy of S.enemies) {
      enemy.wet = 6;

      if (
        Math.hypot(
          enemy.x-S.x,
          enemy.y-S.y
        ) < 240
      ) {
        enemy.hp -= 16;
      }
    }

    burst(S.x,S.y,magic.color,70,35,2);
    notice("TEMPEST CHAIN");
  }

  else if (name === "Glacier") {
    damageArea(220,12,magic.color);

    for (const enemy of S.enemies) {
      if (
        Math.hypot(
          enemy.x-S.x,
          enemy.y-S.y
        ) < 220
      ) {
        enemy.slow = 8;
      }
    }

    notice("GLACIAL PRISON");
  }

  else if (name === "Solar") {
    damageArea(240,30,magic.color);

    burst(S.x,S.y,magic.color,100,40,2.5);

    notice("SOLAR ERUPTION");
  }

  else if (name === "Blackflame") {
    let drained = 0;

    for (const enemy of S.enemies) {
      if (
        Math.hypot(
          enemy.x-S.x,
          enemy.y-S.y
        ) < 190
      ) {
        enemy.hp -= 14;
        enemy.burn = 8;

        drained += 5;
      }
    }

    heal(Math.min(drained,30));

    notice("ABYSSAL FLAME");
  }

  else if (name === "Gravity") {
    pullEnemies(280,150);

    createZone(
      "gravity",
      magic.color,
      140,
      6
    );

    notice("GRAVITY WELL");
  }

  else if (name === "Plasma") {
    const targets =
      [...S.enemies]
      .sort((a,b) =>
        Math.hypot(a.x-S.x,a.y-S.y) -
        Math.hypot(b.x-S.x,b.y-S.y)
      )
      .slice(0,5);

    targets.forEach(enemy => {
      enemy.hp -= 26;

      burst(
        enemy.x,
        enemy.y,
        magic.color,
        20
      );
    });

    notice("PLASMA LANCE");
  }

  else if (name === "Nature") {
    createZone(
      "heal",
      magic.color,
      120,
      10
    );

    for (const enemy of S.enemies) {
      if (
        Math.hypot(
          enemy.x-S.x,
          enemy.y-S.y
        ) < 190
      ) {
        enemy.slow = 6;
      }
    }

    notice("LIVING SANCTUARY");
  }

  else if (name === "Void") {
    pullEnemies(260,120);

    createZone(
      "void",
      magic.color,
      130,
      7
    );

    notice("VOID COLLAPSE");
  }

  /* GENERATED MAGIC */

  else {
    generatedPower(magic);
  }
}

function generatedPower(magic) {
  const t = magic.traits;

  let didSomething = false;

  if (
    t.includes("heal") ||
    t.includes("growth") ||
    t.includes("purify")
  ) {
    heal(25);
    didSomething = true;
  }

  if (
    t.includes("burn") ||
    t.includes("heat")
  ) {
    damageArea(170,12,magic.color);

    for (const enemy of S.enemies) {
      if (
        Math.hypot(
          enemy.x-S.x,
          enemy.y-S.y
        ) < 170
      ) {
        enemy.burn = 5;
      }
    }

    didSomething = true;
  }

  if (
    t.includes("push") ||
    t.includes("impact")
  ) {
    pushEnemies(180,100);
    didSomething = true;
  }

  if (
    t.includes("control") ||
    t.includes("mass")
  ) {
    pullEnemies(220,70);
    didSomething = true;
  }

  if (
    t.includes("freeze") ||
    t.includes("cold")
  ) {
    for (const enemy of S.enemies) {
      if (
        Math.hypot(
          enemy.x-S.x,
          enemy.y-S.y
        ) < 190
      ) {
        enemy.slow = 5;
      }
    }

    didSomething = true;
  }

  if (
    t.includes("shock") ||
    t.includes("energy")
  ) {
    damageArea(190,10,magic.color);
    didSomething = true;
  }

  if (
    t.includes("drain") ||
    t.includes("dark")
  ) {
    damageArea(150,8,magic.color);
    heal(10);
    didSomething = true;
  }

  if (
    t.includes("defense") ||
    t.includes("solid")
  ) {
    S.ward =
      Math.max(S.ward,120);

    didSomething = true;
  }

  if (!didSomething) {
    damageArea(160,15,magic.color);
  }

  burst(
    S.x,
    S.y,
    magic.color,
    70,
    40,
    1.8
  );

  notice("ARCANE POWER");
}

/* =========================
   DEATH
========================= */

function die() {
  if (S.dead) return;

  S.hp = 0;
  S.dead = true;

  S.deathTimer = 0;
  S.deathScreen = false;

  resetJoystick();

  S.shots = [];
  S.ward = 0;

  const magic = S.magic[S.selected];

  burst(
    S.x,S.y,
    magic.color,
    85,55,2.2
  );

  burst(
    S.x,S.y,
    "#ffffff",
    40,45,1.5
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
  S.shots = [];
  S.zones = [];

  S.ward = 0;
  S.armor = 0;
  S.powerCooldown = 0;

  resetJoystick();

  const magic = S.magic[S.selected];

  burst(
    S.x,S.y,
    magic.color,
    70,45,1.7
  );

  burst(
    S.x,S.y,
    "#ffffff",
    25,35,1.1
  );

  notice("MAGIC REFORMED");
}

/* =========================
   NORMAL COMBAT
========================= */

function castSpell() {
  if (S.dead) return;

  if (S.mana < 10) {
    notice("Not enough mana");
    return;
  }

  S.mana -= 10;

  let target = null;
  let closest = Infinity;

  for (const enemy of S.enemies) {
    const d = Math.hypot(
      enemy.x-S.x,
      enemy.y-S.y
    );

    if (d < closest) {
      closest = d;
      target = enemy;
    }
  }

  let dx = joystick.x;
  let dy = joystick.y;

  if (target) {
    dx = target.x-S.x;
    dy = target.y-S.y;
  }

  if (
    Math.abs(dx) +
    Math.abs(dy) <
    0.1
  ) {
    dx = 1;
    dy = 0;
  }

  const d = Math.hypot(dx,dy) || 1;

  dx /= d;
  dy /= d;

  const magic = S.magic[S.selected];

  S.shots.push({
    x:S.x,
    y:S.y,

    vx:dx*9,
    vy:dy*9,

    life:65,
    power:14,

    color:magic.color
  });

  burst(S.x,S.y,magic.color,8);
}

function activateWard() {
  if (S.dead) return;

  if (S.mana < 15) {
    notice("Not enough mana");
    return;
  }

  S.mana -= 15;
  S.ward = 120;

  burst(S.x,S.y,"#b8a8ff",16);
}

function dodge() {
  if (S.dead) return;

  let dx = joystick.x;
  let dy = joystick.y;

  if (
    Math.abs(dx) +
    Math.abs(dy) <
    0.1
  ) {
    dx = 1;
    dy = 0;
  }

  const d = Math.hypot(dx,dy) || 1;

  dx /= d;
  dy /= d;

  S.x += dx*90;
  S.y += dy*90;

  burst(S.x,S.y,"#ffffff",10);
}

function nextMagic() {
  if (S.dead) return;

  const magics = Object.keys(S.magic);

  let index =
    magics.indexOf(S.selected);

  index =
    (index+1)%magics.length;

  S.selected = magics[index];

  updateHUD();
}

document.querySelector("#cast")
  .addEventListener("click",castSpell);

document.querySelector("#ward")
  .addEventListener("click",activateWard);

document.querySelector("#dodge")
  .addEventListener("click",dodge);

document.querySelector("#cycle")
  .addEventListener("click",nextMagic);

/* =========================
   POWER BUTTON
========================= */

let powerButton =
  document.querySelector("#power");

if (!powerButton) {
  powerButton =
    document.createElement("button");

  powerButton.id = "power";
  powerButton.textContent = "POWER";

  powerButton.style.position = "fixed";
  powerButton.style.right = "22px";
  powerButton.style.bottom = "205px";
  powerButton.style.width = "88px";
  powerButton.style.height = "52px";
  powerButton.style.borderRadius = "18px";
  powerButton.style.border =
    "1px solid rgba(255,255,255,.25)";
  powerButton.style.background =
    "rgba(111,72,201,.85)";
  powerButton.style.color = "white";
  powerButton.style.fontWeight = "800";
  powerButton.style.zIndex = "20";
  powerButton.style.touchAction = "manipulation";

  document.body.appendChild(powerButton);
}

powerButton.addEventListener(
  "click",
  usePower
);

/* =========================
   GAME UPDATE
========================= */

let previousTime = performance.now();
let enemyTimer = 0;

function update(time) {
  const delta =
    Math.min(
      .033,
      (time-previousTime)/1000
    );

  previousTime = time;

  if (S.hp <= 0 && !S.dead) {
    die();
  }

  if (S.dead) {
    S.deathTimer += delta;

    if (S.deathTimer >= 1.15) {
      S.deathScreen = true;
    }
  }

  if (!S.dead) {
    S.x += joystick.x*180*delta;
    S.y += joystick.y*180*delta;

    S.mana =
      Math.min(
        100,
        S.mana + 8*delta
      );

    if (S.powerCooldown > 0) {
      S.powerCooldown =
        Math.max(
          0,
          S.powerCooldown-delta
        );

      powerButton.textContent =
        S.powerCooldown > 0
          ? Math.ceil(S.powerCooldown)
          : "POWER";
    }

    if (S.ward > 0) {
      S.ward--;
    }

    if (S.armor > 0) {
      S.armor -= delta;
    }

    enemyTimer += delta;

    if (
      enemyTimer > 3.2 &&
      S.enemies.length < 8
    ) {
      spawnEnemy();
      enemyTimer = 0;
    }

    /* ENEMY MOVEMENT */

    for (const enemy of S.enemies) {
      const dx = S.x-enemy.x;
      const dy = S.y-enemy.y;

      const distance =
        Math.hypot(dx,dy) || 1;

      const slowMultiplier =
        enemy.slow > 0
          ? .35
          : 1;

      enemy.x +=
        (dx/distance) *
        48 *
        slowMultiplier *
        delta;

      enemy.y +=
        (dy/distance) *
        48 *
        slowMultiplier *
        delta;

      if (enemy.slow > 0) {
        enemy.slow -= delta;
      }

      if (enemy.wet > 0) {
        enemy.wet -= delta;
      }

      if (enemy.burn > 0) {
        enemy.burn -= delta;
        enemy.hp -= 3*delta;
      }

      if (
        distance < 28 &&
        S.ward <= 0
      ) {
        const damage =
          S.armor > 0
            ? 4
            : 12;

        S.hp =
          Math.max(
            0,
            S.hp-damage*delta
          );
      }
    }

    /* ZONES */

    for (const zone of S.zones) {
      zone.life -= delta;
      zone.tick -= delta;

      if (zone.type === "gravity") {
        for (const enemy of S.enemies) {
          const dx = zone.x-enemy.x;
          const dy = zone.y-enemy.y;

          const d =
            Math.hypot(dx,dy) || 1;

          if (d < zone.radius) {
            enemy.x +=
              (dx/d)*45*delta;

            enemy.y +=
              (dy/d)*45*delta;
          }
        }
      }

      if (zone.tick <= 0) {
        zone.tick = .5;

        if (
          zone.type === "damage" ||
          zone.type === "void"
        ) {
          for (const enemy of S.enemies) {
            if (
              Math.hypot(
                enemy.x-zone.x,
                enemy.y-zone.y
              ) < zone.radius
            ) {
              enemy.hp -=
                zone.type === "void"
                  ? 7
                  : 6;
            }
          }
        }

        if (zone.type === "heal") {
          if (
            Math.hypot(
              S.x-zone.x,
              S.y-zone.y
            ) < zone.radius
          ) {
            S.hp =
              Math.min(
                100,
                S.hp+4
              );
          }
        }
      }
    }

    S.zones =
      S.zones.filter(z => z.life > 0);

    /* SHOTS */

    for (const shot of S.shots) {
      shot.x += shot.vx;
      shot.y += shot.vy;

      shot.life--;

      for (const enemy of S.enemies) {
        const d =
          Math.hypot(
            shot.x-enemy.x,
            shot.y-enemy.y
          );

        if (d < enemy.r+8) {
          enemy.hp -= shot.power;
          shot.life = 0;

          burst(
            enemy.x,
            enemy.y,
            shot.color,
            12
          );

          break;
        }
      }
    }

    const defeated =
      S.enemies.filter(e => e.hp <= 0);

    if (defeated.length) {
      S.essence += defeated.length;
      S.xp += defeated.length*10;

      S.rank =
        1 +
        Math.floor(S.xp/100);

      defeated.forEach(enemy => {
        burst(
          enemy.x,
          enemy.y,
          "#ffffff",
          20
        );
      });

      saveGame();
    }

    S.enemies =
      S.enemies.filter(e => e.hp > 0);

    S.shots =
      S.shots.filter(s => s.life > 0);

    if (S.hp <= 0) {
      die();
    }
  }

  /* PARTICLES */

  for (const p of S.particles) {
    p.x += p.vx;
    p.y += p.vy;

    p.vx *= .96;
    p.vy *= .96;

    p.life--;
  }

  S.particles =
    S.particles.filter(p => p.life > 0);

  drawWorld();
  updateHUD();

  requestAnimationFrame(update);
}

/* =========================
   DRAW
========================= */

function drawWorld() {
  ctx.clearRect(0,0,vw,vh);

  const background =
    ctx.createRadialGradient(
      vw*.5,
      vh*.45,
      20,
      vw*.5,
      vh*.45,
      Math.max(vw,vh)
    );

  background.addColorStop(0,"#172847");
  background.addColorStop(1,"#070912");

  ctx.fillStyle = background;
  ctx.fillRect(0,0,vw,vh);

  const offsetX = vw/2-S.x;
  const offsetY = vh/2-S.y;

  ctx.save();
  ctx.translate(offsetX,offsetY);

  /* GRID */

  ctx.strokeStyle = "#2c395633";
  ctx.lineWidth = 1;

  const gridX =
    Math.floor((S.x-vw)/100)*100;

  const gridY =
    Math.floor((S.y-vh)/100)*100;

  for (
    let x=gridX;
    x<S.x+vw;
    x+=100
  ) {
    ctx.beginPath();
    ctx.moveTo(x,S.y-vh);
    ctx.lineTo(x,S.y+vh);
    ctx.stroke();
  }

  for (
    let y=gridY;
    y<S.y+vh;
    y+=100
  ) {
    ctx.beginPath();
    ctx.moveTo(S.x-vw,y);
    ctx.lineTo(S.x+vw,y);
    ctx.stroke();
  }

  /* TERRAIN */

  for (let i=-4;i<=4;i++) {
    const x=i*320;
    const y=Math.sin(i*3)*250;

    ctx.fillStyle="#182f2b";

    ctx.beginPath();
    ctx.arc(x,y,85,0,Math.PI*2);
    ctx.fill();

    ctx.strokeStyle="#6b7790";
    ctx.lineWidth=2;

    ctx.strokeRect(
      x-30,
      y-18,
      60,
      36
    );
  }

  /* POWER ZONES */

  for (const zone of S.zones) {
    ctx.globalAlpha =
      .18 +
      .18 *
      Math.sin(performance.now()/120);

    ctx.fillStyle = zone.color;

    ctx.beginPath();

    ctx.arc(
      zone.x,
      zone.y,
      zone.radius,
      0,
      Math.PI*2
    );

    ctx.fill();

    ctx.globalAlpha = .8;

    ctx.strokeStyle = zone.color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  /* ENEMIES */

  for (const enemy of S.enemies) {
    let enemyColor = "#bd334d";

    if (enemy.slow > 0) {
      enemyColor = "#8edfff";
    }

    if (enemy.burn > 0) {
      enemyColor = "#ff7038";
    }

    ctx.shadowBlur = 18;
    ctx.shadowColor = enemyColor;

    ctx.fillStyle = enemyColor;

    ctx.beginPath();

    ctx.arc(
      enemy.x,
      enemy.y,
      enemy.r,
      0,
      Math.PI*2
    );

    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle="#310812";

    ctx.fillRect(
      enemy.x-20,
      enemy.y-29,
      40,
      4
    );

    ctx.fillStyle="#ff536c";

    ctx.fillRect(
      enemy.x-20,
      enemy.y-29,
      40 *
      Math.max(0,enemy.hp) /
      (enemy.maxHp || 40),
      4
    );
  }

  /* SHOTS */

  for (const shot of S.shots) {
    ctx.shadowBlur=25;
    ctx.shadowColor=shot.color;
    ctx.fillStyle=shot.color;

    ctx.beginPath();

    ctx.arc(
      shot.x,
      shot.y,
      8,
      0,
      Math.PI*2
    );

    ctx.fill();
  }

  ctx.shadowBlur=0;

  /* PARTICLES */

  for (const p of S.particles) {
    ctx.globalAlpha =
      Math.max(
        0,
        p.life/(p.maxLife||25)
      );

    ctx.fillStyle=p.color;

    ctx.fillRect(
      p.x-2,
      p.y-2,
      4,
      4
    );
  }

  ctx.globalAlpha=1;

  /* PLAYER */

  if (!S.dead) {
    const playerColor =
      S.magic[S.selected].color;

    ctx.shadowBlur=30;
    ctx.shadowColor=playerColor;

    ctx.fillStyle="#f5f1ff";

    ctx.beginPath();

    ctx.arc(
      S.x,
      S.y,
      14,
      0,
      Math.PI*2
    );

    ctx.fill();

    ctx.strokeStyle=playerColor;
    ctx.lineWidth=3;
    ctx.stroke();

    ctx.shadowBlur=0;

    if (S.ward > 0) {
      ctx.strokeStyle="#b8a8ff";
      ctx.lineWidth=3;

      ctx.beginPath();

      ctx.arc(
        S.x,
        S.y,
        30,
        0,
        Math.PI*2
      );

      ctx.stroke();
    }
  }

  ctx.restore();

  /* DEATH SCREEN */

  if (S.deathScreen) {
    ctx.fillStyle =
      "rgba(5,4,12,.84)";

    ctx.fillRect(0,0,vw,vh);

    ctx.textAlign="center";

    ctx.shadowBlur=30;
    ctx.shadowColor="#9d6cff";

    ctx.fillStyle="#ffffff";
    ctx.font="bold 42px sans-serif";

    ctx.fillText(
      "YOU DIED",
      vw/2,
      vh/2-45
    );

    ctx.shadowBlur=0;

    ctx.fillStyle="#c8c0df";
    ctx.font="17px sans-serif";

    ctx.fillText(
      "Your magic awaits rebirth",
      vw/2,
      vh/2-5
    );

    const bx=vw/2-90;
    const by=vh/2+35;

    ctx.shadowBlur=20;
    ctx.shadowColor="#9d6cff";

    ctx.fillStyle="#6f48c9";

    ctx.fillRect(
      bx,
      by,
      180,
      56
    );

    ctx.shadowBlur=0;

    ctx.fillStyle="#ffffff";
    ctx.font="bold 18px sans-serif";

    ctx.fillText(
      "RESPAWN",
      vw/2,
      by+36
    );
  }
}

/* =========================
   RESPAWN INPUT
========================= */

C.addEventListener(
  "pointerdown",
  event => {
    if (!S.deathScreen) return;

    const rect =
      C.getBoundingClientRect();

    const x =
      event.clientX-rect.left;

    const y =
      event.clientY-rect.top;

    const bx=vw/2-90;
    const by=vh/2+35;

    if (
      x>=bx &&
      x<=bx+180 &&
      y>=by &&
      y<=by+56
    ) {
      respawn();
    }
  }
);

/* =========================
   START
========================= */

renderForge();
renderBook();
renderTree();
updateHUD();

notice("ARCANE FORGE v1.2");

requestAnimationFrame(update);

})();