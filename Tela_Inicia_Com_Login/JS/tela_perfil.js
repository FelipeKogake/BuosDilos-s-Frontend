// ===================== TEMAS =====================

const temas = {
    azul: {
        "--cor-fundo": "#DCEAF7",
        "--cor-painel": "#ffffff",
        "--cor-primaria": "#cccaf1",
        "--cor-botao-principal": "#BCC7EA",
        "--cor-botao-principal-hover": "#bfd4e8",
        "--cor-label": "#4a7fa5",
        "--cor-texto-titulo": "#111",
        "--cor-texto-secundario": "#555",
        "--cor-texto-terciario": "#888",
        "--cor-borda": "#ccc",
        "--cor-divisor": "#e0e0e0",
        "--cor-top-bar": "#a0b8d4",
        imagens: { avatar: "Assets/avatar-azul.png", favicon: "Assets/logo-azul.png" },
    },
    rosa: {
        "--cor-fundo": "#F9EBEB",
        "--cor-painel": "#ffffff",
        "--cor-primaria": "#F1CECE",
        "--cor-botao-principal": "#F1CECE",
        "--cor-botao-principal-hover": "#e6b2b2",
        "--cor-label": "#E3676b",
        "--cor-texto-titulo": "#111",
        "--cor-texto-secundario": "#ccc",
        "--cor-texto-terciario": "#888",
        "--cor-borda": "#cbc3c3",
        "--cor-divisor": "#cbc3c3",
        "--cor-top-bar": "#d4a0a0",
        imagens: { avatar: "Assets/avatar-rosa.png", favicon: "Assets/logo-rosa.png" },
    },
};

function aplicarTema(nomeTema) {
    const tema = temas[nomeTema];
    if (!tema) return;
    const root = document.documentElement;
    Object.entries(tema).forEach(([prop, val]) => {
        if (prop !== "imagens") root.style.setProperty(prop, val);
    });
    const btnTemaImg = document.querySelector(".btn-tema img");
    const favicon = document.querySelector('#favicon');
    if (btnTemaImg) btnTemaImg.src = tema.imagens.avatar;
    if (favicon) favicon.href = tema.imagens.favicon;
    localStorage.setItem("tema", nomeTema);
}

function toggleTema() {
    const atual = localStorage.getItem("tema") || "azul";
    aplicarTema(atual === "azul" ? "rosa" : "azul");
}

aplicarTema(localStorage.getItem("tema") || "azul");

// ===================== BTN TEMA (posição) =====================

function ajustarBtnTema() {
    const btn = document.querySelector(".btn-tema");
    const footer = document.querySelector(".footer");
    if (!btn || !footer) return;
    const footerTop = footer.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    btn.style.bottom =
        footerTop < windowHeight ? windowHeight - footerTop + 20 + "px" : "2rem";
}

window.addEventListener("scroll", ajustarBtnTema);
ajustarBtnTema();

// ===================== POPUPS =====================

function abrirPopup(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add("ativo");
    document.body.style.overflow = "hidden";
}

function fecharPopup(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove("ativo");
    document.body.style.overflow = "";
}

// Fecha ao clicar fora (no overlay, não no popup-box)
function fecharPopupOverlay(event, id) {
    if (event.target === document.getElementById(id)) {
        fecharPopup(id);
    }
}

// Fecha qualquer popup aberto com ESC
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        document.querySelectorAll(".popup-overlay.ativo").forEach((overlay) => {
            overlay.classList.remove("ativo");
        });
        document.body.style.overflow = "";
    }
});