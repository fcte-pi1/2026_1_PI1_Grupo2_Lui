/* ============================================================
   docs/assets/js/secondary-nav.js — MicroMouse PI1
   Enriquece o .md-nav--secondary (index de seção):
     · Conta os itens e expõe via data-mm-count → ativa "[NN PÁG]"
     · Lê <meta name="mm-status" content="ok|draft|todo"> da página
       e propaga pro link ativo (E)
   ============================================================ */

(function () {
  "use strict";

  function enhanceSecondaryNav() {
    document.querySelectorAll(".md-nav--secondary").forEach(function (nav) {
      // (H) contador de páginas
      const items = nav.querySelectorAll(":scope > .md-nav__list > .md-nav__item");
      if (items.length > 0) {
        nav.setAttribute(
          "data-mm-count",
          String(items.length).padStart(2, "0")
        );
      }

      // (E) status do link ativo a partir de <meta name="mm-status">
      const meta = document.querySelector('meta[name="mm-status"]');
      const status = meta ? meta.getAttribute("content") : null;
      if (status) {
        const active = nav.querySelector(".md-nav__link--active");
        if (active) active.setAttribute("data-status", status);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceSecondaryNav);
  } else {
    enhanceSecondaryNav();
  }

  // Re-executa quando a navegação interna do Material substitui o conteúdo
  document.addEventListener("DOMContentSwitch", enhanceSecondaryNav);
})();
