// CS: Better — Core Game Logic, Round System, Shooting, Bomb

const GAME = {
  state: {
    phase: 'menu', // menu, buy, live, end
    round: 1,
    roundTimeLeft: 115,
    ctScore: 0,
    tScore: 0,
    winner: null,
    bomb: null, // { planted: bool, position, site, timer, defuseProgress }
    buyTimeLeft: 0,
    lastRoundWinner: null
  },

  player: null,
  bots: [],
  colliders: [],
  sites: {},
  spawns: {},

  bullets: [],      // active tracers {mesh, life, start, end}
  impacts: [],      // particle-ish
  lastTime: 0,
  frame: 0,

  keys: {},
  mouseLocked: false,
  pendingShoot: false,

  mapData: null,
  scene: null,
  camera: null,
  renderer: null,

  // Viewmodel gun
  viewmodel: null,
  muzzleFlash: null,

  settings: null,

  // Hold-to-plant (progress before bomb exists)
  plantProgress: 0,
  plantingSite: null,

  // MemeTorrent P2E - Rockets earned for MT ecosystem (by memetorrent & futuret3ch)
  mtWallet: null,
  lastPointerUnlockTime: 0,
  _lastLockAttempt: 0,
};

function initGame(scene, camera, renderer) {
  GAME.scene = scene;
  GAME.camera = camera;
  GAME.renderer = renderer;
  GAME.player = new window.CSEntities.Player();
  GAME.settings = window.CSUI.initUI();

  // Build map
  const map = window.CSMap.buildDustMini(scene);
  GAME.colliders = map.colliders;
  GAME.sites = map.sites;
  GAME.spawns = map.spawns;
  GAME.mapData = map;

  // Create viewmodel (simple gun in hands)
  createViewmodel(scene);

  // Initial render so canvas isn't black even before first gameLoop frame
  if (GAME.renderer && GAME.scene && GAME.camera) {
    GAME.renderer.render(GAME.scene, GAME.camera);
  }

  // Input listeners (will be attached in main)
  window.addEventListener('keydown', (e) => {
    GAME.keys[e.key.toLowerCase()] = true;
    GAME.keys[e.code] = true;

    if (e.key.toLowerCase() === 'b' && GAME.state.phase === 'buy') {
      toggleBuyMenu();
    }
    if (e.key.toLowerCase() === 'r') {
      tryReload();
    }
    if (e.key === 'Escape') {
      if (document.getElementById('buy-menu').classList.contains('show')) {
        window.CSUI.hideBuyMenu();
      } else {
        // toggle pause
        if (GAME.state.phase !== 'menu') {
          togglePause();
        }
      }
    }
    // Number weapon select
    const num = parseInt(e.key);
    if (num >= 1 && num <= 5) {
      switchWeaponByIndex(num - 1);
    }
    // Dev: earn test rockets for MT (press = )
    if (e.key === '=') {
      if (window.CSWallet) window.CSWallet.addRockets(100, '(dev test)');
    }
  });

  window.addEventListener('keyup', (e) => {
    GAME.keys[e.key.toLowerCase()] = false;
    GAME.keys[e.code] = false;
  });

  // Mouse wheel weapon switch
  window.addEventListener('wheel', (e) => {
    if (!GAME.mouseLocked) return;
    const weapons = ['glock', 'ak47', 'awp'];
    let idx = weapons.indexOf(GAME.player.currentWeaponKey);
    if (idx === -1) idx = 0;
    idx = (idx + (e.deltaY > 0 ? 1 : -1) + weapons.length) % weapons.length;
    switchToWeapon(weapons[idx]);
  });

  // Click to shoot when locked
  const canvas = document.getElementById('three-canvas');
  canvas.addEventListener('mousedown', (e) => {
    if (!GAME.mouseLocked) {
      lockMouse();
      return;
    }
    if (e.button === 0) { // left
      GAME.pendingShoot = true;
    }
  });

  // Right click scope (simple)
  window.addEventListener('contextmenu', (e) => {
    if (GAME.mouseLocked) e.preventDefault();
  });

  // Pointer lock change
  document.addEventListener('pointerlockchange', () => {
    const wasLocked = GAME.mouseLocked;
    GAME.mouseLocked = !!document.pointerLockElement;
    const phase = GAME.state.phase;
    if (!GAME.mouseLocked && (phase === 'live' || phase === 'buy')) {
      GAME.lastPointerUnlockTime = Date.now();
      window.CSUI.showCenterMessage('Click the game to lock mouse and play');
    } else if (GAME.mouseLocked) {
      GAME.lastPointerUnlockTime = 0;
      window.CSUI.hideCenterMessage();
    }
  });

  resetRound(true);
  window.CSUI.showMenu(true, false);
  // Menu will instruct; after START, world appears (buy phase, you can move with WASD).
  // Click canvas to lock mouse for looking/aiming.

  // Expose for debug
  window.game = GAME;
}

