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

  // tools/importer/import-commerce-pages.js
  var import_commerce_pages_exports = {};
  __export(import_commerce_pages_exports, {
    default: () => import_commerce_pages_default
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

  // tools/importer/import-commerce-pages.js
  var CREATE_ACCOUNT_PATH = "/customer/create";
  var CART_PATH = "/cart";
  var CART_SUMMARY_PATH = "/cart-summary";
  var CHECKOUT_PATH = "/checkout";
  var text = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  function sectionMetadata(document, style) {
    return WebImporter.DOMUtils.createTable([["Section Metadata"], ["style", style]], document);
  }
  function metadata(document, title) {
    return WebImporter.DOMUtils.createTable([
      ["Metadata"],
      ["Title", title],
      ["Robots", "noindex"]
    ], document);
  }
  function readSourceConfig(document, blockClass) {
    const block = document.querySelector(`.${blockClass}`);
    if (!block) {
      console.warn(`\u26A0\uFE0F readSourceConfig: .${blockClass} not found`);
      return [];
    }
    return [...block.children].map((row) => [...row.children].map((cell) => text(cell))).filter(([key]) => key);
  }
  function link(document, href, label, wrapTag) {
    const p = document.createElement("p");
    const a = document.createElement("a");
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
    const title = text(document.querySelector("h1")) || "Acc\xE9dez \xE0 votre compte";
    const card = document.querySelector(".c-connection__card--signin");
    const cardTitle = text(card == null ? void 0 : card.querySelector(".c-connection__card__title")) || "Cr\xE9er un compte";
    const intro = card == null ? void 0 : card.querySelector(".c-connection__card__intro");
    const ctaLabel = text(card == null ? void 0 : card.querySelector("a.c-button")) || cardTitle;
    if (!card) console.warn("\u26A0\uFE0F transformLogin: .c-connection__card--signin not found");
    const h1 = document.createElement("h1");
    h1.textContent = title;
    const h2 = document.createElement("h2");
    h2.textContent = cardTitle;
    const p = document.createElement("p");
    if (intro) p.innerHTML = intro.innerHTML.trim();
    else p.textContent = "Vous \xEAtes un professionnel, cr\xE9ez votre propre compte en un instant.";
    const login = WebImporter.DOMUtils.createTable([["Commerce Login"], [""]], document);
    main.innerHTML = "";
    main.append(h1);
    main.append(document.createElement("hr"));
    main.append(h2, p, link(document, CREATE_ACCOUNT_PATH, ctaLabel, "em"), login);
    main.append(sectionMetadata(document, "login"));
    transform("afterTransform", main, payload);
    main.append(document.createElement("hr"));
    main.append(metadata(document, "Connexion | Legallais"));
    return [{
      element: main,
      path: "/customer/login",
      report: { title, template: "commerce-login", blocks: ["commerce-login"] }
    }];
  }
  var CART_OVERRIDES = {
    cart: { "Checkout URL": CART_SUMMARY_PATH },
    summary: {
      "Enable Item Quantity Update": "false",
      "Enable Item Remove": "false",
      "Hide Heading": "true",
      "Enable Estimate Shipping": "false",
      "Checkout URL": CHECKOUT_PATH,
      "Enable Updating Product": "false"
    }
  };
  var CART_DROPPED_KEYS = ["Agreement name", "Agreement link"];
  function transformCart(payload, step) {
    const { document } = payload;
    const main = document.body;
    const overrides = CART_OVERRIDES[step];
    const rows = readSourceConfig(document, "commerce-cart").filter(([key]) => !CART_DROPPED_KEYS.includes(key)).map(([key, value]) => {
      var _a;
      return [key, (_a = overrides[key]) != null ? _a : value];
    });
    Object.entries(overrides).forEach(([key, value]) => {
      if (!rows.some(([k]) => k === key)) rows.push([key, value]);
    });
    const name = step === "summary" ? "Commerce Cart (summary)" : "Commerce Cart";
    const cart = WebImporter.DOMUtils.createTable([[name], ...rows], document);
    main.innerHTML = "";
    if (step === "summary") {
      main.append(link(document, CART_PATH, "Modifier mon panier"));
      const h1 = document.createElement("h1");
      h1.textContent = "R\xE9capitulatif de votre panier";
      main.append(h1);
    }
    main.append(cart);
    main.append(sectionMetadata(document, "commerce-page"));
    main.append(document.createElement("hr"));
    main.append(metadata(document, step === "summary" ? "R\xE9capitulatif du panier | Legallais" : "Panier | Legallais"));
    return [{
      element: main,
      path: step === "summary" ? CART_SUMMARY_PATH : CART_PATH,
      report: { title: step === "summary" ? "R\xE9capitulatif du panier" : "Panier", template: `commerce-${step}`, blocks: ["commerce-cart"] }
    }];
  }
  function transformCheckout(payload) {
    const { document } = payload;
    const main = document.body;
    if (!document.querySelector(".commerce-checkout")) console.warn("\u26A0\uFE0F transformCheckout: .commerce-checkout not found");
    const checkout = WebImporter.DOMUtils.createTable([["Commerce Checkout"], [""]], document);
    main.innerHTML = "";
    main.append(checkout);
    main.append(sectionMetadata(document, "commerce-page"));
    main.append(document.createElement("hr"));
    main.append(metadata(document, "Commande | Legallais"));
    return [{
      element: main,
      path: CHECKOUT_PATH,
      report: { title: "Commande", template: "commerce-checkout", blocks: ["commerce-checkout"] }
    }];
  }
  function blockFromSource(document, el, overrides = {}) {
    const [name, ...variants] = [...el.classList];
    const title = name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    const header = variants.length ? `${title} (${variants.join(", ")})` : title;
    const rows = [...el.children].map((row) => {
      const cells = [...row.children].map((cell) => text(cell));
      if (cells.length > 1 && overrides[cells[0]] !== void 0) cells[1] = overrides[cells[0]];
      return cells.length ? cells : [""];
    });
    return WebImporter.DOMUtils.createTable([[header], ...rows.length ? rows : [[""]]], document);
  }
  var ACCOUNT_FORMS = {
    "/customer/create": { block: "commerce-create-account", title: "Cr\xE9er un compte | Legallais" },
    "/customer/forgotpassword": { block: "commerce-forgot-password", title: "Mot de passe oubli\xE9 | Legallais" }
  };
  function transformAccountForm(payload, path) {
    const { document } = payload;
    const main = document.body;
    const { block, title } = ACCOUNT_FORMS[path];
    const source = document.querySelector(`.${block}`);
    if (!source) console.warn(`\u26A0\uFE0F transformAccountForm: .${block} not found`);
    const table = source ? blockFromSource(document, source) : WebImporter.DOMUtils.createTable([[block.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")], [""]], document);
    main.innerHTML = "";
    main.append(table);
    main.append(sectionMetadata(document, "account-form"));
    main.append(document.createElement("hr"));
    main.append(metadata(document, title));
    return [{ element: main, path, report: { title, template: "commerce-account-form", blocks: [block] } }];
  }
  var ACCOUNT_BLOCK_OVERRIDES = { Title: "Mon compte" };
  function transformAccount(payload) {
    const { document } = payload;
    const main = document.body;
    const sections = [...document.body.children].filter((s) => s.tagName === "DIV");
    const rebuilt = sections.map((section) => ({
      width: section.getAttribute("data-column-width"),
      gap: section.getAttribute("data-gap"),
      blocks: [...section.children].filter((el) => el.classList.length).map((el) => blockFromSource(document, el, ACCOUNT_BLOCK_OVERRIDES))
    }));
    if (!rebuilt.length) console.warn("\u26A0\uFE0F transformAccount: no source sections");
    main.innerHTML = "";
    rebuilt.forEach(({ width, gap, blocks }, i) => {
      if (i) main.append(document.createElement("hr"));
      blocks.forEach((b) => main.append(b));
      const rows = [["Section Metadata"], ["style", "commerce-page"]];
      if (width) rows.push(["Column Width", width]);
      if (gap) rows.push(["Gap", gap]);
      main.append(WebImporter.DOMUtils.createTable(rows, document));
    });
    main.append(document.createElement("hr"));
    main.append(WebImporter.DOMUtils.createTable([
      ["Metadata"],
      ["Title", "Mon compte | Legallais"],
      ["Template", "My Account, Columns"],
      ["Robots", "noindex, nofollow"]
    ], document));
    return [{ element: main, path: "/customer/account", report: { title: "Mon compte", template: "commerce-account", blocks: ["commerce-account-sidebar", "commerce-account-header"] } }];
  }
  var SIDEBAR_FR = {
    "/customer/account": ["Mon compte", "Informations du compte"],
    "/customer/orders": ["Commandes", "Suivre, g\xE9rer et retourner"],
    "/customer/address": ["Adresses", "G\xE9rer vos adresses"],
    "/customer/returns": ["Retours", "G\xE9rer vos retours"]
  };
  function transformSidebar(payload) {
    const { document } = payload;
    const main = document.body;
    const items = [...document.querySelectorAll("body > div > ol > li, body > ol > li")].map((li) => {
      const params = [...li.querySelectorAll(":scope > ol > li")].map((p) => text(p));
      return { title: text(li.querySelector(":scope > p")), params };
    }).filter(({ params }) => SIDEBAR_FR[params[1]]);
    if (!items.length) console.warn("\u26A0\uFE0F transformSidebar: no sidebar items");
    const ol = document.createElement("ol");
    items.forEach(({ params }) => {
      const [title, subtitle] = SIDEBAR_FR[params[1]];
      const li = document.createElement("li");
      const p = document.createElement("p");
      p.textContent = title;
      const sub = document.createElement("ol");
      [subtitle, params[1], params[2]].forEach((value) => {
        const item = document.createElement("li");
        item.textContent = value;
        sub.append(item);
      });
      li.append(p, sub);
      ol.append(li);
    });
    main.innerHTML = "";
    main.append(ol);
    return [{ element: main, path: "/customer/sidebar-fragment", report: { title: "Menu espace client", template: "commerce-account-sidebar", blocks: [] } }];
  }
  var import_commerce_pages_default = {
    transform: (payload) => {
      const { pathname, searchParams } = new URL(payload.params.originalURL);
      const page = pathname.replace(/\.plain\.html$/, "");
      if (ACCOUNT_FORMS[page]) return transformAccountForm(payload, page);
      if (page === "/customer/account") return transformAccount(payload);
      if (page === "/customer/sidebar-fragment") return transformSidebar(payload);
      if (pathname.startsWith("/user/connection")) return transformLogin(payload);
      if (pathname.startsWith("/cart")) return transformCart(payload, searchParams.get("step") === "summary" ? "summary" : "cart");
      if (pathname.startsWith("/checkout")) return transformCheckout(payload);
      throw new Error(`import-commerce-pages: no transform for ${payload.params.originalURL}`);
    }
  };
  return __toCommonJS(import_commerce_pages_exports);
})();
