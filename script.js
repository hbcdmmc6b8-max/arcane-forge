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

const base = {
  Fire: [
    "#ff6038",
    ["heat", "burn", "energy"]
  ],

  Water: [
    "#3aa9ff",
    ["fluid", "wet", "flow"]
  ],

  Wind: [
    "#9ff1d5",
    ["air", "speed", "push"]
  ],

  Earth: [
    "#a47b50",
    ["stone", "mass", "defense"]
  ],

  Lightning: [
    "#ffe34f",
    ["shock", "speed", "energy"]
  ],

  Ice: [
    "#a9e9ff",
    ["cold", "freeze", "solid"]
  ],

  Light: [
    "#fff0a6",
    ["radiant", "purify", "energy"]
  ],

  Shadow: [
    "#9d6cff",
    ["dark", "drain", "conceal"]
  ],

  Force: [
    "#ff79dd",
    ["push", "impact", "control"]
  ]
};

const recipes = {
  "Earth+Fire": [
    "Magma",
    "#ff5528",
    ["heat", "stone", "burn"]
  ],

  "Fire+Wind": [
    "Inferno",
    "#ff3217",
    ["heat", "burn", "speed"]
  ],

  "Lightning+Water": [
    "Storm",
    "#59dcff",
    ["wet", "shock", "energy"]
  ],

  "Ice+Water": [
    "Glacier",
    "#b8f2ff",
    ["freeze", "solid", "defense"]
  ],

  "Fire+Light": [
    "Solar",
    "#ffd24a",
    ["radiant", "heat", "energy"]
  ],

  "Fire+Shadow": [
    "Blackflame",
    "#a83fff",
    ["dark", "heat", "burn"]
  ],

  "Force+Wind": [
    "Gravity",
    "#b28aff",
    ["control", "mass", "push"]
  ],

  "Light+Lightning": [
    "Plasma",
    "#e8f5ff",
    ["energy", "shock", "radiant"]
  ],

  "Earth+Water": [
    "Nature",
    "#5de27a",
    ["growth", "stone", "flow"]
  ],

  "Force+Shadow": [
    "Void",
    "#62418f",
    ["dark", "control", "drain"]
  ]
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

  forge: [],

  ward: 0
};

Object.entries(base).forEach(([name, data]) => {
  S.magic[name] = {
    color: data[0],
    traits: data[1],
    parents: []
  };
});

try {
  const saved = JSON.parse(
    localStorage.arcaneForge || "null"
  );

  if (saved) {
    S.magic = saved.magic || S.magic;
    S.essence = saved.essence || 0;
    S.xp = saved.xp || 0;

    S.rank =
      1 + Math.floor(S.xp / 100);
  }
} catch (error) {
  console.log("No save found.");
}

function saveGame() {
  try {
    localStorage.arcaneForge =
      JSON.stringify({
        magic: S.magic,
        essence: S.essence,
        xp: S.xp
      });
  } catch (error) {
    console.log("Saving unavailable.");
  }
}

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
  "Arcane"
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
  "Bloom"
];

function generateMagic(parents) {
  const key =
    [...parents].sort().join("+");

  const h = hash(key);

  const name =
    prefixes[h % prefixes.length] +
    " " +
    suffixes[(h >>> 8) % suffixes.length];

  const hue = h % 360;

  const traits = [
    ...new Set(
      parents.flatMap(
        parent =>
          S.magic[parent].traits
      )
    )
  ].slice(0, 5);

  return [
    name,
    `hsl(${hue} 80% 66%)`,
    traits
  ];
}

function notice(text) {
  const box =
    document.querySelector("#notice");

  box.textContent = text;
  box.classList.add("show");

  setTimeout(() => {
    box.classList.remove("show");
  }, 1800);
}

function updateHUD() {
  document.querySelector("#hp")
    .style.width =
    S.hp + "%";

  document.querySelector("#mana")
    .style.width =
    S.mana + "%";

  document.querySelector("#stats")
    .textContent =
    `Rank ${S.rank} • ` +
    `Essence ${S.essence} • ` +
    `${Object.keys(S.magic).length} schools`;

  document.querySelector("#spellName")
    .textContent =
    "✦ " + S.selected;
}
function renderForge() {
  const grid =
    document.querySelector("#forgeGrid");

  grid.innerHTML = "";

  Object.entries(S.magic).forEach(
    ([name, magic]) => {
      const button =
        document.createElement("button");

      button.className =
        "magic" +
        (S.forge.includes(name)
          ? " sel"
          : "");

      button.innerHTML = `
        <span
          class="dot"
          style="
            background:${magic.color};
            color:${magic.color}
          "
        ></span>

        <b>${name}</b>

        <br>

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
          } else if (
            S.forge.length < 3
          ) {
            S.forge.push(name);
          }

          renderForge();
        }
      );

      grid.appendChild(button);
    }
  );

  document.querySelector(
    "#forgeSlots"
  ).textContent =
    S.forge.length
      ? S.forge.join("  +  ")
      : "No magic selected.";
}

function transmute() {
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

  let result =
    recipes[key] ||
    generateMagic(parents);

  let name = result[0];
  const color = result[1];
  const traits = result[2];

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

    S.essence += 1;
    S.xp += 25;

    S.rank =
      1 +
      Math.floor(
        S.xp / 100
      );

    notice(
      "NEW MAGIC: " + name
    );

    saveGame();
  } else {
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
    document.querySelector(
      "#entries"
    );

  entries.innerHTML = "";

  Object.entries(S.magic)
    .sort()
    .forEach(
      ([name, magic]) => {
        const item =
          document.createElement(
            "div"
          );

        item.className = "entry";

        const origin =
          magic.parents.length
            ? magic.parents.join(
                " + "
              )
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
            Origin: ${origin}
            <br>
            Traits:
            ${magic.traits.join(", ")}
          </small>
        `;

        entries.appendChild(item);
      }
    );
}

