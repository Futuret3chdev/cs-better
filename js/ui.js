// CS: Better — UI / HUD / Menus / Crosshair

let crosshairEl = null;
let crosshairDot = null;
let crosshairLines = [];

let killfeedEl = null;
let killfeedEntries = [];

let centerMsgEl = null;
let winBannerEl = null;
let damageOverlayEl = null;

let buyMenuEl = null;
let menuOverlayEl = null;

let settings = {
  sens: 1.8,
  volume: 0.85,
  showRecoilHelper: false,
  crosshair: {
    size: 18,
    gap: 5,
    thickness: 1.6,
    color: '#ffffff',
    alpha: 0.95,
    dot: true,
    outline: true
  }
};

function loadSettings() {
  try {
    const s = localStorage.getItem('csbetter_settings');
    if (s) Object.assign(settings, JSON.parse(s));
  } catch (e) {}
  if (window.CSAudio) window.CSAudio.setVolume(settings.volume);
}

function saveSettings() {
  localStorage.setItem('csbetter_settings', JSON.stringify(settings));
}

function updateCrosshair() {
  if (!crosshairEl) return;
  const c = settings.crosshair;
  crosshairEl.style.opacity = c.alpha;

  // Clear old lines
  crosshairLines.forEach(l => l.remove());
  crosshairLines = [];

  const size = c.size;
  const gap = c.gap;
  const thick = c.thickness;

  // Create 4 lines
  const dirs = [
    { w: thick, h: size, x: -thick/2, y: -gap - size }, // top
    { w: thick, h: size, x: -thick/2, y: gap },          // bottom
    { w: size, h: thick, x: -gap - size, y: -thick/2 },  // left
    { w: size, h: thick, x: gap, y: -thick/2 }           // right
  ];

  dirs.forEach(d => {
    const line = document.createElement('div');
    line.className = 'crosshair-line';
    line.style.width = d.w + 'px';
    line.style.height = d.h + 'px';
    line.style.left = (50 + (d.x / (size + gap) * 50)) + '%';
    line.style.top = (50 + (d.y / (size + gap) * 50)) + '%';
    line.style.background = c.color;
    if (c.outline) {
      line.style.boxShadow = '0 0 0 1px #111, 0 0 0 1.5px #000';
    }
    crosshairEl.appendChild(line);
    crosshairLines.push(line);
  });

  // Dot
  if (!crosshairDot) {
    crosshairDot = document.getElementById('crosshair-dot');
  }
  if (crosshairDot) {
    crosshairDot.style.display = c.dot ? 'block' : 'none';
    crosshairDot.style.background = c.color;
    crosshairDot.style.width = (thick + 1) + 'px';
    crosshairDot.style.height = (thick + 1) + 'px';
  }
}

function setCrosshairFromSettings() {
  updateCrosshair();
}

function flashDamage(amount) {
  if (!damageOverlayEl) damageOverlayEl = document.getElementById('damage-overlay');
  if (!damageOverlayEl) return;
  const a = Math.min(0.55, 0.18 + amount / 180);
  damageOverlayEl.style.transition = 'none';
  damageOverlayEl.style.opacity = a;
  // force reflow
  void damageOverlayEl.offsetWidth;
  damageOverlayEl.style.transition = 'opacity 160ms ease';
  damageOverlayEl.style.opacity = '0';
}

function addKillfeed(killer, victim, weaponName, isHS, isBotKill = false) {
  if (!killfeedEl) killfeedEl = document.getElementById('killfeed');
  if (!killfeedEl) return;

  const row = document.createElement('div');
  row.className = 'kill-row';
  row.innerHTML = `
    <span class="killer">${killer}</span>
    <span class="weapon">${weaponName}</span>
    ${isHS ? '<span class="hs">★</span>' : ''}
    <span class="victim">${victim}</span>
  `;
  killfeedEl.appendChild(row);
  killfeedEntries.push(row);

  // Limit
  while (killfeedEntries.length > 5) {
    const old = killfeedEntries.shift();
    if (old && old.parentNode) old.parentNode.removeChild(old);
  }

  // Auto remove after time
  setTimeout(() => {
    if (row.parentNode) row.parentNode.removeChild(row);
    killfeedEntries = killfeedEntries.filter(e => e !== row);
  }, 5200);
}

