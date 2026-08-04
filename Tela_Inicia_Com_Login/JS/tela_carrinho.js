import { obterProdutoPorId, obterProdutos } from '../../api/produtosStore.js';
import { formatarPreco, obterFotoPrincipal, renderizarBonecosEmGrids } from '../../api/produtosView.js';
import { ehFavorito, alternarFavorito } from '../../api/favoritos.js';
import {
    obterItensCarrinho,
    alterarQuantidade,
    removerDoCarrinho,
    esvaziarCarrinho,
} from '../../api/carrinho.js';

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
        "--cor-botao-principal": "#BCC7EA",
        "--cor-botao-principal-hover": "#bfd4e8",
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
        "--cor-botao-principal": "#F1CECE",
        "--cor-botao-principal-hover": "#e6b2b2",
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

    const btnTemaImg = document.querySelector('.btn-tema img');
    const favicon = document.querySelector('#favicon');
    if (btnTemaImg) btnTemaImg.src = tema.imagens.avatar;
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

/* ============================================
   CARRINHO
   ============================================ */

const FRETE = 14.00;

function urlProduto(id) {
    return `tela_produto.html?id=${encodeURIComponent(id)}&origem=carrinho`;
}

function calcularTotais() {
    const itens = document.querySelectorAll('#lista-carrinho .favorito-card');
    let subtotal = 0;

    itens.forEach(card => {
        const preco = parseFloat(card.dataset.preco) || 0;
        const qty = parseInt(card.querySelector('.qty-valor').textContent, 10) || 1;
        subtotal += preco * qty;
    });

    const temItens = itens.length > 0;
    document.getElementById('subtotal').textContent = formatarPreco(subtotal);
    document.getElementById('frete').textContent = temItens ? formatarPreco(FRETE) : formatarPreco(0);
    document.getElementById('total').textContent = formatarPreco(temItens ? subtotal + FRETE : 0);

    const btnFechar = document.getElementById('btn-fechar-pedido');
    if (btnFechar) btnFechar.disabled = !temItens;
}

function mostrarCarrinhoVazio() {
    document.getElementById('lista-carrinho').innerHTML =
        '<p class="carrinho-vazio">Seu carrinho está vazio. <a href="tela_catalogo.html">Ver bonecos</a></p>';
    calcularTotais();
}

/** Cria o card de um item do carrinho (imagem, nome, preço, favoritar, quantidade, remover). */
function criarItemCarrinhoElemento(produto, qtd) {
    const card = document.createElement('div');
    card.className = 'favorito-card';
    card.dataset.id = produto.id;
    card.dataset.preco = produto.preco;

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
    btnFav.type = 'button';
    btnFav.innerHTML = `
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
    `;
    const atualizarFav = (favoritado) => {
        btnFav.classList.toggle('ativo', favoritado);
        btnFav.setAttribute('aria-label', favoritado ? 'Remover dos favoritos' : 'Favoritar');
        btnFav.querySelector('svg')?.setAttribute('fill', favoritado ? 'currentColor' : 'none');
    };
    atualizarFav(ehFavorito(produto.id));
    btnFav.addEventListener('click', () => atualizarFav(alternarFavorito(produto.id)));

    const btnMenos = document.createElement('button');
    btnMenos.className = 'btn-qty';
    btnMenos.type = 'button';
    btnMenos.textContent = '−';
    btnMenos.setAttribute('aria-label', 'Diminuir quantidade');

    const spanQty = document.createElement('span');
    spanQty.className = 'qty-valor';
    spanQty.textContent = qtd;

    const btnMais = document.createElement('button');
    btnMais.className = 'btn-qty';
    btnMais.type = 'button';
    btnMais.textContent = '+';
    btnMais.setAttribute('aria-label', 'Aumentar quantidade');

    btnMenos.addEventListener('click', () => {
        const nova = Math.max(1, parseInt(spanQty.textContent, 10) - 1);
        spanQty.textContent = nova;
        alterarQuantidade(produto.id, nova);
        calcularTotais();
    });
    btnMais.addEventListener('click', () => {
        const nova = parseInt(spanQty.textContent, 10) + 1;
        spanQty.textContent = nova;
        alterarQuantidade(produto.id, nova);
        calcularTotais();
    });

    const btnRemover = document.createElement('button');
    btnRemover.className = 'btn-remover';
    btnRemover.type = 'button';
    btnRemover.setAttribute('aria-label', 'Remover');
    btnRemover.innerHTML = `
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
    `;
    btnRemover.addEventListener('click', () => {
        removerDoCarrinho(produto.id);
        card.style.transition = 'opacity 0.25s, transform 0.25s';
        card.style.opacity = '0';
        card.style.transform = 'translateX(20px)';
        setTimeout(() => {
            card.remove();
            if (!document.querySelectorAll('#lista-carrinho .favorito-card').length) {
                mostrarCarrinhoVazio();
            } else {
                calcularTotais();
            }
        }, 250);
    });

    acoes.append(btnFav, btnMenos, spanQty, btnMais, btnRemover);
    card.append(imgWrap, info, acoes);
    return card;
}

