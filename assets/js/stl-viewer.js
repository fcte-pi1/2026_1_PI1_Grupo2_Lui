/**
 * Como usar o embed
 *
 * O visualizador STL esta disponivel em qualquer pagina da GitPage. Use a classe do embed STL, o caminho no atributo `data-stl-path`, o titulo em `data-title` e o tamanho no `style`.
 *
 * Exemplo de uso:
 * <div class="stl-embed-container"
 *        data-stl-path="../labirinto.stl"
 *        data-title="Labirinto em STL"
 *        style="height: 600px; width: 100%;"> </div>
 *
 * Para renderizar uma montagem com mais de uma peca, separe os caminhos por virgula:
 * <div class="stl-embed-container"
 *        data-stl-path="./chassi.stl, ./roda.stl, ./suporte.stl"
 *        data-title="Montagem do robo"
 *        data-stl-rotate-x="-90"
 *        style="height: 600px; width: 100%;"> </div>
 *
 * Opcoes uteis:
 * - `data-stl-path`: caminho de um ou mais arquivos STL.
 * - `data-title`: titulo exibido no topo do embed.
 * - `data-stl-rotate-x`, `data-stl-rotate-y`, `data-stl-rotate-z`: rotacao em graus. Por padrao, o embed usa `data-stl-rotate-x="-90"` para deixar modelos CAD na horizontal.
 * - `data-stl-grid="true"`: adiciona uma grade 3D auxiliar.
 * - `data-stl-edges="false"`: esconde as arestas trianguladas do STL. Fica ligado por padrao para dar destaque as quinas.
 * - `data-stl-flat="true"`: usa sombreamento facetado. Fica desligado por padrao para evitar marcas triangulares.
 * - `data-stl-colors="#cbd5e1"`: sobrescreve a cor do material quando o STL nao possui cor propria.
 */
