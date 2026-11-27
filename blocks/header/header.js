// Drop-in Tools
import { events } from '@dropins/tools/event-bus.js';
import { getCookie } from '@dropins/tools/lib.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';

import { loadFragment } from '../fragment/fragment.js';
import {
  fetchPlaceholders,
  getProductLink,
  rootLink,
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_LOGIN_PATH,
} from '../../scripts/commerce.js';

import renderSellerAssistedBuyingBanner from './renderSellerAssistedBuyingBanner.js';

const isDesktop = window.matchMedia('(min-width: 900px)');
const labels = await fetchPlaceholders();
const t = (key, fallback) => labels.Global?.[key] ?? fallback;

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content/nav.plain.html (local preview, pages under /content/) first, then /nav.plain.html
 * (DA / EDS). Relative image paths are resolved against the fragment URL so they work on every page.
 * @returns {Promise<Document|null>}
 */
async function fetchNav() {
  const isLocalPreview = window.location.pathname.startsWith('/content/');
  let base = '/content/nav.plain.html';
  let resp = isLocalPreview ? await fetch(base) : null;
  if (!resp?.ok) {
    resp = await fetch('/nav.plain.html');
    base = '/nav.plain.html';
  }
  if (!resp.ok) return null;
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  const baseUrl = new URL(base, window.location.origin);
  doc.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), baseUrl).href;
    img.loading = 'lazy';
  });
  return doc;
}

/**
 * Loads a commerce fragment (mini-cart…) from the local preview folder first, then the site root.
 * @param {string} path fragment path, e.g. /mini-cart
 */
async function loadCommerceFragment(path) {
  return (await loadFragment(`/content${path}`)) || loadFragment(path);
}

const el = (tag, className, html) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
};

/** Text of a list item without its nested lists / paragraphs */
const ownLabel = (li) => [...li.childNodes]
  .filter((n) => n.nodeType === Node.TEXT_NODE)
  .map((n) => n.textContent)
  .join(' ')
  .trim();

/** Builds a menu link (icon + label + optional caret) from a list item */
function buildMenuLink(li, { expand = false } = {}) {
  const a = li.querySelector(':scope > a, :scope > p > a');
  const icon = li.querySelector(':scope > img, :scope > picture, :scope > p > img, :scope > p > picture');
  const link = el('a', 'nav-menu-link');
  link.href = a?.getAttribute('href') || '#';
  if (icon) {
    const iconWrap = el('span', 'nav-menu-icon');
    iconWrap.append(icon.cloneNode(true));
    link.append(iconWrap);
  }
  link.append(el('span', 'nav-menu-text', a ? a.innerHTML : ownLabel(li)));
  if (expand) link.append(el('span', 'nav-menu-caret'));
  return link;
}

const slugOf = (href) => (href || '').split('/').filter(Boolean).pop() || '';

/**
 * Cascading panel: column 1 lists items that each own a nested list (level 2) which
 * may own nested lists (level 3); an optional second list per item holds image links
 * (logo grid). Hover / focus on an item updates the following columns.
 */
