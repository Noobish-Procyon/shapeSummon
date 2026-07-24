const canvas = document.getElementById('game');
const wheel = new UpgradeWheel(canvas);

let gameSpeed = 1;
let last = performance.now();

const player = {
  xp: 0,
  xpNext: 10,
  level: 1,
  stats: {
    damage:1,
    attackSpeed:1,
    projectileSpeed:1,
    critChance:0,
    critDamage:1.5,
    summonCount:1,
    summonRange:1,
    moveSpeed:1,
    armor:0
  }
};

function applyUpgrade(u){
  if(u.type === 'stat'){
    player.stats[u.stat] += u.value;
  } else if(u.type === 'evolution'){
    console.log('Evolution unlocked:', u.id);
  }
}

function levelUp(){
  player.level++;
  player.xp -= player.xpNext;
  player.xpNext = Math.floor(player.xpNext*1.3);

  wheel.start(UPGRADE_POOL, (upgrade)=>{
    applyUpgrade(upgrade);
    gameSpeed = 1;
  });

  gameSpeed = 0.2;
}

canvas.addEventListener('click', e=>{
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if(wheel.handleClick(mx,my)) return;
});

function update(dt){
  const sdt = dt*gameSpeed;

  player.xp += sdt*2;
  if(player.xp >= player.xpNext && !wheel.active){
    levelUp();
  }

  wheel.update(sdt);
}

function render(){
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // your game drawing here

  wheel.draw();
}

function loop(){
  const now = performance.now();
  const dt = (now-last)/1000;
  last = now;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

loop();
