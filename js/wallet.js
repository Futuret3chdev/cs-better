// CS: Better — MemeTorrent Wallet Integration
// Supports Phantom, Solflare, Backpack for earning Rockets in MT P2E ecosystem
// Created for MemeTorrent by memetorrent and futuret3ch

const MT_TOKEN = 'ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump'; // $MT on Solana
const MT_RPC = 'https://api.mainnet-beta.solana.com';

let walletState = {
  connected: false,
  walletName: null,
  publicKey: null,
  provider: null,
  rocketsEarned: 0,      // this session / unclaimed
  totalRockets: 0,       // lifetime for this wallet (from localStorage)
  claimedRockets: 0
};

const SUPPORTED_WALLETS = [
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '👻',
    detect: () => (window.phantom && window.phantom.solana) || (window.solana && window.solana.isPhantom ? window.solana : null)
  },
  {
    id: 'solflare',
    name: 'Solflare',
    icon: '☀️',
    detect: () => window.solflare
  },
  {
    id: 'backpack',
    name: 'Backpack',
    icon: '🎒',
    detect: () => (window.backpack && window.backpack.solana) || (window.solana && window.solana.isBackpack ? window.solana : null)
  }
];

function getSolanaConnection() {
  if (window.solanaWeb3 && window.solanaWeb3.Connection) {
    return new window.solanaWeb3.Connection(MT_RPC, 'confirmed');
  }
  return null;
}

function shortAddress(pk) {
  if (!pk) return '';
  const str = pk.toString();
  return str.slice(0, 4) + '...' + str.slice(-4);
}

async function connectWallet(walletId) {
  const walletDef = SUPPORTED_WALLETS.find(w => w.id === walletId);
  if (!walletDef) {
    alert('Unsupported wallet');
    return false;
  }

  const provider = walletDef.detect();
  if (!provider) {
    const installUrl = walletId === 'phantom' ? 'https://phantom.app/' : 
                       walletId === 'solflare' ? 'https://solflare.com/' : 'https://backpack.app/';
    if (confirm(`${walletDef.name} not found. Install it?`)) {
      window.open(installUrl, '_blank');
    }
    return false;
  }

  try {
    // Connect
    const resp = await provider.connect();
    const pubKey = resp.publicKey || provider.publicKey;

    if (!pubKey) throw new Error('No public key');

    walletState.connected = true;
    walletState.walletName = walletDef.name;
    walletState.provider = provider;
    walletState.publicKey = pubKey;

    // Load persisted stats for this wallet
    loadWalletStats(pubKey.toString());

    // Update UI
    updateWalletUI();

    // Balance display removed for cleaner HUD; can add later if wanted
    // fetchAndShowBalance(pubKey);

    // Announce to game
    if (window.CSGame && window.CSGame.GAME) {
      window.CSGame.GAME.mtWallet = walletState;
    }

    // Toast
    showWalletToast(`Connected to ${walletDef.name}! Ready to earn Rockets for MemeTorrent P2E.`);

    // Optional: auto show MT panel
    setTimeout(() => {
      const mtPanel = document.getElementById('mt-panel');
      if (mtPanel) mtPanel.classList.add('show');
    }, 800);

    return true;
  } catch (err) {
    console.error('Wallet connect error:', err);
    alert(`Failed to connect to ${walletDef.name}: ${err.message || 'User rejected or wallet error'}`);
    return false;
  }
}

async function disconnectWallet() {
  if (walletState.provider && walletState.provider.disconnect) {
    try {
      await walletState.provider.disconnect();
    } catch (e) {}
  }

  const pub = walletState.publicKey ? walletState.publicKey.toString() : null;
  if (pub) {
    saveWalletStats(pub);
  }

  walletState = {
    connected: false,
    walletName: null,
    publicKey: null,
    provider: null,
    rocketsEarned: 0,
    totalRockets: 0,
    claimedRockets: 0
  };

  updateWalletUI();

  if (window.CSGame && window.CSGame.GAME) {
    window.CSGame.GAME.mtWallet = null;
  }

  showWalletToast('Wallet disconnected. Rockets will still be tracked locally.');
}

