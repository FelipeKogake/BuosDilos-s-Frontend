/*!
 * Splash screen exibido enquanto os produtos são carregados (primeira busca
 * na API ou leitura do cache em sessionStorage). Script clássico, sem
 * dependências — funciona em qualquer página, com ou sem módulos.
 *
 * Como usar:
 *   <script src="../api/splashScreen.js" defer></script>   (antes do <script type="module"> da página)
 *   ... e, no JS da página, ao terminar de carregar os produtos (sucesso ou erro):
 *   window.SplashScreen.esconder();
 *
 * Se nada chamar esconder() em até TEMPO_MAX_MS, o splash se esconde por
 * segurança — nunca trava a página caso o carregamento falhe silenciosamente.
 * TEMPO_MAX_MS precisa ser generoso: o backend (Render, plano free) "dorme"
 * quando fica sem uso e pode levar bem mais que alguns segundos para
 * responder à primeira requisição depois disso (cold start).
 */
(function () {
    "use strict";

    var ESCONDIDO_CLASSE = "splash-escondido";
    var TEMPO_MAX_MS = 45000;
    var TEMPO_AVISO_MS = 10000;

    var elemento = null;
    var timeoutSeguranca = null;
    var timeoutAviso = null;

    function injetarEstilos() {
        var style = document.createElement("style");
        style.id = "splash-produtos-styles";
        style.textContent =
            "#splash-produtos{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;background:var(--cor-fundo,#fff);transition:opacity .25s ease;}\n" +
            "#splash-produtos." + ESCONDIDO_CLASSE + "{opacity:0;pointer-events:none;}\n" +
            ".splash-conteudo{display:flex;flex-direction:column;align-items:center;gap:1rem;}\n" +
            ".splash-spinner{width:44px;height:44px;border-radius:50%;border:4px solid rgba(0,0,0,.12);border-top-color:var(--cor-primaria-hover,var(--cor-primaria,#7b78b0));animation:splash-girar .8s linear infinite;}\n" +
            ".splash-texto{margin:0;font-family:'Epilogue',Arial,sans-serif;font-weight:700;color:var(--cor-texto-titulo,#111);font-size:.95rem;}\n" +
            "@keyframes splash-girar{to{transform:rotate(360deg);}}\n" +
            "html.a11y-reduce-motion .splash-spinner{animation:none;}\n";
        document.head.appendChild(style);
    }

    function injetarMarkup() {
        var overlay = document.createElement("div");
        overlay.id = "splash-produtos";
        overlay.setAttribute("role", "status");
        overlay.setAttribute("aria-live", "polite");
        overlay.innerHTML =
            '<div class="splash-conteudo">' +
                '<div class="splash-spinner" aria-hidden="true"></div>' +
                '<p class="splash-texto" id="splash-produtos-texto">Carregando produtos...</p>' +
            "</div>";
        document.body.insertBefore(overlay, document.body.firstChild);
        return overlay;
    }

    function esconder() {
        if (!elemento) return;
        clearTimeout(timeoutSeguranca);
        clearTimeout(timeoutAviso);

        var el = elemento;
        elemento = null;
        el.classList.add(ESCONDIDO_CLASSE);
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 300);
    }

    /** Depois de um tempo, avisa que o servidor pode estar "acordando" (cold start). */
    function avisarDemora() {
        var texto = document.getElementById("splash-produtos-texto");
        if (texto) texto.textContent = "Ainda carregando... o servidor pode estar iniciando.";
    }

    function init() {
        injetarEstilos();
        elemento = injetarMarkup();
        timeoutAviso = setTimeout(avisarDemora, TEMPO_AVISO_MS);
        timeoutSeguranca = setTimeout(esconder, TEMPO_MAX_MS);
    }

    window.SplashScreen = { esconder: esconder };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
