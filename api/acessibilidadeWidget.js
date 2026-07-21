/*!
 * Central de Acessibilidade — widget standalone, compartilhado por todo o site.
 * Sem dependências, sem serviço externo. Preferências salvas em localStorage.
 * Convive com o VLibras (widget do governo) sem sobrepor — fica no canto
 * inferior direito, o VLibras se posiciona sozinho na borda direita.
 *
 * Como usar (script clássico, funciona em qualquer página, com ou sem módulo):
 *   <script src="api/acessibilidadeWidget.js" defer></script>       (na raiz)
 *   <script src="../api/acessibilidadeWidget.js" defer></script>   (uma pasta abaixo)
 * Ele se injeta sozinho (botão + painel + estilos) — não precisa chamar nada.
 */
(function () {
    "use strict";

    var STORAGE_KEY = "a11y-widget-prefs";

    var FONT_STEPS = [100, 112, 125, 137, 150]; // % do tamanho base
    var SPACING_STEPS = [
        { label: "Normal", letter: "normal", line: "normal" },
        { label: "Médio", letter: "0.06em", line: "1.8" },
        { label: "Grande", letter: "0.12em", line: "2.2" }
    ];

    var defaults = {
        contrast: false,
        reduceMotion: false,
        fontStep: 0,
        spacingStep: 0,
        reading: false,
        narration: false
    };

    var state = loadPrefs();

    // ---------- Persistência ----------
    function loadPrefs() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return primeiraVisitaComPreferenciasDoSistema();
            var parsed = JSON.parse(raw);
            return Object.assign({}, defaults, parsed);
        } catch (e) {
            return Object.assign({}, defaults);
        }
    }

    /** Na primeira visita (sem preferência salva), respeita "reduzir movimento" do sistema. */
    function primeiraVisitaComPreferenciasDoSistema() {
        var prefs = Object.assign({}, defaults);
        try {
            if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                prefs.reduceMotion = true;
            }
        } catch (e) { /* matchMedia indisponível — segue com o padrão */ }
        return prefs;
    }

    function savePrefs() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            /* localStorage indisponível (modo privado etc.) — segue sem salvar */
        }
    }

    // ---------- Aplicação das preferências no <html> ----------
    function applyPrefs() {
        var root = document.documentElement;

        root.classList.toggle("a11y-contrast", state.contrast);
        root.classList.toggle("a11y-reduce-motion", state.reduceMotion);
        root.classList.toggle("a11y-reading", state.reading);

        root.style.setProperty("--a11y-font-scale", FONT_STEPS[state.fontStep] + "%");

        var sp = SPACING_STEPS[state.spacingStep];
        root.style.setProperty("--a11y-letter-spacing", sp.letter);
        root.style.setProperty("--a11y-line-height", sp.line);

        // Reflete estado nos controles do painel, se já existirem
        var painel = document.getElementById("a11y-panel");
        if (painel) {
            marcarPressionado("a11y-toggle-contrast", state.contrast);
            marcarPressionado("a11y-toggle-motion", state.reduceMotion);
            marcarPressionado("a11y-toggle-reading", state.reading);
            document.getElementById("a11y-font-value").textContent = FONT_STEPS[state.fontStep] + "%";
            document.getElementById("a11y-spacing-value").textContent = sp.label;

            var fontMinus = document.getElementById("a11y-font-minus");
            var fontPlus = document.getElementById("a11y-font-plus");
            var espMinus = document.getElementById("a11y-spacing-minus");
            var espPlus = document.getElementById("a11y-spacing-plus");
            fontMinus.disabled = state.fontStep === 0;
            fontPlus.disabled = state.fontStep === FONT_STEPS.length - 1;
            espMinus.disabled = state.spacingStep === 0;
            espPlus.disabled = state.spacingStep === SPACING_STEPS.length - 1;

            marcarPressionado("a11y-toggle-narration", state.narration);
        }

        sincronizarNarracao();
    }

    function marcarPressionado(id, ativo) {
        var el = document.getElementById(id);
        if (el) el.setAttribute("aria-pressed", String(ativo));
    }

    // ---------- Narração por voz (Web Speech API) ----------
    // Liga/desliga um "leitor de tela leve": com o toggle ativo, passar o
    // mouse ou navegar com Tab por títulos, textos, links e botões narra o
    // conteúdo em voz alta e destaca o elemento na tela.
    var LEITURA_SELETOR = "h1, h2, h3, h4, h5, h6, p, a, button, label, li, span, [aria-label]";
    var elementoNarradoAtual = null;
    var elementoDestacado = null;
    var timeoutNarracao = null;
    var narracaoOuvindo = false;

    function falar(texto) {
        if (!("speechSynthesis" in window) || !texto) return;
        window.speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = "pt-BR";
        utterance.rate = 1;   // velocidade da fala (1 é o padrão)
        utterance.pitch = 1;  // tom da fala
        window.speechSynthesis.speak(utterance);
    }

    function obterTextoParaNarrar(el) {
        var texto = el.getAttribute("aria-label") || el.textContent || "";
        return texto.replace(/\s+/g, " ").trim();
    }

    function destacarElemento(el) {
        if (elementoDestacado) elementoDestacado.classList.remove("a11y-narrando-destaque");
        elementoDestacado = el;
        if (el) el.classList.add("a11y-narrando-destaque");
    }

    function narrarElemento(el) {
        if (!el || el === elementoNarradoAtual) return;
        elementoNarradoAtual = el;
        destacarElemento(el);

        var texto = obterTextoParaNarrar(el);
        clearTimeout(timeoutNarracao);
        timeoutNarracao = setTimeout(function () { falar(texto); }, 250);
    }

    function aoPassarMouseNarracao(e) {
        var el = e.target.closest(LEITURA_SELETOR);
        if (el) narrarElemento(el);
    }

    function aoFocarNarracao(e) {
        var el = e.target.closest(LEITURA_SELETOR);
        if (el) narrarElemento(el);
    }

    /** Liga/desliga os listeners de narração conforme state.narration, sem duplicar. */
    function sincronizarNarracao() {
        if (state.narration && !narracaoOuvindo) {
            document.addEventListener("mouseover", aoPassarMouseNarracao);
            document.addEventListener("focusin", aoFocarNarracao);
            narracaoOuvindo = true;
        } else if (!state.narration && narracaoOuvindo) {
            document.removeEventListener("mouseover", aoPassarMouseNarracao);
            document.removeEventListener("focusin", aoFocarNarracao);
            narracaoOuvindo = false;
            clearTimeout(timeoutNarracao);
            elementoNarradoAtual = null;
            destacarElemento(null);
            if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        }
    }

    // ---------- Estilos ----------
    // Paleta própria (não depende das variáveis de tema da página — precisa
    // funcionar igual em toda parte, inclusive no admin, que tem tema próprio).
    var css = "\n"
        + ":root{"
        +   "--a11y-font-scale:100%;--a11y-letter-spacing:normal;--a11y-line-height:normal;"
        +   "--a11y-cor-primaria:#b0aed4;--a11y-cor-primaria-hover:#7b78b0;"
        +   "--a11y-cor-painel:#ffffff;--a11y-cor-texto-titulo:#111;--a11y-cor-texto-secundario:#555;"
        +   "--a11y-cor-borda:#e0e0e0;--a11y-cor-fundo-hover:#f5f5f5;"
        + "}\n"
        + "html{font-size:var(--a11y-font-scale) !important;}\n"
        + ".a11y-skip-link{position:absolute;left:-9999px;top:0;z-index:2147483647;background:#111;color:#fff;padding:0.75rem 1.25rem;border-radius:0 0 10px 0;font-family:'Epilogue',Arial,sans-serif;font-weight:700;text-decoration:none;}\n"
        + ".a11y-skip-link:focus{left:0;}\n"
        + "html.a11y-contrast body{background:#000 !important;color:#fff !important;}\n"
        + "html.a11y-contrast body :not(#a11y-panel):not(#a11y-panel *):not(#a11y-fab):not(#a11y-fab *){background-color:#000 !important;color:#fff !important;border-color:#fff !important;}\n"
        + "html.a11y-contrast a, html.a11y-contrast button{color:#ffe066 !important;text-decoration:underline !important;}\n"
        // Imagens puramente decorativas (fundos, bolhas, personagens de fundo já
        // marcados aria-hidden pelo próprio HTML do site) confundem o contraste
        // alto — ficam coloridas por cima do preto. Some com elas; fotos de
        // produto (que não são aria-hidden) continuam visíveis normalmente.
        + "html.a11y-contrast [aria-hidden='true']{opacity:0 !important;}\n"
        + "html.a11y-reduce-motion *, html.a11y-reduce-motion *::before, html.a11y-reduce-motion *::after{animation-duration:0.001ms !important;animation-iteration-count:1 !important;transition-duration:0.001ms !important;scroll-behavior:auto !important;}\n"
        + "body :not(#a11y-panel):not(#a11y-panel *){letter-spacing:var(--a11y-letter-spacing) !important;line-height:var(--a11y-line-height) !important;}\n"
        // Modo de leitura: troca só a tipografia e aquieta o fundo decorativo.
        // (Antes forçava max-width em TODO elemento, o que espremia grids e
        // navbar — por isso ficava estranho. Agora só afeta texto de verdade.)
        + "html.a11y-reading body{background:#fdfcf8 !important;}\n"
        + "html.a11y-reading p, html.a11y-reading li, html.a11y-reading span, html.a11y-reading label,\n"
        + "html.a11y-reading h1, html.a11y-reading h2, html.a11y-reading h3, html.a11y-reading h4, html.a11y-reading a{\n"
        + "  font-family: Georgia, 'Times New Roman', serif !important;\n"
        + "}\n"
        + "html.a11y-reading [aria-hidden='true']{opacity:0.25 !important;}\n"

        // Destaque do elemento sendo narrado em voz alta
        + ".a11y-narrando-destaque{outline:3px solid var(--a11y-cor-primaria) !important;outline-offset:2px !important;}\n"

        // Botão flutuante (FAB)
        + "#a11y-fab{position:fixed;bottom:24px;right:24px;z-index:2147483000;width:52px;height:52px;border-radius:50%;border:none;background:var(--a11y-cor-primaria);color:#fff;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;transition:background .2s,transform .2s;font-family:'Epilogue',Arial,sans-serif;}\n"
        + "#a11y-fab:hover{background:var(--a11y-cor-primaria-hover);transform:scale(1.06);}\n"
        + "#a11y-fab:focus-visible{outline:3px solid #ffe066;outline-offset:2px;}\n"

        // Painel — mesma linguagem visual dos popups do site (header/corpo/rodapé)
        + "#a11y-panel{position:fixed;bottom:86px;right:24px;z-index:2147483000;width:310px;max-width:calc(100vw - 32px);max-height:calc(100vh - 120px);overflow-y:auto;background:var(--a11y-cor-painel);color:var(--a11y-cor-texto-titulo);border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.22);font-family:'Epilogue',Arial,sans-serif;}\n"
        + "#a11y-panel[hidden]{display:none;}\n"
        + "#a11y-panel-header{display:flex;align-items:center;justify-content:space-between;padding:1.1rem 1.25rem 0.9rem;border-bottom:1.5px solid var(--a11y-cor-borda);}\n"
        + "#a11y-panel-header h2{font-size:1.05rem;font-weight:900;font-style:italic;margin:0;}\n"
        + "#a11y-close{background:none;border:none;cursor:pointer;color:var(--a11y-cor-texto-secundario);padding:4px;border-radius:6px;display:flex;align-items:center;transition:background .15s,color .15s;}\n"
        + "#a11y-close:hover{background:var(--a11y-cor-fundo-hover);color:var(--a11y-cor-texto-titulo);}\n"
        + "#a11y-panel-body{padding:1rem 1.25rem 1.25rem;display:flex;flex-direction:column;gap:0.9rem;}\n"
        + ".a11y-row{display:flex;align-items:center;justify-content:space-between;gap:0.75rem;}\n"
        + ".a11y-row span:first-child{font-size:0.85rem;font-weight:600;color:var(--a11y-cor-texto-titulo);}\n"

        // Toggle estilo "switch" (mesmos <button aria-pressed>, só troquei o visual)
        + ".a11y-switch{border:none;background:var(--a11y-cor-borda);border-radius:999px;width:44px;height:24px;padding:2px;cursor:pointer;position:relative;flex-shrink:0;transition:background .2s;}\n"
        + ".a11y-switch::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .2s;}\n"
        + ".a11y-switch[aria-pressed='true']{background:var(--a11y-cor-primaria);}\n"
        + ".a11y-switch[aria-pressed='true']::after{transform:translateX(20px);}\n"
        + ".a11y-switch:focus-visible{outline:2px solid var(--a11y-cor-primaria-hover);outline-offset:2px;}\n"

        // Stepper (tamanho do texto / espaçamento)
        + ".a11y-stepper{display:flex;align-items:center;gap:0.4rem;}\n"
        + ".a11y-stepper button{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--a11y-cor-borda);background:#fff;color:var(--a11y-cor-texto-titulo);cursor:pointer;font-size:0.85rem;font-weight:700;display:flex;align-items:center;justify-content:center;transition:background .15s,border-color .15s;}\n"
        + ".a11y-stepper button:hover:not(:disabled){background:var(--a11y-cor-fundo-hover);border-color:var(--a11y-cor-primaria);}\n"
        + ".a11y-stepper button:disabled{opacity:0.4;cursor:not-allowed;}\n"
        + ".a11y-stepper span{min-width:44px;text-align:center;font-size:0.75rem;color:var(--a11y-cor-texto-secundario);}\n"

        + "#a11y-reset{margin:0.25rem 1.25rem 1.25rem;padding:0.6rem;border:1.5px solid var(--a11y-cor-borda);background:#fff;color:var(--a11y-cor-texto-secundario);border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:700;font-family:'Epilogue',Arial,sans-serif;transition:background .15s,border-color .15s,color .15s;}\n"
        + "#a11y-reset:hover{background:var(--a11y-cor-fundo-hover);border-color:var(--a11y-cor-primaria);color:var(--a11y-cor-texto-titulo);}\n";

    function injectStyles() {
        var style = document.createElement("style");
        style.id = "a11y-widget-styles";
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ---------- Marcação ----------

    /** Insere um "pular para o conteúdo" no topo do foco por Tab — só fica visível quando focado. */
    function injectSkipLink() {
        var alvo = document.getElementById("conteudo-principal") || document.querySelector("main");
        if (!alvo) return;
        if (!alvo.id) alvo.id = "conteudo-principal";
        if (!alvo.hasAttribute("tabindex")) alvo.setAttribute("tabindex", "-1");

        var link = document.createElement("a");
        link.className = "a11y-skip-link";
        link.href = "#" + alvo.id;
        link.textContent = "Pular para o conteúdo principal";
        document.body.insertBefore(link, document.body.firstChild);
    }

    function injectMarkup() {
        var fab = document.createElement("button");
        fab.id = "a11y-fab";
        fab.type = "button";
        fab.setAttribute("aria-haspopup", "dialog");
        fab.setAttribute("aria-expanded", "false");
        fab.setAttribute("aria-controls", "a11y-panel");
        fab.setAttribute("aria-label", "Abrir central de acessibilidade");
        fab.innerHTML =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
                '<circle cx="12" cy="12" r="10"/>' +
                '<circle cx="12" cy="7.6" r="1.5" fill="currentColor" stroke="none"/>' +
                '<path d="M7 10.6c1.6.9 3.2 1.3 5 1.3s3.4-.4 5-1.3M12 11.9v3.2M9.4 19.8l2.6-4.7 2.6 4.7"/>' +
            '</svg>';
        document.body.appendChild(fab);

        var panel = document.createElement("div");
        panel.id = "a11y-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.setAttribute("aria-labelledby", "a11y-panel-titulo");
        panel.hidden = true;
        panel.innerHTML =
            '<div id="a11y-panel-header">' +
                '<h2 id="a11y-panel-titulo">Acessibilidade</h2>' +
                '<button id="a11y-close" aria-label="Fechar central de acessibilidade">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                '</button>' +
            '</div>' +
            '<div id="a11y-panel-body">' +

                '<div class="a11y-row">' +
                    '<span id="a11y-contrast-label">Alto contraste</span>' +
                    '<button id="a11y-toggle-contrast" class="a11y-switch" type="button" role="switch" aria-pressed="false" aria-labelledby="a11y-contrast-label"></button>' +
                '</div>' +

                '<div class="a11y-row">' +
                    '<span id="a11y-motion-label">Reduzir animações</span>' +
                    '<button id="a11y-toggle-motion" class="a11y-switch" type="button" role="switch" aria-pressed="false" aria-labelledby="a11y-motion-label"></button>' +
                '</div>' +

                '<div class="a11y-row">' +
                    '<span id="a11y-font-label">Tamanho do texto</span>' +
                    '<div class="a11y-stepper">' +
                        '<button id="a11y-font-minus" type="button" aria-label="Diminuir tamanho do texto">A-</button>' +
                        '<span id="a11y-font-value" aria-live="polite">100%</span>' +
                        '<button id="a11y-font-plus" type="button" aria-label="Aumentar tamanho do texto">A+</button>' +
                    '</div>' +
                '</div>' +

                '<div class="a11y-row">' +
                    '<span id="a11y-spacing-label">Espaçamento</span>' +
                    '<div class="a11y-stepper">' +
                        '<button id="a11y-spacing-minus" type="button" aria-label="Diminuir espaçamento">−</button>' +
                        '<span id="a11y-spacing-value" aria-live="polite">Normal</span>' +
                        '<button id="a11y-spacing-plus" type="button" aria-label="Aumentar espaçamento">+</button>' +
                    '</div>' +
                '</div>' +

                '<div class="a11y-row">' +
                    '<span id="a11y-reading-label">Modo de leitura</span>' +
                    '<button id="a11y-toggle-reading" class="a11y-switch" type="button" role="switch" aria-pressed="false" aria-labelledby="a11y-reading-label"></button>' +
                '</div>' +

                '<div class="a11y-row">' +
                    '<span id="a11y-narration-label">Narração por voz</span>' +
                    '<button id="a11y-toggle-narration" class="a11y-switch" type="button" role="switch" aria-pressed="false" aria-labelledby="a11y-narration-label"></button>' +
                '</div>' +

            '</div>' +
            '<button id="a11y-reset" type="button">Restaurar padrão</button>';

        document.body.appendChild(panel);
    }

    // ---------- Interações ----------
    function wireEvents() {
        var fab = document.getElementById("a11y-fab");
        var panel = document.getElementById("a11y-panel");
        var closeBtn = document.getElementById("a11y-close");

        function abrirPainel() {
            panel.hidden = false;
            fab.setAttribute("aria-expanded", "true");
            closeBtn.focus();
            document.addEventListener("keydown", onKeydown);
            document.addEventListener("click", onClickFora, true);
        }
        function fecharPainel() {
            panel.hidden = true;
            fab.setAttribute("aria-expanded", "false");
            fab.focus();
            document.removeEventListener("keydown", onKeydown);
            document.removeEventListener("click", onClickFora, true);
        }
        function onKeydown(e) {
            if (e.key === "Escape") fecharPainel();
        }
        function onClickFora(e) {
            if (!panel.contains(e.target) && e.target !== fab) fecharPainel();
        }

        fab.addEventListener("click", function () {
            panel.hidden ? abrirPainel() : fecharPainel();
        });
        closeBtn.addEventListener("click", fecharPainel);

        document.getElementById("a11y-toggle-contrast").addEventListener("click", function () {
            state.contrast = !state.contrast;
            savePrefs(); applyPrefs();
        });
        document.getElementById("a11y-toggle-motion").addEventListener("click", function () {
            state.reduceMotion = !state.reduceMotion;
            savePrefs(); applyPrefs();
        });
        document.getElementById("a11y-toggle-reading").addEventListener("click", function () {
            state.reading = !state.reading;
            savePrefs(); applyPrefs();
        });

        var toggleNarracao = document.getElementById("a11y-toggle-narration");
        if ("speechSynthesis" in window) {
            toggleNarracao.addEventListener("click", function () {
                state.narration = !state.narration;
                savePrefs(); applyPrefs();
                if (state.narration) falar("Narração por voz ativada. Passe o mouse ou use Tab para ouvir o conteúdo.");
            });
        } else {
            toggleNarracao.disabled = true;
            toggleNarracao.title = "Seu navegador não suporta leitura em voz alta.";
        }

        document.getElementById("a11y-font-plus").addEventListener("click", function () {
            state.fontStep = Math.min(state.fontStep + 1, FONT_STEPS.length - 1);
            savePrefs(); applyPrefs();
        });
        document.getElementById("a11y-font-minus").addEventListener("click", function () {
            state.fontStep = Math.max(state.fontStep - 1, 0);
            savePrefs(); applyPrefs();
        });

        document.getElementById("a11y-spacing-plus").addEventListener("click", function () {
            state.spacingStep = Math.min(state.spacingStep + 1, SPACING_STEPS.length - 1);
            savePrefs(); applyPrefs();
        });
        document.getElementById("a11y-spacing-minus").addEventListener("click", function () {
            state.spacingStep = Math.max(state.spacingStep - 1, 0);
            savePrefs(); applyPrefs();
        });

        document.getElementById("a11y-reset").addEventListener("click", function () {
            state = Object.assign({}, defaults);
            savePrefs(); applyPrefs();
        });
    }

    // ---------- Inicialização ----------
    function init() {
        injectStyles();
        injectSkipLink();
        injectMarkup();
        wireEvents();
        applyPrefs();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
