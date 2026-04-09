const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");

const WORLD = {
  width: canvas.width,
  height: canvas.height,
};

const state = {
  running: true,
  timeLeft: 90,
  hunger: 100,
  score: 0,
  inventory: null,
  potProgress: 0,
  message: "Recolecta ingredientes y llévalos a la olla.",
};

const chef = {
  x: 80,
  y: 80,
  size: 26,
  speed: 3,
};

const pot = {
  x: 620,
  y: 180,
  size: 84,
};

const keys = new Set();
const ingredients = [];

function randomIngredientType() {
  return ["verdura", "agua", "grano"][Math.floor(Math.random() * 3)];
}

function spawnIngredient() {
  ingredients.push({
    x: 40 + Math.random() * (WORLD.width - 80),
    y: 40 + Math.random() * (WORLD.height - 80),
    size: 18,
    type: randomIngredientType(),
  });
}

for (let i = 0; i < 7; i += 1) spawnIngredient();

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function intersects(a, b) {
  return (
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y
  );
}

function update() {
  if (!state.running) return;

  let dx = 0;
  let dy = 0;

  if (keys.has("ArrowUp") || keys.has("w")) dy -= chef.speed;
  if (keys.has("ArrowDown") || keys.has("s")) dy += chef.speed;
  if (keys.has("ArrowLeft") || keys.has("a")) dx -= chef.speed;
  if (keys.has("ArrowRight") || keys.has("d")) dx += chef.speed;

  chef.x = clamp(chef.x + dx, 0, WORLD.width - chef.size);
  chef.y = clamp(chef.y + dy, 0, WORLD.height - chef.size);
}

function drawIngredient(item) {
  const colors = {
    verdura: "#65c86a",
    agua: "#53b7ff",
    grano: "#e6c65f",
  };

  ctx.fillStyle = colors[item.type] || "white";
  ctx.fillRect(item.x, item.y, item.size, item.size);
}

function draw() {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);

  // Suelo
  ctx.fillStyle = "#28452a";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  // Olla
  ctx.fillStyle = "#3b3b3b";
  ctx.fillRect(pot.x, pot.y, pot.size, pot.size);
  ctx.fillStyle = "#ff914d";
  ctx.fillRect(pot.x + 10, pot.y + pot.size - 18, Math.min(64, state.potProgress * 10), 8);

  // Ingredientes
  ingredients.forEach(drawIngredient);

  // Chef
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(chef.x, chef.y, chef.size, chef.size);

  if (state.inventory) {
    ctx.fillStyle = "#111";
    ctx.fillText(`Cargando: ${state.inventory}`, chef.x - 10, chef.y - 8);
  }
}

function updateHud() {
  hud.textContent = `Tiempo: ${state.timeLeft}s | Hambre refugio: ${state.hunger}% | Puntos: ${state.score} | Olla: ${state.potProgress}/6 | ${state.message}`;
}

function interact() {
  if (!state.running) return;

  if (!state.inventory) {
    const foundIndex = ingredients.findIndex((it) => intersects(chef, it));
    if (foundIndex >= 0) {
      state.inventory = ingredients[foundIndex].type;
      ingredients.splice(foundIndex, 1);
      state.message = `Recogiste ${state.inventory}. Llévalo a la olla.`;
      return;
    }
  }

  if (state.inventory && intersects(chef, pot)) {
    state.potProgress += 1;
    state.message = `Ingrediente agregado: ${state.inventory}.`;
    state.inventory = null;

    if (state.potProgress >= 6) {
      state.potProgress = 0;
      state.score += 100;
      state.hunger = clamp(state.hunger + 18, 0, 100);
      state.timeLeft += 10;
      state.message = "¡Comida lista! +100 puntos, +10s y +hambre.";
      for (let i = 0; i < 4; i += 1) spawnIngredient();
    }
  }
}

function resetGame() {
  state.running = true;
  state.timeLeft = 90;
  state.hunger = 100;
  state.score = 0;
  state.inventory = null;
  state.potProgress = 0;
  state.message = "Nueva partida iniciada.";
  ingredients.length = 0;
  for (let i = 0; i < 7; i += 1) spawnIngredient();
  chef.x = 80;
  chef.y = 80;
}

setInterval(() => {
  if (!state.running) return;

  state.timeLeft -= 1;
  state.hunger -= 2;

  if (state.timeLeft <= 0 || state.hunger <= 0) {
    state.running = false;
    state.message = "La comunidad no sobrevivió. Presiona R para reintentar.";
  }

  if (ingredients.length < 4) spawnIngredient();
}, 1000);

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
    keys.add(event.key.startsWith("Arrow") ? event.key : key);
  }

  if (key === "e") interact();
  if (key === "r") resetGame();
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  keys.delete(event.key.startsWith("Arrow") ? event.key : key);
});

function loop() {
  update();
  draw();
  updateHud();
  requestAnimationFrame(loop);
}

updateHud();
loop();
