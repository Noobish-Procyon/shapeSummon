// =========================
// Upgrade system data
// =========================

const RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

const UPGRADE_POOL = [
  // --- Stat upgrades ---
  { id: 'dmg_10', name: 'Damage +10%', desc: 'Increase damage by 10%.', rarity: RARITY.COMMON, type: 'stat', stat: 'damage', value: 0.10 },
  { id: 'aspd_15', name: 'Attack Speed +15%', desc: 'Increase attack speed by 15%.', rarity: RARITY.COMMON, type: 'stat', stat: 'attackSpeed', value: 0.15 },
  { id: 'proj_20', name: 'Projectile Speed +20%', desc: 'Increase projectile speed by 20%.', rarity: RARITY.UNCOMMON, type: 'stat', stat: 'projectileSpeed', value: 0.20 },
  { id: 'crit_5', name: 'Crit Chance +5%', desc: 'Increase crit chance by 5%.', rarity: RARITY.UNCOMMON, type: 'stat', stat: 'critChance', value: 0.05 },
  { id: 'critd_25', name: 'Crit Damage +25%', desc: 'Increase crit damage by 25%.', rarity: RARITY.RARE, type: 'stat', stat: 'critDamage', value: 0.25 },
  { id: 'summon_1', name: 'Summon +1', desc: 'Gain one extra summon.', rarity: RARITY.RARE, type: 'stat', stat: 'summonCount', value: 1 },
  { id: 'range_20', name: 'Summon Range +20%', desc: 'Increase summon range by 20%.', rarity: RARITY.UNCOMMON, type: 'stat', stat: 'summonRange', value: 0.20 },
  { id: 'movespd_10', name: 'Move Speed +10%', desc: 'Increase movement speed by 10%.', rarity: RARITY.COMMON, type: 'stat', stat: 'moveSpeed', value: 0.10 },
  { id: 'armor_1', name: 'Armor +1', desc: 'Increase armor by 1.', rarity: RARITY.UNCOMMON, type: 'stat', stat: 'armor', value: 1 },
  { id: 'xp_10', name: 'XP Gain +10%', desc: 'Increase XP gain by 10%.', rarity: RARITY.COMMON, type: 'stat', stat: 'xpGain', value: 0.10 },

  // --- Example evolution upgrades ---
  { id: 'circle_split', name: 'Split Shot', desc: 'Circle projectiles split on hit.', rarity: RARITY.EPIC, type: 'evolution', shape: 'circle' },
  { id: 'square_shield', name: 'Shield Pulse', desc: 'Squares emit periodic shield pulses.', rarity: RARITY.EPIC, type: 'evolution', shape: 'square' },
  { id: 'tri_clone', name: 'Shadow Clone', desc: 'Triangles gain a shadow clone.', rarity: RARITY.EPIC, type: 'evolution', shape: 'triangle' },
  { id: 'hex_laser', name: 'Laser Turret', desc: 'Hexagons deploy laser turrets.', rarity: RARITY.LEGENDARY, type: 'evolution', shape: 'hexagon' }
];

// =========================
// Helper functions
// =========================

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rand() {
  return Math.random();
}

function pickWeighted(pool) {
  // Simple rarity weighting
  const weights = {
    [RARITY.COMMON]: 1,
    [RARITY.UNCOMMON]: 1.5,
    [RARITY.RARE]: 2,
    [RARITY.EPIC]: 3,
    [RARITY.LEGENDARY]: 5
  };

  let total = 0;
  for (const u of pool) total += weights[u.rarity] || 1;

  let r = rand() * total;
  for (const u of pool) {
    const w = weights[u.rarity] || 1;
    if (r < w) return u;
    r -= w;
  }
  return pool[pool.length - 1];
}

function pickThree(pool) {
  const chosen = [];
  const used = new Set();
  while (chosen.length < 3 && used.size < pool.length) {
    const u = pickWeighted(pool);
    if (!used.has(u.id)) {
      used.add(u.id);
      chosen.push(u);
    }
  }
  return chosen;
}

function getRarityColor(rarity) {
  switch (rarity) {
    case RARITY.COMMON: return '#aaaaaa';
    case RARITY.UNCOMMON: return '#00ffff';
    case RARITY.RARE: return '#b000ff';
    case RARITY.EPIC: return '#ffd700';
    case RARITY.LEGENDARY: return '#ffffff'; // you can add rainbow edge manually
    default: return '#ffffff';
  }
}

// =========================
// Upgrade wheel class
// =========================

class UpgradeWheel {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.active = false;
    this.rotation = 0;
    this.scale = 0;
    this.speed = 0;

    this.cards = [];
    this.cardRects = []; // for click detection

    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;

    this.radiusOuter = 140;
    this.radiusInner = 100;

