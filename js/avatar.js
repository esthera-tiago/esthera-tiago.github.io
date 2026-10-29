(function () {
  const IDLE_MS = 1500;
  const BLINK_INTERVAL_MS = 1500;
  const BLINK_JITTER_MS = 0;
  const BLINK = { close: 70, hold: 50, open: 120 };
  const WINK = { close: 90, hold: 450, open: 180 };
  const GAZE_TAU_MS = 90;
  const RETURN_TAU_MS = 240;
  const DEADZONE = 0.10;
  const FULL_AT = 0.80;
  const RADIUS_X = 0.30;
  const RADIUS_Y = 0.30;
  const FACE_Y = 0.18;
  const PARALLAX_X = 4;
  const PARALLAX_Y = 3;
  const WINK_TARGET = 'avatar';
  const RETURN_TO_CENTER_WHEN_IDLE = true;

  const ORDER = ['default', 'left', 'right', 'up', 'down', 'blink', 'wink'];

  const avatar = document.getElementById('avatar');
  if (!avatar) return;

  const stage = avatar.querySelector('.avatar__stage');
  const layers = {};
  avatar.querySelectorAll('.avatar__layer').forEach((img) => {
    const pose = img.getAttribute('data-pose');
    if (pose) layers[pose] = img;
  });

  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = mqReduce.matches;

  let weights = { default: 1, left: 0, right: 0, up: 0, down: 0, blink: 0, wink: 0 };
  let targetWeights = { ...weights };

  let lastActivity = performance.now();
  let idle = false;
  let blinkTimer = null;
  let winkActive = false;
  let winkStart = 0;
  let blinkActive = false;
  let blinkStart = 0;
  let blinkPhase = 'close';

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let px = 0, py = 0;
  let tx = 0, ty = 0;

  let rafId = null;
  let running = false;
  let visible = true;
  let loaded = false;
  let loaderDone = false;

  function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
  function hypot(x,y){ return Math.sqrt(x*x+y*y); }

  function applyWeights(w) {
    let cum = 0;
    for (let i = 0; i < ORDER.length; i++) {
      const k = ORDER[i];
      const val = w[k] || 0;
      cum += val;
      if (!layers[k]) continue;
      if (val > 0.001 && cum > 0) {
        const op = val / cum;
        const rounded = op.toFixed(3);
        if (layers[k].style.opacity !== rounded) {
          layers[k].style.opacity = rounded;
        }
      } else {
        if (layers[k].style.opacity !== '0') {
          layers[k].style.opacity = '0';
        }
      }
    }
  }

  function setGazeTarget(nx, ny) {
    let ux = nx, uy = ny;
    let len = hypot(ux, uy);
    if (len < 1e-6) { ux = 0; uy = 0; len = 1; }
    ux /= len; uy /= len;
    let gx = Math.max(0, -ux);
    let gy = Math.max(0, -uy);
    let rx = Math.max(0, ux);
    let ry = Math.max(0, uy);
    let S = gx + gy + rx + ry;
    if (S > 1.0) {
      gx /= S; gy /= S; rx /= S; ry /= S;
    }
    targetWeights.left = gx;
    targetWeights.up = gy;
    targetWeights.right = rx;
    targetWeights.down = ry;
    targetWeights.default = Math.max(0, 1 - (gx + gy + rx + ry));
    targetWeights.blink = weights.blink;
    targetWeights.wink = weights.wink;
  }

  function updateGazeFromPointer() {
    const rect = avatar.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * FACE_Y;
    let dx = mouseX - cx;
    let dy = mouseY - cy;
    let nx = dx / Math.max(240, window.innerWidth * RADIUS_X);
    let ny = dy / Math.max(200, window.innerHeight * RADIUS_Y);
    nx = clamp(nx, -1, 1);
    ny = clamp(ny, -1, 1);
    let m = Math.min(1, hypot(nx, ny));
    let g = (m - DEADZONE) / Math.max(1e-6, (FULL_AT - DEADZONE));
    if (g < 0) g = 0;
    if (g > 1) g = 1;
    g = g * g * (3 - 2 * g);
    let ux = 0, uy = 0;
    if (m > 1e-6) {
      ux = (nx / m) * g;
      uy = (ny / m) * g;
    } else {
      ux = 0; uy = 0;
    }
    tx = ux * PARALLAX_X;
    ty = uy * PARALLAX_Y;
    setGazeTarget(ux, uy);
  }

  function clearBlinkTimer() {
    if (blinkTimer) { clearTimeout(blinkTimer); blinkTimer = null; }
  }

  function scheduleBlink() {
    clearBlinkTimer();
    const jitter = (Math.random() * 2 - 1) * BLINK_JITTER_MS;
    blinkTimer = setTimeout(() => {
      if (reduced) return;
      if (!idle && !winkActive) return;
      startBlink();
      scheduleBlink();
    }, BLINK_INTERVAL_MS + jitter);
  }

  function startBlink() {
    if (winkActive) return;
    if (blinkActive) return;
    blinkActive = true;
    blinkStart = performance.now();
    blinkPhase = 'close';
    startLoop();
  }

  function startWink() {
    winkActive = true;
    winkStart = performance.now();
    lastActivity = performance.now();
    clearBlinkTimer();
    startLoop();
  }

  function tickBlink(now) {
    if (!blinkActive && !winkActive) return;
    if (winkActive) {
      let t = now - winkStart;
      let a = 0;
      if (t < WINK.close) {
        a = t / WINK.close;
      } else if (t < WINK.close + WINK.hold) {
        a = 1;
      } else if (t < WINK.close + WINK.hold + WINK.open) {
        a = 1 - ((t - WINK.close - WINK.hold) / WINK.open);
      } else {
        a = 0;
        winkActive = false;
      }
      a = Math.max(0, Math.min(1, a));
      weights.wink = a;
      weights.blink = 0;
    } else if (blinkActive) {
      let t = now - blinkStart;
      let a = 0;
      if (t < BLINK.close) {
        a = t / BLINK.close;
      } else if (t < BLINK.close + BLINK.hold) {
        a = 1;
      } else if (t < BLINK.close + BLINK.hold + BLINK.open) {
        a = 1 - ((t - BLINK.close - BLINK.hold) / BLINK.open);
      } else {
        a = 0;
        blinkActive = false;
      }
      a = Math.max(0, Math.min(1, a));
      weights.blink = a;
      weights.wink = 0;
    }
    // combine
    let b = Math.min(weights.blink, 1 - weights.wink);
    let k = weights.wink;
    // gaze contribution
    let gLeft = targetWeights.left * (1 - b - k);
    let gRight = targetWeights.right * (1 - b - k);
    let gUp = targetWeights.up * (1 - b - k);
    let gDown = targetWeights.down * (1 - b - k);
    let gDef = targetWeights.default * (1 - b - k);
    weights.left = gLeft; weights.right = gRight; weights.up = gUp; weights.down = gDown; weights.default = gDef; weights.blink = b; weights.wink = k;
    // normalize quickly
    let S = weights.default + weights.left + weights.right + weights.up + weights.down + weights.blink + weights.wink;
    if (S > 0) {
      weights.default /= S; weights.left /= S; weights.right /= S; weights.up /= S; weights.down /= S; weights.blink /= S; weights.wink /= S;
    }
  }

  function tick(now) {
    if (!running) return;
    let dt = now - (tick.last || now);
    tick.last = now;
    if (dt > 50) dt = 50;

    if (reduced) {
      // only wink allowed
      tickBlink(now);
      // static
      if (stage) stage.style.transform = 'translate3d(0,0,0)';
      applyWeights(weights);
      if (!winkActive) {
        // check if should stop
        let needs = winkActive;
        if (!needs) { running = false; rafId = null; return; }
      }
      rafId = requestAnimationFrame(tick);
      return;
    }

    // check activity
    if (!winkActive && !blinkActive) {
      if (performance.now() - lastActivity >= IDLE_MS) {
        if (!idle) {
          idle = true;
          if (RETURN_TO_CENTER_WHEN_IDLE) {
            targetWeights.left = targetWeights.right = targetWeights.up = targetWeights.down = 0;
            targetWeights.default = 1;
            tx = 0; ty = 0;
          }
          scheduleBlink();
        }
      } else {
        if (idle) {
          idle = false;
          clearBlinkTimer();
        }
        updateGazeFromPointer();
      }
    } else {
      // active
    }

    // smooth gaze weights
    let tau = winkActive || blinkActive ? GAZE_TAU_MS : (idle ? RETURN_TAU_MS : GAZE_TAU_MS);
    let k = 1 - Math.exp(-dt / tau);
    let wkeys = ['default','left','right','up','down'];
    for (let i = 0; i < wkeys.length; i++) {
      let kk = wkeys[i];
      weights[kk] += (targetWeights[kk] - weights[kk]) * k;
    }
    // parallax smooth
    px += (tx - px) * k;
    py += (ty - py) * k;
    if (stage) stage.style.transform = `translate3d(${px.toFixed(3)}px, ${py.toFixed(3)}px, 0)`;

    tickBlink(now);

    applyWeights(weights);

    // check if settled
    let moving = winkActive || blinkActive || Math.abs(tx-px) > 0.01 || Math.abs(ty-py) > 0.01;
    if (!moving) {
      // check weights settled
      let settled = true;
      for (let i = 0; i < wkeys.length; i++) {
        if (Math.abs(weights[wkeys[i]] - targetWeights[wkeys[i]]) > 0.005) { settled = false; break; }
      }
      if (settled && !winkActive && !blinkActive) {
        running = false;
        rafId = null;
        return;
      }
    }

    rafId = requestAnimationFrame(tick);
  }
  tick.last = performance.now();

  function startLoop() {
    if (!running && visible && !document.hidden && loaded && loaderDone) {
      running = true;
      rafId = requestAnimationFrame(tick);
    }
  }
  function stopLoop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  // pointer
  function onMove(e) {
    if (reduced) return;
    mouseX = e.clientX;
    mouseY = e.clientY;
    const dist = hypot(mouseX - (onMove.lastX||mouseX), mouseY - (onMove.lastY||mouseY));
    onMove.lastX = mouseX; onMove.lastY = mouseY;
    if (dist > 2) {
      lastActivity = performance.now();
      if (idle) {
        idle = false;
        clearBlinkTimer();
      }
    }
    startLoop();
  }
  window.addEventListener('pointermove', onMove, { passive: true });

  // click wink
  function onClick(e) {
    if (WINK_TARGET === 'avatar') {
      if (!avatar.contains(e.target)) return;
    }
    if (reduced) {
      // instant wink
      weights.wink = 1; weights.blink = 0;
      let S = weights.default + weights.left + weights.right + weights.up + weights.down + 1;
      if (S > 0) {
        weights.default /= S; weights.left /= S; weights.right /= S; weights.up /= S; weights.down /= S;
      }
      weights.wink = 1/S;
      applyWeights(weights);
      setTimeout(() => {
        weights.wink = 0;
        let S2 = weights.default + weights.left + weights.right + weights.up + weights.down;
        if (S2 > 0) {
          weights.default /= S2; weights.left /= S2; weights.right /= S2; weights.up /= S2; weights.down /= S2;
        }
        applyWeights(weights);
      }, 600);
      lastActivity = performance.now();
      return;
    }
    startWink();
    lastActivity = performance.now();
  }
  document.addEventListener('click', onClick);

  // idle detection
  function markActivity() {
    if (reduced) return;
    lastActivity = performance.now();
    if (idle) {
      idle = false;
      clearBlinkTimer();
    }
  }
  window.addEventListener('pointerdown', markActivity, { passive: true });

  // visibility
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopLoop();
      clearBlinkTimer();
    } else {
      lastActivity = performance.now();
      startLoop();
    }
  });

  // intersection
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      visible = e.isIntersecting;
      if (!visible) {
        stopLoop();
        clearBlinkTimer();
      } else {
        lastActivity = performance.now();
        startLoop();
      }
    });
  }, { threshold: 0.01 });
  io.observe(avatar);

  // reduced motion
  mqReduce.addEventListener ? mqReduce.addEventListener('change', (e) => {
    reduced = e.matches;
    if (reduced) {
      clearBlinkTimer();
      winkActive = false; blinkActive = false;
      weights = { default: 1, left: 0, right: 0, up: 0, down: 0, blink: 0, wink: 0 };
      targetWeights = { ...weights };
      applyWeights(weights);
      if (stage) stage.style.transform = 'translate3d(0,0,0)';
      stopLoop();
    } else {
      lastActivity = performance.now();
      idle = false;
      startLoop();
    }
  }) : mqReduce.addListener((e) => {
    reduced = e.matches;
    if (reduced) {
      clearBlinkTimer();
      winkActive = false; blinkActive = false;
      weights = { default: 1, left: 0, right: 0, up: 0, down: 0, blink: 0, wink: 0 };
      targetWeights = { ...weights };
      applyWeights(weights);
      if (stage) stage.style.transform = 'translate3d(0,0,0)';
      stopLoop();
    } else {
      lastActivity = performance.now();
      idle = false;
      startLoop();
    }
  });

  // loader done
  function onLoaderDone() {
    loaderDone = true;
    startLoop();
  }
  document.addEventListener('loader:done', onLoaderDone, { once: true });
  // if loader already hidden
  setTimeout(() => {
    const l = document.querySelector('[data-loader]');
    if (!l || l.classList.contains('is-done')) {
      loaderDone = true;
      startLoop();
    }
  }, 100);

  // load images
  const imgs = Array.from(avatar.querySelectorAll('img'));
  Promise.all(imgs.map((i) => i.decode ? i.decode().catch(()=>{}) : Promise.resolve())).then(() => {
    loaded = true;
    startLoop();
  }).catch(() => {
    loaded = true;
    startLoop();
  });

  applyWeights(weights);
})();
