// Config consumida pela CDN do MathJax. Este arquivo PRECISA carregar
// antes da CDN — a CDN substitui window.MathJax pela instância runtime
// (que tem getters somente leitura como .Package). Se a config rodar
// depois, vai dar "Cannot set property X which has only a getter".
window.MathJax = {
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    processEscapes: true,
    processEnvironments: true
  },
  options: {
    ignoreHtmlClass: ".*|",
    processHtmlClass: "arithmatex"
  }
};

// Re-typesetting em mudança de página (Material instant nav).
// Guarda contra MathJax ainda não pronto na primeira emissão de document$.
if (typeof document$ !== "undefined") {
  document$.subscribe(() => {
    if (typeof MathJax === "undefined" || !MathJax.startup) return;
    if (MathJax.startup.output && MathJax.startup.output.clearCache) {
      MathJax.startup.output.clearCache();
    }
    if (MathJax.typesetClear)   MathJax.typesetClear();
    if (MathJax.texReset)       MathJax.texReset();
    if (MathJax.typesetPromise) MathJax.typesetPromise();
  });
}
