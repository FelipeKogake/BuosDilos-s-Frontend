// ─────────────────────────────────────────────────────────────────────────────
// Histórico de pedidos do usuário autenticado.
// Consome GET /api/pedidos/consumidor/{consumidorId}, resolvendo antes o
// cliente_id a partir do usuário do Firebase (ver api/consumidor.js).
// ─────────────────────────────────────────────────────────────────────────────

import { auth } from '../../autthentication/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { formatarPreco } from '../../api/produtosView.js';
import { resolverConsumidorId } from '../../api/consumidor.js';
import { listarPedidosDoConsumidor } from '../../api/pedidos.js';

const ESTADOS = [
    'pedidos-carregando',
    'pedidos-login',
    'pedidos-vazio',
    'pedidos-erro',
    'pedidos-lista',
];

let usuario = null;

const el = (id) => document.getElementById(id);

function mostrarEstado(id) {
    ESTADOS.forEach(chave => { el(chave).hidden = chave !== id; });
}

// ── Tema ──────────────────────────────────────────────────────────────────────

function sincronizarTema(tema) {
    const logo = tema === 'rosa' ? 'Assets/logo-rosa2.png' : 'Assets/logo-azul.png';

    el('btn-tema').querySelector('img').src = `Assets/avatar-${tema}.png`;
    el('favicon').href = logo;

    // O logo da navbar também acompanha o tema, como nas demais telas.
    const logoNavbar = document.querySelector('.navbar-logo-img');
    if (logoNavbar) logoNavbar.src = logo;
}

el('btn-tema').addEventListener('click', () => {
    sincronizarTema(window.TemaPopDreams.alternar());
});
sincronizarTema(window.TemaPopDreams.temaAtual());

// ── Formatação ────────────────────────────────────────────────────────────────

/** "2026-07-20T10:30:00" → "20/07/2026 às 10:30" */
function formatarData(iso) {
    if (!iso) return 'Data não informada';

    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return 'Data não informada';

    return `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    })}`;
}

/** Classe do selo de status. O texto sempre acompanha — a cor é só reforço. */
function classeStatus(status) {
    const normalizado = String(status || '').toUpperCase();
    if (normalizado === 'ENTREGUE')   return 'selo--entregue';
    if (normalizado === 'CANCELADO')  return 'selo--cancelado';
    if (normalizado === 'ENVIADO')    return 'selo--enviado';
    return 'selo--processando';
}

// ── Renderização ──────────────────────────────────────────────────────────────

function criarItemPedido(item) {
    const linha = document.createElement('li');
    linha.className = 'pedido-item';

    const nome = document.createElement('span');
    nome.className = 'pedido-item-nome';
    nome.textContent = `${item.quantidade}× ${item.nomeProduto ?? 'Produto removido'}`;

    const valor = document.createElement('span');
    valor.textContent = formatarPreco(item.subtotal ?? 0);

    linha.append(nome, valor);
    return linha;
}

function criarCartaoPedido(pedido) {
    const cartao = document.createElement('li');
    cartao.className = 'pedido-cartao';

    const cabecalho = document.createElement('div');
    cabecalho.className = 'pedido-cabecalho';

    const titulo = document.createElement('h2');
    titulo.className = 'pedido-numero';
    titulo.textContent = `Pedido #${pedido.id}`;

    const selo = document.createElement('span');
    selo.className = `pedido-selo ${classeStatus(pedido.status)}`;
    selo.textContent = pedido.status || 'PENDENTE';

    cabecalho.append(titulo, selo);

    const data = document.createElement('p');
    data.className = 'pedido-data';
    data.textContent = formatarData(pedido.dataPedido);

    const itens = document.createElement('ul');
    itens.className = 'pedido-itens';
    (pedido.itens || []).forEach(item => itens.appendChild(criarItemPedido(item)));

    if (!itens.children.length) {
        const vazio = document.createElement('li');
        vazio.className = 'pedido-item';
        vazio.textContent = 'Sem itens registrados neste pedido.';
        itens.appendChild(vazio);
    }

    const total = document.createElement('div');
    total.className = 'pedido-total';
    const rotuloTotal = document.createElement('span');
    rotuloTotal.textContent = 'Total';
    const valorTotal = document.createElement('span');
    valorTotal.textContent = formatarPreco(pedido.valorTotal ?? 0);
    total.append(rotuloTotal, valorTotal);

    cartao.append(cabecalho, data, itens, total);
    return cartao;
}

function renderizarPedidos(pedidos) {
    const lista = el('pedidos-lista');
    lista.textContent = '';

    // Um fragmento evita um reflow por cartão inserido.
    const fragmento = document.createDocumentFragment();
    pedidos.forEach(pedido => fragmento.appendChild(criarCartaoPedido(pedido)));
    lista.appendChild(fragmento);

    mostrarEstado('pedidos-lista');
}

// ── Carregamento ──────────────────────────────────────────────────────────────

async function carregarPedidos() {
    mostrarEstado('pedidos-carregando');

    try {
        const consumidorId = await resolverConsumidorId(usuario);
        const pedidos = await listarPedidosDoConsumidor(consumidorId);

        if (!pedidos || pedidos.length === 0) {
            mostrarEstado('pedidos-vazio');
            return;
        }

        renderizarPedidos(pedidos);
    } catch (erro) {
        el('pedidos-erro-detalhe').textContent = erro.message;
        mostrarEstado('pedidos-erro');
    }
}

el('btn-tentar-novamente').addEventListener('click', carregarPedidos);

onAuthStateChanged(auth, (usuarioFirebase) => {
    if (!usuarioFirebase) {
        mostrarEstado('pedidos-login');
        return;
    }

    usuario = usuarioFirebase;
    carregarPedidos();
});
