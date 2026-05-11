(function () {
  "use strict";

  const header = document.querySelector(".md-header");
  const tabs = document.querySelector(".md-tabs");

  // Thresholds com histerese LARGA — evita oscilação na borda.
  // tabsOn (colapsar) precisa estar bem acima de tabsOff (expandir),
  // porque o colapso causa layout shift de ~48px.
  const thresholds = {
    headerOn:  32,   // ativa glass após rolar 32px
    headerOff: 8,    // só desativa glass perto do topo
    tabsOn:    180,  // colapsa só depois de rolar bem
    tabsOff:   60,   // só re-expande perto do topo (margem de 120px)
  };

  // Cooldown anti-thrash: bloqueia toggles em loop dentro de 250ms.
  // Defesa secundária caso o layout shift ainda cruze a histerese.
  const TOGGLE_COOLDOWN_MS = 250;

  let headerScrolled = false;
  let tabsCollapsed = false;
  let ticking = false;
  let lastHeaderToggleAt = 0;
  let lastTabsToggleAt = 0;

  function applyScrollState() {
    const y = window.scrollY || window.pageYOffset;
    const now = performance.now();

    const nextHeaderScrolled = headerScrolled
      ? y > thresholds.headerOff
      : y > thresholds.headerOn;

    const nextTabsCollapsed = tabsCollapsed
      ? y > thresholds.tabsOff
      : y > thresholds.tabsOn;

    if (
      nextHeaderScrolled !== headerScrolled &&
      now - lastHeaderToggleAt > TOGGLE_COOLDOWN_MS
    ) {
      headerScrolled = nextHeaderScrolled;
      lastHeaderToggleAt = now;
      if (header) header.classList.toggle("is-scrolled", headerScrolled);
    }

    if (
      nextTabsCollapsed !== tabsCollapsed &&
      now - lastTabsToggleAt > TOGGLE_COOLDOWN_MS
    ) {
      tabsCollapsed = nextTabsCollapsed;
      lastTabsToggleAt = now;
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
