# CS: Better

**Counter-Strike but better.** A fully client-side tactical FPS that runs in any modern browser.

Deterministic recoil you can actually learn, procedural audio, full round-based bomb defusal, smart bots that plant the bomb, and a polished CS-style HUD — all in ~1MB total with zero dependencies.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fcs-better)

> **See full deployment instructions:** [DEPLOY.md](./DEPLOY.md)

After deploying, update the Vercel button link + demo URL in this README with your real Vercel URL.

![Game Preview](assets/preview.jpg)

## Play Instantly

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/cs-better.git   # ← replace YOUR_USERNAME with your GitHub username
cd cs-better

# 2. Run locally (any of these)
python -m http.server 8080
# or
npx serve
# or just open index.html (limited features)
```

Then open **http://localhost:8080** in **Chrome** (best Pointer Lock + Audio support).

## Controls

| Action            | Input                        |
|-------------------|------------------------------|
| Move              | WASD                         |
| Jump              | Space                        |
| Crouch            | Ctrl / C (hold)              |
| Walk (silent)     | Shift (hold)                 |
| Shoot             | Left Mouse                   |
| Scope / ADS       | Right Mouse                  |
| Reload            | R                            |
| Switch weapons    | 1–5 or Mouse Wheel           |
| Buy menu          | B (buy phase only)           |
| Plant / Defuse    | E (hold near site/bomb)      |
| Menu / Pause      | Esc                          |
| Lock mouse        | Click the game               |

**Pro tip:** Learn the AK spray pattern on a wall — it's 100% the same every time.

## Features

- True 3D first-person with full momentum-based movement + bunnyhop potential
- **Deterministic recoil** — every weapon has a fixed, learnable pattern (the #1 "better than CS" feature)
- 3 distinct weapons: Glock-18, AK-47, AWP
- 5 enemy bots with vision, pathing, and objective play (they will plant)
- Classic bomb defusal (A/B sites, plant, 40s timer, defuse)
- Full economy + buy phase
- Beautiful CS-style HUD: radar, killfeed, money, health/armor, round timer
- Fully procedural audio (Web Audio) — no sound files
- Customizable crosshair + sensitivity saved in localStorage
- Works offline after first load (once vendored)

## MemeTorrent P2E & Wallet Integration

**Wallet connect enabled** for Phantom, Solflare, and Backpack (Solana).

- Earn **🚀 Rockets** through kills (15 base, +10 headshot), bomb plants (+120), defuses (+180), and round performance bonuses.
- Click the top wallet pill or the "CONNECT WALLET" button in the main menu.
- With a wallet connected, use the **CLAIM** button to sign a message proving your score and submit it to the MemeTorrent P2E Arcade.
- Rockets contribute to the MT ecosystem (rewards, airdrops, leaderboards, engagement).
- **Created by memetorrent and futuret3ch** for the MemeTorrent ($MT) ecosystem.

$MT CA: `ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump`

Your signed claims are verifiable proof of on-chain participation.

## Deploy to Vercel + GitHub (Recommended)

**Full step-by-step instructions (including GitHub repo creation):**  
→ See [DEPLOY.md](./DEPLOY.md)

Quick version:
1. Push this folder to a new GitHub repo.
2. Click the **Deploy with Vercel** button (or import on vercel.com).
3. Update the links in this README after your first deploy.

Vercel gives you free HTTPS (required for wallet connect + mouse aim). Auto-deploys on every `git push`.

## Project Structure

```
cs-better/
├── index.html          # Main game + HUD
├── style.css           # Tactical dark UI
├── manifest.json       # PWA manifest (fullscreen, landscape)
├── vercel.json         # Vercel config + caching + headers
├── LICENSE
├── .gitignore
├── README.md
├── GAME_DESIGN.md      # Full design doc & future roadmap
├── assets/
│   └── preview.jpg     # Social / README image
└── js/
    ├── three.min.js    # Vendored Three.js r134 (~600KB)
    ├── audio.js        # Procedural gunshot, footstep, UI synth
    ├── weapons.js      # Weapon data + fixed recoil tables
    ├── entities.js     # Player + Bot AI
    ├── map.js          # Dust II Mini level
    ├── ui.js           # HUD, radar, buy menu, settings
    ├── game.js         # Core loop, shooting, rounds, bomb
    └── main.js         # Bootstrap + input
```

## Development

- Everything is vanilla JS + Three.js. No bundler required.
- Open DevTools → Console. `window.game` gives you the full game state for debugging.
- Press `9` in-game → free money + AK (dev cheat).
- Edit recoil patterns live in `js/weapons.js` → refresh.

## Tech

- Three.js (vendored)
- Web Audio API (procedural everything)
- Pointer Lock API
- Pure static — works on any host that serves files over HTTPS

## Roadmap (see GAME_DESIGN.md)

- Grenades (HE, Flash, Smoke)
- More weapons + better buy menu
- Second map
- Improved bot personalities + utility usage
- Wallbangs with visual feedback
- Full crosshair editor in-game
- Local stats & progression

## Credits

Built as a fun ambitious weekend project. Deterministic gunplay and zero-dependency philosophy are the soul of this game.

**MemeTorrent P2E integration created by memetorrent & futuret3ch.**

**GLHF. Headshots only.**

---

Made to be forked, deployed, and extended. Have fun!