function renderTree() {
  const tree =
    document.querySelector(
      "#treeWrap"
    );

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
        document.createElement(
          "div"
        );

      node.className = "node";

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

document.querySelector(
  "#transmute"
).addEventListener(
  "click",
  transmute
);

document.querySelectorAll(
  "[data-open]"
).forEach(button => {
  button.addEventListener(
    "click",
    () => {
      const modal =
        document.querySelector(
          "#" +
          button.dataset.open
        );

      modal.classList.add(
        "open"
      );

      renderForge();
      renderTree();
      renderBook();
    }
  );
});

document.querySelectorAll(
  ".close"
).forEach(button => {
  button.addEventListener(
    "click",
    () => {
      button
        .closest(".modal")
        .classList.remove(
          "open"
        );
    }
  );
});

let joystick = {
  x: 0,
  y: 0
};

const stick =
  document.querySelector(
    "#stick"
  );

const knob =
  document.querySelector(
    "#knob"
  );

let pointerID = null;

function moveStick(event) {
  const rect =
    stick.getBoundingClientRect();

  let x =
    event.clientX -
    (
      rect.left +
      rect.width / 2
    );

  let y =
    event.clientY -
    (
      rect.top +
      rect.height / 2
    );

  const distance =
    Math.hypot(x, y);

  const limit = 36;

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

stick.addEventListener(
  "pointerdown",
  event => {
    pointerID =
      event.pointerId;

    stick.setPointerCapture(
      pointerID
    );

    moveStick(event);
  }
);

stick.addEventListener(
  "pointermove",
  event => {
    if (
      event.pointerId ===
      pointerID
    ) {
      moveStick(event);
    }
  }
);

stick.addEventListener(
  "pointerup",
  () => {
    pointerID = null;

    joystick.x = 0;
    joystick.y = 0;

    knob.style.transform =
      "translate(0px, 0px)";
  }
);

function spawnEnemy() {
  const angle =
    Math.random() *
    Math.PI *
    2;

  const distance =
    380 +
    Math.random() *
    180;

  S.enemies.push({
    x:
      S.x +
      Math.cos(angle) *
        distance,

    y:
      S.y +
      Math.sin(angle) *
        distance,

    hp: 40,
    r: 18
  });
}

function burst(
  x,
  y,
  color,
  amount
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
      Math.random() *
        3 +
      1;

    S.particles.push({
      x,
      y,

      vx:
        Math.cos(angle) *
        speed,

      vy:
        Math.sin(angle) *
        speed,

      life: 25,
      color
    });
  }
}
  function castSpell() {
  if (S.mana < 10) {
    notice("Not enough mana");
    return;
  }

  S.mana -= 10;

  let target = null;
  let closest = Infinity;

  for (const enemy of S.enemies) {
    const distance = Math.hypot(
      enemy.x - S.x,
      enemy.y - S.y
    );

    if (distance < closest) {
      closest = distance;
      target = enemy;
    }
  }

  let dx = 1;
  let dy = 0;

  if (target) {
    dx = target.x - S.x;
    dy = target.y - S.y;
  } else if (
    Math.abs(joystick.x) +
    Math.abs(joystick.y) >
    0.1
  ) {
    dx = joystick.x;
    dy = joystick.y;
  }

  const distance =
    Math.hypot(dx, dy) || 1;

  dx /= distance;
  dy /= distance;

  const magic =
    S.magic[S.selected];

  S.shots.push({
    x: S.x,
    y: S.y,

    vx: dx * 9,
    vy: dy * 9,

    life: 65,
    power: 14,

    color: magic.color
  });

  burst(
    S.x,
    S.y,
    magic.color,
    8
  );
}

function activateWard() {
  if (S.mana < 15) {
    notice("Not enough mana");
    return;
  }

  S.mana -= 15;
  S.ward = 120;

  burst(
    S.x,
    S.y,
    "#b8a8ff",
    16
  );
}

function dodge() {
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

  const length =
    Math.hypot(dx, dy) || 1;

  dx /= length;
  dy /= length;

  S.x += dx * 90;
  S.y += dy * 90;

  burst(
    S.x,
    S.y,
    "#ffffff",
    10
  );
}

function nextMagic() {
  const magics =
    Object.keys(S.magic);

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

document
  .querySelector("#cast")
  .addEventListener(
    "click",
    castSpell
  );

document
  .querySelector("#ward")
  .addEventListener(
    "click",
    activateWard
  );

document
  .querySelector("#dodge")
  .addEventListener(
    "click",
    dodge
  );

document
  .querySelector("#cycle")
  .addEventListener(
    "click",
    nextMagic
  );

let previousTime =
  performance.now();

let enemyTimer = 0;

function update(time) {
  const delta =
    Math.min(
      0.033,
      (time - previousTime) /
        1000
    );

  previousTime = time;

  S.x +=
    joystick.x *
    180 *
    delta;

  S.y +=
    joystick.y *
    180 *
    delta;

  S.mana =
    Math.min(
      100,
      S.mana +
        8 * delta
    );

  if (S.ward > 0) {
    S.ward -= 1;
  }

  enemyTimer += delta;

  if (
    enemyTimer > 3.2 &&
    S.enemies.length < 8
  ) {
    spawnEnemy();
    enemyTimer = 0;
  }

  for (
    const enemy of S.enemies
  ) {
    const dx =
      S.x - enemy.x;

    const dy =
      S.y - enemy.y;

    const distance =
      Math.hypot(dx, dy) ||
      1;

    enemy.x +=
      (dx / distance) *
      48 *
      delta;

    enemy.y +=
      (dy / distance) *
      48 *
      delta;

    if (
      distance < 28 &&
      S.ward <= 0
    ) {
      S.hp =
        Math.max(
          0,
          S.hp -
            12 * delta
        );
    }
  }

  for (
    const shot of S.shots
  ) {
    shot.x += shot.vx;
    shot.y += shot.vy;

    shot.life -= 1;

    for (
      const enemy of
      S.enemies
    ) {
      const hitDistance =
        Math.hypot(
          shot.x - enemy.x,
          shot.y - enemy.y
        );

      if (
        hitDistance <
        enemy.r + 8
      ) {
        enemy.hp -=
          shot.power;

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
    S.enemies.filter(
      enemy =>
        enemy.hp <= 0
    );

  if (
    defeated.length > 0
  ) {
    S.essence +=
      defeated.length;

    S.xp +=
      defeated.length *
      10;

    S.rank =
      1 +
      Math.floor(
        S.xp / 100
      );

    for (
      const enemy of
      defeated
    ) {
      burst(
        enemy.x,
        enemy.y,
        "#ffffff",
        20
      );
    }

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

    particle.life -= 1;
  }

  S.particles =
    S.particles.filter(
      particle =>
        particle.life > 0
    );

  drawWorld();
  updateHUD();

  requestAnimationFrame(
    update
  );
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

  background.addColorStop(
    0,
    "#172847"
  );

  background.addColorStop(
    1,
    "#070912"
  );

  ctx.fillStyle =
    background;

  ctx.fillRect(
    0,
    0,
    vw,
    vh
  );

  const offsetX =
    vw / 2 -
    S.x;

  const offsetY =
    vh / 2 -
    S.y;

  ctx.save();

  ctx.translate(
    offsetX,
    offsetY
  );

  // WORLD GRID

  ctx.strokeStyle =
    "#2c395633";

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

  // MAGIC ISLANDS / TERRAIN

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

    // RUINS

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

  // ENEMIES

  for (
    const enemy of
    S.enemies
  ) {
    ctx.shadowBlur = 18;

    ctx.shadowColor =
      "#ff4765";

    ctx.fillStyle =
      "#bd334d";

    ctx.beginPath();

    ctx.arc(
      enemy.x,
      enemy.y,
      enemy.r,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle =
      "#310812";

    ctx.fillRect(
      enemy.x - 20,
      enemy.y - 29,
      40,
      4
    );

    ctx.fillStyle =
      "#ff536c";

    ctx.fillRect(
      enemy.x - 20,
      enemy.y - 29,

      40 *
        Math.max(
          0,
          enemy.hp
        ) /
        40,

      4
    );
  }

  // SPELL PROJECTILES

  for (
    const shot of
    S.shots
  ) {
    ctx.shadowBlur = 25;

    ctx.shadowColor =
      shot.color;

    ctx.fillStyle =
      shot.color;

    ctx.beginPath();

    ctx.arc(
      shot.x,
      shot.y,
      8,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.shadowBlur = 0;

  // PARTICLES

  for (
    const particle of
    S.particles
  ) {
    ctx.globalAlpha =
      Math.max(
        0,
        particle.life /
        25
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

  // PLAYER

  const playerColor =
    S.magic[
      S.selected
    ].color;

  ctx.shadowBlur = 30;

  ctx.shadowColor =
    playerColor;

  ctx.fillStyle =
    "#f5f1ff";

  ctx.beginPath();

  ctx.arc(
    S.x,
    S.y,
    14,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.strokeStyle =
    playerColor;

  ctx.lineWidth = 3;

  ctx.stroke();

  ctx.shadowBlur = 0;

  // WARD

  if (S.ward > 0) {
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

  ctx.restore();
}

// START GAME

renderForge();
renderBook();
renderTree();
updateHUD();

notice(
  "ARCANE FORGE ONLINE"
);

requestAnimationFrame(
  update
);

})();
