/* eslint-disable */
/* global WebImporter */

/**
 * Commerce import script — Legallais category pages (PLP).
 *
 * Commerce shell pattern: extract the authorable content (breadcrumb, category header,
 * sub-category tiles, choice guides), clear `main`, then rebuild the page with the
 * `product-list-page` Commerce block. Product tiles, facets, sort and pagination are NOT
 * imported: the block renders them at runtime from the Adobe Commerce catalog.
 *
 * Detection is DOM driven (category-nav / c-articles-container); the page path follows the
 * conventional storefront structure /categories/{slug} (source: /{slug}/{id}).
 */
import cleanupTransformer from './transformers/legallais-cleanup.js';

// Demo catalog category used until the Legallais catalog is loaded in ACCS.
// Set to null to use the source category slug (e.g. radiateurs-et-seche-serviettes).
const DEMO_CATEGORY_URLPATH = 'office';
const PAGE_SIZE = '12';

// PDP: one shared template page (/products/default). defaultSku is only used in authoring
// (Experience Workspace / DA preview); on the live site the SKU comes from /products/{urlKey}/{sku}.
const DEMO_DEFAULT_SKU = 'ADB406';
const RECOMMENDATIONS_REC_ID = 'cf042e53-7efb-4a7e-b1bd-4f87d5c6ca84';
const RELATED_HEADING_PATTERN = /m[eê]me gamme/i;

const UNIVERS_BY_SLUG = {
  batiment: 'batiment',
  'agencement-ameublement': 'agencement-ameublement',
  plomberie: 'plomberie',
  'genie-climatique': 'genie-climatique',
  electricite: 'electricite',
  consommables: 'consommables',
  outillage: 'outillage',
  'materiels-et-equipements': 'materiels-et-equipements',
  epi: 'epi',
};

const slugFromHref = (href) => {
  try {
    const { pathname } = new URL(href, 'https://www.legallais.com');
    return pathname.split('/').filter(Boolean)[0] || '';
  } catch { return ''; }
};

function parseBreadcrumb(document) {
  const items = [...document.querySelectorAll('ol.c-breadcrumb .c-breadcrumb__item')];
  if (!items.length) { console.warn('⚠️ parseBreadcrumb: ol.c-breadcrumb not found'); return { block: null, univers: null }; }
  const ul = document.createElement('ul');
  let univers = null;
  items.forEach((li) => {
    const a = li.querySelector('a');
    const item = document.createElement('li');
    const text = li.textContent.replace(/\s+/g, ' ').trim();
    if (a) {
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = text;
      item.append(link);
      const slug = slugFromHref(a.getAttribute('href'));
      if (!univers && UNIVERS_BY_SLUG[slug]) univers = UNIVERS_BY_SLUG[slug];
    } else {
      item.textContent = text;
    }
    ul.append(item);
  });
  const name = univers ? `Breadcrumb (${univers})` : 'Breadcrumb';
  return { block: WebImporter.DOMUtils.createTable([[name], [ul]], document), univers };
}

function parseCategoryHeader(document) {
  const nav = document.querySelector('.category-nav');
  if (!nav) { console.warn('⚠️ parseCategoryHeader: .category-nav not found'); return null; }
  const nodes = [];
  const back = nav.querySelector('.category-nav__back-button');
  if (back) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = back.getAttribute('href');
    a.textContent = back.textContent.replace(/\s+/g, ' ').trim();
    p.append(a);
    nodes.push(p);
  }
  const title = nav.querySelector('.category-nav__title');
  if (title) {
    const h1 = document.createElement('h1');
    h1.textContent = title.textContent.trim();
    nodes.push(h1);
  }
  const count = nav.querySelector('.category-nav__count');
  if (count) {
    const p = document.createElement('p');
    p.textContent = count.textContent.trim();
    nodes.push(p);
  }
  return nodes;
}

function parseSubcategories(document) {
  const tiles = [...document.querySelectorAll('.category-nav .c-tile')];
  if (!tiles.length) { console.warn('⚠️ parseSubcategories: no .category-nav .c-tile'); return null; }
  const rows = [['Cards Subcategory']];
  tiles.forEach((tile) => {
    const a = tile.closest('a');
    const img = tile.querySelector('img');
    const label = tile.querySelector('.c-tile__label')?.textContent.trim() || a?.textContent.trim();
    const link = document.createElement('a');
    link.href = a?.getAttribute('href') || '#';
    link.textContent = label;
    let image = '';
    if (img) {
      const i = document.createElement('img');
      i.src = img.getAttribute('src') || img.getAttribute('data-src');
      i.alt = label || '';
      image = i;
    }
    rows.push([image, link]);
  });
  return WebImporter.DOMUtils.createTable(rows, document);
}

