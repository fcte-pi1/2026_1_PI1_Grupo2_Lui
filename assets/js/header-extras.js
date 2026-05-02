(function () {
  "use strict";

  const header = document.querySelector(".md-header");
  const tabs = document.querySelector(".md-tabs");
  const thresholds = {
    headerOn: 16,
    headerOff: 4,
    tabsOn: 120,
    tabsOff: 96,
  };

  let headerScrolled = false;
  let tabsCollapsed = false;
  let ticking = false;

  function applyScrollState() {
    const y = window.scrollY || window.pageYOffset;

    const nextHeaderScrolled = headerScrolled
      ? y > thresholds.headerOff
      : y > thresholds.headerOn;

    const nextTabsCollapsed = tabsCollapsed
      ? y > thresholds.tabsOff
      : y > thresholds.tabsOn;

    if (nextHeaderScrolled !== headerScrolled) {
      headerScrolled = nextHeaderScrolled;
      if (header) header.classList.toggle("is-scrolled", headerScrolled);
    }

    if (nextTabsCollapsed !== tabsCollapsed) {
      tabsCollapsed = nextTabsCollapsed;
      if (tabs) tabs.classList.toggle("is-collapsed", tabsCollapsed);
    }

    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(applyScrollState);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  applyScrollState();

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
