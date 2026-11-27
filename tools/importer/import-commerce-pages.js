/* eslint-disable */
/* global WebImporter */

/**
 * Commerce import script — account & purchase funnel shell pages.
 *
 * Pages are thin shells around the Commerce Storefront blocks of the boilerplate template
 * (aem-boilerplate-commerce): the drop-ins render forms, cart lines and totals at runtime.
 *
 *   https://www.legallais.com/user/connection                     → /customer/login
 *       H1 + "Créer un compte" intro (source page) beside the commerce-login block
 *   {boilerplate}/cart.plain.html                                  → /cart
 *       commerce-cart, checkout button routed to the summary step
 *   {boilerplate}/cart.plain.html?step=summary                     → /cart-summary
 *       read-only commerce-cart (summary) + back link, checkout button routed to /checkout
 *   {boilerplate}/checkout.plain.html                              → /checkout
 *       commerce-checkout
 *   {boilerplate}/customer/create|forgotpassword.plain.html        → same path
 *       commerce-create-account / commerce-forgot-password in a centered card
 *   {boilerplate}/customer/account.plain.html                      → /customer/account
 *       account dashboard (Columns template: sidebar + content blocks)
 *   {boilerplate}/customer/sidebar-fragment.plain.html             → /customer/sidebar-fragment
 *       account menu, translated (entries whose pages exist in the funnel)
 *
 * cart.plain.html and cart.plain.html?step=summary share a source page: re-import them
 * with --force, otherwise the second one is skipped as already imported.
 *
 * Paths follow the storefront constants in scripts/commerce.js (CUSTOMER_LOGIN_PATH, /cart,
 * /checkout) so header, mini-cart and drop-in links resolve.
 */
import cleanupTransformer from './transformers/legallais-cleanup.js';

const CREATE_ACCOUNT_PATH = '/customer/create';
const CART_PATH = '/cart';
const CART_SUMMARY_PATH = '/cart-summary';
const CHECKOUT_PATH = '/checkout';

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

function sectionMetadata(document, style) {
  return WebImporter.DOMUtils.createTable([['Section Metadata'], ['style', style]], document);
}

function metadata(document, title) {
  return WebImporter.DOMUtils.createTable([
    ['Metadata'],
    ['Title', title],
    ['Robots', 'noindex'],
  ], document);
}

/** Reads the key/value rows of a block in a .plain.html source (div.<name> > div > div). */
function readSourceConfig(document, blockClass) {
  const block = document.querySelector(`.${blockClass}`);
  if (!block) { console.warn(`⚠️ readSourceConfig: .${blockClass} not found`); return []; }
  return [...block.children]
    .map((row) => [...row.children].map((cell) => text(cell)))
    .filter(([key]) => key);
}

function link(document, href, label, wrapTag) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = href;
  a.textContent = label;
  if (wrapTag) {
    const wrap = document.createElement(wrapTag);
    wrap.append(a);
    p.append(wrap);
  } else {
    p.append(a);
  }
  return p;
}

function transformLogin(payload) {
  const { document } = payload;
  const main = document.body;

  // STEP 1 — extract while the DOM is intact
  const title = text(document.querySelector('h1')) || 'Accédez à votre compte';
  const card = document.querySelector('.c-connection__card--signin');
  const cardTitle = text(card?.querySelector('.c-connection__card__title')) || 'Créer un compte';
  const intro = card?.querySelector('.c-connection__card__intro');
  const ctaLabel = text(card?.querySelector('a.c-button')) || cardTitle;
  if (!card) console.warn('⚠️ transformLogin: .c-connection__card--signin not found');

  const h1 = document.createElement('h1');
  h1.textContent = title;
  const h2 = document.createElement('h2');
  h2.textContent = cardTitle;
  const p = document.createElement('p');
  if (intro) p.innerHTML = intro.innerHTML.trim();
  else p.textContent = 'Vous êtes un professionnel, créez votre propre compte en un instant.';
  const login = WebImporter.DOMUtils.createTable([['Commerce Login'], ['']], document);

  // STEP 2 — clear
  main.innerHTML = '';

  // STEP 3 — rebuild
  main.append(h1);
  main.append(document.createElement('hr'));
  main.append(h2, p, link(document, CREATE_ACCOUNT_PATH, ctaLabel, 'em'), login);
  main.append(sectionMetadata(document, 'login'));
  cleanupTransformer('afterTransform', main, payload);
  main.append(document.createElement('hr'));
  main.append(metadata(document, 'Connexion | Legallais'));

  return [{
    element: main,
    path: '/customer/login',
    report: { title, template: 'commerce-login', blocks: ['commerce-login'] },
  }];
}

