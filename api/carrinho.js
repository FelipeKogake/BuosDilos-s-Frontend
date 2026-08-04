// ─────────────────────────────────────────────────────────────────────────────
// Carrinho de compras: lista de { id, qtd } guardada no localStorage.
// Não há endpoint de carrinho/pedido no backend — é um recurso 100% client-side,
// que simula o fluxo de compra (sem pagamento real).
// ─────────────────────────────────────────────────────────────────────────────

const CHAVE = 'carrinho';

function lerCarrinho() {
    try {
        const bruto = localStorage.getItem(CHAVE);
        return bruto ? JSON.parse(bruto) : [];
    } catch {
        return [];
    }
}

function gravarCarrinho(itens) {
    localStorage.setItem(CHAVE, JSON.stringify(itens));
}

export function obterItensCarrinho() {
    return lerCarrinho();
}

export function obterQuantidadeTotal() {
    return lerCarrinho().reduce((soma, item) => soma + item.qtd, 0);
}

/** Adiciona `qtd` unidades do produto ao carrinho (soma se ele já estiver lá). */
export function adicionarAoCarrinho(id, qtd = 1) {
    const itens = lerCarrinho();
    const existente = itens.find(item => String(item.id) === String(id));

    if (existente) {
        existente.qtd += qtd;
    } else {
        itens.push({ id, qtd });
    }

    gravarCarrinho(itens);
    return itens;
}

/** Define a quantidade exata de um item (mínimo 1). */
export function alterarQuantidade(id, qtd) {
    const itens = lerCarrinho();
    const item = itens.find(i => String(i.id) === String(id));
    if (!item) return itens;

    item.qtd = Math.max(1, qtd);
    gravarCarrinho(itens);
    return itens;
}

export function removerDoCarrinho(id) {
    const itens = lerCarrinho().filter(item => String(item.id) !== String(id));
    gravarCarrinho(itens);
    return itens;
}

/** Chamado ao "fechar pedido" — o pedido foi simulado, o carrinho esvazia. */
export function esvaziarCarrinho() {
    gravarCarrinho([]);
}