function updateHUD(state, player) {
  // Money
  const moneyEl = document.getElementById('money');
  if (moneyEl) moneyEl.textContent = '$' + Math.floor(player.money);

  // Health / Armor
  const hpBar = document.getElementById('health-bar');
  const hpText = document.getElementById('health-text');
  const apBar = document.getElementById('armor-bar');
  const apText = document.getElementById('armor-text');

  if (hpBar) hpBar.style.width = Math.max(0, player.health) + '%';
  if (hpText) hpText.textContent = Math.floor(player.health);
  if (apBar) apBar.style.width = Math.max(0, player.armor) + '%';
  if (apText) apText.textContent = Math.floor(player.armor);

  // Ammo
  const ammoEl = document.getElementById('ammo');
  const resEl = document.getElementById('ammo-reserve');
  const wepEl = document.getElementById('weapon-name');
  const w = player.getCurrentWeapon();

  if (ammoEl) ammoEl.textContent = player.ammo;
  if (resEl) resEl.textContent = '/ ' + player.reserve;
  if (wepEl) wepEl.textContent = (w ? w.name : 'GLOCK-18');

  // Scores + timer
  const ctEl = document.getElementById('score-ct');
  const tEl = document.getElementById('score-t');
  const timerEl = document.getElementById('round-timer');

  if (ctEl) ctEl.textContent = `CT ${state.ctScore || 0}`;
  if (tEl) tEl.textContent = `T ${state.tScore || 0}`;

  if (timerEl) {
    const t = Math.max(0, Math.floor(state.roundTimeLeft || 0));
    const m = Math.floor(t / 60);
    const s = (t % 60).toString().padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
    timerEl.style.color = t < 15 ? '#f59e0b' : '#fff';
  }
}

function showCenterMessage(text, sub = '', big = false) {
  if (!centerMsgEl) centerMsgEl = document.getElementById('center-message');
  if (!centerMsgEl) return;
  centerMsgEl.innerHTML = big ? `<div class="big">${text}</div>` : text;
  if (sub) centerMsgEl.innerHTML += `<div class="sub">${sub}</div>`;
  centerMsgEl.style.display = 'block';
}

function hideCenterMessage() {
  if (centerMsgEl) centerMsgEl.style.display = 'none';
}

function showWinBanner(winner, reason = '') {
  if (!winBannerEl) winBannerEl = document.getElementById('win-banner');
  if (!winBannerEl) return;
  winBannerEl.className = winner === 'ct' ? 'ct' : 't';
  winBannerEl.textContent = winner === 'ct' ? 'COUNTER-TERRORISTS WIN' : 'TERRORISTS WIN';
  if (reason) winBannerEl.textContent += ` — ${reason}`;
  winBannerEl.style.display = 'block';

  setTimeout(() => {
    if (winBannerEl) winBannerEl.style.display = 'none';
  }, 4200);
}

