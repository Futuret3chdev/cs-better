// CS: Better — Entities (Player + Bots)

const PLAYER_START = new THREE.Vector3(0, 1.6, 22);
const BOT_SPAWN_POINTS = [
  new THREE.Vector3(-14, 1.6, -18),
  new THREE.Vector3(14, 1.6, -19),
  new THREE.Vector3(-8, 1.6, -4),
  new THREE.Vector3(9, 1.6, -9),
  new THREE.Vector3(2, 1.6, 4),
  new THREE.Vector3(-3, 1.6, -13),
];

class Player {
  constructor() {
    this.position = PLAYER_START.clone();
    this.velocity = new THREE.Vector3();
    this.yaw = 0;     // radians left/right
    this.pitch = 0;   // radians up/down (negative = look up)
    this.health = 100;
    this.armor = 100;
    this.hasHelmet = true;
    this.money = 1600;
    this.kills = 0;
    this.deaths = 0;

    this.onGround = true;
    this.crouching = false;
    this.walking = false;
    this.lastFootstep = 0;

    this.currentWeaponKey = 'glock';
    this.ammo = 20;
    this.reserve = 120;
    this.lastShotTime = 0;
    this.shotCount = 0; // for recoil pattern index
    this.reloading = false;
    this.reloadEndTime = 0;

    this.lastDamageTime = 0;
  }

  resetForRound(side = 'ct') {
    this.position.copy(PLAYER_START);
    if (side === 't') this.position.z = 20; // slight T side bias
    this.velocity.set(0, 0, 0);
    this.yaw = (side === 't' ? Math.PI : 0);
    this.pitch = 0;
    this.health = 100;
    this.armor = 0;
    this.hasHelmet = false;
    this.kills = 0; // round kills
    this.onGround = true;
    this.crouching = false;
    this.reloading = false;
    this.shotCount = 0;
    // keep money and total stats
  }

  getCurrentWeapon() {
    return window.CSWeapons.getWeapon(this.currentWeaponKey);
  }

  canShoot(now) {
    const w = this.getCurrentWeapon();
    return !this.reloading &&
           now - this.lastShotTime >= w.fireRate &&
           this.ammo > 0;
  }

  shoot(now) {
    if (!this.canShoot(now)) return null;
    const w = this.getCurrentWeapon();
    this.lastShotTime = now;
    this.ammo--;
    this.shotCount++;

    // Return shot info for recoil + spread
    return {
      weapon: w,
      shotIndex: this.shotCount,
      damage: w.damage,
      headMul: w.headMul
    };
  }

  startReload(now) {
    const w = this.getCurrentWeapon();
    if (this.reloading || this.ammo >= w.magSize || this.reserve <= 0) return false;
    this.reloading = true;
    this.reloadEndTime = now + w.reloadTime;
    window.CSAudio && window.CSAudio.reload(this.currentWeaponKey);
    return true;
  }

  updateReload(now) {
    if (!this.reloading) return;
    if (now >= this.reloadEndTime) {
      const w = this.getCurrentWeapon();
      const needed = w.magSize - this.ammo;
      const take = Math.min(needed, this.reserve);
      this.ammo += take;
      this.reserve -= take;
      this.reloading = false;
    }
  }

  takeDamage(amount, isHeadshot) {
    if (this.health <= 0) return 0;
    let dmg = amount;
    if (!isHeadshot && this.armor > 0) {
      const absorbed = Math.min(this.armor, Math.floor(dmg * 0.5));
      this.armor -= absorbed;
      dmg -= absorbed;
    }
    if (isHeadshot && this.hasHelmet) {
      dmg *= 0.7; // helmet helps a bit
    }
    this.health = Math.max(0, this.health - dmg);
    this.lastDamageTime = performance.now() / 1000;
    return dmg;
  }
}

