import { obterProdutos, obterItens } from '../../api/produtosStore.js';
import { renderizarBonecosEmGrids, renderizarItensEmGrids, mostrarErroEmGrids } from '../../api/produtosView.js';
import { inicializarBuscaNav } from '../../api/buscaNav.js';
import { registrarAcao } from '../../api/acoes.js';

const temas = {
    azul: {
        '--cor-fundo': '#DCEAF7',
        '--cor-painel': '#ffffff',
        '--cor-primaria': '#cccaf1',
        '--cor-primaria-hover': '#b4b1ef',
        '--cor-label': '#477a9e',
        '--cor-input-fundo': '#f0f0f0',
        '--cor-input-texto': '#6d6d6d',
        '--cor-texto-titulo': '#111',
        '--cor-texto-secundario': '#555',
        '--cor-texto-terciario': '#767676',
        '--cor-borda': '#ccc',
        '--cor-divisor': '#e0e0e0',
        '--sombra-painel': '6px 6px 20px rgba(0, 9, 169, 0.4)',
        '--sombra-input': '0 2px 8px rgba(0, 0, 0, 0.4)',
        '--cor-sombra-inicio': '#BFD7EE',
        '--cor-sombra-fim': '#DCEAF7',
        '--cor-top-bar': '#a0b8d4',
        '--cor-cta-dark': '#C2D4F0',
        '--cor-cta-dark-border': '#A5B8E0',
        '--cor-cta-light': '#88a8f1',
        '--cor-cta-light-border': '#A5B8E0',
        imagens: {
            avatar: 'Assets/avatar-azul.png',
            heroFundo: 'Assets/Subtract2.jpg',
            logo: '../Tela_Inicia_Com_Login/Assets/logo-azul.png',
            favicon: '../Tela_Inicia_Com_Login/Assets/logo-azul.png',
        }
    },
    rosa: {
        '--cor-fundo': '#F9EBEB',
        '--cor-painel': '#ffffff',
        '--cor-primaria': '#F1CECE',
        '--cor-primaria-hover': '#e3b8b8',
        '--cor-label': '#da383d',
        '--cor-input-fundo': '#f0f0f0',
        '--cor-input-texto': '#6d6d6d',
        '--cor-texto-titulo': '#111',
        '--cor-texto-secundario': '#757575',
        '--cor-texto-terciario': '#767676',
        '--cor-borda': '#cbc3c3',
        '--cor-divisor': '#cbc3c3',
        '--sombra-painel': '6px 6px 20px rgba(243, 162, 162, 0.6)',
        '--sombra-input': '0 2px 8px rgba(0, 0, 0, 0.6)',
        '--cor-sombra-inicio': '#F1CECE',
        '--cor-sombra-fim': '#F9EBEB',
        '--cor-top-bar': '#d4a0a0',
        '--cor-cta-dark': '#FFC2C2',
        '--cor-cta-dark-border': '#FFA5A5',
        '--cor-cta-light': '#f18888',
        '--cor-cta-light-border': '#FFA5A5',
        imagens: {
            avatar: 'Assets/avatar-rosa.png',
            heroFundo: 'Assets/Subtract.jpg',
            logo: '../Tela_Inicia_Com_Login/Assets/logo-rosa2.png',
            favicon: '../Tela_Inicia_Com_Login/Assets/logo-rosa2.png',
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

    const logoImgs = document.querySelectorAll('.navbar-logo-img, .footer-logo');
    const btnTemaImg = document.querySelector('.btn-tema img');
    const sectionAvatar = document.querySelector('.section-avatar');
    const heroFundoImg = document.querySelector('.hero-fundo-img');
    const logoImg = document.querySelector('.navbar-logo-img');
    const faviconLink = document.getElementById('favicon');

    logoImgs.forEach(el => el.src = tema.imagens.avatar);
    if (btnTemaImg) btnTemaImg.src = tema.imagens.avatar;
    if (sectionAvatar) sectionAvatar.src = tema.imagens.avatar;
    if (heroFundoImg) heroFundoImg.src = tema.imagens.heroFundo;
    if (logoImg) logoImg.src = tema.imagens.logo;
    if (faviconLink) faviconLink.href = tema.imagens.favicon;

    localStorage.setItem('tema', nomeTema);
}

function toggleTema() {
    const atual = localStorage.getItem('tema') || 'azul';
    const proximo = atual === 'azul' ? 'rosa' : 'azul';
    aplicarTema(proximo);
}
registrarAcao('alternar-tema', toggleTema);

const temaSalvo = localStorage.getItem('tema') || 'azul';
aplicarTema(temaSalvo);

function ajustarBtnTema() {
    const btn = document.querySelector('.btn-tema');
    const footer = document.querySelector('.footer');
    if (!btn || !footer) return;

    const footerTop = footer.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    const btnHeight = btn.offsetHeight;

    if (footerTop < windowHeight) {
        btn.style.bottom = (windowHeight - footerTop + 20) + 'px';
    } else {
        btn.style.bottom = '2rem';
    }
}

window.addEventListener('scroll', ajustarBtnTema);
ajustarBtnTema();

inicializarBuscaNav('tela_busca.html');

// Scroll dos links da navbar
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-link');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const texto = link.textContent.trim().toUpperCase();

            if (texto === 'BONECOS') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            if (texto === 'ITENS') {
                // Só faz scroll suave se já estiver nesta página
                if (link.getAttribute('href') === '#' || link.getAttribute('href') === '') {
                    e.preventDefault();
                    const secaoItens = document.querySelector('.section-itens');
                    if (secaoItens) {
                        const navbar = document.querySelector('.navbar-wrapper');
                        const offset = navbar ? navbar.offsetHeight : 0;
                        const top = secaoItens.getBoundingClientRect().top + window.scrollY - offset - 30;
                        window.scrollTo({ top, behavior: 'smooth' });
                    }
                }
                // Se tiver href com #itens, deixa o navegador redirecionar normalmente
            }
        });
    });

    // Se chegou na página com #itens na URL, faz o scroll com offset correto
    if (window.location.hash === '#itens') {
        const secaoItens = document.querySelector('#itens');
        if (secaoItens) {
            setTimeout(() => {
                const navbar = document.querySelector('.navbar-wrapper');
                const offset = navbar ? navbar.offsetHeight : 0;
                const top = secaoItens.getBoundingClientRect().top + window.scrollY - offset - 30;
                window.scrollTo({ top, behavior: 'smooth' });
            }, 100); // pequeno delay para garantir que a página carregou
        }
    } else {
        // Entrada padrão no catálogo: pula a hero e já mostra os bonecos
        const secaoBonecos = document.querySelector('#bonecos');
        if (secaoBonecos) {
            setTimeout(() => {
                const navbar = document.querySelector('.navbar-wrapper');
                const offset = navbar ? navbar.offsetHeight : 0;
                const top = secaoBonecos.getBoundingClientRect().top + window.scrollY - offset - 30;
                window.scrollTo({ top, behavior: 'instant' });
            }, 0);
        }
    }
});

