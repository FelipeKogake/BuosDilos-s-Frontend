import { obterProdutoPorId, obterProdutos } from '../../api/produtosStore.js';
import { formatarPreco, obterFotoPrincipal, renderizarBonecosEmGrids } from '../../api/produtosView.js';
import { inicializarBuscaNav } from '../../api/buscaNav.js';
import { ehFavorito, alternarFavorito } from '../../api/favoritos.js';
import { listarFotos } from '../../api/produtos.js';

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

    const logoImgs = document.querySelectorAll('.footer-logo');
    const btnTemaImg = document.querySelector('.btn-tema img');
    const sectionAvatar = document.querySelector('.section-avatar');
    const heroFundoImg = document.querySelector('.hero-fundo-img');
    const logoImg = document.querySelector('.navbar-logo-img');
    const favicon = document.querySelector('#favicon');

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

            // "TELA INICIAL" → topo da página
            if (texto === 'CARRINHO') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// DETALHE DO PRODUTO
// ─────────────────────────────────────────────────────────────────────────────

const QTD_OUTROS_PRODUTOS = 5;

function urlProduto(id) {
    const origem = new URLSearchParams(window.location.search).get('origem') || 'catalogo';
    return `tela_produto.html?id=${encodeURIComponent(id)}&origem=${origem}`;
}

/** Mantém ativa a aba de onde o usuário veio (tela inicial ou catálogo), como se esta fosse uma página modal. */
function aplicarAbaAtiva() {
    const origem = new URLSearchParams(window.location.search).get('origem');
    const textoAlvo = origem === 'inicial' ? 'TELA INICIAL' : 'BONECOS';

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.textContent.trim().toUpperCase() === textoAlvo);
    });
}

function preencherHero(produto) {
    const titulo    = document.querySelector('.hero-titulo');
    const preco     = document.querySelector('.hero-preco');
    const descricao = document.querySelector('.hero-descricao');
    const imagem    = document.querySelector('.hero-imagens img.hero-img-1');

    if (titulo) titulo.textContent = produto.nome ?? '';
    if (preco) preco.textContent = formatarPreco(produto.preco);
    if (descricao) descricao.textContent = produto.descricao ?? '';
    if (imagem) imagem.src = obterFotoPrincipal(produto);

    configurarBotaoFavoritar(produto.id);
}

/** Favoritar/desfavoritar funciona pra produto (boneco) e item — só é possível aqui, na tela_produto. */
function configurarBotaoFavoritar(produtoId) {
    const btn = document.getElementById('btn-favoritar-produto');
    if (!btn) return;

    const atualizarEstado = (favoritado) => {
        btn.classList.toggle('ativo', favoritado);
        btn.setAttribute('aria-pressed', String(favoritado));
        btn.setAttribute('aria-label', favoritado ? 'Remover dos favoritos' : 'Favoritar');
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', favoritado ? 'currentColor' : 'none');
    };

    atualizarEstado(ehFavorito(produtoId));
    btn.onclick = () => atualizarEstado(alternarFavorito(produtoId));
}

/** Busca todas as fotos cadastradas no admin pra esse produto/item e liga as setas de navegação, se houver mais de uma. */
async function carregarGaleria(produto) {
    const btnAnterior     = document.getElementById('hero-foto-anterior');
    const btnProxima      = document.getElementById('hero-foto-proxima');
    const imagemPrincipal = document.querySelector('.hero-imagens img.hero-img-1');
    if (!btnAnterior || !btnProxima || !imagemPrincipal) return;

    let fotos = [];
    try {
        fotos = await listarFotos(produto.id);
    } catch (error) {
        console.error('Erro ao carregar fotos do produto:', error);
        return;
    }

    if (!fotos || fotos.length < 2) return; // só uma foto (ou nenhuma) — não há o que trocar

    fotos = fotos.slice().sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

    // Começa na foto que já está sendo exibida (a "caixa"); se não achar, cai na primeira.
    let indiceAtual = fotos.findIndex(foto => foto.fotoUrl === imagemPrincipal.src);
    if (indiceAtual === -1) indiceAtual = 0;

    const DURACAO_TRANSICAO_MS = 220;

    /** Desliza a imagem pra fora, troca o src e desliza ela de volta pelo lado oposto. */
    function mostrarFoto(indiceDestino, sentido) {
        const classeSaida   = sentido === 'proxima' ? 'hero-img--deslocada-esquerda' : 'hero-img--deslocada-direita';
        const classeEntrada = sentido === 'proxima' ? 'hero-img--deslocada-direita' : 'hero-img--deslocada-esquerda';

        imagemPrincipal.classList.add(classeSaida);

        setTimeout(() => {
            indiceAtual = (indiceDestino + fotos.length) % fotos.length;
            imagemPrincipal.src = fotos[indiceAtual].fotoUrl;

            // Salta pra posição de entrada sem transição, depois solta a transição de volta ao repouso.
            imagemPrincipal.classList.add('hero-img--sem-transicao');
            imagemPrincipal.classList.remove(classeSaida);
            imagemPrincipal.classList.add(classeEntrada);

            requestAnimationFrame(() => {
                imagemPrincipal.classList.remove('hero-img--sem-transicao');
                requestAnimationFrame(() => {
                    imagemPrincipal.classList.remove(classeEntrada);
                });
            });
        }, DURACAO_TRANSICAO_MS);
    }

    btnAnterior.hidden = false;
    btnProxima.hidden  = false;
    btnAnterior.addEventListener('click', () => mostrarFoto(indiceAtual - 1, 'anterior'));
    btnProxima.addEventListener('click', () => mostrarFoto(indiceAtual + 1, 'proxima'));
}

async function carregarProduto() {
    aplicarAbaAtiva();

    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
        window.location.href = 'tela_catalogo.html';
        return;
    }

    try {
        const produto = await obterProdutoPorId(id);
        preencherHero(produto);
        carregarGaleria(produto);

        const produtos = await obterProdutos();
        const outros = produtos
            .filter(p => p.ativo && String(p.id) !== String(id))
            .slice(0, QTD_OUTROS_PRODUTOS);
        renderizarBonecosEmGrids('.bonecos-grid', outros, urlProduto);
    } catch (error) {
        console.error('Erro ao carregar produto:', error);
        window.location.href = 'tela_catalogo.html';
    }
}

document.addEventListener('DOMContentLoaded', carregarProduto);