class Bot {
  constructor(id, side, position, difficulty = 0.7) {
    this.id = id;
    this.side = side; // 'ct' or 't'
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    this.yaw = (side === 'ct' ? 0 : Math.PI) + (Math.random() - 0.5) * 0.6;
    this.pitch = (Math.random() - 0.5) * 0.3;
    this.health = 100;
    this.armor = side === 'ct' ? 80 : 50;
    this.hasHelmet = side === 'ct';
    this.alive = true;

    this.difficulty = difficulty; // 0.4 easy ... 0.95 hard
    this.state = 'patrol'; // patrol, engage, plant, defuse, dead
    this.targetPos = null;
    this.lastShotTime = 0;
    this.lastSeenPlayer = 0;
    this.shotCount = 0;
    this.moveSpeed = 3.8 + (this.difficulty - 0.5) * 0.6;
    this.reaction = 0.28 - (this.difficulty - 0.5) * 0.18; // time to react

    this.currentWeaponKey = (Math.random() < 0.35 && side === 't') ? 'ak47' : (Math.random() < 0.25 ? 'glock' : 'ak47');
    if (side === 'ct' && Math.random() < 0.2) this.currentWeaponKey = 'glock';
    this.ammo = window.CSWeapons.getWeapon(this.currentWeaponKey).magSize;
  }

  getCurrentWeapon() {
    return window.CSWeapons.getWeapon(this.currentWeaponKey);
  }

  reset(position, yawBias = 0) {
    this.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.yaw = (this.side === 'ct' ? 0 : Math.PI) + yawBias;
    this.pitch = 0;
    this.health = 100;
    this.alive = true;
    this.state = 'patrol';
    this.targetPos = null;
    this.shotCount = 0;
    this.lastShotTime = 0;
    const w = this.getCurrentWeapon();
    this.ammo = w.magSize;
  }

