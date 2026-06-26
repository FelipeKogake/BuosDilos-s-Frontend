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
            fravicon: 'Assets/logo-azul.png',
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
            fravicon: 'Assets/logo-rosa.png',
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

function formatarPreco(valor) {
    return 'R$ ' + valor.toFixed(2).replace('.', ',');
}

function calcularTotais() {
    const itens = document.querySelectorAll('#lista-carrinho .favorito-card');
    let subtotal = 0;

    itens.forEach(card => {
        const preco = parseFloat(card.dataset.preco) || 0;
        const qty = parseInt(card.querySelector('.qty-valor').textContent) || 1;
        subtotal += preco * qty;
    });

    const temItens = itens.length > 0;
    document.getElementById('subtotal').textContent = formatarPreco(subtotal);
    document.getElementById('frete').textContent = temItens ? formatarPreco(FRETE) : 'R$ 00,00';
    document.getElementById('total').textContent = formatarPreco(temItens ? subtotal + FRETE : 0);
}

function alterarQty(btn, delta) {
    const card = btn.closest('.favorito-card');
    const span = card.querySelector('.qty-valor');
    let qty = parseInt(span.textContent) + delta;
    if (qty < 1) qty = 1;
    span.textContent = qty;
    calcularTotais();
}

function removerItem(btn) {
    const card = btn.closest('.favorito-card');
    card.style.transition = 'opacity 0.25s, transform 0.25s';
    card.style.opacity = '0';
    card.style.transform = 'translateX(20px)';
    setTimeout(() => {
        card.remove();
        calcularTotais();
    }, 250);
}

function toggleFav(btn) {
    btn.classList.toggle('ativo');
    const svg = btn.querySelector('svg');
    if (btn.classList.contains('ativo')) {
        svg.setAttribute('fill', 'currentColor');
    } else {
        svg.setAttribute('fill', 'none');
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

function fecharPedido() {
    const itens = document.querySelectorAll('#lista-carrinho .favorito-card');
    if (itens.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    alert('Pedido realizado com sucesso! Obrigado pela compra.');
}

calcularTotais();