const CART_OVERRIDES = {
  cart: { 'Checkout URL': CART_SUMMARY_PATH },
  summary: {
    'Enable Item Quantity Update': 'false',
    'Enable Item Remove': 'false',
    'Hide Heading': 'true',
    'Enable Estimate Shipping': 'false',
    'Checkout URL': CHECKOUT_PATH,
    'Enable Updating Product': 'false',
  },
};
// The commerce-cart block does not read these source rows.
const CART_DROPPED_KEYS = ['Agreement name', 'Agreement link'];

function transformCart(payload, step) {
  const { document } = payload;
  const main = document.body;

  // STEP 1 — extract
  const overrides = CART_OVERRIDES[step];
  const rows = readSourceConfig(document, 'commerce-cart')
    .filter(([key]) => !CART_DROPPED_KEYS.includes(key))
    .map(([key, value]) => [key, overrides[key] ?? value]);
  Object.entries(overrides).forEach(([key, value]) => {
    if (!rows.some(([k]) => k === key)) rows.push([key, value]);
  });
  const name = step === 'summary' ? 'Commerce Cart (summary)' : 'Commerce Cart';
  const cart = WebImporter.DOMUtils.createTable([[name], ...rows], document);

  // STEP 2 — clear
  main.innerHTML = '';

  // STEP 3 — rebuild
  if (step === 'summary') {
    main.append(link(document, CART_PATH, 'Modifier mon panier'));
    const h1 = document.createElement('h1');
    h1.textContent = 'Récapitulatif de votre panier';
    main.append(h1);
  }
  main.append(cart);
  main.append(sectionMetadata(document, 'commerce-page'));
  main.append(document.createElement('hr'));
  main.append(metadata(document, step === 'summary' ? 'Récapitulatif du panier | Legallais' : 'Panier | Legallais'));

  return [{
    element: main,
    path: step === 'summary' ? CART_SUMMARY_PATH : CART_PATH,
    report: { title: step === 'summary' ? 'Récapitulatif du panier' : 'Panier', template: `commerce-${step}`, blocks: ['commerce-cart'] },
  }];
}

function transformCheckout(payload) {
  const { document } = payload;
  const main = document.body;
  if (!document.querySelector('.commerce-checkout')) console.warn('⚠️ transformCheckout: .commerce-checkout not found');

  const checkout = WebImporter.DOMUtils.createTable([['Commerce Checkout'], ['']], document);
  main.innerHTML = '';
  main.append(checkout);
  main.append(sectionMetadata(document, 'commerce-page'));
  main.append(document.createElement('hr'));
  main.append(metadata(document, 'Commande | Legallais'));

  return [{
    element: main,
    path: CHECKOUT_PATH,
    report: { title: 'Commande', template: 'commerce-checkout', blocks: ['commerce-checkout'] },
  }];
}

/** Rebuilds a boilerplate block (div.<name> > div rows > div cells) as an import table. */
function blockFromSource(document, el, overrides = {}) {
  const [name, ...variants] = [...el.classList];
  const title = name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const header = variants.length ? `${title} (${variants.join(', ')})` : title;
  const rows = [...el.children].map((row) => {
    const cells = [...row.children].map((cell) => text(cell));
    if (cells.length > 1 && overrides[cells[0]] !== undefined) cells[1] = overrides[cells[0]];
    return cells.length ? cells : [''];
  });
  return WebImporter.DOMUtils.createTable([[header], ...(rows.length ? rows : [['']])], document);
}

const ACCOUNT_FORMS = {
  '/customer/create': { block: 'commerce-create-account', title: 'Créer un compte | Legallais' },
  '/customer/forgotpassword': { block: 'commerce-forgot-password', title: 'Mot de passe oublié | Legallais' },
};

