(() => {
  'use strict';
  // A decorative keyboard surprise; typing fields and shortcuts stay untouched.
  let loveKeys = '';
  let lastLoveKey = 0;
  let heartLayer = null;
  const resetLoveKeys = () => { loveKeys = ''; };
  function showHearts() {
    if (heartLayer) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const layer = document.createElement('div');
    layer.className = 'love-hearts';
    layer.setAttribute('aria-hidden', 'true');
    const count = reduced ? 8 : 44;
    for (let i = 0; i < count; i++) {
      const heart = document.createElement('span');
      heart.className = 'love-heart';
      heart.style.setProperty('--left', `${5 + Math.random() * 90}%`);
      heart.style.setProperty('--size', `${28 + Math.random() * 32}px`);
      heart.style.setProperty('--drift', `${Math.random() * 160 - 80}px`);
      heart.style.setProperty('--tilt', `${Math.random() * 50 - 25}deg`);
      heart.style.setProperty('--delay', `${Math.random() * 0.6}s`);
      heart.style.setProperty('--duration', `${2.1 + Math.random() * 0.6}s`);
      layer.append(heart);
    }
    heartLayer = layer;
    document.body.append(layer);
    setTimeout(() => {
      layer.remove();
      heartLayer = null;
    }, reduced ? 1400 : 3500);
  }
  document.addEventListener('keydown', event => {
    const editing = event.composedPath().some(element => element instanceof HTMLElement &&
      (element.isContentEditable || element.matches('input, textarea, select, [role="textbox"], [role="combobox"]')));
    if (editing || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) {
      resetLoveKeys();
      return;
    }
    if (event.repeat) return;
    if (event.key.length !== 1) { resetLoveKeys(); return; }
    const now = Date.now();
    if (now - lastLoveKey > 3000) resetLoveKeys();
    lastLoveKey = now;
    loveKeys = (loveKeys + event.key.toLowerCase()).slice(-4);
    if (loveKeys === 'love') {
      resetLoveKeys();
      showHearts();
    }
  });
  document.addEventListener('focusin', resetLoveKeys);
  window.addEventListener('blur', resetLoveKeys);
  document.addEventListener('visibilitychange', resetLoveKeys);

  const clock = document.querySelector('.hero-clock');
  if (clock) {
    const time = clock.querySelector('.clock-time');
    const date = clock.querySelector('.clock-date');
    const timeFormat = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });
    const dateFormat = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });
    function updateClock() {
      const now = new Date();
      time.textContent = timeFormat.format(now);
      time.dateTime = now.toISOString();
      const label = dateFormat.format(now);
      if (date.textContent !== label) date.textContent = label;
    }
    updateClock();
    setInterval(updateClock, 1000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) updateClock();
    });
  }
  const link = document.querySelector('a[href="#latest"]');
  const target = document.getElementById('latest');
  if (link && target) {
    link.addEventListener('click', event => {
      event.preventDefault();
      history.replaceState(null, '', '#latest');
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      const heading = target.querySelector('h2');
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    });
  }
})();
