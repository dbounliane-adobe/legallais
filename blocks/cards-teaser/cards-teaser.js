import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Optimizes same-origin, non-SVG images; keeps the authored picture otherwise.
 * @param {Element} root
 */
function optimizeImages(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
}

/**
 * A cell is an image cell when it holds an image and no text.
 * @param {Element} cell
 * @returns {boolean}
 */
function isImageCell(cell) {
  return !!cell.querySelector('img') && cell.textContent.trim() === '';
}

/**
 * Classifies the body: title, description and the trailing "read more" link.
 * @param {Element} body
 */
function decorateBody(body) {
  const title = body.querySelector('h1, h2, h3, h4, h5, h6');
  if (title) title.classList.add('cards-teaser-title');

  const paragraphs = [...body.querySelectorAll(':scope > p')];
  const last = paragraphs[paragraphs.length - 1];
  const lastLink = last && last.querySelector('a[href]');
  if (lastLink && last.textContent.trim() === lastLink.textContent.trim()) {
    last.classList.add('cards-teaser-more');
    lastLink.classList.remove('button', 'primary', 'secondary');
    if (last.classList.contains('button-container')) last.classList.remove('button-container');
  }

  // when the title is not linked, link it to the "read more" target
  if (title && lastLink && !title.querySelector('a')) {
    const a = document.createElement('a');
    a.href = lastLink.href;
    while (title.firstChild) a.append(title.firstChild);
    title.append(a);
  }
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-teaser-list';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-teaser-card';
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((cell) => {
      if (isImageCell(cell)) {
        cell.className = 'cards-teaser-image';
      } else {
        cell.className = 'cards-teaser-body';
        decorateBody(cell);
      }
    });
    if (li.children.length) ul.append(li);
  });

  optimizeImages(ul);
  block.replaceChildren(ul);
}
