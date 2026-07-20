import { listarProdutos } from '../../api/produtos.js';

// ─────────────────────────────────────────────────────────────────────────────
// TEMA (claro/escuro "azul"/"rosa")
// ─────────────────────────────────────────────────────────────────────────────

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
            logo: 'Assets/logo-azul.png',
            favicon: 'Assets/logo-azul.png'
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
            logo: 'Assets/logo-rosa2.png',
            favicon: 'Assets/logo-rosa2.png'
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
    const favicon = document.getElementById('favicon');

    logoImgs.forEach(el => el.src = tema.imagens.avatar);
    if (btnTemaImg) btnTemaImg.src = tema.imagens.avatar;
    if (sectionAvatar) sectionAvatar.src = tema.imagens.avatar;
    if (heroFundoImg) heroFundoImg.src = tema.imagens.heroFundo;
    if (logoImg) logoImg.src = tema.imagens.logo;
    if (favicon) favicon.href = tema.imagens.favicon;
    localStorage.setItem('tema', nomeTema);
}

function toggleTema() {
    const atual = localStorage.getItem('tema') || 'azul';
    const proximo = atual === 'azul' ? 'rosa' : 'azul';
    aplicarTema(proximo);
}
window.toggleTema = toggleTema; // usado pelo onclick inline no HTML

const temaSalvo = localStorage.getItem('tema') || 'azul';
aplicarTema(temaSalvo);

function ajustarBtnTema() {
    const btn = document.querySelector('.btn-tema');
    const footer = document.querySelector('.footer');
    if (!btn || !footer) return;

    const footerTop = footer.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;

    if (footerTop < windowHeight) {
        btn.style.bottom = (windowHeight - footerTop + 20) + 'px';
    } else {
        btn.style.bottom = '2rem';
    }
}

window.addEventListener('scroll', ajustarBtnTema);
ajustarBtnTema();

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL DOS LINKS DA NAVBAR
// ─────────────────────────────────────────────────────────────────────────────

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
// PRODUTOS DINÂMICOS (Itens Colecionáveis + Novos Bonecos)
// ─────────────────────────────────────────────────────────────────────────────

const QTD_ITENS_COLECIONAVEIS = 6;
const QTD_BONECOS             = 5;

// Placeholder usado quando o produto não tem foto cadastrada.
const IMAGEM_PADRAO = 'Assets/login/personagem-azul.png';

/**
 * Extrai a URL da foto principal ("caixa") de um produto.
 * Ajuste este ponto único caso o nome do campo na API seja diferente
 * (ex: 'fotoUrl', 'imagemPrincipal', etc.)
 */
function obterFotoPrincipal(produto) {
    return produto.fotoPrincipal || produto.fotoUrl || IMAGEM_PADRAO;
}

function formatarPreco(preco) {
    const numero = Number(preco);
    if (Number.isNaN(numero)) return 'R$ --';
    return `R$${numero.toFixed(2).replace('.', ',')}`;
}

function irParaProduto(id) {
    window.location.href = `tela_item.html?id=${encodeURIComponent(id)}`;
}

function renderizarItensColecionaveis(produtos) {
    const grid = document.querySelector('.itens-grid');
    if (!grid) return;

    grid.innerHTML = '';

    produtos.slice(0, QTD_ITENS_COLECIONAVEIS).forEach(produto => {
        const div = document.createElement('div');
        div.className = 'item-circular';
        div.addEventListener('click', () => irParaProduto(produto.id));

        const img = document.createElement('img');
        img.src = obterFotoPrincipal(produto);
        img.alt = produto.nome || '';

        div.appendChild(img);
        grid.appendChild(div);
    });
}

function criarIconeFavorito() {
    const btn = document.createElement('button');
    btn.className = 'boneco-fav';
    btn.setAttribute('aria-label', 'Favoritar');
    btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
    `;
    // Evita que o clique no coração também dispare a navegação do card
    btn.addEventListener('click', (e) => e.stopPropagation());
    return btn;
}

function renderizarBonecos(produtos) {
    const grid = document.querySelector('.bonecos-grid');
    if (!grid) return;

    grid.innerHTML = '';

    produtos.slice(0, QTD_BONECOS).forEach((produto, index) => {
        const card = document.createElement('div');
        card.className = 'boneco-card';
        card.addEventListener('click', () => irParaProduto(produto.id));

        const imgWrap = document.createElement('div');
        imgWrap.className = 'boneco-img-wrap' + (index % 2 === 1 ? ' dark' : '');

        const img = document.createElement('img');
        img.src = obterFotoPrincipal(produto);
        img.alt = produto.nome || '';
        imgWrap.appendChild(img);

        const info = document.createElement('div');
        info.className = 'boneco-info';
        info.innerHTML = `
            <p class="boneco-nome">${produto.nome ?? ''}</p>
            <p class="boneco-subtitulo">${produto.categoria ?? ''}</p>
            <p class="boneco-preco">${formatarPreco(produto.preco)}</p>
        `;

        card.appendChild(imgWrap);
        card.appendChild(info);
        card.appendChild(criarIconeFavorito());
        grid.appendChild(card);
    });
}

async function carregarProdutosTelaInicial() {
    try {
        const produtos = await listarProdutos();
        const ativos = produtos.filter(p => p.ativo);

        renderizarItensColecionaveis(ativos);
        renderizarBonecos(ativos);
    } catch (error) {
        console.error('Erro ao carregar produtos na tela inicial:', error);
    }
}

document.addEventListener('DOMContentLoaded', carregarProdutosTelaInicial);