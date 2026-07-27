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

/** Retorna todos os registros do cache (se válido) ou busca da API e cacheia — bonecos e itens misturados. */
async function obterTodosOsRegistros({ forcarAtualizacao = false } = {}) {
    if (!forcarAtualizacao) {
        const emCache = lerCache();
        if (emCache) return emCache;
    }

    const registros = await listarProdutos();
    gravarCache(registros);
    return registros;
}

/** Retorna apenas os "produtos" (bonecos) — registros com `item` falso/ausente. */
export async function obterProdutos(opcoes) {
    const todos = await obterTodosOsRegistros(opcoes);
    return todos.filter(p => !p.item);
}

/** Retorna apenas os "itens" colecionáveis — registros com `item: true`. */
export async function obterItens(opcoes) {
    const todos = await obterTodosOsRegistros(opcoes);
    return todos.filter(p => p.item);
}

/** Busca um produto OU item pelo id no cache; se não encontrar, busca direto na API. */
export async function obterProdutoPorId(id) {
    const todos = await obterTodosOsRegistros();
    const encontrado = todos.find(p => String(p.id) === String(id));
    if (encontrado) return encontrado;

    return buscarProduto(id);
}

/** Descarta o cache. Chamado pelo admin após qualquer mutação de produto. */
export function invalidarCacheProdutos() {
    sessionStorage.removeItem(CHAVE_CACHE);
}
