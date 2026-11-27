/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-teaser.
 * Source: .c-carousel of .cms-institutionnel-card (boutiques carousel and news carousel).
 * Output: one row per card -> [image cell, text cell (heading, description, final link)].
 *
 * The source card wraps a <button> inside an <a> (invalid nesting), so cards are
 * keyed on the stable .c-carousel__slide wrapper, and parts that may be displaced
 * by the HTML parser are paired by document order as a fallback.
 */
function keepSvgAsImage(src) {
  // helix-importer converts <img src="*.svg"> to :icon: tokens; keep real images
  return /\.svg$/.test(src) ? `${src}?format=svg` : src;
}

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

function buildRow(document, { img, title, description, href, label }) {
  const imageCell = [];
  if (img) {
    const image = document.createElement('img');
    image.src = keepSvgAsImage(img.getAttribute('src') || img.getAttribute('data-src') || '');
    image.alt = (img.getAttribute('alt') || '').trim();
    imageCell.push(image);
  }

  const textCell = [];
  const titleText = text(title);
  if (titleText) {
    const h = document.createElement('h3');
    h.textContent = titleText;
    textCell.push(h);
  }
  const descText = text(description);
  if (descText) {
    const p = document.createElement('p');
    p.textContent = descText;
    textCell.push(p);
  }
  if (href) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label || titleText || href;
    const p = document.createElement('p');
    p.append(a);
    textCell.push(p);
  }
  return [imageCell, textCell];
}

export default function parse(element, { document }) {
  const cells = [];

  const slides = [...element.querySelectorAll('.c-carousel__slide')];
  const titles = [...element.querySelectorAll('.cms-institutionnel-card__title')];

  if (slides.length && slides.length === titles.length) {
    slides.forEach((slide) => {
      const linkEl = slide.querySelector('a.cms-institutionnel-card__product-info[href]')
        || slide.querySelector('a[href]');
      cells.push(buildRow(document, {
        img: slide.querySelector('.cms-institutionnel-card__image img, img'),
        title: slide.querySelector('.cms-institutionnel-card__title'),
        description: slide.querySelector('.cms-institutionnel-card__description'),
        href: linkEl ? linkEl.getAttribute('href') : '',
        label: text(slide.querySelector('.c-button__text')),
      }));
    });
  } else {
    // fallback: pair the parts of each card by document order
    const imgs = [...element.querySelectorAll('.cms-institutionnel-card__image img')];
    const descs = [...element.querySelectorAll('.cms-institutionnel-card__description')];
    const labels = [...element.querySelectorAll('.cms-institutionnel-card .c-button__text')];
    const hrefs = [];
    element.querySelectorAll('a.cms-institutionnel-card__product-info[href]').forEach((a) => {
      const h = a.getAttribute('href');
      if (hrefs[hrefs.length - 1] !== h) hrefs.push(h);
    });
    titles.forEach((title, i) => {
      cells.push(buildRow(document, {
        img: imgs[i],
        title,
        description: descs[i],
        href: hrefs[i] || '',
        label: text(labels[i]),
      }));
    });
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-teaser', cells });
  element.replaceWith(block);
}
