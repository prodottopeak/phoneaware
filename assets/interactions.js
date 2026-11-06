(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const demo = document.querySelector('[data-demo]');
  if (demo) {
    const action = demo.querySelector('[data-action]'), count = demo.querySelector('[data-count]');
    const status = demo.querySelector('[data-status]'), cancel = demo.querySelector('[data-cancel]');
    const proceed = demo.querySelector('[data-continue]');
    let timer = 0, started = 0, active = false;
    const labels = demo.dataset, repeat = demo.dataset.demo === 'repeat';
    // Geometry and timing follow TimerHeroPanel/RepeatingReminderPreview and OrganicBreathingPause.
    function draw(seconds = 0, fill = 1, ripple = -1) {
      if (repeat) {
        const phase = reduced.matches ? 0 : seconds / 24 * Math.PI * 2;
        const points = Array.from({length:128}, (_,i) => {
          const a = i / 128 * Math.PI * 2, r = 96 * (1 + .045 * Math.sin(3*a+phase) + .03 * Math.sin(2*a-phase));
          return [100 + r*Math.cos(a), 100 + r*Math.sin(a)];
        });
        const d = points.map((p,i) => (i ? 'L' : 'M') + p.join(' ')).join(' ') + 'Z';
        demo.querySelectorAll('[data-blob]').forEach(p => p.setAttribute('d',d));
        const a = -Math.PI/2 + Math.PI*2*(1-fill), x = 100+100*Math.cos(a), y = 100+100*Math.sin(a);
        const sector = fill >= 1 ? 'M100 0A100 100 0 1 1 100 200A100 100 0 1 1 100 0Z' : fill <= 0 ? '' : `M100 100L${x} ${y}A100 100 0 ${fill>.5?1:0} 1 100 0Z`;
        demo.querySelector('[data-sector]').setAttribute('d',sector);
        const wave = demo.querySelector('.countdown-ripple'), scale = 1 + .24*Math.max(0,ripple);
        wave.setAttribute('transform',`translate(100 100) scale(${scale}) translate(-100 -100)`);
        wave.setAttribute('opacity',!reduced.matches && ripple>=0 && ripple<1 ? .75*(1-ripple) : 0);
      } else {
        const phase = reduced.matches ? 0 : Math.min(seconds,5)*.32;
        function blob(radius,phase) {
          const pts=Array.from({length:10},(_,i)=>{
            const a=i/10*Math.PI*2-Math.PI/2, r=radius*(1+.055*Math.sin(phase+i*1.73)+.025*Math.sin(phase*.67+i*2.41));
            return [130+r*Math.cos(a),130+r*Math.sin(a)];
          });
          const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
          return 'M'+mid(pts[9],pts[0]).join(' ')+pts.map((p,i)=>'Q'+p.join(' ')+' '+mid(p,pts[(i+1)%10]).join(' ')).join(' ')+'Z';
        }
        const outer=demo.querySelector('[data-breath]');outer.setAttribute('d',blob(119,phase));
        const breath=!reduced.matches && seconds<5 ? 1+.035*Math.sin(seconds*Math.PI/2) : 1;
        outer.setAttribute('transform',`translate(130 130) scale(${breath}) translate(-130 -130)`);
        demo.querySelector('[data-breath-inner]').setAttribute('d',blob(103.5,phase+1.4));
      }
    }
    function clear() { clearInterval(timer); timer=0; active=false; }
    function reset(focus = false) {
      clear(); demo.dataset.state = 'ready'; status.textContent = labels.ready;
      count.hidden = false; count.textContent = repeat ? '25:00' : '5';
      draw();
      action.hidden = false; action.textContent = labels.start;
      if (cancel) cancel.hidden = true;
      if (proceed) proceed.hidden = true;
      if (focus) action.focus({preventScroll: true});
    }
    function finish() {
      clear(); demo.dataset.state = 'complete'; status.textContent = labels.complete;
      if (repeat) { count.textContent = '25:00'; draw(); action.textContent = labels.again; }
      else { count.hidden = true; action.hidden = true; cancel.hidden = true; proceed.hidden = false; proceed.focus({preventScroll:true}); }
    }
    function startCycle() {
      started = performance.now(); demo.dataset.state = 'running'; status.textContent = labels.running;
      function tick() {
        if (!active) return;
        const elapsed = performance.now()-started;
        if (repeat) {
          const cycle=Math.floor(elapsed/4000), within=(elapsed%4000)/4000, remaining=Math.ceil(1500*(1-within));
          const cue=cycle>0 && elapsed%4000<1000;
          count.textContent = Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0');
          const nextStatus=cue ? labels.cue : labels.running;
          if (status.textContent!==nextStatus) status.textContent=nextStatus;
          draw(elapsed/1000,1-within,cycle>0 ? (elapsed%4000)/1000 : -1);
          if (elapsed>=9000) finish();
        } else {
          count.textContent=String(Math.max(1,Math.ceil((5000-elapsed)/1000)));
          draw(elapsed/1000);
          if (elapsed>=5000) finish();
        }
      }
      tick(); timer=setInterval(tick,33);
    }
    action.disabled = false;
    action.addEventListener('click', () => {
      if (active) { reset(); return; }
      clear(); active = true; count.hidden = false;
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