function buildCascadePanel(trigger) {
  const [firstTitle, ...otherParas] = trigger.querySelectorAll(':scope > p');
  const topList = trigger.querySelector(':scope > ul');
  const sideTitle = otherParas.find((p) => !p.querySelector('a'));
  const ctas = otherParas.filter((p) => p.querySelector('a'));

  const panel = el('div', 'nav-panel nav-panel-cascade');
  const col1 = el('div', 'nav-col nav-col-1');
  const col2 = el('div', 'nav-col nav-col-2');
  const col3 = el('div', 'nav-col nav-col-3');
  const col4 = el('div', 'nav-col nav-col-side');
  if (firstTitle) col1.append(el('p', 'nav-col-title', firstTitle.textContent));
  const list1 = el('ul', 'nav-menu-list');
  col1.append(list1);

  const renderLevel3 = (famLi, color) => {
    col3.replaceChildren();
    const sub = famLi?.querySelector(':scope > ul');
    if (!sub) return;
    const title = el('a', 'nav-col-title nav-col-title-link');
    title.href = famLi.querySelector(':scope > a')?.getAttribute('href') || '#';
    title.textContent = famLi.querySelector(':scope > a')?.textContent || '';
    title.style.setProperty('--nav-accent', color);
    const ul = el('ul', 'nav-menu-list nav-menu-list-plain');
    sub.querySelectorAll(':scope > li').forEach((li) => {
      const item = el('li');
      item.append(buildMenuLink(li));
      ul.append(item);
    });
    col3.append(title, ul);
  };

  const activate = (univLi, univItem) => {
    list1.querySelectorAll('.nav-menu-link').forEach((l) => l.classList.remove('active'));
    univItem.querySelector('.nav-menu-link').classList.add('active');
    const href = univLi.querySelector(':scope > a, :scope > p > a')?.getAttribute('href');
    panel.dataset.univers = slugOf(href);
    const color = getComputedStyle(panel).getPropertyValue('--nav-accent').trim();
    const [famList, logoList] = univLi.querySelectorAll(':scope > ul');

    col2.replaceChildren();
    const title = el('a', 'nav-col-title nav-col-title-link');
    title.href = href || '#';
    title.textContent = univItem.querySelector('.nav-menu-text').textContent;
    const ul2 = el('ul', 'nav-menu-list');
    const families = famList ? [...famList.querySelectorAll(':scope > li')] : [];
    families.forEach((famLi, i) => {
      const hasSub = !!famLi.querySelector(':scope > ul');
      const item = el('li');
      const link = buildMenuLink(famLi, { expand: hasSub });
      item.append(link);
      const show = () => {
        ul2.querySelectorAll('.nav-menu-link').forEach((l) => l.classList.remove('active'));
        if (hasSub) link.classList.add('active');
        renderLevel3(hasSub ? famLi : null, color);
      };
      link.addEventListener('mouseenter', show);
      link.addEventListener('focus', show);
      if (i === 0 && hasSub) link.classList.add('active');
      ul2.append(item);
    });
    col2.append(title, ul2);
    renderLevel3(families.find((f) => f.querySelector(':scope > ul')), color);

    col4.replaceChildren();
    if (sideTitle) col4.append(el('p', 'nav-col-title', sideTitle.textContent));
    if (logoList) {
      const grid = el('ul', 'nav-logo-grid');
      logoList.querySelectorAll(':scope > li').forEach((li) => {
        const item = el('li');
        const a = li.querySelector('a')?.cloneNode(true);
        if (a) item.append(a);
        grid.append(item);
      });
      col4.append(grid);
    }
    ctas.forEach((p) => {
      const a = p.querySelector('a').cloneNode(true);
      a.className = 'nav-button nav-button-outline nav-button-caret';
      col4.append(a);
    });
  };

  [...(topList?.querySelectorAll(':scope > li') || [])].forEach((li, i) => {
    const item = el('li');
    const link = buildMenuLink(li, { expand: true });
    item.append(link);
    link.addEventListener('mouseenter', () => activate(li, item));
    link.addEventListener('focus', () => activate(li, item));
    list1.append(item);
    if (i === 0) requestAnimationFrame(() => activate(li, item));
  });

  panel.append(col1, col2, col3, col4);
  return panel;
}

/**
 * Group panel: each item is a titled group holding a list of icon links, or an
 * intro block (paragraphs + CTA links) which is appended to the previous group column.
 */
function buildGroupPanel(trigger) {
  const panel = el('div', 'nav-panel nav-panel-groups');
  let previous;
  trigger.querySelectorAll(':scope > ul > li').forEach((group) => {
    const list = group.querySelector(':scope > ul');
    const col = list || !previous ? el('div', 'nav-col nav-group') : previous;
    const block = el('div', 'nav-group-block');
    block.append(el('p', 'nav-col-title', ownLabel(group)));
    if (list) {
      const items = list.querySelectorAll(':scope > li');
      const ul = el('ul', `nav-menu-list nav-menu-list-plain${items.length > 5 ? ' nav-menu-list-2col' : ''}`);
      items.forEach((li) => {
        const item = el('li');
        item.append(buildMenuLink(li));
        ul.append(item);
      });
      block.append(ul);
      if (items.length > 5) col.classList.add('nav-group-wide');
    }
    const ctaRow = el('div', 'nav-group-ctas');
    group.querySelectorAll(':scope > p').forEach((p) => {
      const a = p.querySelector('a');
      if (a) {
        const btn = a.cloneNode(true);
        btn.className = `nav-button ${ctaRow.children.length ? 'nav-button-ghost' : 'nav-button-outline'}`;
        ctaRow.append(btn);
      } else {
        block.append(el('p', 'nav-group-text', p.innerHTML));
      }
    });
    if (ctaRow.children.length) block.append(ctaRow);
    col.append(block);
    if (col !== previous) panel.append(col);
    previous = col;
  });
  return panel;
}

