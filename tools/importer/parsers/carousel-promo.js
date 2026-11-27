/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-promo.
 * Source: .c-hero__slider (swiper of .c-marketing-card slides).
 * Output: one row per slide -> [image cell, link cell].
 */
export default function parse(element, { document }) {
  const cells = [];
  const slides = element.querySelectorAll('.c-carousel__slide');

  slides.forEach((slide) => {
    const srcImg = slide.querySelector('img.c-marketing-card__image, img');
    const linkEl = slide.querySelector('a.c-marketing-card__hover__button[href]')
      || slide.querySelector('a.c-marketing-card__link[href]')
      || slide.querySelector('a[href]');
    if (!srcImg && !linkEl) return;

    const imageCell = [];
    if (srcImg) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src') || srcImg.getAttribute('data-src') || '';
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell.push(img);
    }

    const linkCell = [];
    if (linkEl) {
      const a = document.createElement('a');
      a.href = linkEl.getAttribute('href');
      const label = (slide.querySelector('.c-button__text') || linkEl).textContent.trim();
      a.textContent = label || (srcImg && srcImg.getAttribute('alt')) || a.href;
      const p = document.createElement('p');
      p.append(a);
      linkCell.push(p);
    }

    cells.push([imageCell, linkCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-promo', cells });
  element.replaceWith(block);
}
