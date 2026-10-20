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
  sleepPair.innerHTML = '<span class="companion-sleep-art"></span>';
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
  let heartTimer;
  let sleepFadeTimer;
  let sleepAnimation;
  let gesture = 0;
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
    gesture++;
    meeting = null;
    pairHeart.hidden = true;
    pairHeart.getAnimations().forEach(animation => animation.cancel());
    clearTimeout(cuddleTimer);
    clearTimeout(heartTimer);
    pets.forEach(p => {
      p.goal = null;
      p.gestureAnimation?.cancel();
      pose(p, sleeping() ? 'sleep' : 'idle');
    });
    stage.dataset.phase = sleeping() ? 'sleeping' : 'idle';
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
  function updateSleepPair(transition = false) {
    const paired = saved.mode === 'dogs' && sleeping() && pets.length === 2;
    const wasPaired = stage.classList.contains('is-pair-sleep');
    clearTimeout(sleepFadeTimer);
    sleepAnimation?.cancel();
    stage.classList.toggle('is-pair-sleep', paired);
    if (!paired) {
      if (wasPaired && transition && !reduced.matches && !saved.hidden) {
        sleepAnimation = sleepPair.animate([
          { opacity: 1, transform: 'translateY(0) scale(1)' },
          { opacity: 0, transform: 'translateY(-5px) scale(.97)' }
        ], { duration: 560, easing: 'cubic-bezier(.25,.1,.25,1)' });
        sleepFadeTimer = setTimeout(() => { sleepPair.hidden = true; }, 560);
      } else sleepPair.hidden = true;
      return;
    }
    sleepPair.hidden = false;
    const s = size(), width = s * 1.9, height = s * 1.25;
    const center = (pets[0].x + pets[1].x) / 2 + s / 2;
    sleepPair.style.width = `${width}px`;
    sleepPair.style.height = `${height}px`;
    sleepPair.style.left = `${Math.max(4, Math.min(innerWidth - width - 4, center - width / 2))}px`;
    sleepPair.style.top = `${Math.max(4, Math.min(innerHeight - height - 62, Math.min(pets[0].y, pets[1].y) - s * .25))}px`;
    if (!wasPaired && transition && !reduced.matches && !saved.hidden) {
      sleepAnimation = sleepPair.animate([
        { opacity: 0, transform: 'translateY(7px) scale(.94)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], { duration: 720, easing: 'cubic-bezier(.22,.61,.36,1)' });
    }
  }
  function setSleeping(value, transition = true) {
    const waking = sleeping() && !value && transition;
    saved.sleeping[saved.mode] = value;
    pets.forEach(p => {
      p.goal = null;
      if (!value) p.gestureAnimation?.cancel();
      pose(p, value ? 'sleep' : (waking && !reduced.matches ? 'waking' : 'idle'));
    });
    sleepButton.textContent = value ? '唤醒' : '休息';
    sleepButton.setAttribute('aria-pressed', String(value));
    updateSleepPair(transition);
    stage.dataset.phase = value ? 'sleeping' : (waking && !reduced.matches ? 'waking' : 'idle');
    if (waking && !reduced.matches) {
      const current = gesture;
      cuddleTimer = setTimeout(() => {
        if (gesture !== current) return;
        pets.forEach(p => { if (p.action === 'waking') pose(p, 'idle'); });
        if (stage.dataset.phase === 'waking') stage.dataset.phase = 'idle';
      }, 700);
    }
    persist();
  }
  function showPairHeart() {
    pairHeart.getAnimations().forEach(animation => animation.cancel());
    const s = size();
    pairHeart.style.left = `${(pets[0].x + pets[1].x) / 2 + s / 2 - 22}px`;
    pairHeart.style.top = `${Math.max(8, Math.min(pets[0].y, pets[1].y) - 22)}px`;
    pairHeart.hidden = false;
    if (!reduced.matches) pairHeart.animate([
      { opacity: 0, transform: 'translateY(7px) scale(.6)' },
      { opacity: .9, transform: 'translateY(0) scale(1)', offset: .22 },
      { opacity: .8, transform: 'translateY(-7px) scale(1.04)', offset: .65 },
      { opacity: 0, transform: 'translateY(-20px) scale(.9)' }
    ], { duration: 2450, easing: 'ease-in-out', fill: 'both' });
  }
  function finishMeeting() {
    const reason = meeting;
    meeting = null;
    if (reason === 'sleep') {
      const settle = () => { setSleeping(true); say('小白靠着小黄，睡个好觉。'); remember(); };
      if (reduced.matches) settle();
      else {
        stage.dataset.phase = 'settling';
        pets.forEach((p, index) => {
          pose(p, 'settle');
          p.gestureAnimation = p.el.querySelector('.companion-gesture').animate([
            { transform: 'translateY(0) scale(1) rotate(0)' },
            { transform: `translateY(7px) scale(.96) rotate(${index ? -3 : 3}deg)` }
          ], { duration: 460, easing: 'ease-in-out', fill: 'forwards' });
        });
        const current = gesture;
        cuddleTimer = setTimeout(() => { if (gesture === current) settle(); }, 460);
      }
    } else if (reason === 'release') {
      stage.dataset.phase = 'idle';
    } else if (reason) {
      stage.dataset.phase = 'cuddling';
      pets.forEach(p => pose(p, 'cuddle'));
      say('找到你啦，贴贴！');
      const current = gesture;
      if (!reduced.matches) pets.forEach((p, index) => {
        const x = index ? -6 : 14, angle = index ? -3 : 6;
        p.gestureAnimation = p.el.querySelector('.companion-gesture').animate([
          { transform: 'translate(0,0) rotate(0)', offset: 0 },
          { transform: `translate(${x}px,-2px) rotate(${angle}deg)`, offset: .2 },
          { transform: `translate(${x + (index ? -2 : 3)}px,-1px) rotate(${angle + (index ? -1 : 1)}deg)`, offset: .34 },
          { transform: `translate(${x}px,-2px) rotate(${angle}deg)`, offset: .47 },
          { transform: `translate(${x + (index ? -1 : 2)}px,-1px) rotate(${angle}deg)`, offset: .61 },
          { transform: `translate(${x}px,-2px) rotate(${angle}deg)`, offset: .75 },
          { transform: 'translate(0,0) rotate(0)', offset: 1 }
        ], { duration: 3300, easing: 'ease-in-out', fill: 'forwards' });
      });
      heartTimer = setTimeout(() => { if (gesture === current) showPairHeart(); }, reduced.matches ? 0 : 480);
      cuddleTimer = setTimeout(() => {
        if (gesture !== current) return;
        pairHeart.hidden = true;
        pets.forEach(p => { p.gestureAnimation?.cancel(); pose(p, 'idle'); });
        if (!reduced.matches) {
          meeting = 'release'; stage.dataset.phase = 'separating';
          moveTo(pets[0], pets[0].x - size() * .07, pets[0].y, 650, 'idle');
          moveTo(pets[1], pets[1].x + size() * .07, pets[1].y, 650, 'idle');
          startMotion();
        } else stage.dataset.phase = 'idle';
      }, reduced.matches ? 1500 : 3300);
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
      p.goal.elapsed += dt * 1000;
      const progress = Math.min(1, p.goal.elapsed / p.goal.duration);
      const eased = progress ** 3 * (progress * (progress * 6 - 15) + 10);
      position(p, p.goal.startX + (p.goal.x - p.goal.startX) * eased, p.goal.startY + (p.goal.y - p.goal.startY) * eased);
      if (progress === 1) {
        position(p, p.goal.x, p.goal.y); p.goal = null; pose(p, 'idle');
      } else {
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
  function moveTo(p, x, y, duration, action = 'walk') {
    const goal = clamp(x, y);
    if (reduced.matches) { position(p, goal.x, goal.y); p.goal = null; }
    else {
      const distance = Math.hypot(goal.x - p.x, goal.y - p.y);
      p.goal = { ...goal, startX: p.x, startY: p.y, elapsed: 0, duration: duration ?? Math.max(650, Math.min(4000, distance / (meeting ? 190 : 55) * 1000)) };
      if (action === 'walk' && Math.abs(goal.x - p.x) > 12) face(p, goal.x > p.x ? 1 : -1);
      pose(p, action);
    }
  }
  function gather(reason = 'cuddle') {
    if (saved.mode !== 'dogs' || saved.hidden || drag) return;
    clearMeeting();
    setSleeping(false);
    meeting = reason;
    stage.dataset.phase = 'approaching';
    const s = size();
    const center = Math.max(s * .9, Math.min(innerWidth - s * .9, (pets[0].x + pets[1].x) / 2 + s / 2));
    const y = (pets[0].y + pets[1].y) / 2;
    const targets = [clamp(center - s * .85, y), clamp(center - s * .15, y)];
    const distance = Math.max(...pets.map((p, i) => Math.hypot(p.x - targets[i].x, p.y - targets[i].y)));
    const duration = Math.max(800, Math.min(3200, distance / 190 * 1000));
    pets.forEach((p, i) => moveTo(p, targets[i].x, targets[i].y, duration));
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
      el.innerHTML = '<span class="companion-gesture"><span class="companion-facing"><span class="companion-art"></span></span></span><span class="companion-zzz" aria-hidden="true">z z Z</span>';
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
    setSleeping(sleeping(), false); setHidden(saved.hidden);
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
    if (reduced.matches) {
      pets.forEach(p => p.gestureAnimation?.cancel());
      pairHeart.getAnimations().forEach(animation => animation.cancel());
      updateSleepPair();
    }
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
