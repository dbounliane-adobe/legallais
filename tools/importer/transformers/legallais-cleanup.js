/* eslint-disable */
/* global WebImporter */

/**
 * Legallais cleanup transformer.
 * Removes non-authorable site chrome, overlays and widgets. Selector driven only.
 */
export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Overlays / modals / banners that can interfere with block matching
    WebImporter.DOMUtils.remove(element, [
      '.config-cookies-consent-popup', // cookie consent layer (mfp-bg + mfp-wrap)
      '#configCookiesPopup',
      '.sab', // app download banner
      '.o-search-overlay', // search overlay
      '.o-menu', // mobile / desktop menus
      '#skeepers_carousel_modal', // Skeepers reviews modal
      '.skeepers-widget-popup',
      '.o-modal',
      '.notification.js-notification',
      '.back-to-top',
      '.mfp-hide',
      'hr.c-separator', // decorative dotted separators (would otherwise become section breaks)
    ]);

    // Source CTA buttons -> EDS authored buttons: solid = primary (<strong>), outline/tonal = secondary (<em>)
    element.querySelectorAll('a.c-button').forEach((a) => {
      if (a.closest('strong, em')) return;
      const cls = a.className;
      let wrapTag = null;
      if (/c-button--solid/.test(cls)) wrapTag = 'strong';
      else if (/c-button--(outline|tonal)/.test(cls)) wrapTag = 'em';
      if (!wrapTag) return;
      const label = a.textContent.replace(/\s+/g, ' ').trim();
      if (label) a.textContent = label;
      const doc = element.ownerDocument;
      const wrap = doc.createElement(wrapTag);
      // each CTA in its own paragraph so EDS decorates it as a button
      const holder = a.parentElement?.tagName === 'P' ? wrap : doc.createElement('p');
      a.replaceWith(holder);
      if (holder !== wrap) holder.append(wrap);
      wrap.append(a);
    });
  }

  if (hookName === 'afterTransform') {
    WebImporter.DOMUtils.remove(element, [
      'header.o-header',
      'footer.o-footer',
      'script',
      'style',
      'link',
      'noscript',
      'iframe',
    ]);

    // Same-site links become site-relative; category URLs (/slug/123) follow the
    // conventional storefront structure /categories/slug used by the PLP pages.
    element.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      const m = href.match(/^(?:https?:)?\/\/www\.legallais\.com(\/[^#?]*)?(.*)$/);
      if (!m) return;
      let path = m[1] || '/';
      const cat = path.match(/^\/([a-z0-9-]+)\/\d+\/?$/);
      if (cat) path = `/categories/${cat[1]}`;
      if (path === '/user/create-account') path = '/customer/create';
      if (path.startsWith('/user/connection')) path = '/customer/login';
      a.setAttribute('href', `${path}${m[2] || ''}`);
      if (a.textContent.trim() === href) a.textContent = a.getAttribute('href');
    });

    // Strip tracking / framework attributes (keep comments: XWalk field hints)
    const attrs = ['data-controller', 'data-action', 'onclick', 'data-track'];
    element.querySelectorAll('*').forEach((el) => {
      attrs.forEach((a) => el.removeAttribute(a));
      [...el.attributes].forEach(({ name }) => {
        if (/^data-(utils|components|objects)--/.test(name)) el.removeAttribute(name);
      });
    });
  }
}
