const temas = {
    azul: {
        "--cor-fundo": "#DCEAF7",
        "--cor-painel": "#ffffff",
        "--cor-primaria": "#cccaf1",
        "--cor-label": "#4a7fa5",
        "--cor-texto-titulo": "#111",
        "--cor-texto-secundario": "#555",
        "--cor-texto-terciario": "#888",
        "--cor-borda": "#ccc",
        "--cor-divisor": "#e0e0e0",
        "--cor-top-bar": "#a0b8d4",
        imagens: { avatar: "Assets/avatar-azul.png" },
    },
    rosa: {
        "--cor-fundo": "#F9EBEB",
        "--cor-painel": "#ffffff",
        "--cor-primaria": "#F1CECE",
        "--cor-label": "#E3676b",
        "--cor-texto-titulo": "#111",
        "--cor-texto-secundario": "#ccc",
        "--cor-texto-terciario": "#888",
        "--cor-borda": "#cbc3c3",
        "--cor-divisor": "#cbc3c3",
        "--cor-top-bar": "#d4a0a0",
        imagens: { avatar: "Assets/avatar-rosa.png" },
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
    if (btnTemaImg) btnTemaImg.src = tema.imagens.avatar;
    localStorage.setItem("tema", nomeTema);
}

function toggleTema() {
    const atual = localStorage.getItem("tema") || "azul";
    aplicarTema(atual === "azul" ? "rosa" : "azul");
}

aplicarTema(localStorage.getItem("tema") || "azul");

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