function createViewmodel(scene) {
  const vm = new THREE.Group();
  GAME.viewmodel = vm;
  // Attach to camera so it always follows view perfectly (classic viewmodel)
  GAME.camera.add(vm);

  // Simple gun shapes (will be updated per weapon)
  const barrel = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.07, 0.9),
    new THREE.MeshLambertMaterial({ color: 0x222222 })
  );
  barrel.position.set(0.22, -0.18, -0.6);
  vm.add(barrel);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.16, 0.55),
    new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
  );
  body.position.set(0.22, -0.12, -0.35);
  vm.add(body);

  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.22, 0.11),
    new THREE.MeshLambertMaterial({ color: 0x1f1f1f })
  );
  grip.position.set(0.22, -0.28, -0.12);
  vm.add(grip);

  // Muzzle flash
  GAME.muzzleFlash = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.22, 4),
    new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  );
  GAME.muzzleFlash.rotation.x = Math.PI / 2;
  GAME.muzzleFlash.position.set(0.22, -0.18, -1.05);
  GAME.muzzleFlash.visible = false;
  vm.add(GAME.muzzleFlash);

  vm.userData.barrel = barrel;
  vm.userData.body = body;
  vm.userData.grip = grip;
}

function updateViewmodel(weaponKey, recoilPitch, recoilYaw, bob) {
  const vm = GAME.viewmodel;
  if (!vm) return;

  const w = window.CSWeapons.getWeapon(weaponKey);

  // Local offsets only (because it's child of camera)
  const kick = Math.min(0.85, (recoilPitch || 0) * 0.65);
  vm.position.set(
    0.22 + Math.sin(bob * 1.7) * 0.009,
    -0.17 + Math.cos(bob * 1.5) * 0.007 - kick * 0.032,
    -0.62
  );
  vm.rotation.set(
    (recoilPitch || 0) * 0.55 + Math.sin(bob * 0.9) * 0.003,
    (recoilYaw || 0) * 0.35,
    0
  );

  // Different visual per weapon type (pistol small, rifle, sniper long)
  if (w.type === 'sniper') {
    if (vm.userData.body) vm.userData.body.scale.set(1.0, 0.8, 1.8);
    if (vm.userData.barrel) vm.userData.barrel.scale.set(0.6, 0.6, 2.0);
    if (vm.userData.grip) vm.userData.grip.scale.set(1, 1, 1);
  } else if (w.type === 'rifle') {
    if (vm.userData.body) vm.userData.body.scale.set(1.0, 1.0, 1.3);
    if (vm.userData.barrel) vm.userData.barrel.scale.set(0.8, 0.8, 1.4);
    if (vm.userData.grip) vm.userData.grip.scale.set(1, 1, 1);
  } else {
    // pistol
    if (vm.userData.body) vm.userData.body.scale.set(0.8, 0.8, 0.9);
    if (vm.userData.barrel) vm.userData.barrel.scale.set(0.9, 0.9, 0.7);
    if (vm.userData.grip) vm.userData.grip.scale.set(0.8, 0.8, 0.8);
  }
}

function switchToWeapon(key) {
  const p = GAME.player;
  if (p.currentWeaponKey === key) return;
  const w = window.CSWeapons.getWeapon(key);
  p.currentWeaponKey = key;
  p.ammo = w.magSize;
  p.reserve = w.reserve;
  p.shotCount = 0;
  p.reloading = false;
}

function switchWeaponByIndex(idx) {
  const keys = ['glock', 'ak47', 'awp'];
  if (keys[idx]) switchToWeapon(keys[idx]);
}

function tryReload() {
  const p = GAME.player;
  if (p.startReload(performance.now() / 1000)) {
    // visual feedback handled in UI
  }
}

async function lockMouse() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;
  // Already locked for this canvas - no need to request (prevents some re-acquire issues)
  if (document.pointerLockElement === canvas) {
    GAME.mouseLocked = true;
    return;
  }
  canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
  const now = Date.now();
  // Prevent trying to re-lock too soon after unlock (browser security - "cannot be acquired immediately after the user has exited the lock")
  if (GAME.lastPointerUnlockTime && (now - GAME.lastPointerUnlockTime < 500)) {
    window.CSUI.showCenterMessage('Click the game again to lock mouse and play');
    return;
  }
  // Throttle rapid attempts from multiple events (mousedown + resume etc)
  if (GAME._lastLockAttempt && (now - GAME._lastLockAttempt < 180)) {
    return;
  }
  GAME._lastLockAttempt = now;
  try {
    await canvas.requestPointerLock();
    GAME.mouseLocked = true;
    if (window.CSAudio) window.CSAudio.resume();
    window.CSUI.hideCenterMessage();
    GAME.lastPointerUnlockTime = 0; // clear guard after successful acquire
  } catch (e) {
    const msg = (e && (e.message || e.name || '')).toString();
    if (e && (e.name === 'SecurityError' || /gesture|immediately after|exited the lock/i.test(msg))) {
      // Expected when user exited (Esc) and click-to-resume happens near the boundary, or no fresh gesture.
      // Do not spam console.warn for this common case; UI message is sufficient.
      window.CSUI.showCenterMessage('Click the game to lock mouse and play');
    } else {
      console.warn('Pointer lock failed (user gesture required?):', e);
      window.CSUI.showCenterMessage('Click the game to lock mouse and play');
    }
  }
}

function togglePause() {
  if (GAME.state.phase === 'live' || GAME.state.phase === 'buy') {
    window.CSUI.showMenu(true, true);
    GAME.lastPointerUnlockTime = Date.now();
    GAME.state.phase = 'paused';
  } else if (GAME.state.phase === 'paused') {
    window.CSUI.hideMenu();
    GAME.state.phase = 'live';
    lockMouse();
  }
}

