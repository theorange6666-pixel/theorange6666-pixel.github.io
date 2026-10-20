(() => {
  'use strict';
  const script = document.currentScript;
  if (!script || document.querySelector('.companion-controls')) return;
  const base = new URL('./', script.src);
  const key = 'moonsea-companions-v2';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (_) {}
  saved.mode = saved.mode === 'laffey' ? 'laffey' : 'dogs';
  saved.positions = saved.positions && typeof saved.positions === 'object' ? saved.positions : {};
  saved.sleeping = saved.sleeping && typeof saved.sleeping === 'object' ? saved.sleeping : {};
  if (typeof saved.hidden !== 'boolean') saved.hidden = matchMedia('(max-width: 600px)').matches;
  const stage = document.createElement('div');
  stage.className = 'companion-stage';
  const ui = document.createElement('aside');
  ui.className = 'companion-controls';
  ui.setAttribute('aria-label', '宠物设置');
  ui.innerHTML = '<div class="companion-menu" id="companion-menu" hidden><label>陪伴你的伙伴<select aria-label="选择宠物"><option value="dogs">小白与小金毛</option><option value="laffey">拉菲</option></select></label><div class="companion-actions"><button type="button" data-action="greet">贴贴</button><button type="button" data-action="sleep">休息</button><button type="button" data-action="reset">复位</button><button type="button" data-action="hide">收起</button></div><p>点击互动 · 拖动位置 · 方向键微调</p></div><button class="companion-toggle" type="button" aria-expanded="false" aria-controls="companion-menu">小狗伙伴 · 设置</button><button class="companion-restore" type="button" hidden>召唤小狗</button>';
  const speech = document.createElement('div');
  speech.className = 'companion-speech';
  speech.setAttribute('role', 'status');
  speech.setAttribute('aria-live', 'polite');
  const pairHeart = document.createElement('span');
  pairHeart.className = 'companion-pair-heart';
  pairHeart.setAttribute('aria-hidden', 'true');
  pairHeart.hidden = true;
  stage.append(pairHeart);
  const sleepPair = document.createElement('span');
  sleepPair.className = 'companion-sleep-pair';
  sleepPair.setAttribute('aria-hidden', 'true');
  sleepPair.hidden = true;
  stage.append(sleepPair);
  document.body.append(stage, speech, ui);
  const toggle = ui.querySelector('.companion-toggle');
  const restore = ui.querySelector('.companion-restore');
  const menu = ui.querySelector('.companion-menu');
  const select = ui.querySelector('select');
  const sleepButton = ui.querySelector('[data-action="sleep"]');
  let pets = [];
  let drag = null;
  let meeting = null;
  let followTarget = null;
  let frame = 0;
  let lastFrame = 0;
  let session = 0;
  let speechTimer;
  let cuddleTimer;
  const size = () => innerWidth <= 600 ? 108 : 136;
  const persist = () => { try { localStorage.setItem(key, JSON.stringify(saved)); } catch (_) {} };
  const sleeping = () => Boolean(saved.sleeping[saved.mode]);
  function say(text) {
    speech.textContent = text;
    speech.classList.add('is-visible');
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => speech.classList.remove('is-visible'), 3500);
  }
  function clamp(x, y) {
    const s = size();
    return { x: Math.max(4, Math.min(innerWidth - s - 4, x)), y: Math.max(4, Math.min(innerHeight - s - 62, y)) };
  }
  function position(p, x, y) {
    Object.assign(p, clamp(x, y));
    p.el.style.left = `${p.x}px`;
    p.el.style.top = `${p.y}px`;
  }
  function remember() {
    saved.positions[saved.mode] = pets.map(p => ({ x: p.x, y: p.y }));
    persist();
  }
  function pose(p, action) {
    p.action = action;
    p.el.dataset.action = action;
  }
  function face(p, direction) {
    p.direction = direction;
    p.el.style.setProperty('--facing', direction);
  }
  function closeMenu() {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }
  function clearMeeting() {
    meeting = null;
    pairHeart.hidden = true;
    clearTimeout(cuddleTimer);
    pets.forEach(p => { p.goal = null; pose(p, sleeping() ? 'sleep' : 'idle'); });
  }
  function cancelDrag() {
    if (!drag) return;
    const p = drag.p;
    if (p.el.hasPointerCapture(drag.id)) p.el.releasePointerCapture(drag.id);
    drag = null;
    p.el.classList.remove('is-dragging');
  }
  function setHidden(hidden) {
    saved.hidden = hidden;
    if (hidden) {
      cancelDrag(); clearMeeting();
      cancelAnimationFrame(frame); frame = 0;
      speech.classList.remove('is-visible'); closeMenu();
    }
    stage.hidden = hidden;
    toggle.hidden = hidden;
    restore.hidden = !hidden;
    persist();
  }
  function updateSleepPair() {
    const paired = saved.mode === 'dogs' && sleeping() && pets.length === 2;
    stage.classList.toggle('is-pair-sleep', paired);
    sleepPair.hidden = !paired;
    if (!paired) return;
    const s = size(), width = s * 1.9, height = s * 1.25;
    const center = (pets[0].x + pets[1].x) / 2 + s / 2;
    sleepPair.style.width = `${width}px`;
    sleepPair.style.height = `${height}px`;
    sleepPair.style.left = `${Math.max(4, Math.min(innerWidth - width - 4, center - width / 2))}px`;
    sleepPair.style.top = `${Math.max(4, Math.min(innerHeight - height - 62, Math.min(pets[0].y, pets[1].y) - s * .25))}px`;
  }
  function setSleeping(value) {
    saved.sleeping[saved.mode] = value;
    pets.forEach(p => { p.goal = null; pose(p, value ? 'sleep' : 'idle'); });
    sleepButton.textContent = value ? '唤醒' : '休息';
    sleepButton.setAttribute('aria-pressed', String(value));
    updateSleepPair();
    persist();
  }
  function showPairHeart() {
    const s = size();
    pairHeart.style.left = `${(pets[0].x + pets[1].x) / 2 + s / 2 - 22}px`;
    pairHeart.style.top = `${Math.max(8, Math.min(pets[0].y, pets[1].y) - 22)}px`;
    pairHeart.hidden = false;
  }
  function finishMeeting() {
    const reason = meeting;
    meeting = null;
    if (reason === 'sleep') {
      setSleeping(true);
      say('小白靠着小黄，睡个好觉。');
    } else if (reason) {
      pets.forEach(p => pose(p, 'cuddle'));
      showPairHeart();
      say('找到你啦，贴贴！');
      const currentSession = session;
      cuddleTimer = setTimeout(() => {
        if (session !== currentSession) return;
        pairHeart.hidden = true;
        pets.forEach(p => pose(p, sleeping() ? 'sleep' : 'idle'));
      }, 2600);
    }
    remember();
  }
  function animate(now) {
    frame = 0;
    if (document.hidden || saved.hidden || drag) return;
    const dt = Math.min((now - (lastFrame || now)) / 1000, .05);
    lastFrame = now;
    let moving = false;
    pets.forEach(p => {
      if (!p.goal) return;
      const dx = p.goal.x - p.x, dy = p.goal.y - p.y;
      const distance = Math.hypot(dx, dy);
      const step = (meeting ? 260 : 55) * dt;
      if (distance <= Math.max(step, 1)) {
        position(p, p.goal.x, p.goal.y); p.goal = null; pose(p, 'idle');
      } else {
        position(p, p.x + dx / distance * step, p.y + dy / distance * step);
        if (Math.abs(dx) > 1) face(p, dx > 0 ? 1 : -1);
        moving = true;
      }
    });
    if (moving) frame = requestAnimationFrame(animate);
    else {
      lastFrame = 0;
      if (meeting) { face(pets[0], 1); face(pets[1], -1); finishMeeting(); }
      else remember();
    }
  }
  function startMotion() {
    if (!frame && !saved.hidden && !document.hidden) { lastFrame = 0; frame = requestAnimationFrame(animate); }
  }
  function moveTo(p, x, y) {
    const goal = clamp(x, y);
    if (reduced.matches) { position(p, goal.x, goal.y); p.goal = null; }
    else { p.goal = goal; pose(p, 'walk'); }
  }
  function gather(reason = 'cuddle') {
    if (saved.mode !== 'dogs' || saved.hidden || drag) return;
    clearMeeting();
    setSleeping(false);
    meeting = reason;
    const s = size();
    const center = Math.max(s * .9, Math.min(innerWidth - s * .9, (pets[0].x + pets[1].x) / 2 + s / 2));
    const y = (pets[0].y + pets[1].y) / 2;
    moveTo(pets[0], center - s * .85, y);
    moveTo(pets[1], center - s * .15, y);
    if (reduced.matches) { face(pets[0], 1); face(pets[1], -1); finishMeeting(); }
    else startMotion();
  }
  function react(p) {
    if (sleeping()) { say(saved.mode === 'dogs' ? '小狗们睡着啦，可以在设置里唤醒。' : '拉菲正在休息，可以在设置里唤醒。'); return; }
    clearMeeting();
    pose(p, 'happy');
    if (saved.mode === 'dogs') {
      const other = pets.find(item => item !== p);
      face(other, p.x < other.x ? -1 : 1);
      say(p.name === '小白' ? '小白：你来啦！一起玩吧。' : '小金毛：今天也陪着你。');
    } else say('拉菲在这里，陪你慢慢看。');
    const currentSession = session;
    setTimeout(() => { if (session === currentSession && p.action === 'happy') pose(p, sleeping() ? 'sleep' : 'idle'); }, 750);
  }
  function bindPet(p) {
    p.el.addEventListener('click', () => {
      if (p.suppressClick) { p.suppressClick = false; return; }
      react(p);
    });
    p.el.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      if (saved.mode === 'dogs' && sleeping()) setSleeping(false);
      clearMeeting(); cancelDrag();
      cancelAnimationFrame(frame); frame = 0;
      drag = { p, id: event.pointerId, x: event.clientX, y: event.clientY, left: p.x, top: p.y, moved: false };
      p.el.setPointerCapture(event.pointerId);
    });
    p.el.addEventListener('pointermove', event => {
      if (!drag || drag.p !== p || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (Math.hypot(dx, dy) > 5) drag.moved = true;
      if (!drag.moved) return;
      p.el.classList.add('is-dragging');
      position(p, drag.left + dx, drag.top + dy);
    });
    const endDrag = event => {
      if (!drag || drag.p !== p || event.pointerId !== drag.id) return;
      const moved = drag.moved;
      cancelDrag();
      p.suppressClick = moved && event.type !== 'pointercancel';
      if (moved && saved.mode === 'dogs') followTarget = p;
      remember();
      if (moved && saved.mode === 'dogs' && !sleeping() && event.type !== 'pointercancel' && Math.hypot(pets[0].x - pets[1].x, pets[0].y - pets[1].y) < size()) gather();
    };
    p.el.addEventListener('pointerup', endDrag);
    p.el.addEventListener('pointercancel', endDrag);
    p.el.addEventListener('keydown', event => {
      const directions = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] };
      if (!directions[event.key]) return;
      if (saved.mode === 'dogs' && sleeping()) setSleeping(false);
      event.preventDefault(); clearMeeting();
      position(p, p.x + directions[event.key][0], p.y + directions[event.key][1]); remember();
    });
  }
  function render() {
    session++; cancelDrag(); clearMeeting();
    followTarget = null;
    cancelAnimationFrame(frame); frame = 0;
    pets.forEach(p => p.el.remove());
    const dogs = saved.mode === 'dogs';
    const names = dogs ? ['小白', '小金毛'] : ['拉菲'];
    pets = names.map((name, index) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `companion-pet ${dogs ? (index ? 'is-golden' : 'is-white') : 'is-laffey'}`;
      el.setAttribute('aria-label', `${name}：点击互动，拖动移动，方向键调整位置`);
      el.innerHTML = '<span class="companion-facing"><span class="companion-art"></span></span><span class="companion-zzz" aria-hidden="true">z z Z</span>';
      const art = el.querySelector('.companion-art');
      if (!dogs) art.style.backgroundImage = `url("${new URL('laffey.png', base).href}")`;
      stage.append(el);
      const p = { el, name, x: 0, y: 0, action: 'idle', direction: index ? -1 : 1, goal: null, suppressClick: false };
      const stored = saved.positions[saved.mode]?.[index];
      position(p, Number.isFinite(stored?.x) ? stored.x : innerWidth - size() * (dogs ? 2.2 - index : 1.25) - 14, Number.isFinite(stored?.y) ? stored.y : innerHeight - size() - 72);
      face(p, index ? -1 : 1);
      bindPet(p);
      return p;
    });
    select.value = saved.mode;
    toggle.textContent = dogs ? '小狗伙伴 · 设置' : '拉菲 · 设置';
    restore.textContent = dogs ? '召唤小狗' : '召唤拉菲';
    ui.querySelector('[data-action="greet"]').textContent = dogs ? '贴贴' : '互动';
    setSleeping(sleeping()); setHidden(saved.hidden);
  }
  toggle.addEventListener('click', () => { menu.hidden = !menu.hidden; toggle.setAttribute('aria-expanded', String(!menu.hidden)); });
  restore.addEventListener('click', () => { setHidden(false); toggle.focus(); say(saved.mode === 'dogs' ? '小白和小金毛来陪你啦。' : '拉菲回来了。'); });
  select.addEventListener('change', () => { remember(); saved.mode = select.value; render(); say(saved.mode === 'dogs' ? '小白和小金毛来啦。' : '换拉菲陪你一会儿。'); });
  ui.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'greet') { if (saved.mode === 'dogs') gather(); else react(pets[0]); }
    if (action === 'sleep') {
      if (sleeping()) { clearMeeting(); setSleeping(false); say('醒来啦，继续陪你。'); }
      else if (saved.mode === 'dogs') gather('sleep');
      else { clearMeeting(); setSleeping(true); say('拉菲先休息一会儿……'); }
    }
    if (action === 'reset') { delete saved.positions[saved.mode]; render(); say('回到这里啦。'); }
    if (action === 'hide') { setHidden(true); restore.focus(); }
  });
  document.addEventListener('pointerdown', event => { if (!ui.contains(event.target)) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); toggle.focus(); } });
  document.addEventListener('companion:love', () => {
    if (saved.hidden) return;
    if (saved.mode === 'dogs') gather(); else react(pets[0]);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelDrag(); cancelAnimationFrame(frame); frame = 0; }
    else if (pets.some(p => p.goal)) startMotion();
  });
  addEventListener('blur', cancelDrag);
  addEventListener('resize', () => {
    cancelDrag(); clearMeeting();
    pets.forEach(p => { position(p, p.x, p.y); pose(p, sleeping() ? 'sleep' : 'idle'); }); remember();
    updateSleepPair();
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) { cancelAnimationFrame(frame); frame = 0; pets.forEach(p => { if (p.goal) { position(p, p.goal.x, p.goal.y); p.goal = null; pose(p, 'idle'); } }); if (meeting) finishMeeting(); }
  });
  setInterval(() => {
    if (saved.mode !== 'dogs' || saved.hidden || sleeping() || document.hidden || drag || meeting || frame || reduced.matches || pets.some(p => p.action !== 'idle')) return;
    const [white, golden] = pets;
    if (Math.hypot(white.x - golden.x, white.y - golden.y) > size() * 2.5) {
      const friend = followTarget || white;
      const follower = friend === white ? golden : white;
      moveTo(follower, friend.x + (follower.x > friend.x ? 1 : -1) * size() * .9, friend.y);
    } else {
      followTarget = null;
      const p = pets[Math.random() > .5 ? 0 : 1];
      moveTo(p, p.x + (Math.random() - .5) * 110, p.y);
    }
    startMotion();
  }, 8500);
  render();
})();
