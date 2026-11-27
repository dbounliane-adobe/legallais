import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Optimizes same-origin, non-SVG images; keeps the authored picture otherwise.
 * @param {Element} root
 */
function optimizeImages(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]));
  });
}

/**
 * A column is an image column when it holds an image and no text.
 * @param {Element} col
 * @returns {boolean}
 */
function isImageColumn(col) {
  return !!col.querySelector('img') && col.textContent.trim() === '';
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-image-text-row');
    const cols = [...row.children];
    cols.forEach((col) => {
      if (isImageColumn(col)) {
        col.classList.add('columns-image-text-image');
        // unwrap a bare <p><img></p> or <p><picture></p> so the image fills the column
        const p = col.querySelector(':scope > p');
        const media = p && (p.querySelector('picture') || p.querySelector('img'));
        if (media && p.textContent.trim() === '') p.replaceWith(media);
      } else {
        col.classList.add('columns-image-text-content');
      }
    });
    const first = cols[0];
    if (first && first.classList.contains('columns-image-text-content')) {
      row.classList.add('columns-image-text-reversed');
    }
  });

  block.querySelectorAll('.columns-image-text-content a[href]').forEach((a) => {
    const p = a.closest('p');
    if (p && p.textContent.trim() === a.textContent.trim()) a.classList.add('columns-image-text-cta');
  });

  optimizeImages(block);
}