    this.onSelect = null; // callback(upgrade)
  }

  start(pool, onSelect) {
    this.active = true;
    this.speed = 720; // deg/sec
    this.scale = 0.2;
    this.rotation = 0;
    this.cards = pickThree(pool);
    this.cardRects = [];
    this.onSelect = onSelect;
  }

  update(dt) {
    if (!this.active) return;

    this.rotation += this.speed * dt;
    this.speed = lerp(this.speed, 90, 0.05);
    this.scale = lerp(this.scale, 1.0, 0.1);
  }

  draw() {
    if (!this.active) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.scale(this.scale, this.scale);

    // Background dim
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();

    // Outer ring
    ctx.save();
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.radiusOuter, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Inner ring
    ctx.save();
    ctx.rotate(-this.rotation * Math.PI / 180);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radiusInner, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Radial lines
    ctx.save();
    const lines = 16;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < lines; i++) {
      const angle = (i / lines) * Math.PI * 2 + this.rotation * 0.01;
      const x1 = Math.cos(angle) * (this.radiusInner - 10);
      const y1 = Math.sin(angle) * (this.radiusInner - 10);
      const x2 = Math.cos(angle) * (this.radiusOuter + 10);
      const y2 = Math.sin(angle) * (this.radiusOuter + 10);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();

    // Center node
    ctx.save();
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.005);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 8 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Cards
    this.cardRects = [];
    const cardRadius = this.radiusOuter + 80;
    const baseAngles = [0, 120, 240]; // degrees
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const angleDeg = baseAngles[i];
      const angle = angleDeg * Math.PI / 180;
      const cx = Math.cos(angle) * cardRadius;
      const cy = Math.sin(angle) * cardRadius;

      const w = 180;
      const h = 80;

      const x = cx - w / 2;
      const y = cy - h / 2;

      // Store rect in screen space for click detection
      const screenX = this.centerX + x * this.scale;
      const screenY = this.centerY + y * this.scale;
      const screenW = w * this.scale;
      const screenH = h * this.scale;
      this.cardRects.push({ x: screenX, y: screenY, w: screenW, h: screenH, upgrade: card });

      // Draw card
      ctx.save();
      ctx.translate(cx, cy);

      // Card background
      ctx.fillStyle = 'rgba(10,10,10,0.9)';
      ctx.fillRect(-w / 2, -h / 2, w, h);

      // Border
      ctx.strokeStyle = getRarityColor(card.rarity);
      ctx.lineWidth = 2;
      ctx.strokeRect(-w / 2, -h / 2, w, h);

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(card.name, -w / 2 + 8, -h / 2 + 8);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#cccccc';
      wrapText(ctx, card.desc, -w / 2 + 8, -h / 2 + 28, w - 16, 14);

      ctx.restore();
    }

    ctx.restore();
  }

  handleClick(mx, my) {
    if (!this.active) return false;
    for (const rect of this.cardRects) {
      if (mx >= rect.x && mx <= rect.x + rect.w &&
          my >= rect.y && my <= rect.y + rect.h) {
        if (this.onSelect) this.onSelect(rect.upgrade);
        this.active = false;
        return true;
      }
    }
    return false;
  }
}

// Simple text wrapper
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

// =========================
// Example integration
// =========================

// Assume you already have:
// - canvas
// - player object with stats
// - main game loop with update(dt) and render()

const canvas = document.getElementById('game');
const wheel = new UpgradeWheel(canvas);

let gameSpeed = 1.0;
let lastTime = performance.now();

const player = {
  level: 1,
  xp: 0,
  xpToNext: 10,
  stats: {
    damage: 1,
    attackSpeed: 1,
    projectileSpeed: 1,
    critChance: 0,
    critDamage: 1.5,
    summonCount: 1,
    summonRange: 1,
    moveSpeed: 1,
    armor: 0,
    xpGain: 1
  },
  shapesOwned: ['circle', 'square', 'triangle', 'pentagon', 'hexagon']
};

function applyUpgrade(upgrade) {
  if (upgrade.type === 'stat') {
    const s = upgrade.stat;
    if (typeof player.stats[s] === 'number') {
      player.stats[s] += upgrade.value;
    }
  } else if (upgrade.type === 'evolution') {
    // Flag evolution; your summon system should read these
    console.log('Evolution unlocked:', upgrade.id, 'for', upgrade.shape);
  }
}

function generateUpgradePool() {
  // You can filter based on player build, shapesOwned, etc.
  return UPGRADE_POOL;
}

function levelUp() {
  player.level++;
  player.xp -= player.xpToNext;
  player.xpToNext = Math.floor(player.xpToNext * 1.3);

  const pool = generateUpgradePool();
  wheel.start(pool, (upgrade) => {
    applyUpgrade(upgrade);
    gameSpeed = 1.0;
  });
  gameSpeed = 0.2;
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  if (wheel.handleClick(mx, my)) {
    // click consumed by wheel
  } else {
    // normal game click
  }
});

function gameUpdate(dt) {
  // Your normal game logic here, scaled by gameSpeed
  const scaledDt = dt * gameSpeed;

  // Example XP gain
  player.xp += scaledDt * 2 * player.stats.xpGain;
  if (player.xp >= player.xpToNext && !wheel.active) {
    levelUp();
  }

  wheel.update(scaledDt);
}

function gameRender() {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Your normal game rendering here

  wheel.draw();
}

function loop() {
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  gameUpdate(dt);
  gameRender();

  requestAnimationFrame(loop);
}

loop();