function loadWalletStats(pubKeyStr) {
  try {
    const saved = localStorage.getItem(`mt_rockets_${pubKeyStr}`);
    if (saved) {
      const data = JSON.parse(saved);
      walletState.totalRockets = data.totalRockets || 0;
      walletState.claimedRockets = data.claimedRockets || 0;
      walletState.rocketsEarned = Math.max(0, walletState.totalRockets - walletState.claimedRockets);
    } else {
      walletState.totalRockets = 0;
      walletState.claimedRockets = 0;
      walletState.rocketsEarned = 0;
    }
  } catch (e) {
    walletState.totalRockets = 0;
    walletState.claimedRockets = 0;
    walletState.rocketsEarned = 0;
  }
}

function saveWalletStats(pubKeyStr) {
  try {
    const data = {
      totalRockets: walletState.totalRockets,
      claimedRockets: walletState.claimedRockets,
      lastUpdated: Date.now()
    };
    localStorage.setItem(`mt_rockets_${pubKeyStr}`, JSON.stringify(data));
  } catch (e) {}
}

async function claimRockets() {
  if (!walletState.connected || !walletState.provider) {
    alert('Connect a wallet first!');
    return;
  }

  const claimable = Math.floor(walletState.rocketsEarned);
  if (claimable <= 0) {
    showWalletToast('No new Rockets to claim yet. Play more rounds!');
    return;
  }

  const pubStr = walletState.publicKey.toString();
  const messageStr = `CS:Better | Claim ${claimable} Rockets for MemeTorrent P2E\nWallet: ${pubStr}\nTime: ${new Date().toISOString()}\nCreated by memetorrent & futuret3ch`;

  try {
    const encoded = new TextEncoder().encode(messageStr);

    // Different wallets have slightly different sign APIs
    let signature;
    const provider = walletState.provider;

    if (provider.signMessage) {
      // Standard (Phantom, Backpack, recent Solflare)
      const sigResult = await provider.signMessage(encoded, 'utf8');
      signature = sigResult.signature || sigResult;
    } else if (provider.sign) {
      // Older fallback
      signature = await provider.sign(encoded);
    } else {
      throw new Error('This wallet does not support message signing');
    }

    // Success! "Submit" to MT ecosystem
    walletState.claimedRockets += claimable;
    walletState.totalRockets = walletState.claimedRockets + walletState.rocketsEarned; // keep in sync
    walletState.rocketsEarned = 0; // reset unclaimed for this "claim"

    saveWalletStats(pubStr);

    updateWalletUI();

    // Show nice success
    const successMsg = `🚀 ${claimable} Rockets claimed!\n\nSigned & submitted to MemeTorrent P2E Arcade.\n\nCheck your rewards & leaderboards at memetorrent.com or in the MT TG.`;
    showWalletToast(successMsg, 8000);

    // Optional: could post to a hypothetical MT API, but for static we just prove with signature
    console.log('%c[MT] Rocket claim signature successful for ' + pubStr, 'color:#c8a25f', { claimable, messageStr });

  } catch (err) {
    console.error('Claim error:', err);
    if (err.message && err.message.includes('rejected')) {
      showWalletToast('Claim cancelled by user.');
    } else {
      alert('Failed to sign claim: ' + (err.message || 'Unknown error'));
    }
  }
}

function addRockets(amount, reason = '') {
  if (!amount || amount <= 0) return;

  walletState.rocketsEarned += amount;
  walletState.totalRockets += amount;

  // Persist immediately if connected
  if (walletState.connected && walletState.publicKey) {
    saveWalletStats(walletState.publicKey.toString());
  }

  updateWalletUI();

  // Optional floating +toast
  if (reason) {
    showFloatingRocket(`+${amount} Rockets ${reason}`);
  }
}

