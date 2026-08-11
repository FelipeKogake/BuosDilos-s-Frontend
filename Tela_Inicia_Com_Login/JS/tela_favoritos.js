import { obterProdutos, obterProdutoPorId } from '../../api/produtosStore.js';
import { formatarPreco, obterFotoPrincipal, renderizarBonecosEmGrids } from '../../api/produtosView.js';
import { obterFavoritos, alternarFavorito } from '../../api/favoritos.js';
import { registrarAcao } from '../../api/acoes.js';

const temas = {
    azul: {
        '--cor-fundo': '#DCEAF7',
        '--cor-painel': '#ffffff',
        '--cor-primaria': '#cccaf1',
        '--cor-primaria-hover': '#b4b1ef',
        '--cor-label': '#4a7fa5',
        '--cor-input-fundo': '#f0f0f0',
        '--cor-input-texto': '#aaa',
        '--cor-texto-titulo': '#111',
        '--cor-texto-secundario': '#555',
        '--cor-texto-terciario': '#888',
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
            favicon: 'Assets/logo-azul.png',
        }
    },
    rosa: {
        '--cor-fundo': '#F9EBEB',
        '--cor-painel': '#ffffff',
        '--cor-primaria': '#F1CECE',
        '--cor-primaria-hover': '#e3b8b8',
        '--cor-label': '#E3676b',
        '--cor-input-fundo': '#f0f0f0',
        '--cor-input-texto': '#aaa',
        '--cor-texto-titulo': '#111',
        '--cor-texto-secundario': '#ccc',
        '--cor-texto-terciario': '#888',
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
            favicon: 'Assets/logo-rosa2.png',
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
    const favicon = document.querySelector('#favicon');

    logoImgs.forEach(el => el.src = tema.imagens.avatar);
    if (btnTemaImg) btnTemaImg.src = tema.imagens.avatar;
    if (sectionAvatar) sectionAvatar.src = tema.imagens.avatar;
    if (heroFundoImg) heroFundoImg.src = tema.imagens.heroFundo;
    if (favicon) favicon.href = tema.imagens.favicon;

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

// Scroll dos links da navbar
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-link');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const texto = link.textContent.trim().toUpperCase();

            // "TELA INICIAL" → topo da página
            if (texto === 'TELA INICIAL') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// FAVORITOS
// ─────────────────────────────────────────────────────────────────────────────

const QTD_BONECOS = 5;

function urlProduto(id) {
    return `tela_produto.html?id=${encodeURIComponent(id)}&origem=favoritos`;
}

function irParaProduto(id) {
    window.location.href = urlProduto(id);
}

function atualizarEstadoVazio() {
    const lista = document.getElementById('lista-favoritos');
    if (!lista) return;

    let mensagem = lista.querySelector('.favoritos-vazio');

    if (lista.children.length === 0) {
        if (!mensagem) {
            mensagem = document.createElement('p');
            mensagem.className = 'favoritos-vazio';
            mensagem.textContent = 'Você ainda não favoritou nenhum produto.';
            lista.appendChild(mensagem);
        }
    } else if (mensagem) {
        mensagem.remove();
    }
}

function criarFavoritoCard(produto) {
    const card = document.createElement('div');
    card.className = 'favorito-card';
    card.dataset.id = produto.id;

    const imgWrap = document.createElement('div');
    imgWrap.className = 'favorito-img-wrap';
    const img = document.createElement('img');
    img.src = obterFotoPrincipal(produto);
    img.alt = produto.nome || '';
    imgWrap.appendChild(img);

    const info = document.createElement('div');
    info.className = 'favorito-info';
    info.innerHTML = `
        <p class="favorito-nome">${produto.nome ?? ''}</p>
        <p class="favorito-preco">${formatarPreco(produto.preco)}</p>
    `;

    const acoes = document.createElement('div');
    acoes.className = 'favorito-acoes';

    const btnFav = document.createElement('button');
    btnFav.className = 'btn-fav-ativo';
    btnFav.setAttribute('aria-label', 'Remover dos favoritos');
    btnFav.innerHTML = `
        <svg width="25" height="25" viewBox="0 0 24 24" fill="#e24b4a" stroke="#e24b4a" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
    `;
    btnFav.addEventListener('click', () => {
        alternarFavorito(produto.id);
        card.remove();
        atualizarEstadoVazio();
    });

    const btnComprar = document.createElement('button');
    btnComprar.className = 'btn-comprar-fav';
    btnComprar.textContent = 'COMPRAR';
    btnComprar.addEventListener('click', () => irParaProduto(produto.id));

    acoes.appendChild(btnFav);
    acoes.appendChild(btnComprar);

    card.appendChild(imgWrap);
    card.appendChild(info);
    card.appendChild(acoes);
    return card;
}

async function carregarFavoritos() {
    const lista = document.getElementById('lista-favoritos');
    if (!lista) return;

    lista.innerHTML = '';

    const idsFavoritos = obterFavoritos();
    if (idsFavoritos.length === 0) {
        atualizarEstadoVazio();
        return;
    }

    try {
        const produtos = await Promise.all(
            idsFavoritos.map(id => obterProdutoPorId(id).catch(() => null))
        );
        produtos.filter(Boolean).forEach(produto => lista.appendChild(criarFavoritoCard(produto)));
        atualizarEstadoVazio();
    } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
    }
}

async function carregarNovosBonecos() {
    try {
        const produtos = await obterProdutos();
        const ativos = produtos.filter(p => p.ativo).slice(0, QTD_BONECOS);
        renderizarBonecosEmGrids('.bonecos-grid', ativos, urlProduto);
    } catch (error) {
        console.error('Erro ao carregar novos bonecos:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarFavoritos();
    carregarNovosBonecos();
});