let buyMenuOpen = false;

function toggleBuyMenu() {
  buyMenuOpen = !buyMenuOpen;
  const p = GAME.player;
  if (buyMenuOpen && GAME.state.phase === 'buy') {
    window.CSUI.showBuyMenu(true, p.money, (what) => {
      buyItem(what);
      // keep open so player can buy more
      const bm = document.getElementById('buy-menu');
      if (bm) window.CSUI.showBuyMenu(true, GAME.player.money, (w) => buyItem(w));
    });
  } else {
    window.CSUI.hideBuyMenu();
    buyMenuOpen = false;
  }
}

function buyItem(what) {
  const p = GAME.player;
  const wData = window.CSWeapons.getWeapon(what);
  if (wData && p.money >= wData.price) {
    p.money -= wData.price;
    p.currentWeaponKey = what;
    p.ammo = wData.magSize;
    p.reserve = wData.reserve;
    p.shotCount = 0;
    window.CSUI.updateHUD(GAME.state, p);
    return true;
  }
  if (what === 'kevlar') {
    if (p.money >= 650) {
      p.money -= 650;
      p.armor = Math.max(p.armor, 100);
    }
  } else if (what === 'helmet') {
    if (p.money >= 1000) {
      p.money -= 1000;
      p.armor = Math.max(p.armor, 100);
      p.hasHelmet = true;
    }
  }
  window.CSUI.updateHUD(GAME.state, p);
  return false;
}

function spawnBots(count = 5, difficulty = 0.72) {
  GAME.bots.forEach(b => {
    if (b.mesh) GAME.scene.remove(b.mesh);
  });
  GAME.bots = [];

  const side = 't'; // enemy team for now (player is CT)
  for (let i = 0; i < count; i++) {
    const pos = GAME.spawns.t[i % GAME.spawns.t.length].clone();
    pos.x += (Math.random() - 0.5) * 3.5;
    pos.z += (Math.random() - 0.5) * 2.5;

    const bot = new window.CSEntities.Bot(i, side, pos, difficulty);
    // Visual capsule
    const mesh = createBotMesh(bot.side);
    mesh.position.copy(bot.position);
    GAME.scene.add(mesh);
    bot.mesh = mesh;

    GAME.bots.push(bot);
  }
}

function createBotMesh(side) {
  const g = new THREE.Group();
  const bodyColor = side === 'ct' ? 0x3b5f8a : 0x7a2f2f;

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 0.9, 12),
    new THREE.MeshLambertMaterial({ color: bodyColor })
  );
  body.position.y = 1.0;
  g.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 10, 10),
    new THREE.MeshLambertMaterial({ color: 0xe8d2b8 })
  );
  head.position.y = 1.85;
  g.add(head);

  // simple gun in hand
  const gun = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.6),
    new THREE.MeshLambertMaterial({ color: 0x222 })
  );
  gun.position.set(0.45, 1.15, -0.1);
  g.add(gun);

  return g;
}

function resetRound(first = false) {
  const s = GAME.state;
  const p = GAME.player;

  s.phase = 'buy';
  s.roundTimeLeft = 20; // buy time
  s.buyTimeLeft = 20;
  s.bomb = null;

  p.resetForRound('ct');
  p.money = Math.min(16000, p.money + (first ? 1600 : 1400)); // better first-round money so you can buy a rifle immediately

  // Reset bots
  spawnBots(5, 0.68 + (s.round - 1) * 0.03);

  // Position player at CT spawn
  p.position.copy(GAME.spawns.ct[0]);
  p.yaw = 0;
  p.pitch = 0;
  p._deathMsgShown = false;

  // Clear projectiles
  GAME.bullets.forEach(b => GAME.scene.remove(b.mesh));
  GAME.bullets = [];

  // Clear killfeed for new round
  const kf = document.getElementById('killfeed');
  if (kf) kf.innerHTML = '';

  // Give starting pistol
  p.currentWeaponKey = 'glock';
  const gl = window.CSWeapons.getWeapon('glock');
  p.ammo = gl.magSize;
  p.reserve = gl.reserve;

  window.CSUI.hideBuyMenu();
  buyMenuOpen = false;

  // reset plant state
  GAME.plantProgress = 0;
  GAME.plantingSite = null;

  if (!first) {
    window.CSUI.showCenterMessage(`ROUND ${s.round}`, 'BUY PHASE — PRESS B');
    setTimeout(() => {
      if (s.phase === 'buy') window.CSUI.hideCenterMessage();
    }, 1600);
  }

  // Update scores
  window.CSUI.updateHUD(s, p);
}

function startLivePhase() {
  const s = GAME.state;
  s.phase = 'live';
  s.roundTimeLeft = 115;
  s.bomb = null;

  GAME.player.lastShotTime = performance.now() / 1000 - 0.5;

  // Activate bots
  GAME.bots.forEach(b => {
    b.state = 'patrol';
    b.lastSeenPlayer = 0;
  });

  GAME.plantProgress = 0;
  GAME.plantingSite = null;
  window.CSUI.hideCenterMessage();
  window.CSUI.hideBuyMenu();
  buyMenuOpen = false;
  window.CSUI.showCenterMessage('Click the game to lock mouse and play');
  // Do not auto-lock here (setTimeout loses user gesture in some browsers).
  // mousedown listener will call lockMouse() on first click.
}