/**
 * Mobile drill-down menu built from the same nav content.
 * Each level slides in with a back title; leaves are links.
 */
function buildMobileMenu(navList, utilityList, closeMenu) {
  const drawer = el('div', 'nav-drawer');
  drawer.id = 'nav-drawer';
  drawer.setAttribute('aria-hidden', 'true');
  const close = el('button', 'nav-drawer-close');
  close.type = 'button';
  close.setAttribute('aria-label', t('CloseNavigation', 'Fermer le menu'));
  close.addEventListener('click', closeMenu);
  const viewport = el('div', 'nav-drawer-viewport');
  drawer.append(close, viewport);

  const showLevel = (level) => {
    viewport.querySelectorAll('.nav-drawer-level').forEach((l) => l.classList.remove('is-active'));
    level.classList.add('is-active');
  };

  const buildLevel = (title, items, parent, accent, viewAll) => {
    const level = el('div', 'nav-drawer-level');
    if (accent) level.dataset.univers = accent;
    const head = el('div', 'nav-drawer-head');
    if (parent) {
      const back = el('button', 'nav-drawer-back');
      back.type = 'button';
      back.setAttribute('aria-label', t('Back', 'Retour'));
      back.addEventListener('click', () => showLevel(parent));
      head.append(back);
    }
    head.append(el('p', 'nav-drawer-title', title));
    const ul = el('ul', 'nav-drawer-list');
    level.append(head, ul);
    viewport.append(level);
    if (viewAll) {
      const item = el('li');
      const a = el('a', 'nav-drawer-item nav-drawer-viewall');
      a.href = viewAll;
      a.textContent = t('ViewAllUnivers', 'Voir tout l\'univers');
      item.append(a);
      ul.append(item);
    }
    items.forEach(({ li, label }) => {
      const nested = li.querySelector(':scope > ul');
      const item = el('li');
      if (nested) {
        const btn = el('button', 'nav-drawer-item nav-drawer-item-expand');
        btn.type = 'button';
        const link = buildMenuLink(li);
        btn.innerHTML = link.innerHTML;
        if (label) btn.querySelector('.nav-menu-text').textContent = label;
        const href = li.querySelector(':scope > a, :scope > p > a')?.getAttribute('href');
        const childAccent = accent || (parent && !parent.dataset.univers && href ? slugOf(href) : '');
        const childItems = [...nested.querySelectorAll(':scope > li')]
          .map((child) => ({ li: child }));
        const childLevel = buildLevel(
          btn.textContent.trim(),
          childItems,
          level,
          parent ? childAccent : '',
          href,
        );
        btn.addEventListener('click', () => showLevel(childLevel));
        item.append(btn);
      } else {
        const link = buildMenuLink(li);
        link.classList.add('nav-drawer-item');
        item.append(link);
      }
      ul.append(item);
    });
    return level;
  };

  const rootItems = [...navList.querySelectorAll(':scope > li')].map((li) => ({ li, label: ownLabel(li) || null }));
  const root = buildLevel(t('Menu', 'Menu'), rootItems, null);
  if (utilityList) {
    const sep = el('ul', 'nav-drawer-list nav-drawer-utility');
    utilityList.querySelectorAll(':scope > li').forEach((li) => {
      const item = el('li');
      const link = buildMenuLink(li);
      link.classList.add('nav-drawer-item');
      item.append(link);
      sep.append(item);
    });
    root.append(sep);
  }
  showLevel(root);
  drawer.reset = () => showLevel(root);
  return drawer;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const sellerAssistedBuyingBanner = await renderSellerAssistedBuyingBanner();
  if (sellerAssistedBuyingBanner && !document.querySelector('.seller-assisted-buying-banner')) {
    document.body.insertAdjacentElement('afterbegin', sellerAssistedBuyingBanner);
  }

  const doc = await fetchNav();
  block.textContent = '';
  if (!doc) return;
  const [brandSec, sectionsSec, utilitySec, toolsSec, bannerSec] = doc.body.querySelectorAll(':scope > div');

  const navWrapper = el('div', 'nav-wrapper');
  const top = el('div', 'nav-top');
  const topInner = el('div', 'nav-container');
  top.append(topInner);
  const nav = el('nav', 'nav-bottom');
  nav.id = 'nav';
  nav.setAttribute('aria-label', t('MainNavigation', 'Navigation principale'));
  const navInner = el('div', 'nav-container');
  nav.append(navInner);
  navWrapper.append(top, nav);

  /* ---------- Top bar: hamburger, brand ---------- */
  const hamburger = el('button', 'nav-hamburger');
  hamburger.type = 'button';
  hamburger.setAttribute('aria-controls', 'nav-drawer');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', t('OpenNavigation', 'Ouvrir le menu'));
  hamburger.append(el('span', 'nav-hamburger-icon'));

  const brand = el('div', 'nav-brand');
  const brandLink = brandSec?.querySelector('a');
  if (brandLink) {
    const a = el('a');
    a.href = rootLink(brandLink.getAttribute('href') || '/');
    a.setAttribute('aria-label', brandLink.querySelector('img')?.alt || 'Accueil');
    a.append(...[...brandLink.childNodes].map((n) => n.cloneNode(true)));
    a.querySelector('img')?.removeAttribute('loading');
    brand.append(a);
  }

  /* ---------- Search (Commerce product discovery) ---------- */
  const toolsParas = toolsSec ? [...toolsSec.querySelectorAll('p')] : [];
  const placeholder = toolsParas.find((p) => !p.querySelector('a'))?.textContent.trim()
    || t('Search', 'Rechercher');
  const loginLabel = toolsParas.find((p) => p.querySelector('a[href*="login"]'))?.textContent.trim()
    || t('SignIn', 'Se connecter');
  const cartLabel = toolsParas.find((p) => p.querySelector('a[href*="cart"]'))?.textContent.trim()
    || t('Cart', 'Panier');

  const search = el('div', 'nav-search');
  search.innerHTML = `
    <form class="nav-search-form" role="search" action="${rootLink('/search')}">
      <input type="search" name="q" autocomplete="off" aria-label="${placeholder}" placeholder="${placeholder}">
      <button type="submit" class="nav-search-submit" aria-label="${t('Search', 'Rechercher')}"></button>
    </form>
    <div class="nav-search-results" hidden></div>`;
  const searchForm = search.querySelector('form');
  const searchInput = search.querySelector('input');
  const searchResults = search.querySelector('.nav-search-results');
  let searchApi;
  const pageSize = 4;

  async function initSearch() {
    if (searchApi) return searchApi;
    searchApi = (async () => {
      await import('../../scripts/initializers/search.js');
      const [{ search: runSearch }, { render }, { SearchResults }] = await Promise.all([
        import('@dropins/storefront-product-discovery/api.js'),
        import('@dropins/storefront-product-discovery/render.js'),
        import('@dropins/storefront-product-discovery/containers/SearchResults.js'),
      ]);
      render.render(SearchResults, {
        skeletonCount: pageSize,
        scope: 'popover',
        routeProduct: ({ urlKey, sku }) => getProductLink(urlKey, sku),
        onSearchResult: (results) => { searchResults.hidden = results.length === 0; },
        slots: {
          ProductImage: (ctx) => {
            const { product, defaultImageProps } = ctx;
            const anchor = document.createElement('a');
            anchor.href = getProductLink(product.urlKey, product.sku);
            tryRenderAemAssetsImage(ctx, {
              alias: product.sku,
              imageProps: defaultImageProps,
              wrapper: anchor,
              params: { width: defaultImageProps.width, height: defaultImageProps.height },
            });
          },
        },
      })(searchResults);
      return runSearch;
    })();
    return searchApi;
  }

  searchInput.addEventListener('focus', () => { initSearch(); });
  searchInput.addEventListener('input', async () => {
    const phrase = searchInput.value.trim();
    const runSearch = await initSearch();
    if (phrase.length < 3) {
      runSearch(null, { scope: 'popover' });
      searchResults.hidden = true;
      return;
    }
    runSearch({
      phrase,
      pageSize,
      filter: [{ attribute: 'visibility', in: ['Search', 'Catalog, Search'] }],
    }, { scope: 'popover' });
  });
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (q) window.location.href = `${rootLink('/search')}?q=${encodeURIComponent(q)}`;
  });

  /* ---------- Tools: account (Commerce auth) + mini cart ---------- */
  const tools = el('div', 'nav-tools');
  tools.innerHTML = `
    <div class="nav-tools-wrapper nav-account">
      <button type="button" class="nav-account-button" aria-haspopup="dialog" aria-expanded="false">
        <span class="nav-account-icon"></span><span class="nav-account-label">${loginLabel}</span>
      </button>
      <div class="nav-tools-panel nav-account-panel" tabindex="-1">
        <div class="nav-account-signin"></div>
        <ul class="nav-account-menu" hidden>
          <li><a href="${rootLink(CUSTOMER_ACCOUNT_PATH)}">${t('MyAccount', 'Mon compte')}</a></li>
          <li><button type="button" class="nav-account-logout">${t('Logout', 'Se déconnecter')}</button></li>
        </ul>
      </div>
    </div>
    <div class="nav-tools-wrapper nav-minicart">
      <button type="button" class="nav-cart-button" aria-label="${cartLabel}" aria-haspopup="dialog" aria-expanded="false" aria-controls="minicart-panel"></button>
      <div class="nav-tools-panel minicart-panel" id="minicart-panel"></div>
      <div class="nav-cart-status" role="status" aria-live="polite"></div>
    </div>`;

  const authButton = tools.querySelector('.nav-account-button');
  const authLabel = tools.querySelector('.nav-account-label');
  const authPanel = tools.querySelector('.nav-account-panel');
  const authSignIn = tools.querySelector('.nav-account-signin');
  const authMenu = tools.querySelector('.nav-account-menu');
  const cartButton = tools.querySelector('.nav-cart-button');
  const minicartPanel = tools.querySelector('.minicart-panel');
  const cartStatus = tools.querySelector('.nav-cart-status');

  const setPanel = (panel, button, show) => {
    panel.classList.toggle('nav-tools-panel--show', show);
    button.setAttribute('aria-expanded', show ? 'true' : 'false');
  };

  events.on('authenticated', (isAuthenticated) => {
    authMenu.hidden = !isAuthenticated;
    authSignIn.hidden = !!isAuthenticated;
    authLabel.textContent = isAuthenticated
      ? `${t('Hi', 'Bonjour')} ${getCookie('auth_dropin_firstname') || ''}`.trim()
      : loginLabel;
    authButton.classList.toggle('is-authenticated', !!isAuthenticated);
  }, { eager: true });

  let signInLoaded = false;
  authButton.addEventListener('click', async () => {
    const show = !authPanel.classList.contains('nav-tools-panel--show');
    if (show && !signInLoaded && !events.lastPayload('authenticated')) {
      signInLoaded = true;
      const { initSignIn } = await import('./renderAuth.js');
      await initSignIn(authSignIn);
    }
    setPanel(authPanel, authButton, show);
  });
  authPanel.addEventListener('click', (e) => e.stopPropagation());
  tools.querySelector('.nav-account-logout').addEventListener('click', async () => {
    const { revokeCustomerToken } = await import('@dropins/storefront-auth/api.js');
    await revokeCustomerToken();
    if (window.location.pathname.includes('/customer')) {
      window.location.href = rootLink(CUSTOMER_LOGIN_PATH);
    } else window.location.reload();
  });

  let miniCartLoaded = false;
  async function toggleMiniCart(show) {
    if (show && !miniCartLoaded) {
      miniCartLoaded = true;
      const fragment = await loadCommerceFragment('/mini-cart');
      if (fragment?.firstElementChild) minicartPanel.append(fragment.firstElementChild);
      const { publishShoppingCartViewEvent } = await import('@dropins/storefront-cart/api.js');
      publishShoppingCartViewEvent();
    }
    setPanel(minicartPanel, cartButton, show);
  }
  cartButton.addEventListener('click', () => toggleMiniCart(!minicartPanel.classList.contains('nav-tools-panel--show')));
  if (window.location.pathname.endsWith('/checkout')) cartButton.hidden = true;

  let previousQty;
  events.on('cart/data', (data) => {
    const qty = data?.totalQuantity ?? 0;
    if (qty) cartButton.setAttribute('data-count', qty);
    else cartButton.removeAttribute('data-count');
    cartButton.setAttribute('aria-label', qty ? `${cartLabel} (${qty})` : cartLabel);
    if (previousQty !== undefined && previousQty !== qty) {
      cartStatus.textContent = `${cartLabel} : ${qty}`;
    }
    previousQty = qty;
  }, { eager: true });

  const contactLink = utilitySec?.querySelector('a[href*="contact"]');
  if (contactLink) {
    const phone = el('a', 'nav-phone-button');
    phone.href = contactLink.getAttribute('href');
    phone.setAttribute('aria-label', contactLink.textContent.trim());
    tools.prepend(phone);
  }

  topInner.append(hamburger, brand, search, tools);

  /* ---------- Bottom bar: megamenu triggers + utility links ---------- */
  const navList = sectionsSec?.querySelector(':scope > ul');
  const triggers = el('ul', 'nav-sections');
  const panels = el('div', 'nav-panels');
  let openTrigger = null;

  const closePanels = () => {
    if (!openTrigger) return;
    openTrigger.setAttribute('aria-expanded', 'false');
    openTrigger = null;
    panels.querySelectorAll('.nav-panel').forEach((p) => { p.hidden = true; });
    navWrapper.classList.remove('panel-open');
  };

  [...(navList?.querySelectorAll(':scope > li') || [])].forEach((li, i) => {
    const item = el('li');
    const directLink = li.querySelector(':scope > a');
    if (directLink && !li.querySelector(':scope > ul')) {
      const a = el('a', 'nav-trigger');
      a.href = directLink.getAttribute('href');
      a.textContent = directLink.textContent;
      item.append(a);
    } else {
      const btn = el('button', 'nav-trigger nav-trigger-drop');
      btn.type = 'button';
      btn.textContent = ownLabel(li);
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', `nav-panel-${i}`);
      const cascade = !!li.querySelector(':scope > ul > li > ul > li > ul');
      const panel = cascade ? buildCascadePanel(li) : buildGroupPanel(li);
      panel.id = `nav-panel-${i}`;
      panel.hidden = true;
      panels.append(panel);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = openTrigger === btn;
        closePanels();
        if (wasOpen) return;
        openTrigger = btn;
        btn.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
        navWrapper.classList.add('panel-open');
      });
      item.append(btn);
    }
    triggers.append(item);
  });

  const utilityList = utilitySec?.querySelector('ul');
  const utility = el('ul', 'nav-utility');
  utilityList?.querySelectorAll(':scope > li').forEach((li) => {
    const item = el('li');
    item.append(buildMenuLink(li));
    utility.append(item);
  });
  navInner.append(triggers, utility);
  nav.append(panels);
  panels.addEventListener('click', (e) => e.stopPropagation());

  /* ---------- Marketing banner ---------- */
  if (bannerSec) {
    const banner = el('div', 'nav-banner');
    const [textP, ...rest] = bannerSec.querySelectorAll('p');
    if (textP) banner.append(el('p', 'nav-banner-text', textP.innerHTML));
    rest.forEach((p) => {
      const a = p.querySelector('a');
      if (a) {
        const link = a.cloneNode(true);
        link.className = 'nav-banner-link';
        banner.append(link);
      }
    });
    navWrapper.append(banner);
  }

  /* ---------- Mobile drawer ---------- */
  const closeMenu = () => {
    navWrapper.classList.remove('drawer-open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', t('OpenNavigation', 'Ouvrir le menu'));
    // eslint-disable-next-line no-use-before-define
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflowY = '';
  };
  const drawer = navList ? buildMobileMenu(navList, utilityList, closeMenu) : el('div');
  hamburger.addEventListener('click', () => {
    const open = !navWrapper.classList.contains('drawer-open');
    if (!open) { closeMenu(); return; }
    drawer.reset?.();
    navWrapper.classList.add('drawer-open');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', t('CloseNavigation', 'Fermer le menu'));
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflowY = 'hidden';
  });
  navWrapper.append(drawer);

  /* ---------- Global close behaviour ---------- */
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closePanels();
    if (!authPanel.contains(e.target) && !authButton.contains(e.target)) {
      setPanel(authPanel, authButton, false);
    }
    if (!minicartPanel.contains(e.target) && !cartButton.contains(e.target)
      && !e.target.closest('.nav-minicart')) {
      setPanel(minicartPanel, cartButton, false);
    }
    if (!search.contains(e.target)) searchResults.hidden = true;
  });
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (openTrigger) {
      const trig = openTrigger;
      closePanels();
      trig.focus();
    }
    if (navWrapper.classList.contains('drawer-open')) closeMenu();
  });
  isDesktop.addEventListener('change', () => {
    closePanels();
    closeMenu();
  });

  block.append(navWrapper);
}