// Atualiza o nav-link active conforme o scroll
const sectionBonecos = document.querySelector('.section-bonecos');
const sectionItens = document.querySelector('.section-itens');

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar-wrapper');
    const offset = navbar ? navbar.offsetHeight : 0;
    const scrollY = window.scrollY + offset + 10;

    const linkBonecos = [...document.querySelectorAll('.nav-link')]
        .find(l => l.textContent.trim().toUpperCase() === 'BONECOS');
    const linkItens = [...document.querySelectorAll('.nav-link')]
        .find(l => l.textContent.trim().toUpperCase() === 'ITENS');

    if (sectionItens && scrollY >= sectionItens.offsetTop) {
        linkBonecos?.classList.remove('active');
        linkItens?.classList.add('active');
    } else {
        linkItens?.classList.remove('active');
        linkBonecos?.classList.add('active');
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO DE PRODUTOS (Novos Bonecos + Itens Colecionáveis)
// ─────────────────────────────────────────────────────────────────────────────

function urlProduto(id) {
    return `tela_produto.html?id=${encodeURIComponent(id)}&origem=catalogo`;
}

async function carregarCatalogo() {
    try {
        const [produtos, itens] = await Promise.all([obterProdutos(), obterItens()]);
        const produtosAtivos = produtos.filter(p => p.ativo);
        const itensAtivos = itens.filter(p => p.ativo);

        renderizarBonecosEmGrids('.bonecos-grid', produtosAtivos, urlProduto, { limitar: true });
        renderizarItensEmGrids('.itens-grid', itensAtivos, urlProduto, { limitar: true });
    } catch (error) {
        console.error('Erro ao carregar catálogo de produtos:', error);
        // Sem isto o spinner de carregamento ficaria girando para sempre.
        mostrarErroEmGrids('.bonecos-grid', 'Não foi possível carregar os produtos. Verifique sua conexão.', carregarCatalogo);
        mostrarErroEmGrids('.itens-grid', 'Não foi possível carregar os itens.', carregarCatalogo);
    }
}

document.addEventListener('DOMContentLoaded', carregarCatalogo);

// ─────────────────────────────────────────────────────────────────────────────
// AÇÕES QUE EXIGEM LOGIN (carrinho, favoritos, notificações, comprar)
// ─────────────────────────────────────────────────────────────────────────────

function exigirLogin() {
    localStorage.setItem('popup', 'login-necessario');
    window.location.href = '../Login_Cadatro/login.html';
}
registrarAcao('exigir-login', exigirLogin);