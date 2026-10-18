(() => {
  'use strict';
  const script = document.currentScript;
  if (!script || document.querySelector('.laffey-pet')) return;
  const storageKey = 'laffey-pet-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch (_) { /* Storage is optional. */ }
  let sleeping = Boolean(saved.sleeping);
  const pet = document.createElement('aside');
  pet.className = 'laffey-pet';
  pet.setAttribute('aria-label', '拉菲互动桌宠');
  pet.innerHTML = '<div class="laffey-speech" role="status" aria-live="polite"></div><button class="laffey-character" type="button" aria-label="点击和拉菲打招呼，也可以拖动位置"><img alt="Q 版拉菲" draggable="false"></button><div class="laffey-actions"><button type="button" data-action="greet">互动</button><button type="button" data-action="sleep">休息</button><button type="button" data-action="reset">复位</button><button type="button" data-action="hide">收起</button></div>';
  pet.querySelector('img').src = script.dataset.image;
  const restore = document.createElement('button');
  restore.className = 'laffey-restore';
  restore.type = 'button';
  restore.textContent = '召唤拉菲';
  restore.setAttribute('aria-label', '显示拉菲桌宠');
  document.body.append(pet, restore);
  const speech = pet.querySelector('.laffey-speech');
  const character = pet.querySelector('.laffey-character');
  const sleepButton = pet.querySelector('[data-action="sleep"]');
  let speechTimer;
  let reactTimer;
  let drag = null;
  let suppressClick = false;
  let line = 0;
  const greetings = ['欢迎回来，今天也一起读点什么吧。', '这篇文章，看起来很有趣呢。', '拉菲在这里，陪你慢慢看。', '休息一下，再继续记录喜欢的事吧。'];
  const persist = () => { try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch (_) { /* Private mode remains usable. */ } };
  function say(text) {
    clearTimeout(speechTimer);
    speech.textContent = text;
    speech.classList.add('is-visible');
    speechTimer = setTimeout(() => speech.classList.remove('is-visible'), 5500);
  }
  function react() {
    if (sleeping) { say('拉菲正在休息，点击“唤醒”再一起玩吧。'); return; }
    say(greetings[line++ % greetings.length]);
    clearTimeout(reactTimer);
    pet.classList.remove('is-reacting');
    void character.offsetWidth;
    pet.classList.add('is-reacting');
    reactTimer = setTimeout(() => pet.classList.remove('is-reacting'), 700);
  }
  function setPosition(x, y) {
    const maxX = Math.max(0, innerWidth - pet.offsetWidth - 8);
    const maxY = Math.max(0, innerHeight - pet.offsetHeight - 8);
    const left = Math.min(maxX, Math.max(8, x));
    const top = Math.min(maxY, Math.max(8, y));
    pet.style.left = `${left}px`; pet.style.top = `${top}px`;
    pet.style.right = 'auto'; pet.style.bottom = 'auto';
    saved.x = left; saved.y = top;
  }
  function setSleep(value) {
    sleeping = value; saved.sleeping = value;
    pet.classList.toggle('is-sleeping', value);
    sleepButton.textContent = value ? '唤醒' : '休息';
    sleepButton.setAttribute('aria-pressed', String(value));
  }
  function hidePet(hidden) {
    pet.hidden = hidden; restore.hidden = !hidden;
    saved.hidden = hidden; persist();
  }
  setSleep(sleeping);
  hidePet(typeof saved.hidden === 'boolean' ? saved.hidden : matchMedia('(max-width: 600px)').matches);
  if (Number.isFinite(saved.x) && Number.isFinite(saved.y) && !pet.hidden) setPosition(saved.x, saved.y);
  character.addEventListener('click', event => {
    if (event.detail === 0) react();
    else if (suppressClick) suppressClick = false;
  });
  character.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    const rect = pet.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, moved: false };
    character.setPointerCapture(event.pointerId);
  });
  character.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x; const dy = event.clientY - drag.y;
    if (Math.hypot(dx, dy) > 6) drag.moved = true;
    if (!drag.moved) return;
    pet.classList.add('is-dragging');
    setPosition(drag.left + dx, drag.top + dy);
  });
  function finishDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    const moved = drag.moved;
    drag = null;
    pet.classList.remove('is-dragging');
    if (character.hasPointerCapture(event.pointerId)) character.releasePointerCapture(event.pointerId);
    suppressClick = true;
    if (moved) { persist(); say('在这里陪你，好。'); }
    else if (event.type !== 'pointercancel') react();
  }
  character.addEventListener('pointerup', finishDrag);
  character.addEventListener('pointercancel', finishDrag);
  pet.querySelector('.laffey-actions').addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'greet') react();
    if (action === 'sleep') { setSleep(!sleeping); persist(); say(sleeping ? '拉菲先休息一会儿……' : '醒来了，继续陪你。'); }
    if (action === 'reset') {
      pet.style.left = ''; pet.style.top = ''; pet.style.right = ''; pet.style.bottom = '';
      delete saved.x; delete saved.y; persist(); say('回到这里啦。');
    }
    if (action === 'hide') { hidePet(true); restore.focus(); }
  });
  restore.addEventListener('click', () => {
    hidePet(false);
    if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) setPosition(saved.x, saved.y);
    character.focus(); say('拉菲回来了。');
  });
  addEventListener('resize', () => {
    if (!pet.hidden && pet.style.left) { const rect = pet.getBoundingClientRect(); setPosition(rect.left, rect.top); persist(); }
  });
  setTimeout(() => { if (!pet.hidden) say('欢迎回来。可以拖动拉菲，也可以点我打招呼。'); }, 700);
})();