async function carregarCarrinho() {
    const lista = document.getElementById('lista-carrinho');
    const itensCarrinho = obterItensCarrinho();

    if (itensCarrinho.length === 0) {
        mostrarCarrinhoVazio();
        return;
    }

    try {
        const produtos = await Promise.all(
            itensCarrinho.map(item => obterProdutoPorId(item.id).catch(() => null))
        );

        lista.innerHTML = '';
        itensCarrinho.forEach((item, indice) => {
            const produto = produtos[indice];
            if (!produto) return; // produto pode ter sido excluído desde que foi adicionado
            lista.appendChild(criarItemCarrinhoElemento(produto, item.qtd));
        });

        if (!lista.children.length) {
            mostrarCarrinhoVazio();
            return;
        }
        calcularTotais();
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        lista.innerHTML = '<p class="carrinho-vazio">Erro ao carregar seu carrinho.</p>';
    }
}

function aplicarCupom() {
    const input = document.getElementById('cupom-input');
    const val = input.value.trim().toUpperCase();
    if (val === 'GERMINARE10') {
        document.getElementById('taxa').textContent = '−R$ 12,00';
        input.style.borderColor = '#5cb85c';
    } else if (val !== '') {
        input.style.borderColor = '#e24b4a';
    }
}
window.aplicarCupom = aplicarCupom;

/* ============================================
   FECHAR PEDIDO (simulação de checkout)
   ============================================ */

function fecharPedido() {
    if (obterItensCarrinho().length === 0) return;

    const modal        = document.getElementById('modal-pedido');
    const processando  = document.getElementById('pedido-processando');
    const sucesso       = document.getElementById('pedido-sucesso');
    const totalTexto    = document.getElementById('total').textContent;
    const numeroPedido  = '#' + Math.floor(100000 + Math.random() * 900000);

    document.getElementById('pedido-total-final').textContent = totalTexto;
    document.getElementById('pedido-numero').textContent = numeroPedido;

    processando.hidden = false;
    sucesso.hidden = true;
    modal.hidden = false;

    // Simula o tempo de processamento do pagamento.
    setTimeout(() => {
        processando.hidden = true;
        sucesso.hidden = false;
        esvaziarCarrinho();
    }, 1400);
}
window.fecharPedido = fecharPedido;

document.getElementById('btn-pedido-continuar').addEventListener('click', () => {
    document.getElementById('modal-pedido').hidden = true;
    carregarCarrinho();
});

/* ============================================
   OUTROS BONECOS
   ============================================ */

async function carregarOutrosBonecos() {
    try {
        const produtos = await obterProdutos();
        const ativos = produtos.filter(p => p.ativo).slice(0, 5);
        renderizarBonecosEmGrids('.bonecos-grid', ativos, urlProduto);
    } catch (error) {
        console.error('Erro ao carregar outros bonecos:', error);
    }
}

carregarCarrinho();
carregarOutrosBonecos();
