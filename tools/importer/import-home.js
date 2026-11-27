/* eslint-disable */
/* global WebImporter */

import carouselPromoParser from './parsers/carousel-promo.js';
import productRecommendationsParser from './parsers/product-recommendations.js';
import columnsImageTextParser from './parsers/columns-image-text.js';
import cardsLogosParser from './parsers/cards-logos.js';
import cardsTeaserParser from './parsers/cards-teaser.js';
import widgetParser from './parsers/widget.js';
import cleanupTransformer from './transformers/legallais-cleanup.js';
import sectionsTransformer from './transformers/legallais-sections.js';

const PAGE_TEMPLATE = {
  "name": "home",
  "urls": [
    "https://www.legallais.com/"
  ],
  "representativeUrl": "https://www.legallais.com/",
  "description": "Legallais homepage: welcome hero + promo slider, Commerce product carousel, services, brands, boutiques, news, reviews",
  "blocks": [
    {
      "name": "carousel-promo",
      "instances": [
        ".home-page__section--hero .c-hero__slider"
      ]
    },
    {
      "name": "product-recommendations",
      "instances": [
        ".home-page__section--lastseen .c-carousel"
      ]
    },
    {
      "name": "columns-image-text",
      "instances": [
        ".home-page__section--premium .cms-double-colonnes"
      ]
    },
    {
      "name": "cards-logos",
      "instances": [
        ".home-page__section--brand .c-carousel"
      ]
    },
    {
      "name": "cards-teaser",
      "instances": [
        ".home-page__section--shop .c-carousel",
        ".home-page__section--news .c-carousel"
      ]
    },
    {
      "name": "widget",
      "instances": [
        ".home-page__section--satisfaction .home__reviews"
      ]
    }
  ],
  "urlPattern": "/",
  "sections": [
    {
      "id": "rc1",
      "name": "hero",
      "selector": [
        ".home-page__section--hero"
      ],
      "style": "split",
      "blocks": [
        "carousel-promo"
      ],
      "defaultContent": [
        ".home-page__section--hero .c-hero__welcome"
      ]
    },
    {
      "id": "rc2",
      "name": "selected-products",
      "selector": [
        ".home-page__section--lastseen"
      ],
      "style": null,
      "blocks": [
        "product-recommendations"
      ],
      "defaultContent": [
        ".home-page__section--lastseen .home-page__title-wrapper"
      ]
    },
    {
      "id": "rc3",
      "name": "services",
      "selector": [
        ".home-page__section--premium"
      ],
      "style": null,
      "blocks": [
        "columns-image-text"
      ],
      "defaultContent": [
        ".home-page__section--premium .home-page__title-wrapper"
      ]
    },
    {
      "id": "rc4",
      "name": "brands",
      "selector": [
        ".home-page__section--brand"
      ],
      "style": null,
      "blocks": [
        "cards-logos"
      ],
      "defaultContent": [
        ".home-page__section--brand .home-page__title-wrapper"
      ]
    },
    {
      "id": "rc5",
      "name": "boutiques",
      "selector": [
        ".home-page__section--shop"
      ],
      "style": null,
      "blocks": [
        "cards-teaser"
      ],
      "defaultContent": [
        ".home-page__section--shop .home-page__title-wrapper"
      ]
    },
    {
      "id": "rc6",
      "name": "news",
      "selector": [
        ".home-page__section--news"
      ],
      "style": null,
      "blocks": [
        "cards-teaser"
      ],
      "defaultContent": [
        ".home-page__section--news .home-page__title-wrapper"
      ]
    },
    {
      "id": "rc7",
      "name": "reviews",
      "selector": [
        ".home-page__section--satisfaction"
      ],
      "style": null,
      "blocks": [
        "widget"
      ],
      "defaultContent": [
        ".home-page__section--satisfaction .home-page__title-wrapper"
      ]
    }
  ]
};

const parsers = {
  'carousel-promo': carouselPromoParser,
  'product-recommendations': productRecommendationsParser,
  'columns-image-text': columnsImageTextParser,
  'cards-logos': cardsLogosParser,
  'cards-teaser': cardsTeaserParser,
  'widget': widgetParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
// Page corrections ({sitename}-page-corrections.js, when it exists) run last.
const correctionTransformers = [];
const transformers = [cleanupTransformer, ...lateTransformers, ...correctionTransformers];
const earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
// Catalog selectors (pageInstances, pageCleanup) count the <script> and <hr> elements the importer
// removes before transform, so a catalog template finds its targets in preprocess.
const CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: payload.params?.targets?.template || PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

// Runs the early transformers, then marks each block and section target with an attribute: the
// importer re-creates the body before transform, so only attributes survive, not element references.
function markPageTargets(payload) {
  const { document, params } = payload;
  executeTransformers('beforeTransform', document.body, payload, earlyTransformers);
  const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
    element.setAttribute('data-excat-block', String(i));
    return { name, selector };
  });
  const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
    const target = (section.selector || []).map((s) => { try { return document.querySelector(s); } catch { return null; } }).find(Boolean);
    if (!target) return section;
    target.setAttribute('data-excat-section', String(i));
    return { ...section, selector: [`[data-excat-section="${i}"]`] };
  });
  params.targets = { blocks, template: { ...PAGE_TEMPLATE, sections } };
}

export default {
  preprocess: (payload) => {
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];

    if (!params.targets) markPageTargets(payload);
    const pageBlocks = params.targets.blocks
      .map((block, i) => ({ ...block, element: document.querySelector(`[data-excat-block="${i}"]`) }))
      .filter((block) => block.element);
    executeTransformers('beforeTransform', main, { ...payload, pageBlocks }, lateTransformers);

    pageBlocks.forEach((block) => {
      if (!main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    params.fragments.forEach(({ element }) => {
      executeTransformers('afterTransform', element, payload, earlyTransformers);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
