// ─────────────────────────────────────────────────────────────────────────────
// Carrinho de compras: lista de { id, qtd } guardada no localStorage.
//
// O carrinho em si é client-side — o backend não tem endpoint de carrinho. Mas
// o fechamento do pedido é real: o checkout envia os itens para POST /pedidos,
// e as triggers do banco validam e baixam o estoque. Ver api/pedidos.js.
//
// Cupom e totais moram aqui, e não na tela, porque o carrinho e o checkout
// precisam chegar exatamente ao mesmo valor.
// ─────────────────────────────────────────────────────────────────────────────

const CHAVE = 'carrinho';
const CHAVE_CUPOM = 'carrinhoCupom';

/** Frete fixo. Um cálculo real dependeria de contrato com transportadora. */
export const FRETE = 14.00;

/**
 * Cupons fixos, validados no próprio front.
 * - percentual: fração abatida do subtotal
 * - fixo: valor em reais abatido do subtotal
 * - frete: zera o frete
 */
export const CUPONS = {
    GERMINARE10: { tipo: 'percentual', valor: 0.10,  rotulo: '10% de desconto' },
    POPDREAMS20: { tipo: 'percentual', valor: 0.20,  rotulo: '20% de desconto' },
    BEMVINDO15:  { tipo: 'fixo',       valor: 15.00, rotulo: 'R$ 15,00 de desconto' },
    FRETEGRATIS: { tipo: 'frete',      valor: 0,     rotulo: 'Frete grátis' },
};

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

/** Chamado quando o pedido é confirmado no backend. */
export function esvaziarCarrinho() {
    gravarCarrinho([]);
    removerCupom();
}

// ── Cupom ─────────────────────────────────────────────────────────────────────

/** Código do cupom válido em uso, ou null. */
export function obterCupomAplicado() {
    const codigo = localStorage.getItem(CHAVE_CUPOM);
    return codigo && CUPONS[codigo] ? codigo : null;
}

/**
 * Aplica um cupom. Devolve o código normalizado se for válido, ou null se não
 * for — nesse caso qualquer cupom anterior é descartado.
 */
export function aplicarCupomCodigo(codigo) {
    const normalizado = String(codigo ?? '').trim().toUpperCase();

    if (!CUPONS[normalizado]) {
        removerCupom();
        return null;
    }

    localStorage.setItem(CHAVE_CUPOM, normalizado);
    return normalizado;
}

export function removerCupom() {
    localStorage.removeItem(CHAVE_CUPOM);
}

// ── Totais ────────────────────────────────────────────────────────────────────

/**
 * Calcula os totais do carrinho a partir das linhas já resolvidas com preço.
 *
 * @param {Array<{preco: number, qtd: number}>} linhas
 * @returns {{subtotal: number, desconto: number, frete: number, total: number, cupom: string|null}}
 */
export function calcularTotais(linhas) {
    const subtotal = linhas.reduce(
        (soma, linha) => soma + (Number(linha.preco) || 0) * (Number(linha.qtd) || 0),
        0
    );

    const temItens = linhas.length > 0 && subtotal > 0;
    const codigo   = obterCupomAplicado();
    const cupom    = codigo ? CUPONS[codigo] : null;

    let desconto = 0;
    if (temItens && cupom) {
        if (cupom.tipo === 'percentual') desconto = subtotal * cupom.valor;
        else if (cupom.tipo === 'fixo')  desconto = Math.min(cupom.valor, subtotal);
    }

    const freteGratis = Boolean(cupom && cupom.tipo === 'frete');
    const frete       = temItens && !freteGratis ? FRETE : 0;
    const total       = temItens ? Math.max(0, subtotal - desconto + frete) : 0;

    return { subtotal, desconto, frete, total, cupom: codigo };
}
