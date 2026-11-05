(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const demo = document.querySelector('[data-demo]');
  if (demo) {
    const action = demo.querySelector('[data-action]'), count = demo.querySelector('[data-count]');
    const status = demo.querySelector('[data-status]'), cancel = demo.querySelector('[data-cancel]');
    const proceed = demo.querySelector('[data-continue]'), ring = demo.querySelector('.dial-progress');
    let timer = 0, handoff = 0, started = 0, cycles = 0, active = false, running = false;
    const labels = demo.dataset, repeat = demo.dataset.demo === 'repeat';
    function clear() { clearInterval(timer); clearTimeout(handoff); timer = handoff = 0; active = running = false; }
    function reset(focus = false) {
      clear(); demo.dataset.state = 'ready'; status.textContent = labels.ready;
      count.hidden = false; count.textContent = repeat ? '0:06' : '3';
      if (ring) ring.style.strokeDashoffset = '0';
      action.hidden = false; action.textContent = labels.start;
      if (cancel) cancel.hidden = true;
      if (proceed) proceed.hidden = true;
      if (focus) action.focus({preventScroll: true});
    }
    function finish() {
      clear(); demo.dataset.state = 'complete'; status.textContent = labels.complete;
      if (repeat) { count.textContent = '0:06'; ring.style.strokeDashoffset = '0'; action.textContent = labels.again; }
      else { count.hidden = true; action.hidden = true; cancel.hidden = false; proceed.hidden = false; }
    }
    function startCycle() {
      started = performance.now(); running = true; demo.dataset.state = 'running'; status.textContent = labels.running;
      function tick() {
        if (!active) return;
        const duration = repeat ? 6000 : 3000, elapsed = Math.min(duration, performance.now() - started);
        const seconds = Math.max(0, Math.ceil((duration - elapsed) / 1000));
        count.textContent = repeat ? '0:0' + seconds : String(seconds);
        if (ring) ring.style.strokeDashoffset = (elapsed / duration * 100).toFixed(2);
        if (elapsed < duration) return;
        clearInterval(timer); timer = 0; running = false;
        if (!repeat) { finish(); return; }
        cycles += 1; demo.dataset.state = 'cue'; status.textContent = labels.cue;
        handoff = setTimeout(() => { if (!active) return; if (cycles < 2) startCycle(); else finish(); }, 450);
      }
      tick(); timer = setInterval(tick, 100);
    }
    action.disabled = false;
    action.addEventListener('click', () => {
      if (active) { reset(); return; }
      clear(); active = true; cycles = 0; count.hidden = false;
      if (reduced.matches) { finish(); if (cancel) cancel.focus({preventScroll: true}); return; }
      if (repeat) action.textContent = labels.stop;
      else { action.hidden = true; cancel.hidden = false; proceed.hidden = true; cancel.focus({preventScroll: true}); }
      startCycle();
    });
    cancel?.addEventListener('click', () => reset(true));
    proceed?.addEventListener('click', () => reset(true));
    document.addEventListener('visibilitychange', () => { if (document.hidden && active) reset(); });
    reduced.addEventListener('change', () => reset());
    if (window.IntersectionObserver) new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting && active) reset();
    }).observe(demo);
    reset();
  }
  if (!window.IntersectionObserver || reduced.matches) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
  }, {threshold: 0.05});
  document.querySelectorAll('.story,.step').forEach(element => { observer.observe(element); element.classList.add('has-reveal'); });
  reduced.addEventListener('change', () => {
    if (reduced.matches) { observer.disconnect(); document.querySelectorAll('.has-reveal').forEach(element => element.classList.add('is-visible')); }
  });
})();
