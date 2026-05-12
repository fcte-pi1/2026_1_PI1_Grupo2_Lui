# Protótipo Funcional da Interface

Esta página apresenta o protótipo funcional do dashboard web do Micromouse. A versão abaixo é executada diretamente na GitPage e simula o fluxo principal da interface: telemetria em tempo real, visualização do labirinto, resumo da corrida e histórico filtrável por tipo de pista.

<p>
  <a class="md-button md-button--primary" href="../../assets/prototipo-interface/index.html" target="_blank" rel="noopener">
    Abrir protótipo em tela cheia
  </a>
</p>

<div class="prototype-embed">
  <iframe
    title="Protótipo funcional da interface web do Micromouse"
    src="../../assets/prototipo-interface/index.html"
    loading="lazy"
  ></iframe>
</div>

<style>
  .prototype-embed {
    width: 100%;
    min-height: 760px;
    border: 1px solid rgba(139, 92, 246, 0.28);
    border-radius: 8px;
    overflow: hidden;
    background: #071017;
  }

  .prototype-embed iframe {
    display: block;
    width: 100%;
    min-height: 760px;
    border: 0;
  }

  @media screen and (max-width: 760px) {
    .prototype-embed,
    .prototype-embed iframe {
      min-height: 980px;
    }
  }
</style>
