/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/carousel-promo.js
  function parse(element, { document }) {
    const cells = [];
    const slides = element.querySelectorAll(".c-carousel__slide");
    slides.forEach((slide) => {
      const srcImg = slide.querySelector("img.c-marketing-card__image, img");
      const linkEl = slide.querySelector("a.c-marketing-card__hover__button[href]") || slide.querySelector("a.c-marketing-card__link[href]") || slide.querySelector("a[href]");
      if (!srcImg && !linkEl) return;
      const imageCell = [];
      if (srcImg) {
        const img = document.createElement("img");
        img.src = srcImg.getAttribute("src") || srcImg.getAttribute("data-src") || "";
        img.alt = srcImg.getAttribute("alt") || "";
        imageCell.push(img);
      }
      const linkCell = [];
      if (linkEl) {
        const a = document.createElement("a");
        a.href = linkEl.getAttribute("href");
        const label = (slide.querySelector(".c-button__text") || linkEl).textContent.trim();
        a.textContent = label || srcImg && srcImg.getAttribute("alt") || a.href;
        const p = document.createElement("p");
        p.append(a);
        linkCell.push(p);
      }
      cells.push([imageCell, linkCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/product-recommendations.js
  function parse2(element, { document }) {
    const cells = [
      ["recId", "cf042e53-7efb-4a7e-b1bd-4f87d5c6ca84"],
      // The demo unit is a "viewed-viewed" type: on the homepage it needs an anchor SKU
      // (no product context). Authors can change it or remove it once a homepage unit exists.
      ["currentSku", "ADB406"]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "product-recommendations", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-image-text.js
  function parse3(element, { document }) {
    const figure = element.querySelector(":scope > figure.cms-image, :scope > .cms-image");
    const content = element.querySelector(":scope > .cms-double-colonnes__content");
    const imageCell = [];
    const srcImg = figure ? figure.querySelector("img") : null;
    if (srcImg) {
      const img = document.createElement("img");
      img.src = srcImg.getAttribute("src") || srcImg.getAttribute("data-src") || "";
      img.alt = srcImg.getAttribute("alt") || "";
      imageCell.push(img);
    }
    const textCell = [];
    if (content) {
      const heading = content.querySelector(":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6");
      if (heading) textCell.push(heading);
      const wysiwyg = content.querySelector(":scope > .cms-wysiwyg");
      if (wysiwyg) {
        [...wysiwyg.children].forEach((child) => textCell.push(child));
      }
      const buttons = content.querySelectorAll(".cms-double-colonnes__buttons a[href]");
      buttons.forEach((btn) => {
        const a = document.createElement("a");
        a.href = btn.getAttribute("href");
        a.textContent = btn.textContent.trim();
        const strong = document.createElement("strong");
        strong.append(a);
        const p = document.createElement("p");
        p.append(strong);
        textCell.push(p);
      });
    }
    const imageFirst = !figure || !content || !!(figure.compareDocumentPosition(content) & 4);
    const row = imageFirst ? [imageCell, textCell] : [textCell, imageCell];
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-image-text", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-logos.js
  function brandName(img, href) {
    const alt = (img && img.getAttribute("alt") || "").replace(/^\s*logo\s*/i, "").trim();
    if (alt) return alt;
    if (!href) return "";
    const slug = href.split("?")[0].replace(/\/+$/, "").split("/").pop() || "";
    return slug.split("-").filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
  function keepSvgAsImage(src) {
    return /\.svg$/.test(src) ? `${src}?format=svg` : src;
  }
  function parse4(element, { document }) {
    const cells = [];
    const slides = element.querySelectorAll(".c-carousel__slide");
    slides.forEach((slide) => {
      const srcImg = slide.querySelector("img");
      const linkEl = slide.querySelector("a[href]");
      const href = linkEl ? linkEl.getAttribute("href") : "";
      if (!srcImg && !href) return;
      const name = brandName(srcImg, href);
      const imageCell = [];
      if (srcImg) {
        const img = document.createElement("img");
        img.src = keepSvgAsImage(srcImg.getAttribute("src") || srcImg.getAttribute("data-src") || "");
        const srcAlt = (srcImg.getAttribute("alt") || "").trim();
        img.alt = srcAlt && !/^logo$/i.test(srcAlt) ? srcAlt : name ? `Logo ${name}` : srcAlt;
        imageCell.push(img);
      }
      const linkCell = [];
      if (href) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = name || href;
        linkCell.push(a);
      } else if (name) {
        linkCell.push(name);
      }
      cells.push([imageCell, linkCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-logos", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-teaser.js
  function keepSvgAsImage2(src) {
    return /\.svg$/.test(src) ? `${src}?format=svg` : src;
  }
  function text(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function buildRow(document, { img, title, description, href, label }) {
    const imageCell = [];
    if (img) {
      const image = document.createElement("img");
      image.src = keepSvgAsImage2(img.getAttribute("src") || img.getAttribute("data-src") || "");
      image.alt = (img.getAttribute("alt") || "").trim();
      imageCell.push(image);
    }
    const textCell = [];
    const titleText = text(title);
    if (titleText) {
      const h = document.createElement("h3");
      h.textContent = titleText;
      textCell.push(h);
    }
    const descText = text(description);
    if (descText) {
      const p = document.createElement("p");
      p.textContent = descText;
      textCell.push(p);
    }
    if (href) {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = label || titleText || href;
      const p = document.createElement("p");
      p.append(a);
      textCell.push(p);
    }
    return [imageCell, textCell];
  }
  function parse5(element, { document }) {
    const cells = [];
    const slides = [...element.querySelectorAll(".c-carousel__slide")];
    const titles = [...element.querySelectorAll(".cms-institutionnel-card__title")];
    if (slides.length && slides.length === titles.length) {
      slides.forEach((slide) => {
        const linkEl = slide.querySelector("a.cms-institutionnel-card__product-info[href]") || slide.querySelector("a[href]");
        cells.push(buildRow(document, {
          img: slide.querySelector(".cms-institutionnel-card__image img, img"),
          title: slide.querySelector(".cms-institutionnel-card__title"),
          description: slide.querySelector(".cms-institutionnel-card__description"),
          href: linkEl ? linkEl.getAttribute("href") : "",
          label: text(slide.querySelector(".c-button__text"))
        }));
      });
    } else {
      const imgs = [...element.querySelectorAll(".cms-institutionnel-card__image img")];
      const descs = [...element.querySelectorAll(".cms-institutionnel-card__description")];
      const labels = [...element.querySelectorAll(".cms-institutionnel-card .c-button__text")];
      const hrefs = [];
      element.querySelectorAll("a.cms-institutionnel-card__product-info[href]").forEach((a) => {
        const h = a.getAttribute("href");
        if (hrefs[hrefs.length - 1] !== h) hrefs.push(h);
      });
      titles.forEach((title, i) => {
        cells.push(buildRow(document, {
          img: imgs[i],
          title,
          description: descs[i],
          href: hrefs[i] || "",
          label: text(labels[i])
        }));
      });
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-teaser", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/widget.js
  function parse6(element, { document }) {
    const a = document.createElement("a");
    a.href = "/widgets/avis-verifies.html";
    a.textContent = "/widgets/avis-verifies.html";
    const cells = [[a]];
    const block = WebImporter.Blocks.createBlock(document, { name: "widget", cells });
    element.replaceWith(block);
  }

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

  // tools/importer/transformers/legallais-sections.js
  var MARKER = "data-excat-section-id";
  function findSection(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSection(element, section);
        if (!el) continue;
        if (i > 0 || section.style) {
          const hr = document.createElement("hr");
          if (section.style) hr.setAttribute(MARKER, section.id);
          if (i === 0) hr.setAttribute("data-excat-first", "true");
          el.before(hr);
        }
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        if (marker) {
          let next = marker.nextElementSibling;
          while (next && next.tagName !== "HR") next = next.nextElementSibling;
          if (next) next.before(metadata);
          else marker.parentElement.append(metadata);
          if (marker.getAttribute("data-excat-first") === "true") marker.remove();
          else marker.removeAttribute(MARKER);
        } else {
          const el = findSection(element, section);
          if (el) el.after(metadata);
        }
      }
    }
  }

  // tools/importer/import-home.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "carousel-promo": parse,
    "product-recommendations": parse2,
    "columns-image-text": parse3,
    "cards-logos": parse4,
    "cards-teaser": parse5,
    "widget": parse6
  };
  var sectionTransformers = [transform2];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var correctionTransformers = [];
  var transformers = [transform, ...lateTransformers, ...correctionTransformers];
  var earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
  var CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));
  function executeTransformers(hookName, element, payload, list = transformers) {
    var _a, _b;
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: ((_b = (_a = payload.params) == null ? void 0 : _a.targets) == null ? void 0 : _b.template) || PAGE_TEMPLATE });
    list.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template, url) {
    const pageBlocks = [];
    const pageKey = (u) => {
      try {
        const { origin, pathname } = new URL(u);
        return `${origin}${pathname.replace(/\/$/, "")}`;
      } catch (e) {
        return u;
      }
    };
    const key = pageKey(url);
    const claim = (blockDef, selector) => {
      let matches = [];
      try {
        matches = document.querySelectorAll(selector);
      } catch (e) {
        return;
      }
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
  function markPageTargets(payload) {
    const { document, params } = payload;
    executeTransformers("beforeTransform", document.body, payload, earlyTransformers);
    const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
      element.setAttribute("data-excat-block", String(i));
      return { name, selector };
    });
    const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
      const target = (section.selector || []).map((s) => {
        try {
          return document.querySelector(s);
        } catch (e) {
          return null;
        }
      }).find(Boolean);
      if (!target) return section;
      target.setAttribute("data-excat-section", String(i));
      return __spreadProps(__spreadValues({}, section), { selector: [`[data-excat-section="${i}"]`] });
    });
    params.targets = { blocks, template: __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { sections }) };
  }
  var import_home_default = {
    preprocess: (payload) => {
      if (CATALOG) markPageTargets(payload);
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      params.fragments = [];
      if (!params.targets) markPageTargets(payload);
      const pageBlocks = params.targets.blocks.map((block, i) => __spreadProps(__spreadValues({}, block), { element: document.querySelector(`[data-excat-block="${i}"]`) })).filter((block) => block.element);
      executeTransformers("beforeTransform", main, __spreadProps(__spreadValues({}, payload), { pageBlocks }), lateTransformers);
      pageBlocks.forEach((block) => {
        if (!main.contains(block.element)) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      params.fragments.forEach(({ element }) => {
        executeTransformers("afterTransform", element, payload, earlyTransformers);
        WebImporter.rules.transformBackgroundImages(element, document);
        WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
      });
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_home_exports);
})();
