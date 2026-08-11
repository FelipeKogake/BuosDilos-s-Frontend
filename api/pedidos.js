// api/pedidos.js
// ─────────────────────────────────────────────────────────────────────────────
// Pedidos, entrega e pagamento.
//
// O backend separa o pedido em três recursos: POST /pedidos cria o pedido e
// seus itens (as triggers do banco validam e baixam o estoque), e depois
// /entregas e /pagamentos são registrados apontando para o pedido criado.
// ─────────────────────────────────────────────────────────────────────────────

import { apiFetch } from './http.js';

/**
 * Cria um pedido com seus itens.
 *
 * O preço não é enviado: o backend lê o preço atual do produto, para o cliente
 * não conseguir forjar o valor pela requisição.
 *
 * @param {number} consumidorId
 * @param {Array<{produtoId: number, quantidade: number}>} itens
 */
export async function criarPedido(consumidorId, itens) {
    return apiFetch('/pedidos', {
        method: 'POST',
        body: JSON.stringify({
            consumidorId,
            itens: itens.map(item => ({
                produtoId:  Number(item.produtoId),
                quantidade: Number(item.quantidade),
            })),
        }),
    });
}

/** Registra o endereço de entrega de um pedido. */
export async function registrarEntrega(pedidoId, endereco) {
    return apiFetch('/entregas', {
        method: 'POST',
        body: JSON.stringify({
            pedidoId,
            cep:         endereco.cep,
            numero:      endereco.numero,
            cidade:      endereco.cidade,
            estado:      endereco.estado,
            complemento: endereco.complemento || null,
        }),
    });
}

/** Registra o pagamento de um pedido. */
export async function registrarPagamento(pedidoId, tipoPagamentoId, valor) {
    return apiFetch('/pagamentos', {
        method: 'POST',
        body: JSON.stringify({
            pedidoId,
            tipoPagamentoId: Number(tipoPagamentoId),
            valor:           Number(valor),
        }),
    });
}

/** Lista os tipos de pagamento cadastrados (PIX, crédito, boleto...). */
export async function listarTiposPagamento() {
    return apiFetch('/tipos-pagamento');
}

/** Lista os pedidos de um consumidor, do mais recente para o mais antigo. */
export async function listarPedidosDoConsumidor(consumidorId) {
    const pedidos = await apiFetch(`/pedidos/consumidor/${consumidorId}`);
    return (pedidos || []).sort(
        (a, b) => new Date(b.dataPedido) - new Date(a.dataPedido)
    );
}

/** Busca um pedido pelo id. */
export async function buscarPedido(pedidoId) {
    return apiFetch(`/pedidos/${pedidoId}`);
}
