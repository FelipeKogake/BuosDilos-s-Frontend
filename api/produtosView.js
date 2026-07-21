// ─────────────────────────────────────────────────────────────────────────────
// Helpers de apresentação de produto compartilhados entre tela_inicial,
// tela_catalogo e tela_produto (Com_Login e Sem_Login).
// ─────────────────────────────────────────────────────────────────────────────

import { ehFavorito, alternarFavorito } from './favoritos.js';

export const IMAGEM_PADRAO = '/Tela_Inicia_Com_Login/Assets/login/personagem-azul.png';

/** Extrai a URL da foto principal ("caixa") de um produto. */
export function obterFotoPrincipal(produto) {
    return produto.fotoPrincipal || produto.fotoUrl || IMAGEM_PADRAO;
}

export function formatarPreco(preco) {
    const numero = Number(preco);
    if (Number.isNaN(numero)) return 'R$ --';
    return `R$${numero.toFixed(2).replace('.', ',')}`;
}

function criarIconeFavorito(produtoId) {
    const btn = document.createElement('button');
    btn.className = 'boneco-fav';

    const atualizarEstado = (favoritado) => {
        btn.classList.toggle('ativo', favoritado);
        btn.setAttribute('aria-label', favoritado ? 'Remover dos favoritos' : 'Favoritar');
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', favoritado ? 'currentColor' : 'none');
    };

    btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
    `;
    atualizarEstado(ehFavorito(produtoId));

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        atualizarEstado(alternarFavorito(produtoId));
    });

    return btn;
}

/** Cria o card usado nos grids "Novos bonecos"/"Outros produtos". */
export function criarBonecoCard(produto, aoClicar, escuro = false) {
    const card = document.createElement('div');
    card.className = 'boneco-card';
    card.addEventListener('click', () => aoClicar(produto.id));

    const imgWrap = document.createElement('div');
    imgWrap.className = 'boneco-img-wrap' + (escuro ? ' dark' : '');

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
    card.appendChild(criarIconeFavorito(produto.id));
    return card;
}

/** Cria o item circular usado nos carrosséis "Itens Colecionáveis". */
export function criarItemCircular(produto, aoClicar) {
    const div = document.createElement('div');
    div.className = 'item-circular';
    div.addEventListener('click', () => aoClicar(produto.id));

    const img = document.createElement('img');
    img.src = obterFotoPrincipal(produto);
    img.alt = produto.nome || '';

    div.appendChild(img);
    return div;
}

const PRODUTOS_POR_LINHA = 5;
const LINHAS_MAX         = 3;
const LIMITE_GRID         = PRODUTOS_POR_LINHA * LINHAS_MAX;

function criarBotaoVerMais(classe, aoClicar, texto = null) {
    const btn = document.createElement('button');
    btn.className = classe;
    btn.setAttribute('aria-label', 'Ver mais');
    btn.innerHTML = `
        <span class="ver-mais-icone">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
            </svg>
        </span>
        ${texto ? `<span class="ver-mais-texto">${texto}</span>` : ''}
    `;
    btn.addEventListener('click', aoClicar);
    return btn;
}

/**
 * Renderiza produtos em todos os grids que casam com o seletor (suporta seções duplicadas).
 * Com `limitar: true`, mostra no máximo LIMITE_GRID cards, trocando o último por um
 * botão "Ver mais" que revela o restante ao ser clicado.
 */
export function renderizarBonecosEmGrids(seletorGrid, produtos, aoClicar, { limitar = false } = {}) {
    document.querySelectorAll(seletorGrid).forEach(grid => {
        const preencher = (lista, comVerMais) => {
            grid.innerHTML = '';
            lista.forEach((produto, index) => {
                grid.appendChild(criarBonecoCard(produto, aoClicar, index % 2 === 1));
            });
            if (comVerMais) {
                grid.appendChild(criarBotaoVerMais('boneco-card boneco-card--ver-mais', () => preencher(produtos, false), 'Ver mais'));
            }
        };

        if (limitar && produtos.length > LIMITE_GRID) {
            preencher(produtos.slice(0, LIMITE_GRID - 1), true);
        } else {
            preencher(produtos, false);
        }
    });
}

/**
 * Renderiza itens circulares em todos os grids que casam com o seletor (suporta seções duplicadas).
 * Com `limitar: true`, mostra no máximo LIMITE_GRID itens, trocando o último por um
 * botão "Ver mais" que revela o restante ao ser clicado.
 */
export function renderizarItensEmGrids(seletorGrid, produtos, aoClicar, { limitar = false } = {}) {
    document.querySelectorAll(seletorGrid).forEach(grid => {
        const preencher = (lista, comVerMais) => {
            grid.innerHTML = '';
            lista.forEach(produto => grid.appendChild(criarItemCircular(produto, aoClicar)));
            if (comVerMais) {
                grid.appendChild(criarBotaoVerMais('item-circular item-circular--ver-mais', () => preencher(produtos, false), 'Ver mais'));
            }
        };

        if (limitar && produtos.length > LIMITE_GRID) {
            preencher(produtos.slice(0, LIMITE_GRID - 1), true);
        } else {
            preencher(produtos, false);
        }
    });
}
