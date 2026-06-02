# CS: Better — Game Design Document

**Tagline:** Counter-Strike, but smoother, fairer, and more satisfying. Pure gunplay focus with modern polish.

**Core Fantasy:** High-stakes tactical first-person shooter. One life per round. Precision, positioning, and gun mechanics matter more than reaction time.

## 1. High-Level Vision

- **Faithful to CS DNA**:
  - Round-based (1:55–2:00 rounds)
  - Economy & buy phase
  - Bomb defusal (T plant, CT defuse)
  - One life per round (no respawn mid-round)
  - Weapon variety with distinct roles

- **"Better" Differentiators** (the secret sauce):
  - **Zero-RNG gunplay**: Recoil is deterministic patterns. Spray control is pure skill (no random spread on full auto beyond designed cone that shrinks with control).
  - **Movement mastery**: Momentum-based, crouch-jump, air-accel, optional bunnyhop chaining for speed (reward skilled movement without breaking hitreg).
  - **Perfect netcode feel locally**: Since offline, 0 latency. Hits always register exactly where crosshair is.
  - **Procedural audio**: Every gunshot, reload, footstep is synthesized live — crisp, punchy, unique per weapon. No two shots sound identical.
  - **Clarity & Accessibility**: Beautiful readable UI, customizable crosshair editor (CS 1.6 style), optional recoil pattern overlay for learning (off in "serious" mode).
  - **Smart adaptive bots**: Bots have personalities (rusher, anchor, lurker). They use basic utility later, prefire common angles, rotate on info.
  - **Wallbangs & destruction lite**: Certain walls/boxes are penetrable. Wood/ drywall weak, concrete strong. Some props break.
  - **Modern QOL**: Fast buy binds (keys 1-5 + mouse), hold-to-sprint or shift-walk, quick grenade (mouse4/5 or G), inspect weapon, kill cam replay simple.

## 2. Game Modes (MVP → Post)

**MVP Priority:**
1. **Classic Bomb Defusal (Offline Bots)** — 5v5 (player + 4 bots vs 5 enemy bots). Player can choose side or random. One map: "Dust II Mini".
2. **Deathmatch** — Unlimited respawns, 10 min, practice aim / sprays. Weapon spawns or buy any time.

**Later:**
- Retake / Execute scenarios
- Hostage rescue (lite)
- Wingman 2v2
- Custom: choose bot count, difficulty, time, starting money

## 3. Core Mechanics

### Movement
- WASD: forward/strafe/back
- Space: Jump (crouch-jump possible)
- Ctrl / C: Crouch (hold)
- Shift: Walk (slow, silent, accurate)
- Mouse wheel or 1-5: Weapon select
- R: Reload
- B (or Tab in buy phase): Buy menu
- Mouse1: Fire
- Mouse2: Aim down sights (scoped weapons zoom + reduce spread)
- E: Use / plant / defuse (hold on bomb)
- G: Drop current weapon (for later pickup)

**Physics feel:**
- Ground friction + acceleration
- Air control (less than ground)
- Jump height allows box jumps on key spots
- Max speed ~250-300 units (tunable). Bhop gives temporary speed boost up to ~320 if chained well.

### Combat & Weapons

**Weapon Classes (MVP 4-6 weapons):**
- **Pistols**: Glock-18 (T), USP-S / P2000 (CT) — cheap, accurate, good first round.
- **SMG**: MP9 / MAC-10 — run-and-gun, cheap.
- **Rifles**: AK-47 (T, high damage, big recoil), M4A1-S (CT, suppressed, accurate).
- **Sniper**: AWP — one-shot body (almost), expensive, slow.
- **Grenades** (phase 2): HE (damage), Flash, Smoke (line of sight block).

**Gunplay Rules (the "better" part):**
- Every weapon has a **fixed recoil table** (array of {pitch, yaw} deltas per shot in burst).
- First shot accurate. Subsequent shots kick in patterned way.
- Holding mouse1 plays the pattern. Releasing resets (or recovers over time).
- Crouch + stop = tighter pattern.
- Moving = increased spread + pattern kick multiplier.
- Recoil recovery: after stopping fire, crosshair returns to center over ~0.4-0.8s depending on gun.
- Headshots: 4x damage or instant kill on rifles/AWP (armor ignored on HS for rifles).
- Armor: reduces damage to body (not head for balance).
- Penetration: bullets lose damage over distance + material.