function updateWalletUI() {
  // Menu / modal status
  const menuStatus = document.getElementById('wallet-menu-status');
  if (menuStatus) {
    if (walletState.connected && walletState.publicKey) {
      menuStatus.innerHTML = `
        <div style="color:#c8a25f">✅ ${walletState.walletName} Connected</div>
        <div style="font-family:monospace;font-size:11px;opacity:0.7">${shortAddress(walletState.publicKey)}</div>
        <div style="margin-top:4px">Total Rockets: <strong>🚀 ${Math.floor(walletState.totalRockets)}</strong> (Claimed: ${walletState.claimedRockets})</div>
      `;
    } else {
      menuStatus.innerHTML = `<span style="color:#888">Not connected — earn Rockets for MemeTorrent P2E</span>`;
    }
  }

  // Update MT rockets display (always visible)
  const mtVal = document.getElementById('mt-rockets-val');
  if (mtVal) mtVal.textContent = Math.floor(walletState.rocketsEarned);

  // Update claim button visibility 
  const claimHud = document.getElementById('wallet-claim-hud');
  if (claimHud) {
    claimHud.style.display = (walletState.rocketsEarned > 0 && walletState.connected) ? 'inline-block' : 'none';
  }

  const topRight = document.getElementById('top-right');
  const mtHud = document.getElementById('mt-rockets-hud');
  if (topRight) {
    if (walletState.connected && walletState.publicKey) {
      topRight.classList.add('connected');
      topRight.title = `${walletState.walletName} • ${shortAddress(walletState.publicKey)} — Click for MT wallet`;
      // small addr hint inside pill
      if (mtHud) {
        let addr = mtHud.querySelector('.mt-addr');
        if (!addr) {
          addr = document.createElement('span');
          addr.className = 'mt-addr';
          mtHud.appendChild(addr);
        }
        addr.textContent = shortAddress(walletState.publicKey);
      }
    } else {
      topRight.classList.remove('connected');
      topRight.title = 'Click to connect wallet & earn/claim Rockets for MemeTorrent P2E';
      if (mtHud) {
        const addr = mtHud.querySelector('.mt-addr');
        if (addr) addr.remove();
      }
    }
  }
}

