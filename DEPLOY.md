# Deploy CS: Better to GitHub + Vercel

**Your current Vercel project:** https://vercel.com/futuret3chs-projects/cs-better

**GitHub repo:** https://github.com/Futuret3chdev/cs-better (from local git remote)

This project is a **pure static site** (no build step, no server code). It deploys instantly to Vercel, Netlify, or GitHub Pages.

All assets are vendored locally (Three.js + Solana web3.js), so it works reliably everywhere.

**Important for full features:**
- The game uses **Pointer Lock** (mouse aim), **Web Audio**, and **Wallet signing** (for MemeTorrent Rockets).
- These require **HTTPS** + a modern browser (Chrome recommended).
- Vercel provides free HTTPS automatically.
- Users need Phantom / Solflare / Backpack browser extensions for the wallet features.

---

## Prerequisites

- [Git](https://git-scm.com/downloads) installed
- GitHub account (free)
- Vercel account (free) — sign up at [vercel.com](https://vercel.com) with GitHub

---

## Step 1: Prepare Locally (PowerShell on Windows)

```powershell
# Go to the project
cd E:\cs-better

# Initialize git (if not already done)
git init

# Add everything
git add .

# First commit
git commit -m "Initial commit: CS: Better - tactical FPS with MemeTorrent P2E (memetorrent & futuret3ch)"

# Rename default branch to main (recommended)
git branch -M main
```

---

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `cs-better` (or anything you like)
3. Description: `Counter-Strike but better — browser FPS with deterministic recoil + MemeTorrent P2E (rockets, wallet connect)`
4. **Public** (recommended so others can deploy easily)
5. **Do NOT** initialize with README, .gitignore, or license (we already have them)
6. Click **Create repository**

You will get a URL like:
`https://github.com/YOUR_USERNAME/cs-better.git`

---

## Step 3: Push to GitHub

Back in PowerShell:

```powershell
cd E:\cs-better

# Add your GitHub repo as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/cs-better.git

# Push
git push -u origin main
```

If you get an auth error, use GitHub CLI (`gh auth login`) or Personal Access Token.

---

## Step 4: Connect Git and Deploy on Your Vercel Project (https://vercel.com/futuret3chs-projects/cs-better)

**Critical:** The dashboard says "framework is set to vite". This is why things are missing/broken on the live site — Vite is trying to build it (looking for vite.config, running build to dist/, etc.), but this is a pure static site with no package.json or Vite setup. The vercel.json is set to override it, but the project-level setting in UI overrides detection.

Since you already have the project created, do this in the dashboard:

1. Open https://vercel.com/futuret3chs-projects/cs-better
2. In the sidebar, click **Settings** (or look for "Connect Git Repository" on Overview).
3. Under **Git**, click **Connect Git Repository** (or "Connect" button) if not already linked.
4. Select **GitHub**, authorize if needed.
5. Search and select the repo: **Futuret3chdev / cs-better**
6. Choose branch: **main**
7. **IMPORTANT - Fix the Vite framework detection:**
   - Go to **Settings > General**
   - Find **Framework Preset**
   - Change from "Vite" to **None** (or "Other")
   - Root Directory: leave as `.` or blank
   - Build Command: leave blank/empty (vercel.json controls it)
   - Output Directory: `.` 
   - Install Command: blank
   - Save
8. (Optional but recommended) Go to **Settings > Environment Variables** and make sure none are conflicting.
9. Go to **Deployments** tab.
10. Find the latest commit from your git push.
11. Click the three dots > **Redeploy** > Production.

This forces Vercel to treat it as static (respecting your vercel.json with "framework": null), pulls all the code including UI polish, wallet features, etc.

Future `git push origin main` will auto-deploy correctly.

Your prod URL: https://cs-better.vercel.app/ (or check Domains in dashboard).

### Option A: One-Click (Easiest - for new projects)

1. Go to your new GitHub repo
2. Edit `README.md`
3. Replace the Vercel button URL with your actual repo:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Fcs-better)
```

4. Commit & push the change.
5. Click the **Deploy with Vercel** button in the README (or visit the link directly).
6. Vercel will import the repo automatically.
7. Click **Deploy**. Done in ~30 seconds.

### Option B: Connect to Existing Vercel Project (your current dashboard)

Since you have https://vercel.com/futuret3chs-projects/cs-better :

1. Open the link: https://vercel.com/futuret3chs-projects/cs-better
2. In the left sidebar, click **Settings** (or directly go to the Git section).
3. Look for **"Connect Git Repository"** or **Git** tab.
4. Connect your GitHub account if not already.
5. Select the repository: **Futuret3chdev/cs-better** (or the exact name of your GitHub repo).
6. Once connected:
   - Set **Framework Preset** to **None** (or "Other").
   - **Root Directory**: leave as `.` or blank (the vercel.json at root will handle it).
   - Build Command, Output Directory, Install Command: leave empty (vercel.json overrides with `framework: null`, `outputDirectory: "."`, `buildCommand: null`).
7. Save.
8. Go back to **Deployments** tab.
9. Find the latest commit from Git (the one with the UI polish or "Full deploy prep").
10. Click **Redeploy** (Production).

This will make future `git push` to main automatically deploy the full polished version with all features (wallet, rockets, clean UI, etc.).

Your production domain is likely https://cs-better.vercel.app (or check Domains in dashboard).

If the current production deployment is from a manual upload or old commit, the Redeploy step above will fix the "missing a lot of things".

---

## Step 5: Post-Deploy Tasks

### Update README with your live URL

Edit `README.md` and replace the demo link:

```markdown
> **Live Demo:** https://your-project.vercel.app
```

Also update the clone example and Vercel button if you haven't already.

Commit and push:

```powershell
git add README.md
git commit -m "docs: add live Vercel demo link"
git push
```

### Test the game

- Open your Vercel URL in **Chrome**
- Click **START MATCH**
- Click the game area to lock mouse
- Test wallet: Click the top **🚀** Rockets pill or the **CONNECT WALLET** button
- Play a round → earn Rockets
- Click **CLAIM** → approve in your wallet (Phantom/Solflare/Backpack)
- You should see the "Rockets claimed" toast

**Note:** The wallet features only work over HTTPS (Vercel provides this). They will not work on `http://localhost` or GitHub Pages without HTTPS.

---

## Important Notes Specific to This Game

- **HTTPS is required for:**
  - Mouse pointer lock (aiming)
  - Web Audio (gunshots, etc.)
  - Wallet signing (claiming Rockets)
- Vercel gives you HTTPS automatically (GitHub Pages is possible but less ideal for the wallet features).
- Wallet integration (Phantom / Solflare / Backpack) only works when the site is served over HTTPS.
- The MemeTorrent P2E features (Rockets, wallet connect, claim) are fully client-side and work immediately after deploy.

---

## Complete Git Commands Sequence (Run These to Deploy Properly)

Copy and run these commands one by one in PowerShell from your E:\cs-better folder. This ensures all UI polish, MT integration, map improvements, docs, and notes are included.

```powershell
# 1. Navigate to the project
cd E:\cs-better

# 2. Make sure you have the absolute latest from GitHub (including any previous pushes)
git fetch origin
git pull origin main

# 3. Check current state (should be clean or show only your local edits)
git status

# 4. Stage ALL changes (this catches any uncommitted polish, new files, etc.)
git add -A

# 5. Commit with a comprehensive message covering everything (UI, wallet, rockets, docs, etc.)
git commit -m "Full deploy prep: UI polish (clean menu + grouped top-right MT pill), visual map improvements (Phong + lights), wallet integration (Phantom/Solflare/Backpack + Rockets), Important Notes section, DEPLOY.md updates, and trigger for Vercel"

# If the commit says "nothing to commit", that's fine — everything is already committed. Skip to push.

# 6. Push to GitHub (this will trigger Vercel auto-deploy if connected)
git push origin main

# 7. Verify the push
git status
git log --oneline -5
```

After the push succeeds:

- Go to https://github.com/Futuret3chdev/cs-better (or your fork) and confirm the latest commit is there.

- Vercel should start building automatically. Watch the deployment at vercel.com.

If Vercel does not auto-deploy or the live site is still old:

- Log into Vercel dashboard
- Select the cs-better project
- Go to **Deployments**
- Find the commit you just pushed
- Click the three dots → **Redeploy** (to Production)

This will force a fresh build with ALL the missing pieces (polished HUD, clean menu, working MT wallet/rockets UI, better 3D visuals, proper docs, etc.).

---

## Updating the Game Later

1. Make changes locally
2. `git add .`
3. `git commit -m "your message"`
4. `git push`
5. Vercel **automatically redeploys** within seconds (check the Vercel dashboard for build logs)

---

## Alternative: Deploy with Vercel CLI (bypasses some Git/UI settings, useful to force static)

If the dashboard still shows Vite even after setting to None, use CLI to deploy directly (it respects vercel.json strictly).

```powershell
# 1. Install Vercel CLI if not already (run in PowerShell)
npm i -g vercel

# 2. Login (opens browser, or use token if you have one: vercel login --token YOUR_TOKEN)
vercel login

# 3. From project dir, link to your Vercel project (interactive: select team "futuret3chs-projects", project "cs-better")
cd E:\cs-better
npx vercel link

# 4. Deploy to production (this will use your vercel.json with framework: null, ignoring any Vite detection in UI)
npx vercel --prod
```

This deploys the current local files as static, pulling all the code. After successful, the dashboard will reflect the new deployment.

You can also run `npx vercel` for preview URL first.

Note: After CLI deploy, you can still connect Git for future auto-deploys.

---

## GitHub Pages Alternative (Free, no Vercel account)

1. Push to GitHub (as above)
2. Go to your repo → **Settings** → **Pages**
3. Source: **GitHub Actions** (or "Deploy from a branch" → main / (root))
4. Save

Your site will be at:
`https://YOUR_USERNAME.github.io/cs-better`

**Limitation:** GitHub Pages does **not** provide automatic HTTPS for custom subdomains in all cases, and some browser features (wallet signing) may be stricter. Vercel is strongly recommended for this game.

---

## Troubleshooting

- **Wallet connect fails**: Make sure you are on HTTPS and have the wallet extension installed + unlocked.
- **Mouse doesn't lock**: Click the game area first. Some browsers block on http://.
- **Rockets not saving**: They are stored per-wallet in browser localStorage. Different browser = different data.
- **Build fails on Vercel**: Check the deploy logs. This project has `vercel.json` with `buildCommand: null`, so it should just serve the files.
- **manifest.json 401 or favicon 404**: On Vercel preview deployments (the -hash- urls), if "Vercel Authentication" or "Deployment Protection" is enabled in project Settings, static assets like manifest.json may return 401 for unauthenticated viewers. Go to project Settings > General > Vercel Authentication and set to "None" (or disable protection for previews). The game runs fine without the manifest (it's for optional PWA install). Favicon is a data URL now.
- **Black screen / only radar visible, or JS errors like "CapsuleGeometry not constructor" or "async is not defined"**: These were fixed in recent commits (using CylinderGeometry instead, removing stray code). Make sure you redeploy the *latest* commit after `git push`. The errors prevented full init (no bots, no movement logic).
- **Can't move / nothing interactive / settings doesn't work**: After START MATCH, the game enters buy phase (you can move around spawn now). Click the canvas to lock mouse for look. WASD to move. Full shooting etc. after the phase goes live (timer at top). Settings button is in the main/paused menu (press Esc to pause and access). Make sure no JS errors in console blocking init. Sens/volume/crosshair update live in the settings modal.
- **game.js:1093 Uncaught ReferenceError: eHeld is not defined at gameLoop**: This was a scope bug — code in gameLoop referenced `eHeld` (used for plant/defuse hold-E) that was only `const` declared inside `updatePlayer()`. Fixed by inlining the key check (`eHeldCheck`) directly from `GAME.keys` inside gameLoop + adding safe near-site detection for prompt hiding. The plant block (around the bomb mesh line) and auto-hide logic now have zero dependency on undeclared eHeld. Also improved the prompt so "HOLD E TO PLANT" actually stays visible while near a site without holding E.
- **Pointer lock failed (user gesture required?): SecurityError: Pointer lock cannot be acquired immediately after the user has exited the lock. (at lockMouse)**: Browser security rule. Common after Esc (which auto-unlocks) + quickly resuming via menu, or setTimeout calls, or mousedown right after unlock. Hardened: 500ms cooldown guard (raised from 300), attempt throttle, early return if `document.pointerLockElement` already set, explicit `lastPointerUnlockTime` management in togglePause / resumeGame / pointerlockchange, and on success. In catch: common SecurityError / "exited the lock" cases are handled quietly (only show the "Click the game to lock mouse and play" center message; no console.warn spam). Always click the canvas area directly for lock attempts (user gesture). Resume button in pause menu is also a valid gesture.

---

## Custom Domain (Optional)

On Vercel dashboard:
- Project → Settings → Domains
- Add your domain and follow the DNS instructions

---

**Enjoy!** Your CS: Better + MemeTorrent P2E integration is now live on the internet.

Questions? Check the original repo or reach out to the creators (memetorrent & futuret3ch).

GLHF — headshots only. 🚀