function showBuyMenu(show, playerMoney, onBuy) {
  if (!buyMenuEl) buyMenuEl = document.getElementById('buy-menu');
  if (!buyMenuEl) return;

  if (!show) {
    buyMenuEl.classList.remove('show');
    return;
  }

  buyMenuEl.classList.add('show');

  const moneyEl = document.getElementById('buy-money');
  if (moneyEl) moneyEl.textContent = '$' + playerMoney;

  // Build items
  const pistols = document.getElementById('buy-pistols');
  const rifles = document.getElementById('buy-rifles');
  const gear = document.getElementById('buy-gear');

  pistols.innerHTML = '';
  rifles.innerHTML = '';
  gear.innerHTML = '';

  const weapons = window.CSWeapons.getAllWeapons();

  weapons.forEach(w => {
    const el = document.createElement('div');
    el.className = 'buy-item';
    el.innerHTML = `<span class="name">${w.name}</span><span class="price">$${w.price}</span>`;

    if (playerMoney < w.price) el.classList.add('disabled');

    el.onclick = () => {
      if (playerMoney >= w.price) {
        onBuy(w.key);
        window.CSAudio && window.CSAudio.buy(true);
        // refresh money display
        const nm = document.getElementById('buy-money');
        if (nm) nm.textContent = '$' + (playerMoney - w.price);
      } else {
        window.CSAudio && window.CSAudio.error();
      }
    };
    if (w.type === 'pistol') pistols.appendChild(el);
    else if (w.type === 'rifle' || w.type === 'sniper') rifles.appendChild(el);
  });

  // Gear
  const gearItems = [
    { name: 'Kevlar', price: 650, key: 'kevlar' },
    { name: 'Kevlar + Helmet', price: 1000, key: 'helmet' }
  ];
  gearItems.forEach(g => {
    const el = document.createElement('div');
    el.className = 'buy-item';
    el.innerHTML = `<span class="name">${g.name}</span><span class="price">$${g.price}</span>`;
    if (playerMoney < g.price) el.classList.add('disabled');
    el.onclick = () => {
      if (playerMoney >= g.price) {
        onBuy(g.key);
        window.CSAudio && window.CSAudio.buy(true);
      } else {
        window.CSAudio && window.CSAudio.error();
      }
    };
    gear.appendChild(el);
  });
}

function hideBuyMenu() {
  if (buyMenuEl) buyMenuEl.classList.remove('show');
}

function showMenu(show, isPause = false) {
  if (!menuOverlayEl) menuOverlayEl = document.getElementById('menu-overlay');
  if (!menuOverlayEl) return;

  const resumeBtn = document.getElementById('btn-resume');
  const startBtn = document.getElementById('btn-start');

  if (show) {
    menuOverlayEl.classList.add('show');
    if (resumeBtn) resumeBtn.style.display = isPause ? 'block' : 'none';
    if (startBtn) startBtn.style.display = isPause ? 'none' : 'block';
  } else {
    menuOverlayEl.classList.remove('show');
  }
}

function setupMenus(onStart, onResume, onSettings, onHowto) {
  const start = document.getElementById('btn-start');
  const resume = document.getElementById('btn-resume');
  const settingsBtn = document.getElementById('btn-settings');
  const how = document.getElementById('btn-howto');

  if (start) start.onclick = () => { hideMenu(); onStart && onStart(); };
  if (resume) resume.onclick = () => { hideMenu(); onResume && onResume(); };
  if (settingsBtn) settingsBtn.onclick = () => {
    hideMenu();
    showSettingsModal(onSettings);
  };
  if (how) how.onclick = () => {
    hideMenu();
    showHowToModal();
    setTimeout(() => onHowto && onHowto(), 1200);
  };

  // Keyboard close for buy
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'b') {
      const bm = document.getElementById('buy-menu');
      if (bm && bm.classList.contains('show')) {
        bm.classList.remove('show');
      }
    }
    if (e.key === 'Escape') {
      const bm = document.getElementById('buy-menu');
      if (bm && bm.classList.contains('show')) {
        bm.classList.remove('show');
        return;
      }
      // handled in main game loop
    }
  });
}

function hideMenu() {
  if (menuOverlayEl) menuOverlayEl.classList.remove('show');
}

