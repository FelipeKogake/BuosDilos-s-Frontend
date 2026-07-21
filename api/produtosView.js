// ─────────────────────────────────────────────────────────────────────────────
// Helpers de apresentação de produto compartilhados entre tela_inicial,
// tela_catalogo e tela_produto (Com_Login e Sem_Login).
// ─────────────────────────────────────────────────────────────────────────────

import { ehFavorito, alternarFavorito } from './favoritos.js';

// Resolvido a partir da localização deste módulo (não da página atual), pois
// este arquivo é usado tanto por páginas na raiz (index.html) quanto por
// páginas um nível abaixo (Tela_Inicia_*/*.html) — um caminho relativo à
// página quebraria em uma das duas profundidades. Também funciona hospedado
// em subpasta (ex.: GitHub Pages de projeto), diferente de um caminho absoluto "/...".
export const IMAGEM_PADRAO = new URL('../Tela_Inicia_Com_Login/Assets/login/personagem-azul.png', import.meta.url).href;

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

/**
 * Cria o card usado nos grids "Novos bonecos"/"Outros produtos".
 * `obterUrl(produtoId)` deve retornar a URL de destino — o card inteiro
 * (exceto o botão de favoritar) é um <a> nativo: focável e ativável
 * por teclado sem precisar de role/tabindex artificiais.
 */
export function criarBonecoCard(produto, obterUrl, escuro = false) {
    const card = document.createElement('div');
    card.className = 'boneco-card';

    const link = document.createElement('a');
    link.className = 'boneco-card-link';
    link.href = obterUrl(produto.id);
    link.style.cssText = 'display:contents;color:inherit;text-decoration:none;';

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

    link.appendChild(imgWrap);
    link.appendChild(info);

    card.appendChild(link);
    card.appendChild(criarIconeFavorito(produto.id));
    return card;
}

/**
 * Cria o item circular usado nos carrosséis "Itens Colecionáveis".
 * `obterUrl(produtoId)` deve retornar a URL de destino.
 */
export function criarItemCircular(produto, obterUrl) {
    const link = document.createElement('a');
    link.className = 'item-circular';
    link.href = obterUrl(produto.id);
    link.style.cssText = 'color:inherit;text-decoration:none;';

    const img = document.createElement('img');
    img.src = obterFotoPrincipal(produto);
    img.alt = produto.nome || '';

    link.appendChild(img);
    return link;
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
export function renderizarBonecosEmGrids(seletorGrid, produtos, obterUrl, { limitar = false } = {}) {
    document.querySelectorAll(seletorGrid).forEach(grid => {
        const preencher = (lista, comVerMais) => {
            grid.innerHTML = '';
            lista.forEach((produto, index) => {
                grid.appendChild(criarBonecoCard(produto, obterUrl, index % 2 === 1));
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
export function renderizarItensEmGrids(seletorGrid, produtos, obterUrl, { limitar = false } = {}) {
    document.querySelectorAll(seletorGrid).forEach(grid => {
        const preencher = (lista, comVerMais) => {
            grid.innerHTML = '';
            lista.forEach(produto => grid.appendChild(criarItemCircular(produto, obterUrl)));
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