function plantBomb(siteKey) {
  const s = GAME.state;
  if (s.bomb && s.bomb.planted) return;

  const site = GAME.sites[siteKey];
  const p = GAME.player;

  s.bomb = {
    planted: true,
    site: siteKey,
    position: site.center.clone(),
    timer: 40,
    defuseProgress: 0,
    defusing: false
  };

  // Visual bomb
  const bombMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.55, 10),
    new THREE.MeshLambertMaterial({ color: 0xcc2222 })
  );
  bombMesh.position.copy(site.center);
  bombMesh.position.y = 1.35;
  GAME.scene.add(bombMesh);
  s.bomb.mesh = bombMesh;

  window.CSAudio && window.CSAudio.plant();
  window.CSUI.showCenterMessage('BOMB PLANTED', 'DEFUSE OR DIE', true);

  GAME.plantProgress = 0;
  GAME.plantingSite = null;

  setTimeout(() => window.CSUI.hideCenterMessage(), 1400);
}

// (plant state lives on GAME.plantProgress / GAME.plantingSite)

function tryDefuse(dt = 0.016) {
  const s = GAME.state;
  if (!s.bomb || !s.bomb.planted) return;

  const p = GAME.player;
  const dist = p.position.distanceTo(s.bomb.position);
  if (dist > 3.2) return;

  s.bomb.defusing = true;
  s.bomb.defuseProgress = (s.bomb.defuseProgress || 0) + dt * 0.14; // ~7s hold

  if (s.bomb.defuseProgress >= 1) {
    // success
    if (window.CSWallet) window.CSWallet.addRockets(180, '(bomb defused)');
    endRound('ct', 'Bomb defused');
  }
}

function endRound(winner, reason = '') {
  const s = GAME.state;
  s.phase = 'end';
  s.winner = winner;
  s.lastRoundWinner = winner;

  if (winner === 'ct') s.ctScore++;
  else s.tScore++;

  window.CSUI.showWinBanner(winner, reason);
  window.CSAudio && window.CSAudio.win(winner === 'ct');

  // Simple money award
  const p = GAME.player;
  if (winner === 'ct') {
    p.money = Math.min(16000, p.money + 2700 + (p.kills * 300));
  } else {
    p.money = Math.min(16000, p.money + 1900 + (p.kills * 200));
  }

  // MemeTorrent Rockets bonus for round performance (only if survived)
  if (p.health > 0 && window.CSWallet) {
    const roundRockets = 80 + (p.kills * 12);
    window.CSWallet.addRockets(roundRockets, 'round bonus');
  }

  // Remove bomb visual
  if (s.bomb && s.bomb.mesh) GAME.scene.remove(s.bomb.mesh);

  setTimeout(() => {
    s.round++;
    resetRound();
  }, 5200);
}

function checkWinConditions(dt) {
  const s = GAME.state;
  if (s.phase !== 'live') return;

  const p = GAME.player;
  const aliveBots = GAME.bots.filter(b => b.alive);

  if (s.bomb && s.bomb.planted) {
    s.bomb.timer -= dt;
    if (s.bomb.timer <= 0) {
      endRound('t', 'Bomb exploded');
      return;
    }
  }

  // Time up
  s.roundTimeLeft -= dt;
  if (s.roundTimeLeft <= 0) {
    if (s.bomb && s.bomb.planted) {
      endRound('t', 'Time');
    } else {
      endRound('ct', 'Time');
    }
    return;
  }

  // Elimination
  const playerAlive = p.health > 0;
  if (!playerAlive && aliveBots.length > 0) {
    endRound('t', 'Eliminated');
    return;
  }
  if (playerAlive && aliveBots.length === 0) {
    // player team wins (even if no real teammates)
    if (s.bomb && s.bomb.planted) {
      // still have to defuse or time
    } else {
      endRound('ct', 'Eliminated');
    }
  }
}

// ===== SHOOTING =====

