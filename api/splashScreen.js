/*!
 * Splash screen de página inteira — hoje sem nenhuma página usando (as telas
 * de produto carregam a página imediatamente e mostram spinners por seção
 * em vez de bloquear tudo com isto). Mantido disponível para casos futuros
 * que precisem bloquear a tela inteira até algo terminar. Script clássico,
 * sem dependências — funciona em qualquer página, com ou sem módulos.
 *
 * Como usar:
 *   <script src="../api/splashScreen.js" defer></script>   (antes do <script type="module"> da página)
 *   ... e, no JS da página, ao terminar o carregamento (sucesso ou erro):
 *   window.SplashScreen.esconder();
 *
 * Se nada chamar esconder() em até TEMPO_MAX_MS, o splash se esconde por
 * segurança — nunca trava a página caso o carregamento falhe silenciosamente.
 * As MENSAGENS vão trocando com o tempo pra dar sensação de progresso.
 */
(function () {
    "use strict";

    var ESCONDIDO_CLASSE = "splash-escondido";
    var TEMPO_MAX_MS = 30000;
    var MENSAGENS = [
        { tempo: 0,     texto: "Carregando..." },
        { tempo: 3000,  texto: "Ainda carregando... o servidor pode estar iniciando." },
        { tempo: 8000,  texto: "Isso está demorando mais que o normal, mas já estamos quase lá." },
        { tempo: 15000, texto: "O servidor ainda está de pé, prometemos! Só mais um pouco." },
        { tempo: 24000, texto: "Quase lá! Agradecemos a paciência." },
    ];

    var elemento = null;
    var timeoutSeguranca = null;
    var timeoutsMensagens = [];

    function injetarEstilos() {
        var style = document.createElement("style");
        style.id = "splash-produtos-styles";
        style.textContent =
            "#splash-produtos{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;background:var(--cor-fundo,#fff);transition:opacity .3s ease;}\n" +
            "#splash-produtos." + ESCONDIDO_CLASSE + "{opacity:0;pointer-events:none;}\n" +

            ".splash-conteudo{position:relative;display:flex;flex-direction:column;align-items:center;gap:1.5rem;animation:splash-conteudo-entrar .5s cubic-bezier(.34,1.56,.64,1);}\n" +
            "@keyframes splash-conteudo-entrar{from{opacity:0;transform:translateY(10px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}\n" +

            // Brilho pulsante atrás dos pontinhos — puramente decorativo.
            ".splash-glow{position:absolute;top:50%;left:50%;width:130px;height:130px;margin:-65px 0 0 -65px;border-radius:50%;" +
                "background:radial-gradient(circle,var(--cor-primaria,#b0aed4) 0%,transparent 72%);opacity:.4;" +
                "animation:splash-pulsar 2.2s ease-in-out infinite;z-index:0;}\n" +
            "@keyframes splash-pulsar{0%,100%{transform:scale(.8);opacity:.25;}50%{transform:scale(1.15);opacity:.5;}}\n" +

            // Três pontos saltitando em onda (loading dots) — a "logo" do carregamento.
            ".splash-loader{position:relative;z-index:1;display:flex;align-items:center;gap:12px;height:26px;}\n" +
            ".splash-loader span{width:16px;height:16px;border-radius:50%;background:var(--cor-primaria-hover,var(--cor-primaria,#7b78b0));" +
                "animation:splash-saltar 1s ease-in-out infinite;}\n" +
            ".splash-loader span:nth-child(2){animation-delay:.15s;}\n" +
            ".splash-loader span:nth-child(3){animation-delay:.3s;}\n" +
            "@keyframes splash-saltar{0%,80%,100%{transform:scale(.55) translateY(0);opacity:.5;}40%{transform:scale(1) translateY(-10px);opacity:1;}}\n" +

            ".splash-texto{position:relative;z-index:1;margin:0;font-family:'Epilogue',Arial,sans-serif;font-weight:700;" +
                "color:var(--cor-texto-titulo,#111);font-size:.95rem;text-align:center;max-width:280px;" +
                "transition:opacity .2s ease,transform .2s ease;}\n" +
            ".splash-texto--trocando{opacity:0;transform:translateY(4px);}\n" +

            // Preferência de "reduzir movimento" desliga tudo que gira/pula/pulsa, mantendo só o fade do overlay.
            "html.a11y-reduce-motion .splash-conteudo,html.a11y-reduce-motion .splash-glow,html.a11y-reduce-motion .splash-loader span{animation:none;}\n" +
            "html.a11y-reduce-motion .splash-loader span{opacity:.85;}\n";
        document.head.appendChild(style);
    }

    function injetarMarkup() {
        var overlay = document.createElement("div");
        overlay.id = "splash-produtos";
        overlay.setAttribute("role", "status");
        overlay.setAttribute("aria-live", "polite");
        overlay.innerHTML =
            '<div class="splash-conteudo">' +
                '<div class="splash-glow" aria-hidden="true"></div>' +
                '<div class="splash-loader" aria-hidden="true"><span></span><span></span><span></span></div>' +
                '<p class="splash-texto" id="splash-produtos-texto">Carregando...</p>' +
            "</div>";
        document.body.insertBefore(overlay, document.body.firstChild);
        return overlay;
    }

    function esconder() {
        if (!elemento) return;
        clearTimeout(timeoutSeguranca);
        timeoutsMensagens.forEach(clearTimeout);
        timeoutsMensagens = [];

        var el = elemento;
        elemento = null;
        el.classList.add(ESCONDIDO_CLASSE);
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 300);
    }

    /** Troca o texto com um pequeno crossfade, em vez de substituir abruptamente. */
    function trocarTexto(texto) {
        var el = document.getElementById("splash-produtos-texto");
        if (!el) return;
        el.classList.add("splash-texto--trocando");
        setTimeout(function () {
            el.textContent = texto;
            el.classList.remove("splash-texto--trocando");
        }, 200);
    }

    /** Agenda a troca de mensagem pra cada estágio em MENSAGENS, dando sensação de progresso. */
    function agendarMensagens() {
        MENSAGENS.forEach(function (etapa) {
            if (etapa.tempo === 0) return; // já é o texto inicial do markup
            timeoutsMensagens.push(setTimeout(function () { trocarTexto(etapa.texto); }, etapa.tempo));
        });
    }

    function init() {
        injetarEstilos();
        elemento = injetarMarkup();
        agendarMensagens();
        timeoutSeguranca = setTimeout(esconder, TEMPO_MAX_MS);
    }

    window.SplashScreen = { esconder: esconder };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
