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
 * Returns the authored visual of a cell: its picture, or a bare img.
 * @param {Element} cell
 * @returns {Element|null}
 */
function getVisual(cell) {
  const img = cell.querySelector('img');
  if (!img) return null;
  return img.closest('picture') || img;
}

/**
 * Builds a single slide from an authored row (image cell + link cell).
 * @param {Element} row
 * @returns {HTMLLIElement|null}
 */
function buildSlide(row) {
  const cells = [...row.children];
  const visual = cells.map(getVisual).find(Boolean);
  const link = row.querySelector('a[href]');
  if (!visual && !link) return null;

  const slide = document.createElement('li');
  slide.className = 'carousel-promo-slide';

  if (link) {
    const anchor = document.createElement('a');
    anchor.href = link.href;
    anchor.className = 'carousel-promo-link';
    if (link.target) anchor.target = link.target;
    const label = link.textContent.trim();
    const alt = visual ? (visual.querySelector('img') || visual).alt : '';
    const accessibleName = [alt, label].filter(Boolean).join(' - ');
    if (accessibleName) anchor.setAttribute('aria-label', accessibleName);
    if (visual) anchor.append(visual);
    else anchor.textContent = label;
    slide.append(anchor);
  } else {
    slide.append(visual);
  }
  return slide;
}

/**
 * Scrolls the track by roughly one viewport of slides.
 * @param {Element} track
 * @param {number} direction -1 for previous, 1 for next
 */
function scrollTrack(track, direction) {
  const slide = track.querySelector('.carousel-promo-slide');
  const step = slide ? slide.getBoundingClientRect().width : track.clientWidth;
  track.scrollBy({ left: direction * step, behavior: 'smooth' });
}

/**
 * Enables/disables nav buttons depending on scroll position.
 */
function updateNav(track, prev, next) {
  const max = track.scrollWidth - track.clientWidth - 1;
  prev.disabled = track.scrollLeft <= 0;
  next.disabled = track.scrollLeft >= max;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const track = document.createElement('ul');
  track.className = 'carousel-promo-track';
  track.setAttribute('tabindex', '0');
  track.setAttribute('aria-label', 'Promotions');

  [...block.children].forEach((row) => {
    const slide = buildSlide(row);
    if (slide) track.append(slide);
  });

  optimizeImages(track);
  block.replaceChildren(track);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');

  if (track.children.length < 2) return;

  const nav = document.createElement('div');
  nav.className = 'carousel-promo-nav';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-promo-prev';
  prev.setAttribute('aria-label', 'Previous');
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-promo-next';
  next.setAttribute('aria-label', 'Next');
  nav.append(prev, next);
  block.append(nav);

  prev.addEventListener('click', () => scrollTrack(track, -1));
  next.addEventListener('click', () => scrollTrack(track, 1));
  track.addEventListener('scroll', () => updateNav(track, prev, next), { passive: true });
  window.addEventListener('resize', () => updateNav(track, prev, next), { passive: true });
  updateNav(track, prev, next);
}