function performShot(origin, direction, damage, headMul, penetration, shooterIsBot = false, shooter = null) {
  const p = GAME.player;
  const raycaster = new THREE.Raycaster(origin, direction.normalize(), 0.1, 70);

  // Collect all possible targets
  const botMeshes = GAME.bots.filter(b => b.alive).map(b => b.mesh);
  const intersects = raycaster.intersectObjects(botMeshes.concat(GAME.scene.children), true);

  let hitSomething = false;
  let finalDamage = damage;

  for (let hit of intersects) {
    if (hit.distance > 65) break;

    // Check if bot
    let hitBot = null;
    for (let b of GAME.bots) {
      if (b.alive && b.mesh && (hit.object === b.mesh || hit.object.parent === b.mesh)) {
        hitBot = b;
        break;
      }
    }

    if (hitBot) {
      // Headshot check (rough: if hit y high on capsule)
      const isHS = hit.point.y > hitBot.position.y + 1.55;
      const mul = isHS ? headMul : 1.0;
      const dealt = hitBot.takeDamage(finalDamage * mul, isHS);

      window.CSAudio && window.CSAudio.hit(isHS, hitBot.armor > 0);

      if (shooterIsBot) {
        // Bot killed player?
        if (p.health <= 0 && !shooterIsBot) {
          // wait, this branch is bot shooting player
        }
      } else {
        if (dealt > 0) {
          p.kills = (p.kills || 0) + (hitBot.health <= 0 ? 1 : 0);
          window.CSUI.addKillfeed('YOU', 'BOT', shooter ? shooter.currentWeaponKey.toUpperCase() : 'AK', isHS);

          // Earn Rockets for MemeTorrent P2E
          const rocketGain = isHS ? 25 : 15;
          if (window.CSWallet) window.CSWallet.addRockets(rocketGain, isHS ? '(headshot)' : '');
        }
      }

      // Blood / impact
      spawnImpact(hit.point, 0xff4444, 0.6);
      hitSomething = true;
      break; // stop at first target
    }

    // Wall hit
    if (hit.object && hit.object.isMesh && !hit.object.parent?.userData?.isViewmodel) {
      const mat = hit.object.material;
      let pen = penetration;
      if (hit.object.userData.penetration) pen *= hit.object.userData.penetration;

      spawnImpact(hit.point, 0xcccccc, 0.35);

      // Wallbang continue with reduced damage
      if (pen > 0.2) {
        finalDamage *= pen * 0.7;
        // continue to next intersect
        continue;
      }
      hitSomething = true;
      break;
    }
  }

  // Tracer
  const endPoint = origin.clone().add(direction.clone().multiplyScalar(48));
  createTracer(origin, endPoint);

  return hitSomething;
}

function createTracer(from, to) {
  const points = [from, to];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0xffee99, transparent: true, opacity: 0.85 });
  const line = new THREE.Line(geo, mat);
  GAME.scene.add(line);

  GAME.bullets.push({
    mesh: line,
    life: 0.09,
    maxLife: 0.09
  });
}

function spawnImpact(pos, color = 0xaaaaaa, scale = 0.4) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(scale, 5, 5),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
  );
  m.position.copy(pos);
  GAME.scene.add(m);
  GAME.impacts.push({ mesh: m, life: 0.22 });
}

function fireWeapon(now) {
  const p = GAME.player;
  if (p.health <= 0) return;

  const shot = p.shoot(now);
  if (!shot) return;

  const w = shot.weapon;

  // Camera recoil (deterministic)
  const [pitchDelta, yawDelta] = window.CSWeapons.getRecoilDelta(w, shot.shotIndex);
  const moveMul = (p.walking || Math.abs(p.velocity.x) + Math.abs(p.velocity.z) > 1.5) ? w.movePenalty : 1.0;
  const crouchMul = p.crouching ? 0.7 : 1.0;

  p.yaw += yawDelta * moveMul * crouchMul;
  p.pitch += pitchDelta * moveMul * crouchMul;
  p.pitch = Math.max(-1.45, Math.min(1.45, p.pitch));

  // Muzzle flash
  if (GAME.muzzleFlash) {
    GAME.muzzleFlash.visible = true;
    GAME.muzzleFlash.scale.set(1, 1 + Math.random() * 0.3, 1);
    setTimeout(() => { if (GAME.muzzleFlash) GAME.muzzleFlash.visible = false; }, 55);
  }

  // Sound
  window.CSAudio && window.CSAudio.gunshot(w.key);

  // Calculate spread direction
  const spread = window.CSWeapons.getCurrentSpread(w, {
    moving: Math.abs(p.velocity.x) + Math.abs(p.velocity.z) > 1.2,
    crouching: p.crouching,
    scoped: false
  });

  const dir = new THREE.Vector3(0, 0, -1);
  dir.applyEuler(new THREE.Euler(p.pitch, p.yaw, 0, 'YXZ'));

  // Apply cone spread
  if (spread > 0.001) {
    const rx = (Math.random() - 0.5) * spread * 1.6;
    const ry = (Math.random() - 0.5) * spread * 1.6;
    dir.applyEuler(new THREE.Euler(rx, ry, 0));
  }

  const origin = GAME.camera.position.clone().add(dir.clone().multiplyScalar(0.4));

  performShot(origin, dir, shot.damage, shot.headMul, w.penetration, false);

  // Update HUD ammo
  window.CSUI.updateHUD(GAME.state, p);
}

function botShoot(bot, shotInfo, now) {
  if (!bot || !bot.alive) return;

  const origin = bot.position.clone().add(new THREE.Vector3(0, 1.55, 0));
  const dir = new THREE.Vector3(0, 0, -1);
  dir.applyEuler(new THREE.Euler(bot.pitch, bot.yaw, 0, 'YXZ'));

  // Bot inaccuracy
  const acc = shotInfo.accuracy || 0.7;
  const spread = (1 - acc) * 0.045;
  if (spread > 0) {
    dir.applyEuler(new THREE.Euler(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      0
    ));
  }

  window.CSAudio && window.CSAudio.gunshot(shotInfo.weapon.key);

  // Create tracer from bot
  const end = origin.clone().add(dir.clone().multiplyScalar(42));
  createTracer(origin, end);

  // Hit player?
  const p = GAME.player;
  const toPlayer = p.position.clone().sub(origin);
  const dist = toPlayer.length();
  const dot = dir.dot(toPlayer.normalize());

  if (dot > 0.82 && dist < 38) {
    const isHS = Math.random() < 0.12 + (shotInfo.accuracy - 0.6) * 0.25;
    const dmg = shotInfo.damage * (isHS ? shotInfo.headMul : 1) * (0.9 + Math.random() * 0.2);
    const dealt = p.takeDamage(dmg, isHS);

    window.CSAudio && window.CSAudio.hit(isHS, p.armor > 0);
    window.CSUI.flashDamage(dealt);

    if (p.health <= 0) {
      window.CSUI.addKillfeed('BOT', 'YOU', shotInfo.weapon.key.toUpperCase(), isHS, true);
      // end round soon
      setTimeout(() => {
        if (GAME.state.phase === 'live' && GAME.player.health <= 0) {
          endRound('t', 'Eliminated');
        }
      }, 420);
    }
  }

  // Impact on walls sometimes
  if (Math.random() < 0.6) {
    const impactPos = origin.clone().add(dir.clone().multiplyScalar(12 + Math.random() * 18));
    spawnImpact(impactPos, 0x999999, 0.3);
  }
}