function showSettingsModal(onChange) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:70;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:#111;border:1px solid #333;padding:28px 36px;min-width:320px;color:#ddd">
      <h3 style="margin-top:0;color:#c8a25f">SETTINGS</h3>

      <div style="margin:14px 0">
        <label>Mouse Sensitivity: <span id="sens-val">${settings.sens}</span></label><br>
        <input type="range" id="sens" min="0.4" max="4.5" step="0.1" value="${settings.sens}" style="width:100%">
      </div>

      <div style="margin:14px 0">
        <label>Master Volume: <span id="vol-val">${Math.round(settings.volume*100)}</span>%</label><br>
        <input type="range" id="vol" min="0" max="1" step="0.05" value="${settings.volume}" style="width:100%">
      </div>

      <div style="margin:12px 0">
        <label><input type="checkbox" id="recoil-helper" ${settings.showRecoilHelper ? 'checked' : ''}> Show recoil pattern helper (learning)</label>
      </div>

      <h4 style="margin:16px 0 6px">Crosshair</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
        <label>Size <input type="range" id="ch-size" min="6" max="36" value="${settings.crosshair.size}"></label>
        <label>Gap <input type="range" id="ch-gap" min="0" max="18" value="${settings.crosshair.gap}"></label>
        <label>Thickness <input type="range" id="ch-thick" min="0.6" max="4" step="0.2" value="${settings.crosshair.thickness}"></label>
        <label>Alpha <input type="range" id="ch-alpha" min="0.3" max="1" step="0.05" value="${settings.crosshair.alpha}"></label>
      </div>
      <div style="margin:6px 0">
        <label><input type="checkbox" id="ch-dot" ${settings.crosshair.dot ? 'checked' : ''}> Center dot</label>
        <label style="margin-left:12px"><input type="checkbox" id="ch-outline" ${settings.crosshair.outline ? 'checked' : ''}> Outline</label>
      </div>
      <div>
        <button id="ch-color" style="background:#222;color:#fff;border:1px solid #555;padding:3px 8px">Color</button>
        <span id="ch-color-val" style="margin-left:8px">${settings.crosshair.color}</span>
      </div>

      <div style="margin-top:20px;display:flex;gap:8px">
        <button id="save-settings" class="menu-btn" style="flex:1">SAVE</button>
        <button id="close-settings" class="menu-btn secondary" style="flex:1">CLOSE</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Wire up
  const sens = modal.querySelector('#sens');
  const vol = modal.querySelector('#vol');
  const recoil = modal.querySelector('#recoil-helper');

  const chSize = modal.querySelector('#ch-size');
  const chGap = modal.querySelector('#ch-gap');
  const chThick = modal.querySelector('#ch-thick');
  const chAlpha = modal.querySelector('#ch-alpha');
  const chDot = modal.querySelector('#ch-dot');
  const chOutline = modal.querySelector('#ch-outline');

  const updateLive = () => {
    settings.sens = parseFloat(sens.value);
    settings.volume = parseFloat(vol.value);
    settings.showRecoilHelper = recoil.checked;

    settings.crosshair.size = parseFloat(chSize.value);
    settings.crosshair.gap = parseFloat(chGap.value);
    settings.crosshair.thickness = parseFloat(chThick.value);
    settings.crosshair.alpha = parseFloat(chAlpha.value);
    settings.crosshair.dot = chDot.checked;
    settings.crosshair.outline = chOutline.checked;

    modal.querySelector('#sens-val').textContent = settings.sens.toFixed(1);
    modal.querySelector('#vol-val').textContent = Math.round(settings.volume * 100);

    updateCrosshair();
    if (window.CSAudio) window.CSAudio.setVolume(settings.volume);
  };

  sens.oninput = updateLive;
  vol.oninput = updateLive;
  recoil.onchange = updateLive;
  chSize.oninput = updateLive;
  chGap.oninput = updateLive;
  chThick.oninput = updateLive;
  chAlpha.oninput = updateLive;
  chDot.onchange = updateLive;
  chOutline.onchange = updateLive;

  modal.querySelector('#ch-color').onclick = () => {
    const newCol = prompt('Crosshair color (hex)', settings.crosshair.color);
    if (newCol) {
      settings.crosshair.color = newCol;
      modal.querySelector('#ch-color-val').textContent = newCol;
      updateCrosshair();
    }
  };

  modal.querySelector('#save-settings').onclick = () => {
    saveSettings();
    onChange && onChange(settings);
    modal.remove();
  };
  modal.querySelector('#close-settings').onclick = () => {
    // revert visual only
    updateCrosshair();
    modal.remove();
  };
}

