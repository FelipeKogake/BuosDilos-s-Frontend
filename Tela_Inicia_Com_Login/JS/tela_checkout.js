// ─────────────────────────────────────────────────────────────────────────────
// Checkout: endereço, pagamento e fechamento do pedido.
//
// Fluxo do envio:
//   1. resolve o usuário do Firebase para um cliente_id no Postgres
//   2. POST /pedidos    → cria pedido e itens (triggers validam/baixam estoque)
//   3. POST /entregas   → endereço de entrega
//   4. POST /pagamentos → forma e valor
// ─────────────────────────────────────────────────────────────────────────────

import { auth } from '../../autthentication/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { obterProdutoPorId } from '../../api/produtosStore.js';
import { formatarPreco } from '../../api/produtosView.js';
import { obterItensCarrinho, esvaziarCarrinho, calcularTotais, CUPONS } from '../../api/carrinho.js';
import { resolverConsumidorId } from '../../api/consumidor.js';
import {
    criarPedido,
    registrarEntrega,
    registrarPagamento,
    listarTiposPagamento,
} from '../../api/pedidos.js';
import { buscarEnderecoPorCep, formatarCep, limparCep } from '../../api/cep.js';

const ESTADOS = [
    'checkout-carregando',
    'checkout-login',
    'checkout-vazio',
    'checkout-conteudo',
    'checkout-sucesso',
];

let usuario = null;
let linhas  = [];   // [{ produto, qtd }]
let totais  = null;
let enviando = false;

const el = (id) => document.getElementById(id);

/** Mostra um dos estados da página e esconde os demais. */
function mostrarEstado(id) {
    ESTADOS.forEach(chave => { el(chave).hidden = chave !== id; });
}

/**
 * Escreve (ou limpa) a mensagem de erro de um campo e marca aria-invalid.
 * Devolve true quando o campo está válido.
 */
function definirErroCampo(idCampo, mensagem) {
    const campo = el(idCampo);
    const erro  = el(`${idCampo}-erro`);

    if (erro) erro.textContent = mensagem || '';
    if (campo) campo.setAttribute('aria-invalid', mensagem ? 'true' : 'false');

    return !mensagem;
}

// ── Tema ──────────────────────────────────────────────────────────────────────

function sincronizarTema(tema) {
    el('btn-tema').querySelector('img').src = `Assets/avatar-${tema}.png`;
    el('favicon').href = tema === 'rosa' ? 'Assets/logo-rosa2.png' : 'Assets/logo-azul.png';
}

el('btn-tema').addEventListener('click', () => {
    sincronizarTema(window.TemaPopDreams.alternar());
});
sincronizarTema(window.TemaPopDreams.temaAtual());

// ── Resumo ────────────────────────────────────────────────────────────────────

function renderizarResumo() {
    const lista = el('resumo-itens');
    lista.textContent = '';

    linhas.forEach(({ produto, qtd }) => {
        const item = document.createElement('li');
        item.className = 'resumo-item';

        const nome = document.createElement('span');
        nome.className = 'resumo-item-nome';
        nome.textContent = `${qtd}× ${produto.nome}`;

        const valor = document.createElement('span');
        valor.textContent = formatarPreco(produto.preco * qtd);

        item.append(nome, valor);
        lista.appendChild(item);
    });

    totais = calcularTotais(linhas.map(l => ({ preco: l.produto.preco, qtd: l.qtd })));

    el('resumo-subtotal').textContent = formatarPreco(totais.subtotal);
    el('resumo-frete').textContent    = formatarPreco(totais.frete);
    el('resumo-total').textContent    = formatarPreco(totais.total);
    el('resumo-desconto').textContent =
        totais.desconto > 0 ? `− ${formatarPreco(totais.desconto)}` : formatarPreco(0);

    const cupom = el('resumo-cupom');
    if (totais.cupom) {
        cupom.textContent = `Cupom ${totais.cupom} — ${CUPONS[totais.cupom].rotulo}`;
        cupom.hidden = false;
    } else {
        cupom.hidden = true;
    }
}

// ── CEP (ViaCEP) ──────────────────────────────────────────────────────────────

async function consultarCep() {
    const status = el('cep-status');
    definirErroCampo('cep', '');

    if (limparCep(el('cep').value).length !== 8) {
        status.textContent = '';
        definirErroCampo('cep', 'Informe um CEP com 8 dígitos.');
        return;
    }

    status.textContent = 'Buscando endereço...';

    try {
        const endereco = await buscarEnderecoPorCep(el('cep').value);

        el('cep').value        = endereco.cep;
        el('logradouro').value = endereco.logradouro;
        el('cidade').value     = endereco.cidade;
        el('estado').value     = endereco.estado;

        status.textContent = `Endereço encontrado em ${endereco.cidade}/${endereco.estado}. Falta o número.`;
        el('numero').focus();
    } catch (erro) {
        status.textContent = '';
        definirErroCampo('cep', erro.message);
    }
}

el('cep').addEventListener('input', (evento) => {
    evento.target.value = formatarCep(evento.target.value);
});

el('cep').addEventListener('blur', () => {
    if (limparCep(el('cep').value).length === 8) consultarCep();
});

el('btn-buscar-cep').addEventListener('click', consultarCep);

// ── Formas de pagamento ───────────────────────────────────────────────────────