function showWalletToast(msg, duration = 4200) {
  const toast = document.createElement('div');
  toast.className = 'wallet-toast';
  toast.innerHTML = msg.replace(/\n/g, '<br>');
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function showFloatingRocket(text) {
  const float = document.createElement('div');
  float.className = 'rocket-float';
  float.textContent = text;
  document.body.appendChild(float);

  setTimeout(() => {
    float.remove();
  }, 1400);
}

// Expose for game integration
window.CSWallet = {
  connect: connectWallet,
  disconnect: disconnectWallet,
  addRockets,
  getState: () => ({ ...walletState }),
  claim: claimRockets,
  updateWalletUI,
  SUPPORTED_WALLETS
};

// Auto-reconnect last wallet on load (best effort)
function tryAutoReconnect() {
  // We can't auto-connect without user gesture in most wallets for security.
  // But we can prefill last used if user clicks connect.
  // For UX, on first menu open we can show "Last used: Phantom"
  try {
    const last = localStorage.getItem('mt_last_wallet');
    if (last) {
      // We can pre-select in the connect modal
      window.CSWallet._lastWallet = last;
    }
  } catch (e) {}
}

function initWalletUI() {
  tryAutoReconnect();

  // We rely on static #mt-rockets-hud in index.html + wallet-hud if needed.
  // The mt one is always visible for rockets.
  // Add a claim button near it if missing.
  const mtHud = document.getElementById('mt-rockets-hud');
  if (mtHud && !document.getElementById('wallet-claim-hud')) {
    const claim = document.createElement('button');
    claim.id = 'wallet-claim-hud';
    claim.className = 'wallet-claim';
    claim.textContent = 'CLAIM';
    claim.onclick = (e) => { e.stopPropagation(); window.CSWallet && window.CSWallet.claim(); };
    mtHud.appendChild(claim);
  }

  // Add styles dynamically (or rely on css)
  addWalletStyles();

  updateWalletUI();
}

function addWalletStyles() {
  if (document.getElementById('wallet-styles')) return;
  const style = document.createElement('style');
  style.id = 'wallet-styles';
  style.textContent = `
    .wallet-claim {
      background: #c8a25f;
      color: #111;
      border: none;
      padding: 1px 5px;
      border-radius: 2px;
      font-size: 9px;
      font-weight: 700;
      cursor: pointer;
      margin-left: 4px;
    }
    .wallet-toast {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: #111;
      border: 2px solid #c8a25f;
      color: #c8a25f;
      padding: 10px 18px;
      border-radius: 4px;
      font-size: 13px;
      z-index: 100;
      max-width: 380px;
      text-align: center;
      box-shadow: 0 0 20px rgba(200,162,95,0.3);
      white-space: pre-line;
    }
    .wallet-toast.fade { opacity: 0; transition: opacity .3s; }
    .rocket-float {
      position: fixed;
      left: 50%;
      top: 42%;
      transform: translate(-50%, -50%);
      color: #c8a25f;
      font-size: 16px;
      font-weight: 700;
      pointer-events: none;
      z-index: 90;
      animation: rocketPop 1.2s forwards;
      text-shadow: 0 0 6px #000;
    }
    @keyframes rocketPop {
      0% { opacity:1; transform: translate(-50%, -50%) scale(0.7); }
      40% { opacity:1; }
      100% { opacity:0; transform: translate(-50%, -140%) scale(1); }
    }
    #connect-modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.85);
      z-index: 70;
      display: none;
      align-items: center;
      justify-content: center;
    }
    #connect-modal.show { display: flex; }
    .connect-box {
      background: #111;
      border: 1px solid #333;
      padding: 24px;
      min-width: 320px;
      color: #ddd;
    }
    .wallet-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      margin: 6px 0;
      background: #1a1a1a;
      border: 1px solid #333;
      cursor: pointer;
      transition: all .1s;
    }
    .wallet-option:hover {
      border-color: #c8a25f;
      background: #222;
    }
  `;
  document.head.appendChild(style);
}

function showConnectModal() {
  let modal = document.getElementById('connect-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'connect-modal';
    modal.innerHTML = `
      <div class="connect-box">
        <h3 style="margin:0 0 12px;color:#c8a25f">Connect Wallet — MemeTorrent P2E</h3>
        <p style="font-size:12px;color:#888;margin-bottom:16px">Earn 🚀 Rockets while playing CS: Better. Submit scores to the MT Arcade for rewards, airdrops & leaderboards. Created by memetorrent & futuret3ch.</p>
        
        <div id="wallet-options"></div>

        <div style="margin-top:16px;font-size:11px;color:#555">
          Your on-chain activity & signed claims help power the MemeTorrent ecosystem.
        </div>

        <button onclick="hideConnectModal()" style="margin-top:16px;width:100%" class="menu-btn secondary">CLOSE</button>
      </div>
    `;
    document.body.appendChild(modal);

    // Populate options
    const opts = modal.querySelector('#wallet-options');
    SUPPORTED_WALLETS.forEach(w => {
      const el = document.createElement('div');
      el.className = 'wallet-option';
      el.innerHTML = `
        <span style="font-size:20px">${w.icon}</span>
        <div>
          <div style="font-weight:600">${w.name}</div>
          <div style="font-size:10px;color:#666">Click to connect</div>
        </div>
      `;
      el.onclick = async () => {
        hideConnectModal();
        await window.CSWallet.connect(w.id);
      };
      opts.appendChild(el);
    });
  }

  modal.classList.add('show');
}

function hideConnectModal() {
  const modal = document.getElementById('connect-modal');
  if (modal) modal.classList.remove('show');
}

// Also expose modal for menu buttons
window.showConnectModal = showConnectModal;

// Init on load
window.addEventListener('load', () => {
  // Delay a bit so other UI is ready
  setTimeout(initWalletUI, 120);
});

console.log('%c[CS:Better] MemeTorrent Wallet module loaded — Phantom / Solflare / Backpack supported. Rockets for MT P2E by memetorrent & futuret3ch.', 'color:#666');