function showHowToModal() {
  const m = document.createElement('div');
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:80;display:flex;align-items:center;justify-content:center;';
  m.innerHTML = `
    <div style="background:#111;border:1px solid #333;max-width:560px;padding:24px 30px;color:#ccc;line-height:1.45">
      <h3 style="color:#c8a25f;margin-top:0">HOW TO PLAY</h3>
      <ul style="padding-left:18px">
        <li><b>WASD</b> — Move &nbsp; <b>SPACE</b> — Jump &nbsp; <b>CTRL/C</b> — Crouch &nbsp; <b>SHIFT</b> — Walk</li>
        <li><b>MOUSE</b> — Aim &nbsp; <b>LEFT CLICK</b> — Shoot &nbsp; <b>RIGHT CLICK</b> — Scope</li>
        <li><b>1-5 / SCROLL</b> — Switch weapons &nbsp; <b>R</b> — Reload</li>
        <li><b>B</b> — Buy menu (only in buy phase) &nbsp; <b>E</b> — Plant / Defuse bomb</li>
        <li>Headshots do massive damage. Learn the recoil pattern of each gun.</li>
        <li>Buy better guns and armor every round. Money carries over on win streaks.</li>
      <li><b>Wallet:</b> Connect Phantom/Solflare/Backpack to earn 🚀 Rockets and claim to MemeTorrent P2E (by memetorrent & futuret3ch).</li>
      </ul>
      <div style="margin-top:14px;font-size:12px;color:#666">Click the game to lock your mouse. ESC unlocks. Have fun! Rockets feed the MT ecosystem.</div>
      <button style="margin-top:16px" class="menu-btn">GOT IT</button>
    </div>
  `;
  document.body.appendChild(m);
  m.querySelector('button').onclick = () => m.remove();
  m.onclick = (e) => { if (e.target === m) m.remove(); };
}

function updateRadar(player, bots, bomb, mapData) {
  const canvas = document.getElementById('radar-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;

  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, w, h);

  // Simple top-down radar. Map is ~52x52 units, center 0,0
  const scale = 2.35;
  const cx = w / 2, cy = h / 2;

  // Draw very rough walls
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 24*scale, cy - 24*scale, 48*scale, 48*scale);

  // Draw some cover hints
  ctx.fillStyle = '#222';
  ctx.fillRect(cx - 2*scale, cy - 3*scale, 4*scale, 6*scale); // mid
  ctx.fillRect(cx - 15*scale, cy + 6*scale, 8*scale, 3*scale); // A

  // Player (green arrow)
  const px = cx + player.position.x * scale * 0.96;
  const pz = cy + player.position.z * scale * 0.96;
  ctx.save();
  ctx.translate(px, pz);
  ctx.rotate(-player.yaw + Math.PI);
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-4, 5);
  ctx.lineTo(4, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Bots
  bots.forEach(bot => {
    if (!bot.alive) return;
    const bx = cx + bot.position.x * scale * 0.96;
    const bz = cy + bot.position.z * scale * 0.96;
    ctx.fillStyle = bot.side === 'ct' ? '#3b82f6' : '#ef4444';
    ctx.beginPath();
    ctx.arc(bx, bz, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Bomb
  if (bomb && bomb.planted) {
    const bx = cx + bomb.position.x * scale * 0.96;
    const bz = cy + bomb.position.z * scale * 0.96;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(bx, bz, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.font = '7px monospace';
    ctx.fillText('B', bx - 2, bz + 2.5);
  }
}

function initUI() {
  loadSettings();

  crosshairEl = document.getElementById('crosshair');
  crosshairDot = document.getElementById('crosshair-dot');

  killfeedEl = document.getElementById('killfeed');
  centerMsgEl = document.getElementById('center-message');
  winBannerEl = document.getElementById('win-banner');
  damageOverlayEl = document.getElementById('damage-overlay');
  buyMenuEl = document.getElementById('buy-menu');
  menuOverlayEl = document.getElementById('menu-overlay');

  updateCrosshair();

  // Hide some on start
  if (winBannerEl) winBannerEl.style.display = 'none';
  if (centerMsgEl) centerMsgEl.style.display = 'none';

  // Global volume from settings already applied in load
  return settings;
}

window.CSUI = {
  initUI,
  updateHUD,
  updateCrosshair,
  setCrosshairFromSettings,
  flashDamage,
  addKillfeed,
  showCenterMessage,
  hideCenterMessage,
  showWinBanner,
  showBuyMenu,
  hideBuyMenu,
  showMenu,
  hideMenu,
  setupMenus,
  updateRadar,
  settings
};