**Ammo:**
- Reserve + magazine. Reload time per weapon (AK ~2.0s, pistol fast).
- Tactical reload (partial mag) vs full.

### Economy (Classic)
Start round money:
- Loss bonus streak (CT or T side)
- Plant bonus, defuse bonus, kill rewards.
Typical: $800 start after loss, up to $3400+ win streak.

Buy menu categories:
Pistols | SMGs | Rifles | Gear (kevlar, helmet) | Grenades

### The Bomb
- T side plants at A or B site (2 designated zones).
- Plant time: 3.5s (hold E).
- Defuse: 7s or 5s with kit.
- Bomb timer: 40s after plant.
- If time expires or all T dead before plant → CT win.
- Bomb explodes → T win.
- Defused → CT win.

## 4. Map: "Dust II Mini" (MVP)

Layout (top down mental model):
- T spawn → long mid hallway → split to A (long A with box) and B (close B with ramp).
- Two bomb sites (A rectangular, B more square).
- Key cover: mid boxes, A plat, B car, doors.
- Long sightlines for AWP.
- Penetrable mid wall in one spot (famous dust2 wallbang).

Implemented with:
- Floor plane + walls as BoxGeometry + MeshLambert or Phong.
- Ramps as rotated boxes or wedges (use multiple boxes or Cylinder for curves lite).
- Props: stack of boxes (breakable for cover), barrels, walls with different materials.

Simple nav: hardcoded waypoints or use ray + random for bots to navigate between cover points.

## 5. Bots (AI)

Three tiers (selectable difficulty: Easy / Medium / Hard):

**Behaviors:**
- **Patrol / Hold**: Anchor sites or rotate mid.
- **Engage**: When player or sound heard, push or peek.
- **Utility lite** (future): pop flash before entry.
- **Defuse / Plant**: When bomb down and clear, one bot will path to it and defuse/guard.

**Sensing:**
- Vision cone + distance.
- "Sound" : shots and footsteps reveal position briefly (red dot on radar for player too).
- Prefire: occasionally wide peek common player spots.

**Shooting:**
- Same recoil rules as player (fair).
- Aim at chest, occasional head flicks on hard.
- Inaccuracy when moving.

Kill attribution, death animations (fall over, simple).

## 6. UI / HUD (Pixel Perfect CS Feel)

- **Crosshair**: 4 lines + gap + outline + center dot. Color picker + alpha. Size, thickness. Saved to localStorage. "Style" presets (classic, small, dot only).
- **Health + Armor bars**: Green / blue classic. Helmet icon if helmet.
- **Ammo**: Current / Reserve. Low ammo warning red.
- **Money**: Big yellow $ top right, like CS.
- **Round info**: Round number + "T / CT" win counts. Timer (mm:ss).
- **Radar**: Top-left square, rotatable? Simple top-down dots (green friendly, red enemy, bomb icon when planted). Shows only in range or always lite version.
- **Kill feed**: Right side, 4-5 lines, headshot icon (X), weapon icon (text or small sprite).
- **Buy menu**: Full screen or side panel on B during buy time (15-20s). Grid or list. Click or number keys. Shows price, own money. "Buy" button or auto on select if enough.
- **Win banner**: "TERRORISTS WIN" or "COUNTER-TERRORISTS WIN" with reason + nice slow fade + sound.
- **Death notice**: "You killed X with AK-47" or "X killed you".
- **Pause menu**: Esc — resume, settings, change map (future), quit.

**Settings (localStorage):**
- Mouse sens (0.1-5.0)
- Invert Y?
- Crosshair full editor
- Volume master (for procedural)
- Show recoil pattern helper (toggle)
- Bot difficulty

## 7. Audio Design (Procedural — Unique Strength)

All sounds generated with AudioContext (Oscillator + Noise + filters + envelopes).

Weapons:
- AK: Low thump + mid crack + tail
- M4: Sharper, suppressed version softer
- AWP: Big bass boom + high ring
- Pistol: Snappy high

