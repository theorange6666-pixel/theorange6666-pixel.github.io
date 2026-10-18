'use strict';

hexo.extend.filter.register('after_render:html', function (html) {
  if (!html.includes('</body>') || html.includes('data-laffey-pet')) return html;
  const root = hexo.config.root || '/';
  const base = `${root.replace(/\/$/, '')}/pet/`;
  return html.replace('</body>', `<link rel="stylesheet" href="${base}pet.css" data-laffey-pet><script src="${base}pet.js" defer data-image="${base}laffey.png"></script></body>`);
});