// ===== MAIN SIMULATION =====

function updatePlayer(dt, now) {
  const p = GAME.player;
  if (p.health <= 0) return;

  const speed = p.crouching ? 2.4 : (p.walking ? 2.9 : 5.6);
  const accel = p.onGround ? 38 : 12;

  let mx = 0, mz = 0;
  if (GAME.keys['w'] || GAME.keys['arrowup']) mz -= 1;
  if (GAME.keys['s'] || GAME.keys['arrowdown']) mz += 1;
  if (GAME.keys['a'] || GAME.keys['arrowleft']) mx -= 1;
  if (GAME.keys['d'] || GAME.keys['arrowright']) mx += 1;

  p.walking = !!GAME.keys['shift'];
  p.crouching = !!(GAME.keys['control'] || GAME.keys['c']);

  const len = Math.sqrt(mx * mx + mz * mz) || 1;
  mx /= len; mz /= len;

  // Forward vector from yaw
  const forward = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
  const right = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));

  const wish = right.multiplyScalar(mx).add(forward.multiplyScalar(mz));

  if (p.onGround) {
    p.velocity.x += wish.x * accel * dt;
    p.velocity.z += wish.z * accel * dt;
  } else {
    p.velocity.x += wish.x * 7 * dt;
    p.velocity.z += wish.z * 7 * dt;
  }

  // Friction
  const fric = p.onGround ? 9.5 : 1.6;
  p.velocity.x *= (1 - fric * dt);
  p.velocity.z *= (1 - fric * dt);

  // Cap speed
  const horiz = Math.sqrt(p.velocity.x * p.velocity.x + p.velocity.z * p.velocity.z);
  const max = p.walking ? 3.2 : (p.crouching ? 2.8 : speed);
  if (horiz > max) {
    const f = max / horiz;
    p.velocity.x *= f;
    p.velocity.z *= f;
  }

  // Jump
  if ((GAME.keys[' '] || GAME.keys['space']) && p.onGround) {
    p.velocity.y = 9.2;
    p.onGround = false;
    window.CSAudio && window.CSAudio.land();
  }

  // Gravity
  p.velocity.y -= 26 * dt;

  // Integrate
  p.position.x += p.velocity.x * dt;
  p.position.y += p.velocity.y * dt;
  p.position.z += p.velocity.z * dt;

  // Floor
  if (p.position.y < 1.6) {
    if (p.velocity.y < -4) window.CSAudio && window.CSAudio.land();
    p.position.y = 1.6;
    p.velocity.y = 0;
    p.onGround = true;
  } else {
    p.onGround = false;
  }

  // World collision
  resolvePlayerCollisions(p);

  // Footsteps
  const horizSpeed = Math.sqrt(p.velocity.x * p.velocity.x + p.velocity.z * p.velocity.z);
  if (p.onGround && horizSpeed > 1.8 && now - p.lastFootstep > (p.crouching ? 0.48 : 0.32)) {
    p.lastFootstep = now;
    window.CSAudio && window.CSAudio.footstep(horizSpeed / 5, p.crouching);
  }

  // Reload
  p.updateReload(now);

  // Viewmodel update (camera sync is now always done in main loop for buy/live)
  const bob = (now * 1.6) % (Math.PI * 2);
  updateViewmodel(p.currentWeaponKey, 0, 0, bob); // recoil applied via camera already

  // Bomb plant / defuse (hold E) — proper timed actions
  const eHeld = GAME.keys['e'] || GAME.keys['e'.toUpperCase()];
  const s = GAME.state;

  if (s.phase === 'live') {
    if (!s.bomb) {
      // Try to start / continue planting
      let nearSite = null;
      for (let key in GAME.sites) {
        const site = GAME.sites[key];
        if (p.position.distanceTo(site.center) < site.radius) {
          nearSite = key;
          break;
        }
      }
      if (nearSite && eHeld) {
        if (GAME.plantingSite !== nearSite) {
          GAME.plantingSite = nearSite;
          GAME.plantProgress = 0;
        }
        GAME.plantProgress += dt * 0.28; // ~3.5-4s plant time
        window.CSUI.showCenterMessage('PLANTING', Math.round(GAME.plantProgress * 100) + '% — HOLD E');

        if (GAME.plantProgress >= 1) {
          plantBomb(GAME.plantingSite);
          GAME.plantProgress = 0;
          GAME.plantingSite = null;
          window.CSUI.hideCenterMessage();
        }
      } else {
        GAME.plantProgress = 0;
        GAME.plantingSite = null;
        if (nearSite) {
          window.CSUI.showCenterMessage('HOLD E TO PLANT', nearSite + ' SITE');
        }
      }
    } else if (s.bomb && s.bomb.planted && eHeld) {
      tryDefuse(dt);
    } else {
      // not holding or not near
      if (s.bomb && s.bomb.planted) {
        // handled inside updateBomb for decay
      }
    }
  }
}

