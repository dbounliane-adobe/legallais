/**
 * Breadcrumb block.
 * Content model: one cell with a list (or paragraphs) of links; the last item
 * (plain text or link) is the current page.
 * Variants: univers slug (e.g. `breadcrumb (genie-climatique)`) sets the accent colour.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const items = [];
  block.querySelectorAll('li, p').forEach((node) => {
    if (node.querySelector('li')) return;
    const text = node.textContent.trim();
    if (!text) return;
    const a = node.querySelector('a');
    items.push({ text: a ? a.textContent.trim() : text, href: a?.getAttribute('href') });
  });
  if (!items.length) {
    block.querySelectorAll('a').forEach((a) => items.push({ text: a.textContent.trim(), href: a.getAttribute('href') }));
  }

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Fil d\'Ariane');
  const ol = document.createElement('ol');
  items.forEach(({ text, href }, i) => {
    const li = document.createElement('li');
    const last = i === items.length - 1;
    if (href && !last) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = text;
      li.append(link);
    } else {
      const span = document.createElement('span');
      span.textContent = text;
      if (last) span.setAttribute('aria-current', 'page');
      li.append(span);
    }
    ol.append(li);
  });
  nav.append(ol);
  block.replaceChildren(nav);
}
