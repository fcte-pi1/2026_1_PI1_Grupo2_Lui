document$.subscribe(() => {
    if (window.mermaid && document.querySelector('.mermaid')) {
        mermaid.initialize({
            startOnLoad: false,
            theme: "dark"
        });

        mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    }
});