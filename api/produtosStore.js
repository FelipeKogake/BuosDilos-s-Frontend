import { listarProdutos, buscarProduto } from './produtos.js';

// ─────────────────────────────────────────────────────────────────────────────
// Cache client-side de produtos (sessionStorage) para evitar refazer o GET
// /produtos em toda página. Válido por TTL_MS; expira sozinho ou é invalidado
// manualmente pelo admin após criar/editar/excluir/inativar um produto.
// ─────────────────────────────────────────────────────────────────────────────

const CHAVE_CACHE = 'produtosCache';
const TTL_MS       = 5 * 60 * 1000;

function lerCache() {
    try {
        const bruto = sessionStorage.getItem(CHAVE_CACHE);
        if (!bruto) return null;

        const registro = JSON.parse(bruto);
        if (Date.now() - registro.timestamp >= TTL_MS) return null;

        return registro.produtos;
    } catch {
        return null;
    }
}

function gravarCache(produtos) {
    sessionStorage.setItem(CHAVE_CACHE, JSON.stringify({ timestamp: Date.now(), produtos }));
}

/** Retorna os produtos do cache (se válido) ou busca da API e cacheia. */
export async function obterProdutos({ forcarAtualizacao = false } = {}) {
    if (!forcarAtualizacao) {
        const emCache = lerCache();
        if (emCache) return emCache;
    }

    const produtos = await listarProdutos();
    gravarCache(produtos);
    return produtos;
}

/** Busca um produto pelo id no cache; se não encontrar, busca direto na API. */
export async function obterProdutoPorId(id) {
    const produtos = await obterProdutos();
    const encontrado = produtos.find(p => String(p.id) === String(id));
    if (encontrado) return encontrado;

    return buscarProduto(id);
}

/** Descarta o cache. Chamado pelo admin após qualquer mutação de produto. */
export function invalidarCacheProdutos() {
    sessionStorage.removeItem(CHAVE_CACHE);
}