  takeDamage(amount, isHeadshot) {
    if (!this.alive) return 0;
    let dmg = amount;
    if (!isHeadshot && this.armor > 0) {
      const absorb = Math.min(this.armor, Math.floor(dmg * 0.55));
      this.armor -= absorb;
      dmg -= absorb;
    }
    this.health -= dmg;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      this.state = 'dead';
    }
    return dmg;
  }

  // Very simple AI — good enough for MVP, can be expanded massively
  think(dt, now, player, colliders, map) {
    if (!this.alive) return;

    const w = this.getCurrentWeapon();
    const distToPlayer = this.position.distanceTo(player.position);
    const canSeePlayer = this.canSeePlayer(player, colliders);

    if (canSeePlayer) {
      this.lastSeenPlayer = now;
      this.state = 'engage';
    } else if (now - this.lastSeenPlayer > 3.5) {
      this.state = 'patrol';
    }

    // T bots try to plant when time is low (read from global state)
    const g = (typeof window !== 'undefined' && window.CSGame && window.CSGame.GAME);
    const gs = g && g.state;
    if (gs && gs.phase === 'live' && !gs.bomb && this.side === 't' && gs.roundTimeLeft < 58 && Math.random() < 0.018) {
      const sites = g.sites || {};
      for (let k in sites) {
        const site = sites[k];
        if (this.position.distanceTo(site.center) < 8.5) {
          this.state = 'plant';
          this.targetPos = site.center.clone();
          break;
        }
      }
    }

    // Movement target
    if (this.state === 'patrol' || !this.targetPos) {
      if (!this.targetPos || this.position.distanceTo(this.targetPos) < 1.8) {
        // pick new patrol point near a site or mid
        const options = BOT_SPAWN_POINTS.concat([
          new THREE.Vector3(0, 1.6, -2),
          new THREE.Vector3(-11, 1.6, 1),
          new THREE.Vector3(11, 1.6, -6),
        ]);
        this.targetPos = options[Math.floor(Math.random() * options.length)].clone();
        this.targetPos.x += (Math.random() - 0.5) * 5;
        this.targetPos.z += (Math.random() - 0.5) * 5;
      }
    } else if (this.state === 'engage') {
      // Strafe + close distance a bit
      const toPlayer = player.position.clone().sub(this.position).normalize();
      const strafe = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).multiplyScalar((Math.random() - 0.5) * 3.5);
      this.targetPos = player.position.clone().add(strafe).add(toPlayer.clone().multiplyScalar(-2.5));
    }

    // Move toward target
    if (this.targetPos) {
      const dir = this.targetPos.clone().sub(this.position);
      dir.y = 0;
      const d = dir.length();
      if (d > 0.3) {
        dir.normalize();
        const speed = this.moveSpeed * (this.state === 'engage' ? 0.95 : 0.72);
        this.velocity.x = dir.x * speed;
        this.velocity.z = dir.z * speed;
        // face movement + slight look at player
        const desiredYaw = Math.atan2(dir.x, dir.z);
        this.yaw = this.lerpAngle(this.yaw, desiredYaw, 0.08);
      } else {
        this.velocity.x *= 0.6;
        this.velocity.z *= 0.6;
      }
    }

    // Look at player when engaging (or last known)
    if (this.state === 'engage' && canSeePlayer) {
      const toP = player.position.clone().sub(this.position);
      const desiredYaw = Math.atan2(toP.x, toP.z);
      const desiredPitch = -Math.atan2(toP.y - 0.6, toP.length());
      this.yaw = this.lerpAngle(this.yaw, desiredYaw, 0.18);
      this.pitch = this.lerp(this.pitch, desiredPitch * 0.7, 0.12);
    }

    // Shooting
    const fireRate = w.fireRate * (1.0 - (this.difficulty - 0.4) * 0.35);
    if (canSeePlayer && distToPlayer < 28 && now - this.lastShotTime > fireRate) {
      // Small reaction delay on lower difficulty
      if (now - this.lastSeenPlayer > this.reaction) {
        this.lastShotTime = now;
        this.shotCount++;
        this.ammo = Math.max(0, this.ammo - 1);
        if (this.ammo <= 0) {
          this.ammo = w.magSize; // free reload for bots
          this.shotCount = 0;
        }
        // Return shot data for game to process
        return {
          bot: this,
          weapon: w,
          damage: w.damage * (0.82 + this.difficulty * 0.28),
          headMul: w.headMul,
          accuracy: 0.6 + this.difficulty * 0.35
        };
      }
    }

    // Simple gravity
    this.velocity.y -= 28 * dt;
    this.position.add(this.velocity.clone().multiplyScalar(dt));

    // Floor
    if (this.position.y < 1.6) {
      this.position.y = 1.6;
      this.velocity.y = 0;
    }

    // Light collision with world
    this.resolveCollisions(colliders);
  }

  canSeePlayer(player, colliders) {
    const toPlayer = player.position.clone().sub(this.position);
    const dist = toPlayer.length();
    if (dist > 32) return false;

    const dir = toPlayer.clone().normalize();
    const yawTo = Math.atan2(dir.x, dir.z);
    let yawDiff = Math.abs(this.yaw - yawTo);
    while (yawDiff > Math.PI) yawDiff = Math.abs(yawDiff - Math.PI * 2);
    if (yawDiff > 1.35) return false; // ~77 deg fov each side

    // Ray vs colliders (very cheap)
    const rayStart = this.position.clone().add(new THREE.Vector3(0, 0.6, 0));
    for (let c of colliders) {
      if (this.rayHitsBox(rayStart, dir, dist - 0.6, c)) {
        return false;
      }
    }
    return true;
  }

  rayHitsBox(origin, dir, maxDist, box) {
    // box = {min: Vector3, max: Vector3}
    const invDir = new THREE.Vector3(1 / dir.x || 1e6, 1 / dir.y || 1e6, 1 / dir.z || 1e6);
    let t1 = (box.min.x - origin.x) * invDir.x;
    let t2 = (box.max.x - origin.x) * invDir.x;
    let t3 = (box.min.y - origin.y) * invDir.y;
    let t4 = (box.max.y - origin.y) * invDir.y;
    let t5 = (box.min.z - origin.z) * invDir.z;
    let t6 = (box.max.z - origin.z) * invDir.z;

    let tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
    let tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
    return tmax >= Math.max(tmin, 0) && tmin < maxDist;
  }

  resolveCollisions(colliders) {
    const r = 0.45;
    for (let box of colliders) {
      const closestX = Math.max(box.min.x, Math.min(this.position.x, box.max.x));
      const closestY = Math.max(box.min.y, Math.min(this.position.y, box.max.y));
      const closestZ = Math.max(box.min.z, Math.min(this.position.z, box.max.z));

      const dx = this.position.x - closestX;
      const dy = this.position.y - closestY;
      const dz = this.position.z - closestZ;
      const distSq = dx * dx + dy * dy + dz * dz;
      const rSum = r + 0.1;

      if (distSq > 0 && distSq < rSum * rSum) {
        const dist = Math.sqrt(distSq);
        const push = (rSum - dist) / dist;
        this.position.x += dx * push * 0.9;
        this.position.z += dz * push * 0.9;
        // bounce a little
        this.velocity.x -= dx * 1.4;
        this.velocity.z -= dz * 1.4;
      }
    }
  }

  lerp(a, b, t) { return a + (b - a) * t; }
  lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
  }
}

window.CSEntities = { Player, Bot, PLAYER_START, BOT_SPAWN_POINTS };
