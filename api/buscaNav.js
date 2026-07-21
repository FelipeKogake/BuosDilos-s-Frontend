// ─────────────────────────────────────────────────────────────────────────────
// Ícone de busca expansível da navbar, compartilhado por todas as páginas.
// Clicar no ícone abre um input inline; Enter (ou clicar no ícone de novo)
// navega pra tela_busca.html já com o termo digitado em "?q=".
// ─────────────────────────────────────────────────────────────────────────────

export function inicializarBuscaNav(caminhoBusca) {
    const nav = document.getElementById('busca-nav');
    if (!nav) return;

    const btn = nav.querySelector('.icon-btn');
    const input = nav.querySelector('.busca-nav-input');

    function abrir() {
        nav.classList.add('aberto');
        input.focus();
    }

    function fechar() {
        nav.classList.remove('aberto');
        input.value = '';
    }

    function irParaBusca() {
        const termo = input.value.trim();
        window.location.href = termo
            ? `${caminhoBusca}?q=${encodeURIComponent(termo)}`
            : caminhoBusca;
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (nav.classList.contains('aberto')) {
            irParaBusca();
        } else {
            abrir();
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') irParaBusca();
        if (e.key === 'Escape') fechar();
    });

    input.addEventListener('click', (e) => e.stopPropagation());

    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target)) fechar();
    });
}
