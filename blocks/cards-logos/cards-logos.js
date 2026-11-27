import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Optimizes same-origin, non-SVG images; keeps the authored picture otherwise.
 * @param {Element} root
 */
function optimizeImages(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '300' }]));
  });
}

/**
 * Builds one logo tile from an authored row (logo image cell + brand link cell).
 * @param {Element} row
 * @returns {HTMLLIElement|null}
 */
function buildTile(row) {
  const img = row.querySelector('img');
  const visual = img ? (img.closest('picture') || img) : null;
  const link = row.querySelector('a[href]');
  const name = (link ? link.textContent : row.textContent).trim();
  if (!visual && !name) return null;

  const li = document.createElement('li');
  li.className = 'cards-logos-item';

  const wrapper = document.createElement(link ? 'a' : 'div');
  wrapper.className = 'cards-logos-link';
  if (link) {
    wrapper.href = link.href;
    if (link.target) wrapper.target = link.target;
  }

  if (visual) {
    if (img && !img.alt && name) img.alt = name;
    wrapper.append(visual);
    if (link && name) wrapper.setAttribute('aria-label', name);
  } else {
    const label = document.createElement('span');
    label.className = 'cards-logos-name';
    label.textContent = name;
    wrapper.append(label);
  }

  li.append(wrapper);
  return li;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-logos-list';
  [...block.children].forEach((row) => {
    const tile = buildTile(row);
    if (tile) ul.append(tile);
  });
  optimizeImages(ul);
  block.replaceChildren(ul);
}
