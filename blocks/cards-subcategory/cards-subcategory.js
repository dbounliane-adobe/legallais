import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Sub-category tiles (category pages).
 * Content model: one row per sub-category — image cell, link cell.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const img = row.querySelector('img');
    const link = row.querySelector('a');
    if (!link && !img) return;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'cards-subcategory-tile';
    a.href = link?.getAttribute('href') || '#';
    if (img) {
      const local = img.src.startsWith(window.location.origin) && !img.src.endsWith('.svg');
      const pic = local ? createOptimizedPicture(img.src, img.alt || '', false, [{ width: '120' }]) : img.cloneNode(true);
      const media = document.createElement('span');
      media.className = 'cards-subcategory-image';
      media.append(pic);
      a.append(media);
    }
    const label = document.createElement('span');
    label.className = 'cards-subcategory-label';
    label.textContent = (link || row).textContent.trim();
    a.append(label);
    li.append(a);
    ul.append(li);
  });
  block.replaceChildren(ul);
}
