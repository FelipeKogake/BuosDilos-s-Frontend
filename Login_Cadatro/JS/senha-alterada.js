history.pushState(null, null, location.href);
history.replaceState(null, null, location.href);

window.addEventListener('popstate', () => {
    history.pushState(null, null, location.href);
    history.replaceState(null, null, location.href);
});

const temas = {
    azul: {
        '--cor-fundo': '#DCEAF7',
        '--cor-painel': '#ffffff',
        '--cor-primaria': '#b0aed4',
        '--cor-primaria-hover': '#7b78b0',
        '--cor-texto-titulo': '#111',
        '--cor-texto-secundario': '#555',
        '--sombra-painel': '6px 6px 20px rgba(0, 9, 169, 0.4)',
        '--cor-sombra-inicio': '#BFD7EE',
        '--cor-sombra-fim': '#DCEAF7',
        imagens: {
            personagem: 'Assets/senha-alterada/personagem-azul.png',
            estrelas: 'Assets/senha-alterada/estrelas-azul.png',
            avatar: 'Assets/avatar-azul.png',
        }
    },
    rosa: {
        '--cor-fundo': '#F9EBEB',
        '--cor-painel': '#ffffff',
        '--cor-primaria': '#F1CECE',
        '--cor-primaria-hover': '#d4b6b6',
        '--cor-texto-titulo': '#111',
        '--cor-texto-secundario': '#ccc',
        '--sombra-painel': '6px 6px 20px rgba(243, 162, 162, 0.6)',
        '--cor-sombra-inicio': '#F1CECE',
        '--cor-sombra-fim': '#F9EBEB',
        imagens: {
            personagem: 'Assets/senha-alterada/personagem-rosa.png',
            estrelas: 'Assets/senha-alterada/estrelas-rosa.png',
            avatar: 'Assets/avatar-rosa.png',
        }
    }
};

function aplicarTema(nomeTema) {
    const tema = temas[nomeTema];
    if (!tema) return;

    const root = document.documentElement;
    Object.entries(tema).forEach(([propriedade, valor]) => {
        if (propriedade !== 'imagens') {
            root.style.setProperty(propriedade, valor);
        }
    });

    document.querySelectorAll('.estrelas').forEach(el => {
        el.src = tema.imagens.estrelas;
    });
    document.querySelector('.personagemImg').src = tema.imagens.personagem;
    document.querySelector('.btn-tema img').src = tema.imagens.avatar;

    localStorage.setItem('tema', nomeTema);
}

function toggleTema() {
    const atual = localStorage.getItem('tema') || 'azul';
    const proximo = atual === 'azul' ? 'rosa' : 'azul';
    aplicarTema(proximo);
}

const temaSalvo = localStorage.getItem('tema') || 'azul';
aplicarTema(temaSalvo);

function voltarParaLogin() {
    localStorage.setItem('popup', 'senha-alterada');
    window.location.href = 'login.html';
}