async function carregarFormasPagamento() {
    const lista = el('lista-pagamento');

    try {
        const tipos = await listarTiposPagamento();
        lista.textContent = '';

        if (!tipos || tipos.length === 0) {
            const vazio = document.createElement('p');
            vazio.className = 'campo-status';
            vazio.textContent = 'Nenhuma forma de pagamento cadastrada.';
            lista.appendChild(vazio);
            return;
        }

        tipos.forEach((tipo, indice) => {
            const opcao = document.createElement('div');
            opcao.className = 'pagamento-opcao';

            const radio = document.createElement('input');
            radio.type    = 'radio';
            radio.name    = 'tipoPagamento';
            radio.id      = `pagamento-${tipo.id}`;
            radio.value   = tipo.id;
            radio.checked = indice === 0;

            const rotulo = document.createElement('label');
            rotulo.setAttribute('for', radio.id);
            rotulo.textContent = tipo.nome;

            opcao.append(radio, rotulo);
            lista.appendChild(opcao);
        });
    } catch (erro) {
        lista.textContent = '';
        const falha = document.createElement('p');
        falha.className = 'campo-erro';
        falha.textContent = `Não foi possível carregar as formas de pagamento: ${erro.message}`;
        lista.appendChild(falha);
    }
}

// ── Validação ─────────────────────────────────────────────────────────────────

function validarFormulario() {
    // Cada definirErroCampo roda antes do && para que todos os campos sejam
    // avaliados — não queremos parar no primeiro erro.
    const cepOk = definirErroCampo('cep',
        limparCep(el('cep').value).length === 8 ? '' : 'Informe um CEP válido com 8 dígitos.');

    const numeroOk = definirErroCampo('numero',
        el('numero').value.trim() ? '' : 'Informe o número do endereço.');

    const cidadeOk = definirErroCampo('cidade',
        el('cidade').value.trim() ? '' : 'Informe a cidade.');

    const estadoOk = definirErroCampo('estado',
        el('estado').value.trim().length === 2 ? '' : 'Informe a UF com 2 letras.');

    const pagamento   = document.querySelector('input[name="tipoPagamento"]:checked');
    const pagamentoOk = Boolean(pagamento);
    el('pagamento-erro').textContent = pagamentoOk ? '' : 'Escolha uma forma de pagamento.';

    return cepOk && numeroOk && cidadeOk && estadoOk && pagamentoOk;
}

// ── Envio ─────────────────────────────────────────────────────────────────────

async function enviarPedido(evento) {
    evento.preventDefault();
    if (enviando) return;

    el('checkout-erro').textContent = '';

    if (!validarFormulario()) {
        el('checkout-erro').textContent = 'Revise os campos destacados antes de continuar.';
        return;
    }

    const botao = el('btn-confirmar');
    enviando = true;
    botao.disabled = true;
    botao.textContent = 'Enviando pedido...';

    try {
        const consumidorId = await resolverConsumidorId(usuario);

        const pedido = await criarPedido(
            consumidorId,
            linhas.map(linha => ({ produtoId: linha.produto.id, quantidade: linha.qtd }))
        );

        // Entrega e pagamento vêm depois porque dependem do id do pedido. Se
        // falharem, o pedido já existe e o estoque já foi baixado pelas
        // triggers — então não desfazemos a compra, só registramos a falha.
        try {
            await registrarEntrega(pedido.id, {
                cep:         el('cep').value,
                numero:      el('numero').value.trim(),
                cidade:      el('cidade').value.trim(),
                estado:      el('estado').value.trim().toUpperCase(),
                complemento: el('complemento').value.trim(),
            });

            const tipoPagamentoId = document.querySelector('input[name="tipoPagamento"]:checked').value;
            await registrarPagamento(pedido.id, tipoPagamentoId, totais.total);
        } catch (erro) {
            console.error('Pedido criado, mas entrega/pagamento não foram registrados:', erro);
        }

        esvaziarCarrinho();

        el('pedido-numero').textContent = `#${pedido.id}`;
        el('pedido-total').textContent  = formatarPreco(totais.total);
        mostrarEstado('checkout-sucesso');

        // Leva o foco para a confirmação, senão quem usa teclado ou leitor de
        // tela continua no botão de um formulário que sumiu.
        const titulo = el('checkout-sucesso').querySelector('h2');
        titulo.setAttribute('tabindex', '-1');
        titulo.focus();

    } catch (erro) {
        el('checkout-erro').textContent = `Não foi possível concluir o pedido: ${erro.message}`;
    } finally {
        enviando = false;
        botao.disabled = false;
        botao.textContent = 'Confirmar pedido';
    }
}

el('form-checkout').addEventListener('submit', enviarPedido);

// ── Inicialização ─────────────────────────────────────────────────────────────

async function iniciar() {
    carregarFormasPagamento();

    const itensCarrinho = obterItensCarrinho();

    if (itensCarrinho.length === 0) {
        mostrarEstado('checkout-vazio');
        return;
    }

    try {
        const produtos = await Promise.all(
            itensCarrinho.map(item => obterProdutoPorId(item.id).catch(() => null))
        );

        // Um produto pode ter sido excluído depois de entrar no carrinho.
        linhas = itensCarrinho
            .map((item, indice) => ({ produto: produtos[indice], qtd: item.qtd }))
            .filter(linha => linha.produto);

        if (linhas.length === 0) {
            mostrarEstado('checkout-vazio');
            return;
        }

        renderizarResumo();
        mostrarEstado('checkout-conteudo');
    } catch (erro) {
        mostrarEstado('checkout-conteudo');
        el('checkout-erro').textContent = `Erro ao carregar seu carrinho: ${erro.message}`;
    }
}

onAuthStateChanged(auth, (usuarioFirebase) => {
    if (!usuarioFirebase) {
        mostrarEstado('checkout-login');
        return;
    }

    usuario = usuarioFirebase;
    iniciar();
});