function parseGuides(document) {
  const footer = document.querySelector('.category-nav__footer');
  if (!footer) return null;
  const label = footer.querySelector('.category-nav__guides-toggle')?.textContent.replace(/\s+/g, ' ').trim();
  const links = [...footer.querySelectorAll('.category-nav__guides-list a')];
  if (!links.length) return null;
  const p = document.createElement('p');
  if (label) {
    const strong = document.createElement('strong');
    strong.textContent = `${label} : `;
    p.append(strong);
  }
  links.forEach((a, i) => {
    if (i) p.append(document.createTextNode(' · '));
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.trim();
    p.append(link);
  });
  return p;
}

function sectionMetadata(document, style) {
  return WebImporter.DOMUtils.createTable([['Section Metadata'], ['style', style]], document);
}

/**
 * PDP shell: product-details (Commerce PDP drop-in) + related products heading and
 * product-recommendations. Product data (gallery, title, price, options, description,
 * attributes, variants table, documents, reviews) is never imported.
 */
function transformProductPage(payload) {
  const { document } = payload;
  const main = document.body;

  // STEP 1 — extract while the DOM is intact
  const relatedHeading = [...document.querySelectorAll('.product-page h2')]
    .find((h) => RELATED_HEADING_PATTERN.test(h.textContent))?.textContent.trim();
  const productTitle = document.querySelector('.product-page h1')?.textContent.trim();

  const details = WebImporter.DOMUtils.createTable([
    ['Product Details'],
    ['defaultSku', DEMO_DEFAULT_SKU],
  ], document);
  const recommendations = WebImporter.DOMUtils.createTable([
    ['Product Recommendations'],
    ['recId', RECOMMENDATIONS_REC_ID],
  ], document);

  // STEP 2 — clear
  main.innerHTML = '';

  // STEP 3 — rebuild
  main.append(details);
  main.append(document.createElement('hr'));
  if (relatedHeading) {
    const h2 = document.createElement('h2');
    h2.textContent = relatedHeading;
    main.append(h2);
  }
  main.append(recommendations);

  cleanupTransformer('afterTransform', main, payload);

  // STEP 4 — metadata (template page: product SEO comes from Commerce at runtime)
  const meta = WebImporter.DOMUtils.createTable([
    ['Metadata'],
    ['Title', 'Produit | Legallais'],
    ['Template', 'product'],
    ['Robots', 'noindex'],
  ], document);
  main.append(document.createElement('hr'));
  main.append(meta);

  return [{
    element: main,
    path: '/products/default',
    report: { title: productTitle, template: 'PDP', blocks: ['product-details', 'product-recommendations'] },
  }];
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    const originalURL = params?.originalURL || url;
    cleanupTransformer('beforeTransform', main, payload);

    // page type from the DOM: product page vs category page
    if (document.querySelector('.product-page') && !document.querySelector('.c-articles-container')) {
      return transformProductPage(payload);
    }

    // STEP 1 — extract while the DOM is intact
    const { block: breadcrumb, univers } = parseBreadcrumb(document);
    const header = parseCategoryHeader(document);
    const subcategories = parseSubcategories(document);
    const guides = parseGuides(document);
    const hasGrid = !!document.querySelector('.c-articles-container');
    const sourceSlug = slugFromHref(originalURL);
    const title = document.querySelector('.category-nav__title')?.textContent.trim();
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content');

    const plp = WebImporter.DOMUtils.createTable([
      ['Product List Page'],
      ['urlpath', DEMO_CATEGORY_URLPATH || sourceSlug],
      ['pageSize', PAGE_SIZE],
    ], document);

    // STEP 2 — clear
    main.innerHTML = '';

    // STEP 3 — rebuild in page order (sections separated by <hr>)
    const sections = [];
    if (breadcrumb) sections.push([breadcrumb]);
    if (header || subcategories || guides) {
      sections.push([
        ...(header || []),
        subcategories,
        guides,
        sectionMetadata(document, univers ? `card, ${univers}` : 'card'),
      ].filter(Boolean));
    }
    if (hasGrid) sections.push([plp]);
    sections.forEach((nodes, i) => {
      if (i) main.append(document.createElement('hr'));
      nodes.forEach((n) => main.append(n));
    });

    cleanupTransformer('afterTransform', main, payload);

    // STEP 4 — metadata + importer rules
    const meta = WebImporter.DOMUtils.createTable([
      ['Metadata'],
      ['Title', title ? `${title} | Legallais` : document.title],
      ...(description ? [['Description', description]] : []),
      ['Template', 'category'],
      ['Category', sourceSlug],
    ], document);
    main.append(document.createElement('hr'));
    main.append(meta);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, originalURL);

    // conventional path: /{slug}/{id} -> /categories/{slug}
    const rawPath = new URL(originalURL).pathname.replace(/\.html?$/i, '').replace(/\/+$/, '') || '/';
    const cat = rawPath.match(/^\/([a-z0-9-]+)\/\d+$/);
    const path = WebImporter.FileUtils.sanitizePath(cat ? `/categories/${cat[1]}` : rawPath);

    return [{
      element: main,
      path,
      report: { title, template: 'PLP', blocks: ['breadcrumb', 'cards-subcategory', 'product-list-page'] },
    }];
  },
};