function resolvePlayerCollisions(p) {
  const r = 0.42;
  for (let box of GAME.colliders) {
    const closestX = Math.max(box.min.x, Math.min(p.position.x, box.max.x));
    const closestY = Math.max(box.min.y, Math.min(p.position.y, box.max.y));
    const closestZ = Math.max(box.min.z, Math.min(p.position.z, box.max.z));

    const dx = p.position.x - closestX;
    const dy = p.position.y - closestY;
    const dz = p.position.z - closestZ;
    const d2 = dx * dx + dy * dy + dz * dz;

    if (d2 > 0 && d2 < r * r) {
      const d = Math.sqrt(d2);
      const push = (r - d) / d;
      p.position.x += dx * push * 0.85;
      p.position.z += dz * push * 0.85;

      // stop velocity into wall
      if (Math.abs(dx) > Math.abs(dz)) p.velocity.x *= 0.3;
      else p.velocity.z *= 0.3;
    }
  }
}

function updateBots(dt, now) {
  const p = GAME.player;
  GAME.bots.forEach(bot => {
    if (!bot.alive) {
      if (bot.mesh) bot.mesh.visible = false;
      return;
    }
    const shot = bot.think(dt, now, p, GAME.colliders, GAME.mapData);
    if (shot) {
      botShoot(bot, shot, now);
    }
    if (bot.mesh) {
      bot.mesh.position.x = bot.position.x;
      bot.mesh.position.y = bot.position.y;
      bot.mesh.position.z = bot.position.z;
      bot.mesh.rotation.y = bot.yaw;
    }
  });
}

function updateProjectiles(dt) {
  // Tracers
  for (let i = GAME.bullets.length - 1; i >= 0; i--) {
    const b = GAME.bullets[i];
    b.life -= dt;
    if (b.mesh && b.mesh.material) {
      b.mesh.material.opacity = (b.life / b.maxLife) * 0.85;
    }
    if (b.life <= 0) {
      if (b.mesh) GAME.scene.remove(b.mesh);
      GAME.bullets.splice(i, 1);
    }
  }

  // Impacts
  for (let i = GAME.impacts.length - 1; i >= 0; i--) {
    const imp = GAME.impacts[i];
    imp.life -= dt;
    if (imp.mesh) {
      imp.mesh.scale.multiplyScalar(0.88);
      if (imp.mesh.material) imp.mesh.material.opacity = imp.life * 3;
    }
    if (imp.life <= 0) {
      if (imp.mesh) GAME.scene.remove(imp.mesh);
      GAME.impacts.splice(i, 1);
    }
  }
}

function updateBomb(dt) {
  const s = GAME.state;
  if (!s.bomb || !s.bomb.planted) return;

  // Beeps
  if (Math.floor(s.bomb.timer) !== Math.floor(s.bomb.timer + dt)) {
    window.CSAudio && window.CSAudio.plant();
  }

  // Defuse progress decay if not holding
  if (!s.bomb.defusing) {
    s.bomb.defuseProgress = Math.max(0, (s.bomb.defuseProgress || 0) - dt * 0.6);
  }
  s.bomb.defusing = false; // reset each frame, set true only if holding E

  // Simple visual pulse on bomb
  if (s.bomb.mesh) {
    const pulse = 1 + Math.sin(performance.now() / 180) * 0.06;
    s.bomb.mesh.scale.set(pulse, 1, pulse);
  }

  // Show defuse progress
  if (s.bomb.defuseProgress > 0.03) {
    window.CSUI.showCenterMessage('DEFUSING', Math.round(s.bomb.defuseProgress * 100) + '% — HOLD E');
  } else if (window.CSUI && document.getElementById('center-message') && document.getElementById('center-message').textContent.includes('DEFUSING')) {
    window.CSUI.hideCenterMessage();
  }
}