Variations: slight pitch random per shot, different for suppressed.

Other:
- Footsteps: low thuds with varying interval based on speed/surface (hard floor).
- Jump land: heavier.
- Hit: fleshy "thwack" + armor "plink".
- Headshot: higher ping + kill confirm "ding".
- Bomb plant: electronic beep sequence.
- 10 second warning: classic CS "hurry" voice? (or tone).
- Buy confirm "cha-ching", error "denied" buzz.

Advantage: tiny file size, infinite variety, easy to tweak per weapon.

## 8. Technical Architecture (High Level)

- **Engine**: Three.js (vendored r134 for reliable static hosting). Custom FPS controller (no external controls lib).
- **Web3 / MT Integration**: Vanilla Solana wallet connect (Phantom, Solflare, Backpack via injected providers + vendored @solana/web3.js). No backend. Rockets earned on kills/plants/defuses/rounds. Claim = signMessage proof submitted to MemeTorrent P2E (by memetorrent & futuret3ch). Stats persisted in localStorage per pubkey. $MT: ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump.
- **Rendering**: WebGL, Lambert/Phong materials + Point/Spot lights for muzzle. Basic post (optional brightness/contrast via shader later).
- **Physics/Collision**: Custom. Player: capsule approx (sphere sweep or 3 ray + box). World static boxes list. Simple SAT or distance checks for movement resolution. Bullets: raycast + step penetration.
- **Game State**: Pure JS single object `gameState` { round, phase: 'buy'|'live'|'end', money, players[], bomb: {planted, timer, site}, ... }
- **Loop**: requestAnimationFrame → input → simulate movement/AI → physics → render → update HUD.
- **Input**: PointerLock API on canvas click. Keyboard state map. Mouse delta accumulated.
- **Persistence**: localStorage for settings + lifetime stats (kills, wins, accuracy?).
- **Assets**: Zero external files at MVP. All geometry procedural, textures = Canvas generated or solid + vertex colors. Later optional PNGs in assets/.

**File Layout (target):**
```
cs-better/
├── index.html
├── style.css
├── js/
│   ├── main.js       # entry, three setup, loop
│   ├── controls.js   # fps controller + input
│   ├── weapons.js    # Weapon defs + recoil tables + firing logic
│   ├── entities.js   # Player, Bot classes
│   ├── map.js        # level builder
│   ├── game.js       # round manager, economy, win conditions
│   ├── ui.js         # hud, menus, crosshair
│   └── audio.js      # WebAudio synth
├── assets/
│   └── (generated icons or future)
├── README.md
└── GAME_DESIGN.md
```

## 9. Scope & Milestones (for this session)

**MVP (playable today):**
- [ ] One map (Dust Mini)
- [ ] Player FPS controls + shooting
- [ ] 2-3 weapons (Glock, AK, AWP)
- [ ] 4-6 enemy bots that move + shoot back
- [ ] Basic buy (start with pistol, can buy rifle mid round for test)
- [ ] Health / death / respawn per round
- [ ] 60s rounds, plant/defuse stub (even if simple)
- [ ] Full HUD + crosshair + killfeed
- [ ] Procedural gunshot + hit sounds
- [ ] Win/lose per round + next round reset

**Polish pass:**
- Recoil patterns feel great
- Bots decently challenging
- Nice particles (muzzle, impact puffs, blood lite)
- Buy menu functional
- Bomb fully working
- Radar

**Stretch:**
- More weapons + nades
- 2 maps switchable
- Bot teammates
- Settings panel + crosshair customizer live
- Stats tracking

## 10. Risks & Mitigations

- Collision feels bad → tune with debug rays visible (dev mode).
- Bots too dumb or too good → difficulty scalars + simple state machine.
- Performance on low-end → limit bots to 6-8 total, low poly count (use few lights, no shadows initially).
- "Not CS enough" → copy timings, damage numbers, money values exactly from CS:GO where known.

## 11. Success Criteria

- User can load, lock mouse, run around map, gun down 3+ bots in a round.
- Spray an AK clip into a wall and see the exact same 30-bullet pattern every time.
- Plant bomb, defend 20s, win round → dopamine.
- Feels snappy <16ms input to shot (local = true).

Let's build it.
