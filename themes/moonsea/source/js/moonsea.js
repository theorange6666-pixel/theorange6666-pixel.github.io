(() => {
  'use strict';
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