function transformAccountForm(payload, path) {
  const { document } = payload;
  const main = document.body;
  const { block, title } = ACCOUNT_FORMS[path];
  const source = document.querySelector(`.${block}`);
  if (!source) console.warn(`⚠️ transformAccountForm: .${block} not found`);
  const table = source ? blockFromSource(document, source)
    : WebImporter.DOMUtils.createTable([[block.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')], ['']], document);

  main.innerHTML = '';
  main.append(table);
  main.append(sectionMetadata(document, 'account-form'));
  main.append(document.createElement('hr'));
  main.append(metadata(document, title));

  return [{ element: main, path, report: { title, template: 'commerce-account-form', blocks: [block] } }];
}

// Account dashboard: sidebar column + content column (boilerplate "Columns" template).
const ACCOUNT_BLOCK_OVERRIDES = { Title: 'Mon compte' };

function transformAccount(payload) {
  const { document } = payload;
  const main = document.body;
  const sections = [...document.body.children].filter((s) => s.tagName === 'DIV');
  const rebuilt = sections.map((section) => ({
    width: section.getAttribute('data-column-width'),
    gap: section.getAttribute('data-gap'),
    blocks: [...section.children].filter((el) => el.classList.length)
      .map((el) => blockFromSource(document, el, ACCOUNT_BLOCK_OVERRIDES)),
  }));
  if (!rebuilt.length) console.warn('⚠️ transformAccount: no source sections');

  main.innerHTML = '';
  rebuilt.forEach(({ width, gap, blocks }, i) => {
    if (i) main.append(document.createElement('hr'));
    blocks.forEach((b) => main.append(b));
    const rows = [['Section Metadata'], ['style', 'commerce-page']];
    if (width) rows.push(['Column Width', width]);
    if (gap) rows.push(['Gap', gap]);
    main.append(WebImporter.DOMUtils.createTable(rows, document));
  });
  main.append(document.createElement('hr'));
  main.append(WebImporter.DOMUtils.createTable([
    ['Metadata'],
    ['Title', 'Mon compte | Legallais'],
    ['Template', 'My Account, Columns'],
    ['Robots', 'noindex, nofollow'],
  ], document));

  return [{ element: main, path: '/customer/account', report: { title: 'Mon compte', template: 'commerce-account', blocks: ['commerce-account-sidebar', 'commerce-account-header'] } }];
}

// Account sidebar fragment (read by commerce-account-sidebar): title, then subtitle / link / icon.
const SIDEBAR_FR = {
  '/customer/account': ['Mon compte', 'Informations du compte'],
  '/customer/orders': ['Commandes', 'Suivre, gérer et retourner'],
  '/customer/address': ['Adresses', 'Gérer vos adresses'],
  '/customer/returns': ['Retours', 'Gérer vos retours'],
};

function transformSidebar(payload) {
  const { document } = payload;
  const main = document.body;
  const items = [...document.querySelectorAll('body > div > ol > li, body > ol > li')].map((li) => {
    const params = [...li.querySelectorAll(':scope > ol > li')].map((p) => text(p));
    return { title: text(li.querySelector(':scope > p')), params };
  }).filter(({ params }) => SIDEBAR_FR[params[1]]);
  if (!items.length) console.warn('⚠️ transformSidebar: no sidebar items');

  const ol = document.createElement('ol');
  items.forEach(({ params }) => {
    const [title, subtitle] = SIDEBAR_FR[params[1]];
    const li = document.createElement('li');
    const p = document.createElement('p');
    p.textContent = title;
    const sub = document.createElement('ol');
    [subtitle, params[1], params[2]].forEach((value) => {
      const item = document.createElement('li');
      item.textContent = value;
      sub.append(item);
    });
    li.append(p, sub);
    ol.append(li);
  });
  main.innerHTML = '';
  main.append(ol);

  return [{ element: main, path: '/customer/sidebar-fragment', report: { title: 'Menu espace client', template: 'commerce-account-sidebar', blocks: [] } }];
}

export default {
  transform: (payload) => {
    const { pathname, searchParams } = new URL(payload.params.originalURL);
    const page = pathname.replace(/\.plain\.html$/, '');
    if (ACCOUNT_FORMS[page]) return transformAccountForm(payload, page);
    if (page === '/customer/account') return transformAccount(payload);
    if (page === '/customer/sidebar-fragment') return transformSidebar(payload);
    if (pathname.startsWith('/user/connection')) return transformLogin(payload);
    if (pathname.startsWith('/cart')) return transformCart(payload, searchParams.get('step') === 'summary' ? 'summary' : 'cart');
    if (pathname.startsWith('/checkout')) return transformCheckout(payload);
    throw new Error(`import-commerce-pages: no transform for ${payload.params.originalURL}`);
  },
};