(function () {
  const VERSAO_THREE = "0.160.0";
  const URL_THREE = `https://esm.sh/three@${VERSAO_THREE}`;
  const URL_CARREGADOR_STL = `https://esm.sh/three@${VERSAO_THREE}/examples/jsm/loaders/STLLoader.js`;
  const URL_CONTROLES_ORBITA = `https://esm.sh/three@${VERSAO_THREE}/examples/jsm/controls/OrbitControls.js`;
  const URL_UTILS_GEOMETRIA = `https://esm.sh/three@${VERSAO_THREE}/examples/jsm/utils/BufferGeometryUtils.js`;
  const COR_MODELO_PADRAO = "#cbd5e1";
  const COR_ARESTA_PADRAO = "#000000";

  const urlScript = document.currentScript ? document.currentScript.src : document.baseURI;
  const urlBaseSite = new URL("../../", urlScript);
  let promessaDependencias;

  function carregarDependencias() {
    if (!promessaDependencias) {
      promessaDependencias = Promise.all([
        import(URL_THREE),
        import(URL_CARREGADOR_STL),
        import(URL_CONTROLES_ORBITA),
        import(URL_UTILS_GEOMETRIA),
      ]).then(([THREE, stl, orbita, utilsGeometria]) => ({
        THREE,
        CarregadorSTL: stl.STLLoader,
        ControlesOrbita: orbita.OrbitControls,
        gerarNormaisComVinco: utilsGeometria.toCreasedNormals,
      }));
    }

    return promessaDependencias;
  }

  function criarBotao(titulo, icone) {
    const botao = document.createElement("button");
    botao.className = "stl-embed__button";
    botao.type = "button";
    botao.title = titulo;
    botao.setAttribute("aria-label", titulo);
    botao.innerHTML = `<span class="material-icons" aria-hidden="true">${icone}</span>`;
    return botao;
  }

  function criarInterface(elemento) {
    garantirIcones();
    elemento.classList.add("stl-embed-container");

    if (elemento.dataset.stlHeight) {
      elemento.style.setProperty("--stl-height", `${Number(elemento.dataset.stlHeight)}px`);
    }

    const moldura = document.createElement("div");
    const barraTopo = document.createElement("div");
    const barraBase = document.createElement("div");
    const titulo = document.createElement("span");
    const areaCanvas = document.createElement("div");
    const grupoVisualizacao = document.createElement("div");
    const grupoTela = document.createElement("div");

    const botaoMenosZoom = criarBotao("Reduzir zoom", "remove");
    const botaoMaisZoom = criarBotao("Aumentar zoom", "add");
    const botaoResetar = criarBotao("Resetar camera", "refresh");
    const botaoCentralizar = criarBotao("Centralizar", "center_focus_strong");
    const botaoTelaCheia = criarBotao("Tela cheia", "fullscreen");

    moldura.className = "stl-embed";
    barraTopo.className = "stl-embed__toolbar stl-embed__toolbar--top";
    barraBase.className = "stl-embed__toolbar stl-embed__toolbar--bottom";
    titulo.className = "stl-embed__title";
    areaCanvas.className = "stl-embed__canvas";
    grupoVisualizacao.className = "stl-embed__button-group";
    grupoTela.className = "stl-embed__button-group";
    titulo.textContent = elemento.dataset.title || elemento.dataset.stlTitle || "Modelo STL";

    barraTopo.append(titulo);
    grupoVisualizacao.append(botaoMenosZoom, botaoMaisZoom, botaoResetar, botaoCentralizar);
    grupoTela.append(botaoTelaCheia);
    barraBase.append(grupoVisualizacao, grupoTela);
    moldura.append(barraTopo, areaCanvas, barraBase);
    elemento.replaceChildren(moldura);

    return {
      areaCanvas,
      botaoCentralizar,
      botaoMaisZoom,
      botaoMenosZoom,
      botaoResetar,
      botaoTelaCheia,
      moldura,
    };
  }

  function garantirIcones() {
    if (document.getElementById("stl-material-icons-css")) return;

    const link = document.createElement("link");
    link.id = "stl-material-icons-css";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    document.head.appendChild(link);
  }

  function lerArquivos(elemento) {
    const valor = elemento.dataset.stlPath || elemento.dataset.stlSrc || elemento.dataset.src || "";
    return valor.split(",").map((item) => item.trim()).filter(Boolean);
  }

  function lerCores(elemento) {
    const valor = elemento.dataset.stlColors || elemento.dataset.colors || elemento.dataset.stlColor || "";
    return valor.split(",").map((item) => item.trim()).filter(Boolean);
  }

  function resolverUrl(caminho) {
    if (/^(https?:|data:|blob:|\/|\.\/|\.\.\/)/.test(caminho)) {
      return new URL(caminho, document.baseURI).href;
    }

    if (!caminho.includes("/")) {
      return new URL(caminho, document.baseURI).href;
    }

    return new URL(caminho, urlBaseSite).href;
  }

  function grausParaRadianos(valor, padrao = 0) {
    const numero = Number(valor ?? padrao);
    return Number.isFinite(numero) ? numero * Math.PI / 180 : 0;
  }

  function limitar(valor, minimo, maximo) {
    return Math.max(minimo, Math.min(maximo, valor));
  }

  function corCss(elemento, nome, padrao) {
    return getComputedStyle(elemento).getPropertyValue(nome).trim() || padrao;
  }

  async function carregarGeometria(carregador, url) {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`Nao foi possivel carregar ${url}`);
    return carregador.parse(await resposta.arrayBuffer());
  }

  function prepararGeometria(geometria, gerarNormaisComVinco) {
    const geometriaPreparada = gerarNormaisComVinco(geometria, Math.PI / 3);
    geometriaPreparada.hasColors = geometria.hasColors;
    geometriaPreparada.alpha = geometria.alpha;
    return geometriaPreparada;
  }

  function criarMaterial(THREE, geometria, elemento, cor) {
    const temCoresNoArquivo = Boolean(geometria.hasColors || geometria.getAttribute("color"));

    return new THREE.MeshStandardMaterial({
      color: temCoresNoArquivo ? "#ffffff" : cor,
      flatShading: elemento.dataset.stlFlat === "true",
      metalness: 0.02,
      roughness: 0.92,
      side: THREE.DoubleSide,
      transparent: geometria.alpha !== undefined && geometria.alpha < 1,
      opacity: geometria.alpha !== undefined ? geometria.alpha : 1,
      vertexColors: temCoresNoArquivo,
    });
  }

  function criarArestas(THREE, geometria, cor) {
    return new THREE.LineSegments(
      new THREE.EdgesGeometry(geometria, 28),
      new THREE.LineBasicMaterial({ color: cor, opacity: 1.0, transparent: true }),
    );
  }

  function ajustarCamera(THREE, camera, controles, grupo, luzPrincipal) {
    const caixa = new THREE.Box3().setFromObject(grupo);

    if (caixa.isEmpty()) {
      camera.position.set(120, 90, 120);
      controles.target.set(0, 0, 0);
      controles.update();
      return;
    }

    const centro = caixa.getCenter(new THREE.Vector3());
    const tamanho = caixa.getSize(new THREE.Vector3());
    const maiorDimensao = Math.max(tamanho.x, tamanho.y, tamanho.z);

    camera.position.set(
      centro.x + maiorDimensao * 1.5,
      centro.y + maiorDimensao * 1.5,
      centro.z + maiorDimensao * 1.5,
    );
    camera.lookAt(centro);
    camera.near = 0.1;
    camera.far = 500000;
    camera.updateProjectionMatrix();

    luzPrincipal.position.set(
      centro.x + maiorDimensao,
      centro.y + maiorDimensao * 2,
      centro.z + maiorDimensao,
    );

    controles.target.copy(centro);
    controles.update();
  }

  function distanciaCamera(camera, controles) {
    return camera.position.distanceTo(controles.target);
  }

  function definirDistanciaCamera(camera, controles, distancia) {
    const direcao = camera.position.clone().sub(controles.target).normalize();
    camera.position.copy(controles.target).add(direcao.multiplyScalar(distancia));
    controles.update();
  }

  function alternarTelaCheia(botao, elemento) {
    botao.addEventListener("click", () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        elemento.requestFullscreen().catch((erro) => console.error(erro));
      }
    });
  }

  async function iniciarVisualizador(elemento) {
    if (elemento.dataset.stlReady === "true") {
      if (elemento.stlRestart) elemento.stlRestart();
      return;
    }
    elemento.dataset.stlReady = "true";

    const arquivos = lerArquivos(elemento);
    const interfaceVisualizador = criarInterface(elemento);

    if (!arquivos.length) {
      elemento.classList.add("is-error");
      return;
    }

    try {
      const { THREE, CarregadorSTL, ControlesOrbita, gerarNormaisComVinco } = await carregarDependencias();
      const cena = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500000);
      const renderizador = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      const controles = new ControlesOrbita(camera, renderizador.domElement);
      const grupo = new THREE.Group();
      const carregador = new CarregadorSTL();
      const urls = arquivos.map(resolverUrl);
      const cores = lerCores(elemento);
      const corModelo = corCss(interfaceVisualizador.moldura, "--stl-model-color", COR_MODELO_PADRAO);
      const corAresta = corCss(interfaceVisualizador.moldura, "--stl-edge-color", COR_ARESTA_PADRAO);
      const distanciaMinima = Number(elemento.dataset.stlMinDistance || 10);
      const distanciaMaxima = Number(elemento.dataset.stlMaxDistance || 10000);
      const fatorZoomRoda = Number(elemento.dataset.stlWheelZoomFactor || 1.08);
      const suavizacaoZoom = Number(elemento.dataset.stlZoomLerp || 0.18);
      let distanciaAlvoZoom = null;

      renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderizador.shadowMap.enabled = false;
      renderizador.outputColorSpace = THREE.SRGBColorSpace;
      interfaceVisualizador.areaCanvas.appendChild(renderizador.domElement);

      controles.enableDamping = true;
      controles.dampingFactor = 0.05;
      controles.enableZoom = false;
      controles.minDistance = distanciaMinima;
      controles.maxDistance = distanciaMaxima;

      grupo.rotation.set(
        grausParaRadianos(elemento.dataset.stlRotateX, -90),
        grausParaRadianos(elemento.dataset.stlRotateY),
        grausParaRadianos(elemento.dataset.stlRotateZ),
      );

      cena.add(grupo);
      cena.add(new THREE.AmbientLight(0xffffff, 0.55));
      cena.add(new THREE.HemisphereLight(0xf8fafc, 0x221a35, 0.65));

      const luzPrincipal = new THREE.DirectionalLight(0xffffff, 0.65);
      cena.add(luzPrincipal);

      const luzPreenchimento = new THREE.DirectionalLight(0xffffff, 0.25);
      luzPreenchimento.position.set(-120, 80, -140);
      cena.add(luzPreenchimento);

      if (elemento.dataset.stlGrid === "true") {
        cena.add(new THREE.GridHelper(500, 50, 0x8b5cf6, 0x2a2140));
      }

      for (const [indice, url] of urls.entries()) {
        const geometriaOriginal = await carregarGeometria(carregador, url);
        const geometria = prepararGeometria(geometriaOriginal, gerarNormaisComVinco);

        const malha = new THREE.Mesh(
          geometria,
          criarMaterial(THREE, geometria, elemento, cores[indice % cores.length] || corModelo),
        );
        grupo.add(malha);

        if (elemento.dataset.stlEdges !== "false") {
          const arestas = criarArestas(THREE, geometria, corAresta);
          arestas.renderOrder = 2;
          grupo.add(arestas);
        }
      }

      const pedirZoomSuave = (fator) => {
        const distanciaBase = distanciaAlvoZoom ?? distanciaCamera(camera, controles);
        distanciaAlvoZoom = limitar(distanciaBase * fator, distanciaMinima, distanciaMaxima);
      };

      const aplicarZoomSuave = () => {
        if (distanciaAlvoZoom === null) return;

        const atual = distanciaCamera(camera, controles);
        const proxima = atual + (distanciaAlvoZoom - atual) * suavizacaoZoom;

        definirDistanciaCamera(camera, controles, Math.abs(distanciaAlvoZoom - atual) < 0.02 ? distanciaAlvoZoom : proxima);
        if (Math.abs(distanciaAlvoZoom - atual) < 0.02) distanciaAlvoZoom = null;
      };

      const redimensionar = () => {
        const largura = interfaceVisualizador.areaCanvas.clientWidth || elemento.clientWidth;
        const altura = interfaceVisualizador.areaCanvas.clientHeight || elemento.clientHeight;
        renderizador.setSize(largura, altura);
        camera.aspect = largura / altura;
        camera.updateProjectionMatrix();
      };

      const resetarCamera = () => {
        distanciaAlvoZoom = null;
        ajustarCamera(THREE, camera, controles, grupo, luzPrincipal);
      };

      const animar = () => {
        if (!elemento.isConnected) {
          elemento._stlIsAnimating = false;
          return;
        }
        elemento._stlIsAnimating = true;
        requestAnimationFrame(animar);
        aplicarZoomSuave();
        controles.update();
        renderizador.render(cena, camera);
      };

      elemento.stlRestart = () => {
        if (!elemento._stlIsAnimating && elemento.isConnected) {
          animar();
        }
      };

      new ResizeObserver(redimensionar).observe(interfaceVisualizador.areaCanvas);
      renderizador.domElement.addEventListener("wheel", (evento) => {
        evento.preventDefault();
        evento.stopPropagation();
        pedirZoomSuave(evento.deltaY > 0 ? fatorZoomRoda : 1 / fatorZoomRoda);
      }, { passive: false });

      interfaceVisualizador.botaoMenosZoom.addEventListener("click", () => pedirZoomSuave(1.25));
      interfaceVisualizador.botaoMaisZoom.addEventListener("click", () => pedirZoomSuave(0.8));
      interfaceVisualizador.botaoResetar.addEventListener("click", resetarCamera);
      interfaceVisualizador.botaoCentralizar.addEventListener("click", resetarCamera);
      alternarTelaCheia(interfaceVisualizador.botaoTelaCheia, interfaceVisualizador.moldura);

      redimensionar();
      resetarCamera();
      animar();
    } catch (erro) {
      console.error(erro);
      elemento.classList.add("is-error");
    }
  }

  function iniciarTodos(raiz) {
    const alvo = (raiz && typeof raiz.querySelectorAll === "function") ? raiz : document;
    alvo.querySelectorAll(".stl-embed-container, [data-stl-viewer]").forEach(iniciarVisualizador);
  }

  window.MicromouseSTLViewer = {
    iniciarTodos,
    initAll: iniciarTodos,
  };

  if (typeof document$ !== "undefined") {
    document$.subscribe((el) => iniciarTodos(el || document));
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => iniciarTodos(document));
  } else {
    iniciarTodos(document);
  }
}());
