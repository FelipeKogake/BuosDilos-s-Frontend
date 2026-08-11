// api/consumidor.js
// ─────────────────────────────────────────────────────────────────────────────
// Ponte entre as duas identidades do projeto.
//
// Quem autentica é o Firebase, que identifica o usuário por uid e e-mail.
// Quem guarda pedidos é o Postgres, que identifica o comprador por cliente_id
// (Integer). Nenhum dos dois conhece o outro — e POST /api/pedidos exige o
// consumidorId. Este módulo resolve um para o outro usando o e-mail como
// chave, e guarda o resultado para não repetir a busca a cada checkout.
// ─────────────────────────────────────────────────────────────────────────────

import { apiFetch, ErroApi } from './http.js';

const CHAVE_CACHE = 'consumidorPorEmail';

function lerCache() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_CACHE)) || {};
    } catch {
        return {};
    }
}

function gravarCache(email, consumidorId) {
    const cache = lerCache();
    cache[email] = consumidorId;
    localStorage.setItem(CHAVE_CACHE, JSON.stringify(cache));
}

/**
 * Cria o registro de cliente correspondente ao usuário do Firebase.
 *
 * Sobre a senha: a coluna cliente.senha é NOT NULL e existe no schema desde
 * antes do Firebase entrar no projeto. Como toda autenticação acontece no
 * Firebase e o backend não expõe nenhum endpoint de login, essa coluna nunca
 * é lida para autenticar ninguém. Gravamos um valor aleatório apenas para
 * satisfazer a restrição do banco.
 */
async function criarConsumidor(usuarioFirebase) {
    const nome = usuarioFirebase.displayName
        || usuarioFirebase.email.split('@')[0];

    return apiFetch('/consumidores', {
        method: 'POST',
        body: JSON.stringify({
            nome,
            email: usuarioFirebase.email,
            senha: `firebase-${crypto.randomUUID()}`,
        }),
    });
}

/**
 * Devolve o cliente_id do usuário autenticado, criando o registro na primeira
 * vez que ele aparece.
 *
 * @param {object} usuarioFirebase objeto User do Firebase Auth
 * @returns {Promise<number>} cliente_id no Postgres
 */
export async function resolverConsumidorId(usuarioFirebase) {
    if (!usuarioFirebase?.email) {
        throw new Error('Usuário sem e-mail: não é possível identificar o comprador.');
    }

    const email = usuarioFirebase.email;

    const emCache = lerCache()[email];
    if (emCache) return emCache;

    let consumidor;
    try {
        consumidor = await apiFetch(`/consumidores/email/${encodeURIComponent(email)}`);
    } catch (erro) {
        // 404 é esperado no primeiro pedido do usuário — qualquer outro erro sobe.
        if (!(erro instanceof ErroApi) || erro.status !== 404) throw erro;
        consumidor = await criarConsumidor(usuarioFirebase);
    }

    gravarCache(email, consumidor.id);
    return consumidor.id;
}

/** Limpa o cache — usar no logout para não vazar id entre contas. */
export function limparCacheConsumidor() {
    localStorage.removeItem(CHAVE_CACHE);
}
