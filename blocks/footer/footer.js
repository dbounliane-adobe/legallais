import { getRootPath, isMultistore } from '@dropins/tools/lib/aem/configs.js';
// Dropin Components
import {
  Button,
  provider as UI,
} from '@dropins/tools/components.js';

// Block-level
import createModal from '../modal/modal.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Toggles all storeSelector sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleStoreDropdown(sections, expanded = false) {
  sections
    .querySelectorAll('.storeview-modal .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

/**
 * Renders the multistore (language / region) switcher when several stores are configured.
 * Content comes from the /store-switcher fragment (one entry per locale root, e.g. /fr/fr/).
 * @param {Element} footer footer container
 */
async function renderStoreSwitcher(footer) {
  const root = getRootPath();
  footer.insertAdjacentHTML('beforeend', '<div class="storeview-switcher-button"></div>');

  // Container and component refs
  let modal;

  // Modal Actions
  const showModal = async (content) => {
    modal = await createModal([content]);
    modal.showModal();
  };

  // Rendering the Store Switcher Modal Content
  const $storeSwitcherBtn = footer.querySelector(
    '.storeview-switcher-button',
  );

  // Store Switcher Modal Content
  const storeSwitcherPath = '/store-switcher';
  let fragmentStoreView;

  try {
    fragmentStoreView = await loadFragment(storeSwitcherPath);
    if (!fragmentStoreView) throw new Error(`Footer does not render due to Store Switcher fragment (${storeSwitcherPath}) not found`);
  } catch (error) {
    console.error('Error loading store switcher fragment:', error);
    return;
  }

  // Store Switcher Modal Content
  const storeSwitcher = document.createElement('div');

  // Return Storename from stores-switcher
  const selected = [...fragmentStoreView.querySelectorAll('a')].find((a) => {
    const url = new URL(a.href);
    return url.pathname.startsWith(root);
  });

  storeSwitcher.id = 'storeview-modal';
  while (fragmentStoreView.firstElementChild) {
    storeSwitcher.append(fragmentStoreView.firstElementChild);
  }

  // create classes for storeview modal sections
  const classes = ['storeview-title', 'storeview-list'];
  classes.forEach((c, i) => {
    const section = storeSwitcher.children[i];
    if (section) section.classList.add(`storeview-modal-${c}`);
  });

  // Store Switcher Modal Content - Store View Title
  const storeViewTitle = storeSwitcher.querySelector('.storeview-modal-storeview-title');
  const title = storeViewTitle.querySelector('h3');
  if (title) {
    title.className = '';
    title.closest('h3').classList.add('storeview-modal-storeview-title');
    title.setAttribute('tabindex', '0');
  }

  // Storeview List
  const storeViewList = storeSwitcher.querySelector('.storeview-modal-storeview-list');

  if (storeViewList && storeViewList.children.length) {
    // Add storeview-selection class to parent UL
    storeViewList
      .querySelectorAll(':scope .default-content-wrapper > ul')
      .forEach((storeView) => {
        if (storeView.querySelector('ul')) storeView.classList.add('storeview-selection');
      });

    // if multiple stores exist per region, add class storeviews and click events for accordion
    storeViewList.querySelectorAll('.default-content-wrapper > ul > li > ul').forEach((storeRegion) => {
      if (storeRegion.children.length > 1) {
        if (storeRegion.querySelector('ul')) storeRegion.classList.add('storeviews');

        // Accessiblity: addeventlistener for 'click' and keyboard event and tab indexes
        storeViewList.querySelectorAll(':scope li').forEach((storeView) => {
          const link = storeView.closest('a');
          if (link) link.setAttribute('tabindex', '0');
          storeView.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              const expanded = storeView.getAttribute('aria-expanded') === 'true';
              toggleStoreDropdown(storeViewList);
              storeView.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            }
          });
          storeView.addEventListener('click', () => {
            const expanded = storeView.getAttribute('aria-expanded') === 'true';
            toggleStoreDropdown(storeViewList);
            storeView.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          });
        });
      }
    });

    // If only one storeview link in region, convert parent UL into the li and remove the child UL
    storeViewList.querySelectorAll('.default-content-wrapper > ul > li > ul').forEach((storeRegion) => {
      const li = storeRegion.closest('li');

      if (storeRegion.children.length <= 1) {
        li.classList.add('storeview-single-store');
        const ulParent = li.closest('ul');
        const replacedChild = (storeRegion.firstElementChild);
        replacedChild.className = 'storeview-single-store';

        ulParent.replaceChild(replacedChild, li);
        ulParent.setAttribute('tabindex', '0');
      } else {
        li.classList.add('storeview-multiple-stores');
        li.setAttribute('tabindex', '0');
      }
    });

    UI.render(Button, {
      children: `${selected.text}`,
      'data-testid': 'storeview-switcher-button',
      className: 'storeview-switcher-button',
      size: 'medium',
      variant: 'teritary',
      onClick: () => {
        showModal(storeSwitcher);
      },
    })($storeSwitcherBtn);
  }
}

