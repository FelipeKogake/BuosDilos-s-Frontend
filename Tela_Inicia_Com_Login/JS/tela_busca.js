import { obterProdutos } from '../../api/produtosStore.js';
import { renderizarBonecosEmGrids } from '../../api/produtosView.js';
import { inicializarBuscaNav } from '../../api/buscaNav.js';

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
        '--cor-sombra-inicio': '#BFD7EE',
        '--cor-sombra-fim': '#DCEAF7',
        '--cor-top-bar': '#a0b8d4',
        '--cor-cta-dark': '#C2D4F0',
        '--cor-cta-dark-border': '#A5B8E0',
        '--cor-cta-light': '#88a8f1',
        '--cor-cta-light-border': '#A5B8E0',
        imagens: {
            avatar: 'Assets/avatar-azul.png',
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
        '--cor-sombra-inicio': '#F1CECE',
        '--cor-sombra-fim': '#F9EBEB',
        '--cor-top-bar': '#d4a0a0',
        '--cor-cta-dark': '#FFC2C2',
        '--cor-cta-dark-border': '#FFA5A5',
        '--cor-cta-light': '#f18888',
        '--cor-cta-light-border': '#FFA5A5',
        imagens: {
            avatar: 'Assets/avatar-rosa.png',
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

    const btnTemaImg = document.querySelector('.btn-tema img');
    const logoImg = document.querySelector('.navbar-logo-img');
    const favicon = document.querySelector('#favicon');

    if (btnTemaImg) btnTemaImg.src = tema.imagens.avatar;
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

aplicarTema(localStorage.getItem('tema') || 'azul');

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

inicializarBuscaNav('tela_busca.html');

// ─────────────────────────────────────────────────────────────────────────────
// BUSCA (por nome + filtro por categoria, os dois já ligados)
// ─────────────────────────────────────────────────────────────────────────────

let todosOsProdutos = [];

function urlProduto(id) {
    return `tela_produto.html?id=${encodeURIComponent(id)}&origem=busca`;
}

/** Remove acentos e caixa pra comparar termos sem distinção. */
function normalizar(texto) {
    return (texto || '')
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase();
}

function obterCategoriasSelecionadas() {
    return [...document.querySelectorAll('#categoria-lista input[type="checkbox"]:checked')]
        .map(input => input.dataset.categoria);
}

function atualizarBotaoLimpar() {
    const termo = document.getElementById('input-busca-nome').value.trim();
    const categorias = obterCategoriasSelecionadas();
    const btn = document.getElementById('btn-limpar-filtros');
    if (btn) btn.hidden = !termo && categorias.length === 0;
}

function aplicarFiltros() {
    const termo = normalizar(document.getElementById('input-busca-nome').value.trim());
    const categoriasSelecionadas = obterCategoriasSelecionadas();

    const filtrados = todosOsProdutos.filter(produto => {
        const combinaNome = !termo || normalizar(produto.nome).includes(termo);
        const combinaCategoria = categoriasSelecionadas.length === 0 || categoriasSelecionadas.includes(produto.categoria);
        return combinaNome && combinaCategoria;
    });

    renderizarBonecosEmGrids('#grid-resultados', filtrados, urlProduto);
    atualizarContagem(filtrados.length);
    document.getElementById('busca-vazio').hidden = filtrados.length > 0;
    atualizarBotaoLimpar();
}

function limparFiltros() {
    document.getElementById('input-busca-nome').value = '';
    document.querySelectorAll('#categoria-lista input[type="checkbox"]').forEach(cb => cb.checked = false);
    aplicarFiltros();
}
window.limparFiltros = limparFiltros;

function renderizarCategorias(produtos) {
    const lista = document.getElementById('categoria-lista');
    const categorias = [...new Set(produtos.map(p => p.categoria).filter(Boolean))];

    if (categorias.length === 0) {
        lista.innerHTML = '<p class="categoria-vazio">Nenhuma categoria disponível.</p>';
        return;
    }

    lista.innerHTML = '';
    categorias.forEach(categoria => {
        const label = document.createElement('label');
        label.className = 'categoria-chip';
        label.innerHTML = `<input type="checkbox" data-categoria="${categoria}" /><span>${categoria}</span>`;
        label.querySelector('input').addEventListener('change', aplicarFiltros);
        lista.appendChild(label);
    });
}

function atualizarContagem(qtd) {
    const contagem = document.getElementById('busca-contagem');
    contagem.textContent = `${qtd} produto${qtd === 1 ? '' : 's'} encontrado${qtd === 1 ? '' : 's'}`;
}

function preencherTermoDaUrl() {
    const termo = new URLSearchParams(window.location.search).get('q');
    if (termo) document.getElementById('input-busca-nome').value = termo;
}

async function carregarBusca() {
    preencherTermoDaUrl();
    document.getElementById('input-busca-nome').addEventListener('input', aplicarFiltros);

    try {
        const produtos = await obterProdutos();
        todosOsProdutos = produtos.filter(p => p.ativo);

        renderizarCategorias(todosOsProdutos);
        aplicarFiltros();
    } catch (error) {
        console.error('Erro ao carregar busca:', error);
        document.getElementById('busca-contagem').textContent = 'Erro ao carregar produtos.';
    } finally {
        window.SplashScreen?.esconder();
    }
}

document.addEventListener('DOMContentLoaded', carregarBusca);
