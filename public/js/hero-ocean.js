(() => {
  const cv = document.getElementById('heroOcean');
  if (!cv) return;
  const hero = cv.closest('.hc-sec'), box = cv.parentElement, x = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GOLD = '216,192,138';
  let w = 0, h = 0, raf = 0, running = false, mouseX = null, shift = 0;

  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = box.clientWidth; h = box.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(t) {
    x.clearRect(0, 0, w, h);
    const mobile = w < 720;
    const cols = mobile ? 150 : 300, rows = mobile ? 56 : 84;
    const f = w * 0.55, camH = 120, hz = h * (mobile ? 0.55 : 0.48);
    const target = mouseX == null ? 0 : (mouseX / w - 0.5) * -260;
    shift += (target - shift) * 0.04;                       // smooth parallax
    for (let j = rows - 1; j >= 0; j--) {                   // far rows first
      const Z = 240 + j * 24, k = 1 - j / rows;
      for (let i = 0; i < cols; i++) {
        const X = (i / (cols - 1) - 0.5) * 4200 + shift;
        const Y = Math.sin(i * 0.09 + t * 1.1) * 34
                + Math.cos(j * 0.2 + t * 0.8) * 30
                + Math.sin((i + j) * 0.05 + t * 0.6) * 24;
        const sx = w / 2 + X * f / Z;
        if (sx < -4 || sx > w + 4) continue;
        const sy = hz + (camH - Y) * f / Z;
        if (sy > h + 4) continue;
        const hi = (Y + 88) / 176;                          // wave crests brighter
        const r = Math.max(1.2, 3.2 * 240 / Z);             // nearer = bigger
        x.fillStyle = `rgba(${GOLD},${(0.25 + 0.75 * hi) * (0.35 + 0.65 * k)})`;
        x.fillRect(sx - r / 2, sy - r / 2, r, r);
      }
    }
  }

  const t0 = performance.now();
  function loop(now) { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); }
  function start() { if (running || reduce) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  size(); draw(4);                                          // static first frame (also the reduced-motion frame)
  new ResizeObserver(() => { size(); if (!running) draw(4); }).observe(box);
  new IntersectionObserver(([e]) => e.isIntersecting ? start() : stop()).observe(hero); // pause off-screen
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  hero.addEventListener('pointermove', e => { mouseX = e.clientX - hero.getBoundingClientRect().left; });
  hero.addEventListener('pointerleave', () => { mouseX = null; });
})();