function gameLoop(nowMs) {
  const now = nowMs / 1000;
  const dt = Math.min(0.05, (GAME.lastTime ? now - GAME.lastTime : 0.016));
  GAME.lastTime = now;
  GAME.frame++;

  const s = GAME.state;
  const p = GAME.player;

  // Update input driven things
  if (GAME.mouseLocked && (s.phase === 'live' || s.phase === 'buy')) {
    // handled by mousemove listener in main.js
  }

  if (s.phase === 'live' || s.phase === 'buy') {
    updatePlayer(dt, now);

    if (s.phase === 'live') {
      if (p.health <= 0) {
        if (!p._deathMsgShown) {
          window.CSUI.showCenterMessage('YOU DIED', 'Round will end soon...', true);
          p._deathMsgShown = true;
        }
      } else {
        p._deathMsgShown = false;
      }
      updateBots(dt, now);

      // Bot plant logic (simple)
      if (!s.bomb) {
        GAME.bots.forEach(bot => {
          if (bot.alive && bot.state === 'plant') {
            for (let k in GAME.sites) {
              const site = GAME.sites[k];
              if (bot.position.distanceTo(site.center) < 2.8) {
                s.bomb = { planted: true, site: k, position: site.center.clone(), timer: 40, defuseProgress: 0, defusing: false };
                const bm = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.55, 10), new THREE.MeshLambertMaterial({ color: 0xcc2222 }));
                bm.position.copy(site.center);
                bm.position.y = 1.35;
                GAME.scene.add(bm);
                s.bomb.mesh = bm;
                window.CSAudio && window.CSAudio.plant();
                window.CSUI.showCenterMessage('BOMB PLANTED', 'DEFUSE OR LOSE', true);
                GAME.plantProgress = 0;
                GAME.plantingSite = null;
                setTimeout(() => window.CSUI.hideCenterMessage(), 1500);
                break;
              }
            }
          }
        });
      }

      updateBomb(dt);
      checkWinConditions(dt);

      // Auto-hide stale interaction prompts when not near anything.
      // Inline key check (no 'eHeld' symbol in gameLoop scope) to prevent any ReferenceError
      // even if older bundles or edits copy logic from updatePlayer. Also only hide when
      // truly not near a site so the "HOLD E TO PLANT" prompt stays visible while near + !E.
      let nearSiteNow = null;
      for (let k in GAME.sites) {
        const site = GAME.sites[k];
        if (p.position.distanceTo(site.center) < (site.radius || 2.5)) {
          nearSiteNow = k;
          break;
        }
      }
      const eHeldCheck = GAME.keys && (GAME.keys['e'] || GAME.keys['e'.toUpperCase()]);
      if (!nearSiteNow && !s.bomb && !GAME.plantingSite) {
        const cm = document.getElementById('center-message');
        if (cm && (cm.textContent.includes('PLANT') || cm.textContent.includes('HOLD E') || cm.textContent.includes('DEFUSE'))) {
          window.CSUI.hideCenterMessage();
        }
      }

      // Pending left click shot
      if (GAME.pendingShoot) {
        GAME.pendingShoot = false;
        fireWeapon(now);
      }

      // Auto scope visual feedback (right mouse held)
      const rightHeld = GAME.keys[''] || false; // we don't track easily, skip for now

    } else if (s.phase === 'buy') {
      s.buyTimeLeft -= dt;
      s.roundTimeLeft = s.buyTimeLeft;
      if (s.buyTimeLeft <= 0) {
        startLivePhase();
      }
      // In buy we allow movement via updatePlayer above; no shooting (pending handled only in live)
    }
  } else if (s.phase === 'paused') {
    // nothing
  }

  // Update viewmodel position even in buy
  if (p && GAME.viewmodel) {
    const bob = (now * 1.4) % (Math.PI * 2);
    updateViewmodel(p.currentWeaponKey, 0, 0, bob);
  }

  // Always keep camera synced to player (important for buy phase view too, and after reset)
  if (p && GAME.camera) {
    GAME.camera.position.copy(p.position);
    GAME.camera.position.y += p.crouching ? 0.55 : 0;
    GAME.camera.rotation.order = 'YXZ';
    GAME.camera.rotation.y = p.yaw;
    GAME.camera.rotation.x = p.pitch;
  }

  updateProjectiles(dt);

  // HUD
  window.CSUI.updateHUD(s, p);
  window.CSUI.updateRadar(p, GAME.bots, s.bomb, GAME.mapData);

  // Refresh MT wallet / rockets UI
  if (window.CSWallet && window.CSWallet.getState) {
    // the module already keeps its own state, but force UI sync occasionally
    if (typeof window.CSWallet.updateWalletUI === 'function') {
      window.CSWallet.updateWalletUI();
    }
  }

  // FPS counter
  if (GAME.frame % 20 === 0) {
    const fpsEl = document.getElementById('fps');
    if (fpsEl && GAME.lastFpsTime) {
      const fps = Math.round(20 / (now - GAME.lastFpsTime));
      fpsEl.textContent = fps + ' fps';
    }
    GAME.lastFpsTime = now;
  }

  // Render the 3D scene (was missing - this is why canvas was black)
  if (GAME.renderer && GAME.scene && GAME.camera) {
    GAME.renderer.render(GAME.scene, GAME.camera);
  }

  // Request next
  requestAnimationFrame(gameLoop);
}

function startGame() {
  GAME.state.phase = 'buy';
  window.CSUI.hideMenu();
  resetRound(true);
  window.CSUI.showCenterMessage('Buy phase: WASD to move, B to buy. Live soon. Click canvas to lock mouse for look.');
  // Start first live after buy
  setTimeout(() => {
    if (GAME.state.phase === 'buy') startLivePhase();
  }, 18500);

  requestAnimationFrame(gameLoop);
}

function resumeGame() {
  if (GAME.state.phase === 'paused') {
    GAME.state.phase = 'live';
  }
  window.CSUI.hideMenu();
  GAME.lastPointerUnlockTime = 0; // fresh gesture from resume button click
  lockMouse();
  requestAnimationFrame(gameLoop);
}

window.CSGame = {
  init: initGame,
  start: startGame,
  resume: resumeGame,
  GAME // for debugging
};
