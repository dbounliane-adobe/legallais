/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/commerce-import.js
  var commerce_import_exports = {};
  __export(commerce_import_exports, {
    default: () => commerce_import_default
  });

  // tools/importer/transformers/legallais-cleanup.js
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, [
        ".config-cookies-consent-popup",
        // cookie consent layer (mfp-bg + mfp-wrap)
        "#configCookiesPopup",
        ".sab",
        // app download banner
        ".o-search-overlay",
        // search overlay
        ".o-menu",
        // mobile / desktop menus
        "#skeepers_carousel_modal",
        // Skeepers reviews modal
        ".skeepers-widget-popup",
        ".o-modal",
        ".notification.js-notification",
        ".back-to-top",
        ".mfp-hide",
        "hr.c-separator"
        // decorative dotted separators (would otherwise become section breaks)
      ]);
      element.querySelectorAll("a.c-button").forEach((a) => {
        var _a;
        if (a.closest("strong, em")) return;
        const cls = a.className;
        let wrapTag = null;
        if (/c-button--solid/.test(cls)) wrapTag = "strong";
        else if (/c-button--(outline|tonal)/.test(cls)) wrapTag = "em";
        if (!wrapTag) return;
        const label = a.textContent.replace(/\s+/g, " ").trim();
        if (label) a.textContent = label;
        const doc = element.ownerDocument;
        const wrap = doc.createElement(wrapTag);
        const holder = ((_a = a.parentElement) == null ? void 0 : _a.tagName) === "P" ? wrap : doc.createElement("p");
        a.replaceWith(holder);
        if (holder !== wrap) holder.append(wrap);
        wrap.append(a);
      });
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        "header.o-header",
        "footer.o-footer",
        "script",
        "style",
        "link",
        "noscript",
        "iframe"
      ]);
      element.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        const m = href.match(/^(?:https?:)?\/\/www\.legallais\.com(\/[^#?]*)?(.*)$/);
        if (!m) return;
        let path = m[1] || "/";
        const cat = path.match(/^\/([a-z0-9-]+)\/\d+\/?$/);
        if (cat) path = `/categories/${cat[1]}`;
        if (path === "/user/create-account") path = "/customer/create";
        if (path.startsWith("/user/connection")) path = "/customer/login";
        a.setAttribute("href", `${path}${m[2] || ""}`);
        if (a.textContent.trim() === href) a.textContent = a.getAttribute("href");
      });
      const attrs = ["data-controller", "data-action", "onclick", "data-track"];
      element.querySelectorAll("*").forEach((el) => {
        attrs.forEach((a) => el.removeAttribute(a));
        [...el.attributes].forEach(({ name }) => {
          if (/^data-(utils|components|objects)--/.test(name)) el.removeAttribute(name);
        });
      });
    }
  }

  // tools/importer/commerce-import.js
  var DEMO_CATEGORY_URLPATH = "office";
  var PAGE_SIZE = "12";
  var DEMO_DEFAULT_SKU = "ADB406";
  var RECOMMENDATIONS_REC_ID = "cf042e53-7efb-4a7e-b1bd-4f87d5c6ca84";
  var RELATED_HEADING_PATTERN = /m[eê]me gamme/i;
  var UNIVERS_BY_SLUG = {
    batiment: "batiment",
    "agencement-ameublement": "agencement-ameublement",
    plomberie: "plomberie",
    "genie-climatique": "genie-climatique",
    electricite: "electricite",
    consommables: "consommables",
    outillage: "outillage",
    "materiels-et-equipements": "materiels-et-equipements",
    epi: "epi"
  };
  var slugFromHref = (href) => {
    try {
      const { pathname } = new URL(href, "https://www.legallais.com");
      return pathname.split("/").filter(Boolean)[0] || "";
    } catch (e) {
      return "";
    }
  };
  function parseBreadcrumb(document) {
    const items = [...document.querySelectorAll("ol.c-breadcrumb .c-breadcrumb__item")];
    if (!items.length) {
      console.warn("\u26A0\uFE0F parseBreadcrumb: ol.c-breadcrumb not found");
      return { block: null, univers: null };
    }
    const ul = document.createElement("ul");
    let univers = null;
    items.forEach((li) => {
      const a = li.querySelector("a");
      const item = document.createElement("li");
      const text = li.textContent.replace(/\s+/g, " ").trim();
      if (a) {
        const link = document.createElement("a");
        link.href = a.getAttribute("href");
        link.textContent = text;
        item.append(link);
        const slug = slugFromHref(a.getAttribute("href"));
        if (!univers && UNIVERS_BY_SLUG[slug]) univers = UNIVERS_BY_SLUG[slug];
      } else {
        item.textContent = text;
      }
      ul.append(item);
    });
    const name = univers ? `Breadcrumb (${univers})` : "Breadcrumb";
    return { block: WebImporter.DOMUtils.createTable([[name], [ul]], document), univers };
  }
  function parseCategoryHeader(document) {
    const nav = document.querySelector(".category-nav");
    if (!nav) {
      console.warn("\u26A0\uFE0F parseCategoryHeader: .category-nav not found");
      return null;
    }
    const nodes = [];
    const back = nav.querySelector(".category-nav__back-button");
    if (back) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = back.getAttribute("href");
      a.textContent = back.textContent.replace(/\s+/g, " ").trim();
      p.append(a);
      nodes.push(p);
    }
    const title = nav.querySelector(".category-nav__title");
    if (title) {
      const h1 = document.createElement("h1");
      h1.textContent = title.textContent.trim();
      nodes.push(h1);
    }
    const count = nav.querySelector(".category-nav__count");
    if (count) {
      const p = document.createElement("p");
      p.textContent = count.textContent.trim();
      nodes.push(p);
    }
    return nodes;
  }
  function parseSubcategories(document) {
    const tiles = [...document.querySelectorAll(".category-nav .c-tile")];
    if (!tiles.length) {
      console.warn("\u26A0\uFE0F parseSubcategories: no .category-nav .c-tile");
      return null;
    }
    const rows = [["Cards Subcategory"]];
    tiles.forEach((tile) => {
      var _a;
      const a = tile.closest("a");
      const img = tile.querySelector("img");
      const label = ((_a = tile.querySelector(".c-tile__label")) == null ? void 0 : _a.textContent.trim()) || (a == null ? void 0 : a.textContent.trim());
      const link = document.createElement("a");
      link.href = (a == null ? void 0 : a.getAttribute("href")) || "#";
      link.textContent = label;
      let image = "";
      if (img) {
        const i = document.createElement("img");
        i.src = img.getAttribute("src") || img.getAttribute("data-src");
        i.alt = label || "";
        image = i;
      }
      rows.push([image, link]);
    });
    return WebImporter.DOMUtils.createTable(rows, document);
  }
  function parseGuides(document) {
    var _a;
    const footer = document.querySelector(".category-nav__footer");
    if (!footer) return null;
    const label = (_a = footer.querySelector(".category-nav__guides-toggle")) == null ? void 0 : _a.textContent.replace(/\s+/g, " ").trim();
    const links = [...footer.querySelectorAll(".category-nav__guides-list a")];
    if (!links.length) return null;
    const p = document.createElement("p");
    if (label) {
      const strong = document.createElement("strong");
      strong.textContent = `${label} : `;
      p.append(strong);
    }
    links.forEach((a, i) => {
      if (i) p.append(document.createTextNode(" \xB7 "));
      const link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = a.textContent.trim();
      p.append(link);
    });
    return p;
  }
  function sectionMetadata(document, style) {
    return WebImporter.DOMUtils.createTable([["Section Metadata"], ["style", style]], document);
  }
  function transformProductPage(payload) {
    var _a, _b;
    const { document } = payload;
    const main = document.body;
    const relatedHeading = (_a = [...document.querySelectorAll(".product-page h2")].find((h) => RELATED_HEADING_PATTERN.test(h.textContent))) == null ? void 0 : _a.textContent.trim();
    const productTitle = (_b = document.querySelector(".product-page h1")) == null ? void 0 : _b.textContent.trim();
    const details = WebImporter.DOMUtils.createTable([
      ["Product Details"],
      ["defaultSku", DEMO_DEFAULT_SKU]
    ], document);
    const recommendations = WebImporter.DOMUtils.createTable([
      ["Product Recommendations"],
      ["recId", RECOMMENDATIONS_REC_ID]
    ], document);
    main.innerHTML = "";
    main.append(details);
    main.append(document.createElement("hr"));
    if (relatedHeading) {
      const h2 = document.createElement("h2");
      h2.textContent = relatedHeading;
      main.append(h2);
    }
    main.append(recommendations);
    transform("afterTransform", main, payload);
    const meta = WebImporter.DOMUtils.createTable([
      ["Metadata"],
      ["Title", "Produit | Legallais"],
      ["Template", "product"],
      ["Robots", "noindex"]
    ], document);
    main.append(document.createElement("hr"));
    main.append(meta);
    return [{
      element: main,
      path: "/products/default",
      report: { title: productTitle, template: "PDP", blocks: ["product-details", "product-recommendations"] }
    }];
  }
  var commerce_import_default = {
    transform: (payload) => {
      var _a, _b;
      const { document, url, params } = payload;
      const main = document.body;
      const originalURL = (params == null ? void 0 : params.originalURL) || url;
      transform("beforeTransform", main, payload);
      if (document.querySelector(".product-page") && !document.querySelector(".c-articles-container")) {
        return transformProductPage(payload);
      }
      const { block: breadcrumb, univers } = parseBreadcrumb(document);
      const header = parseCategoryHeader(document);
      const subcategories = parseSubcategories(document);
      const guides = parseGuides(document);
      const hasGrid = !!document.querySelector(".c-articles-container");
      const sourceSlug = slugFromHref(originalURL);
      const title = (_a = document.querySelector(".category-nav__title")) == null ? void 0 : _a.textContent.trim();
      const description = (_b = document.querySelector('meta[name="description"]')) == null ? void 0 : _b.getAttribute("content");
      const plp = WebImporter.DOMUtils.createTable([
        ["Product List Page"],
        ["urlpath", DEMO_CATEGORY_URLPATH || sourceSlug],
        ["pageSize", PAGE_SIZE]
      ], document);
      main.innerHTML = "";
      const sections = [];
      if (breadcrumb) sections.push([breadcrumb]);
      if (header || subcategories || guides) {
        sections.push([
          ...header || [],
          subcategories,
          guides,
          sectionMetadata(document, univers ? `card, ${univers}` : "card")
        ].filter(Boolean));
      }
      if (hasGrid) sections.push([plp]);
      sections.forEach((nodes, i) => {
        if (i) main.append(document.createElement("hr"));
        nodes.forEach((n) => main.append(n));
      });
      transform("afterTransform", main, payload);
      const meta = WebImporter.DOMUtils.createTable([
        ["Metadata"],
        ["Title", title ? `${title} | Legallais` : document.title],
        ...description ? [["Description", description]] : [],
        ["Template", "category"],
        ["Category", sourceSlug]
      ], document);
      main.append(document.createElement("hr"));
      main.append(meta);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, originalURL);
      const rawPath = new URL(originalURL).pathname.replace(/\.html?$/i, "").replace(/\/+$/, "") || "/";
      const cat = rawPath.match(/^\/([a-z0-9-]+)\/\d+$/);
      const path = WebImporter.FileUtils.sanitizePath(cat ? `/categories/${cat[1]}` : rawPath);
      return [{
        element: main,
        path,
        report: { title, template: "PLP", blocks: ["breadcrumb", "cards-subcategory", "product-list-page"] }
      }];
    }
  };
  return __toCommonJS(commerce_import_exports);
})();