/**
 * Fetches the footer fragment. Metadata-independent dual fetch:
 * /content/footer.plain.html (local preview) first, then /footer.plain.html (DA / EDS).
 * @returns {Promise<Document|null>}
 */
async function fetchFooter() {
  let base = '/content/footer.plain.html';
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) {
    base = '/footer.plain.html';
    resp = await fetch('/footer.plain.html');
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

const isImageList = (ul) => [...ul.children].every((li) => li.querySelector('img'));

/**
 * Builds a titled group: heading followed by its list (links or image links).
 */
function buildGroup(heading, list, className) {
  const group = document.createElement('div');
  group.className = className;
  if (heading) {
    const title = document.createElement('p');
    title.className = 'footer-title';
    title.textContent = heading.textContent;
    group.append(title);
  }
  if (list) {
    list.className = isImageList(list) ? 'footer-logos' : 'footer-links';
    group.append(list);
  }
  return group;
}

/** Pairs every heading of a section with the list that follows it */
function groupsOf(section) {
  return [...section.querySelectorAll(':scope > h2, :scope > h3, :scope > h4')].map((h) => {
    const next = h.nextElementSibling;
    return { heading: h, list: next?.tagName === 'UL' ? next : null };
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const doc = await fetchFooter();
  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-inner';
  if (!doc) {
    block.append(footer);
    return;
  }
  const sections = [...doc.body.querySelectorAll(':scope > div')];
  const main = document.createElement('div');
  main.className = 'footer-main';
  const bottom = document.createElement('div');
  bottom.className = 'footer-bottom';

  sections.forEach((section, i) => {
    const groups = groupsOf(section);
    const isLast = i === sections.length - 1 && sections.length > 1;
    if (isLast) {
      groups.forEach(({ heading, list }) => bottom.append(buildGroup(heading, list, 'footer-bottom-group')));
      return;
    }
    const allLinks = groups.every(({ list }) => list && !isImageList(list));
    const wrap = document.createElement('div');
    wrap.className = allLinks ? 'footer-columns' : 'footer-band';
    groups.forEach(({ heading, list }) => wrap.append(buildGroup(heading, list, allLinks ? 'footer-column' : 'footer-band-group')));
    main.append(wrap);
  });

  footer.append(main);
  if (bottom.children.length) footer.append(bottom);

  const backToTop = document.createElement('button');
  backToTop.type = 'button';
  backToTop.className = 'footer-back-to-top';
  backToTop.setAttribute('aria-label', 'Retour en haut de page');
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const toggleBackToTop = () => backToTop.classList.toggle('is-visible', window.scrollY > 400);
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();
  footer.append(backToTop);

  if (isMultistore()) await renderStoreSwitcher(footer);

  block.append(footer);
}
