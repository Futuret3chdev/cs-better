// CS: Better — Weapons + Deterministic Recoil
// All recoil patterns are fixed arrays. Same every time = pure skill.

const WEAPONS = {
  glock: {
    key: 'glock',
    name: 'GLOCK-18',
    type: 'pistol',
    price: 200,
    damage: 28,
    headMul: 3.8,
    fireRate: 0.12,          // seconds between shots
    magSize: 20,
    reserve: 120,
    reloadTime: 1.55,
    spreadHip: 0.018,
    spreadMove: 0.032,
    spreadCrouch: 0.011,
    recoilRecovery: 0.55,
    penetration: 0.6,
    movePenalty: 1.35,
    scopeZoom: 1.0,
    // Recoil pattern: [pitchDelta (rad), yawDelta (rad)] per shot. Small for pistol.
    recoilPattern: [
      [0.004, 0.000], [0.005, 0.001], [0.006, -0.001], [0.004, 0.002],
      [0.007, -0.002], [0.005, 0.001], [0.006, 0.003], [0.004, -0.001]
    ]
  },

  ak47: {
    key: 'ak47',
    name: 'AK-47',
    type: 'rifle',
    price: 2700,
    damage: 36,
    headMul: 4.0,
    fireRate: 0.1,
    magSize: 30,
    reserve: 90,
    reloadTime: 2.05,
    spreadHip: 0.022,
    spreadMove: 0.048,
    spreadCrouch: 0.013,
    recoilRecovery: 0.72,
    penetration: 0.85,
    movePenalty: 1.7,
    scopeZoom: 1.0,
    // Famous AK spray — first 8-10 shots go up right then left pull
    recoilPattern: [
      [0.011, 0.000], [0.013, 0.002], [0.015, 0.004], [0.014, 0.003],
      [0.017, -0.001], [0.016, -0.004], [0.015, -0.007], [0.013, -0.005],
      [0.012, -0.002], [0.011, 0.003], [0.009, 0.005], [0.008, 0.002],
      [0.007, -0.001], [0.006, -0.003], [0.005, 0.000]
    ]
  },

  awp: {
    key: 'awp',
    name: 'AWP',
    type: 'sniper',
    price: 4750,
    damage: 115,
    headMul: 1.6,
    fireRate: 1.45,
    magSize: 5,
    reserve: 30,
    reloadTime: 3.4,
    spreadHip: 0.009,
    spreadMove: 0.055,
    spreadCrouch: 0.004,
    recoilRecovery: 0.95,
    penetration: 0.95,
    movePenalty: 2.8,
    scopeZoom: 2.6,
    recoilPattern: [
      [0.085, 0.000]
    ]
  },

  // Future: m4a1, mp9, etc. easy to add
};

function getWeapon(key) {
  return WEAPONS[key] || WEAPONS.glock;
}

function getAllWeapons() {
  return Object.values(WEAPONS);
}

// Calculate current spread (radians) based on state
function getCurrentSpread(weapon, { moving, crouching, scoped }) {
  let s = weapon.spreadHip;
  if (crouching) s = weapon.spreadCrouch;
  if (moving) s = Math.max(s, weapon.spreadMove);
  if (scoped && weapon.scopeZoom > 1.2) s *= 0.35;
  return s;
}

// Get the exact recoil delta for this shot index in the pattern (loops if longer)
function getRecoilDelta(weapon, shotIndex) {
  const p = weapon.recoilPattern;
  if (!p || p.length === 0) return [0, 0];
  const idx = shotIndex % p.length;
  return p[idx];
}

window.CSWeapons = { WEAPONS, getWeapon, getAllWeapons, getCurrentSpread, getRecoilDelta };
