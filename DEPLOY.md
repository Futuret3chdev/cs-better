# Deploy CS: Better to GitHub + Vercel

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

## Step 4: Deploy to Vercel (Recommended)

### Option A: One-Click (Easiest)

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

### Option B: Import Manually on Vercel

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your `cs-better` repo
4. Vercel auto-detects it's static (thanks to `vercel.json`)
5. Click **Deploy**

Vercel will give you a URL like:
`https://cs-better-abc123.vercel.app`

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

## Updating the Game Later

1. Make changes locally
2. `git add .`
3. `git commit -m "your message"`
4. `git push`
5. Vercel **automatically redeploys** within seconds (check the Vercel dashboard for build logs)

---

## Alternative: Deploy with Vercel CLI (no GitHub required)

```powershell
# Install Vercel CLI (once)
npm i -g vercel

# Login
vercel login

# Deploy from the project folder
cd E:\cs-better
vercel

# Follow the prompts. Choose "Yes" to link to a project.
```

For production deploys:

```powershell
vercel --prod
```

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

---

## Custom Domain (Optional)

On Vercel dashboard:
- Project → Settings → Domains
- Add your domain and follow the DNS instructions

---

**Enjoy!** Your CS: Better + MemeTorrent P2E integration is now live on the internet.

Questions? Check the original repo or reach out to the creators (memetorrent & futuret3ch).

GLHF — headshots only. 🚀
