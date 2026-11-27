/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-logos.
 * Source: brand carousel (.c-carousel > .c-carousel__slide > figure > a > img).
 * Output: one row per brand -> [logo image cell, brand link cell].
 */
function brandName(img, href) {
  const alt = ((img && img.getAttribute('alt')) || '').replace(/^\s*logo\s*/i, '').trim();
  if (alt) return alt;
  if (!href) return '';
  const slug = href.split('?')[0].replace(/\/+$/, '').split('/').pop() || '';
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Brand logos are often SVG; helix-importer's convertIcons rule turns any
// <img src="*.svg"> into a :name: icon token. Keep them as real images
// by adding a neutral query string.
function keepSvgAsImage(src) {
  return /\.svg$/.test(src) ? `${src}?format=svg` : src;
}

export default function parse(element, { document }) {
  const cells = [];
  const slides = element.querySelectorAll('.c-carousel__slide');

  slides.forEach((slide) => {
    const srcImg = slide.querySelector('img');
    const linkEl = slide.querySelector('a[href]');
    const href = linkEl ? linkEl.getAttribute('href') : '';
    if (!srcImg && !href) return;

    const name = brandName(srcImg, href);

    const imageCell = [];
    if (srcImg) {
      const img = document.createElement('img');
      img.src = keepSvgAsImage(srcImg.getAttribute('src') || srcImg.getAttribute('data-src') || '');
      const srcAlt = (srcImg.getAttribute('alt') || '').trim();
      // source alts are often just "Logo " -> complete them with the brand name
      img.alt = (srcAlt && !/^logo$/i.test(srcAlt)) ? srcAlt : (name ? `Logo ${name}` : srcAlt);
      imageCell.push(img);
    }

    const linkCell = [];
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = name || href;
      linkCell.push(a);
    } else if (name) {
      linkCell.push(name);
    }

    cells.push([imageCell, linkCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-logos', cells });
  element.replaceWith(block);
}
