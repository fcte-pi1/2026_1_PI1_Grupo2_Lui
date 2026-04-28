(function () {
  "use strict";

  const header = document.querySelector(".md-header");
  const tabs = document.querySelector(".md-tabs");

  function onScroll() {
    const y = window.scrollY || window.pageYOffset;
    const scrolled = y > 16;
    if (header) header.classList.toggle("is-scrolled", scrolled);
    if (tabs) tabs.classList.toggle("is-collapsed", y > 120);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Atalho de teclado (Ctrl+K ou Cmd+K) para focar na pesquisa
  document.addEventListener("keydown", function (e) {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const cmd = isMac ? e.metaKey : e.ctrlKey;
    if (cmd && e.key.toLowerCase() === "k") {
      e.preventDefault();
      const toggle = document.querySelector('input[name="search"]');
      if (toggle) {
        toggle.checked = true;
        const input = document.querySelector(".md-search__input");
        if (input) setTimeout(() => input.focus(), 50);
      }
    }
  });
})();
