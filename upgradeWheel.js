// =========================
// Rarity
// =========================
const RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

// =========================
// Upgrade Pool
// =========================
const UPGRADE_POOL = [
  { id:'dmg10', name:'Damage +10%', desc:'Increase damage by 10%.', rarity:RARITY.COMMON, type:'stat', stat:'damage', value:0.10 },
  { id:'aspd15', name:'Attack Speed +15%', desc:'Increase attack speed by 15%.', rarity:RARITY.COMMON, type:'stat', stat:'attackSpeed', value:0.15 },
  { id:'proj20', name:'Projectile Speed +20%', desc:'Increase projectile speed by 20%.', rarity:RARITY.UNCOMMON, type:'stat', stat:'projectileSpeed', value:0.20 },
  { id:'crit5', name:'Crit Chance +5%', desc:'Increase crit chance by 5%.', rarity:RARITY.UNCOMMON, type:'stat', stat:'critChance', value:0.05 },
  { id:'critd25', name:'Crit Damage +25%', desc:'Increase crit damage by 25%.', rarity:RARITY.RARE, type:'stat', stat:'critDamage', value:0.25 },
  { id:'summon1', name:'Summon +1', desc:'Gain one extra summon.', rarity:RARITY.RARE, type:'stat', stat:'summonCount', value:1 },
  { id:'range20', name:'Summon Range +20%', desc:'Increase summon range by 20%.', rarity:RARITY.UNCOMMON, type:'stat', stat:'summonRange', value:0.20 },
  { id:'movespd10', name:'Move Speed +10%', desc:'Increase movement speed by 10%.', rarity:RARITY.COMMON, type:'stat', stat:'moveSpeed', value:0.10 },
  { id:'armor1', name:'Armor +1', desc:'Increase armor by 1.', rarity:RARITY.UNCOMMON, type:'stat', stat:'armor', value:1 },

  // Evolutions
  { id:'circle_split', name:'Split Shot', desc:'Circle projectiles split on hit.', rarity:RARITY.EPIC, type:'evolution', shape:'circle' },
  { id:'square_shield', name:'Shield Pulse', desc:'Squares emit shield pulses.', rarity:RARITY.EPIC, type:'evolution', shape:'square' },
  { id:'tri_clone', name:'Shadow Clone', desc:'Triangles gain a clone.', rarity:RARITY.EPIC, type:'evolution', shape:'triangle' },
  { id:'hex_laser', name:'Laser Turret', desc:'Hexagons deploy laser turrets.', rarity:RARITY.LEGENDARY, type:'evolution', shape:'hexagon' }
];

// =========================
// Helpers
// =========================
function lerp(a,b,t){ return a+(b-a)*t; }

function pickWeighted(pool){
  const weights = {
    common:1,
    uncommon:1.5,
    rare:2,
    epic:3,
    legendary:5
  };
  let total = 0;
  for(const u of pool) total += weights[u.rarity];

  let r = Math.random()*total;
  for(const u of pool){
    const w = weights[u.rarity];
    if(r < w) return u;
    r -= w;
  }
  return pool[pool.length-1];
}

function pickThree(pool){
  const out = [];
  const used = new Set();
  while(out.length < 3){
    const u = pickWeighted(pool);
    if(!used.has(u.id)){
      used.add(u.id);
      out.push(u);
    }
  }
  return out;
}

function rarityColor(r){
  return {
    common:'#aaaaaa',
    uncommon:'#00ffff',
    rare:'#b000ff',
    epic:'#ffd700',
    legendary:'#ffffff'
  }[r];
}

// =========================
// Upgrade Wheel Class
// =========================
class UpgradeWheel {
  constructor(canvas){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.active = false;
    this.rotation = 0;
    this.scale = 0;
    this.speed = 0;

    this.cards = [];
    this.cardRects = [];

    this.cx = canvas.width/2;
    this.cy = canvas.height/2;

    this.outerR = 140;
    this.innerR = 100;

    this.onSelect = null;
  }

  start(pool, onSelect){
    this.active = true;
    this.speed = 720;
    this.scale = 0.2;
    this.rotation = 0;
    this.cards = pickThree(pool);
    this.onSelect = onSelect;
  }

  update(dt){
    if(!this.active) return;
    this.rotation += this.speed*dt;
    this.speed = lerp(this.speed, 90, 0.05);
    this.scale = lerp(this.scale, 1.0, 0.1);
  }

  draw(){
    if(!this.active) return;
    const ctx = this.ctx;

    // Dim background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.scale(this.scale, this.scale);

    // Outer ring
    ctx.save();
    ctx.rotate(this.rotation*Math.PI/180);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0,0,this.outerR,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();

    // Inner ring
    ctx.save();
    ctx.rotate(-this.rotation*Math.PI/180);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0,0,this.innerR,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();

    // Radial lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for(let i=0;i<16;i++){
      const a = (i/16)*Math.PI*2 + this.rotation*0.01;
      const x1 = Math.cos(a)*(this.innerR-10);
      const y1 = Math.sin(a)*(this.innerR-10);
      const x2 = Math.cos(a)*(this.outerR+10);
      const y2 = Math.sin(a)*(this.outerR+10);
      ctx.beginPath();
      ctx.moveTo(x1,y1);
      ctx.lineTo(x2,y2);
      ctx.stroke();
    }

    // Center node
    const pulse = 0.7 + 0.3*Math.sin(Date.now()*0.005);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0,0,8*pulse,0,Math.PI*2);
    ctx.fill();

    // Cards
    this.cardRects = [];
    const cardR = this.outerR + 80;
    const angles = [0,120,240];

    for(let i=0;i<this.cards.length;i++){
      const card = this.cards[i];
      const a = angles[i]*Math.PI/180;
      const cx = Math.cos(a)*cardR;
      const cy = Math.sin(a)*cardR;

      const w = 180;
      const h = 80;

      const sx = this.cx + (cx - w/2)*this.scale;
      const sy = this.cy + (cy - h/2)*this.scale;

      this.cardRects.push({ x:sx, y:sy, w:w*this.scale, h:h*this.scale, upgrade:card });

      ctx.save();
      ctx.translate(cx, cy);

      ctx.fillStyle = 'rgba(10,10,10,0.9)';
      ctx.fillRect(-w/2, -h/2, w, h);

      ctx.strokeStyle = rarityColor(card.rarity);
      ctx.lineWidth = 2;
      ctx.strokeRect(-w/2, -h/2, w, h);

      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(card.name, -w/2+8, -h/2+8);

      ctx.fillStyle = '#cccccc';
      ctx.font = '12px sans-serif';
      wrapText(ctx, card.desc, -w/2+8, -h/2+28, w-16, 14);

      ctx.restore();
    }

    ctx.restore();
  }

  handleClick(mx,my){
    if(!this.active) return false;
    for(const r of this.cardRects){
      if(mx>=r.x && mx<=r.x+r.w && my>=r.y && my<=r.y+r.h){
        this.onSelect(r.upgrade);
        this.active = false;
        return true;
      }
    }
    return false;
  }
}

function wrapText(ctx,text,x,y,maxWidth,lineHeight){
  const words = text.split(' ');
  let line = '';
  for(let n=0;n<words.length;n++){
    const test = line+words[n]+' ';
    if(ctx.measureText(test).width > maxWidth){
      ctx.fillText(line,x,y);
      line = words[n]+' ';
      y += lineHeight;
    } else line = test;
  }
  ctx.fillText(line,x,y);
}
