// CS: Better — Main bootstrap (Three.js + Input + Start)

let scene, camera, renderer;
let mouseX = 0, mouseY = 0;
let lastMouseMove = 0;

function initThree() {
  const canvas = document.getElementById('three-canvas');

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false
  });
  renderer.setClearColor(0x000000, 1); // ensure black clear instead of transparent/black default issues
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false; // cheap

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1a1814, 18, 72);

  camera = new THREE.PerspectiveCamera(
    74,
    window.innerWidth / window.innerHeight,
    0.1,
    400
  );
  camera.position.set(0, 1.7, 18);

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Mouse look (accumulated while locked)
  document.addEventListener('mousemove', (e) => {
    if (!document.pointerLockElement) return;

    const sens = (window.CSUI && window.CSUI.settings && window.CSUI.settings.sens) || 1.8;
    const dx = e.movementX || 0;
    const dy = e.movementY || 0;

    const game = window.CSGame && window.CSGame.GAME;
    if (!game || !game.player) return;

    const p = game.player;
    p.yaw -= dx * 0.0018 * sens;
    p.pitch -= dy * 0.0018 * sens;
    p.pitch = Math.max(-1.48, Math.min(1.48, p.pitch));
  });

  // Initial scene lighting (map will add more)
  const ambient = new THREE.AmbientLight(0x554433, 0.35);
  scene.add(ambient);
}

function start() {
  initThree();

  // Init game systems
  window.CSGame.init(scene, camera, renderer);

  // Wire menus
  window.CSUI.setupMenus(
    () => {
      // Start new match
      window.CSGame.start();
    },
    () => {
      // Resume
      window.CSGame.resume();
    },
    (newSettings) => {
      // Settings changed
      const game = window.CSGame.GAME;
      if (game && game.player) {
        // sens already live from UI
      }
    },
    () => {
      // How to — just show again if needed
    }
  );

  // Wire MT Wallet connect button
  const connectBtn = document.getElementById('btn-connect-wallet');
  if (connectBtn) {
    connectBtn.onclick = () => {
      if (window.showConnectModal) {
        window.showConnectModal();
      } else if (window.CSWallet) {
        // fallback: try phantom first
        window.CSWallet.connect('phantom');
      }
    };
  }

  // Boot audio on first click anywhere
  const bootAudio = () => {
    if (window.CSAudio) {
      window.CSAudio.init();
      window.CSAudio.resume();
    }
    document.removeEventListener('click', bootAudio);
    document.removeEventListener('keydown', bootAudio);
  };
  document.addEventListener('click', bootAudio, { once: true });
  document.addEventListener('keydown', bootAudio, { once: true });

  // Show initial menu
  setTimeout(() => {
    const menu = document.getElementById('menu-overlay');
    if (menu) menu.classList.add('show');
  }, 80);

  // Hint for MT
  console.log('%c[CS:Better] Connect a Solana wallet (Phantom/Solflare/Backpack) via menu to earn & claim 🚀 Rockets for the MemeTorrent ecosystem (memetorrent + futuret3ch). Press = in-game for test rockets.', 'color:#c8a25f');

  // Dev helper: press 9 to give money + rifle
  document.addEventListener('keydown', (e) => {
    const g = window.CSGame && window.CSGame.GAME;
    if (!g) return;
    if (e.key === '9') {
      g.player.money += 3200;
      g.player.currentWeaponKey = 'ak47';
      const w = window.CSWeapons.getWeapon('ak47');
      g.player.ammo = w.magSize;
      g.player.reserve = w.reserve;
      window.CSUI.updateHUD(g.state, g.player);
    }
    if (e.key.toLowerCase() === '0') {
      // suicide for testing
      g.player.health = 0;
    }
  });

  console.log('%c[CS:Better] Ready. Click START MATCH. Press 9 in game for free AK + cash.', 'color:#666');
}

// Boot
window.addEventListener('load', start);
