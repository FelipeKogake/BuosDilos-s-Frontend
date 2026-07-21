// ─────────────────────────────────────────────────────────────────────────────
// Dados extras de perfil (idade, telefone, endereço, cartões, foto) que o
// backend não guarda hoje — nome e e-mail continuam vindo do Firebase Auth.
// Fica no localStorage, por conta (chaveado pelo uid), então é esperado que
// não sincronize entre dispositivos e possa ser perdido se o navegador limpar
// os dados do site.
// ─────────────────────────────────────────────────────────────────────────────

const PREFIXO = 'perfilExtra_';

function chave(uid) {
    return `${PREFIXO}${uid}`;
}

function lerPerfilExtra(uid) {
    try {
        const bruto = localStorage.getItem(chave(uid));
        return bruto ? JSON.parse(bruto) : {};
    } catch {
        return {};
    }
}

function gravarPerfilExtra(uid, dados) {
    localStorage.setItem(chave(uid), JSON.stringify(dados));
}

export function obterPerfilExtra(uid) {
    const dados = lerPerfilExtra(uid);
    return {
        idade: dados.idade ?? null,
        telefone: dados.telefone ?? null,
        endereco: dados.endereco ?? null,
        cartoes: dados.cartoes ?? [],
        fotoPerfil: dados.fotoPerfil ?? null,
    };
}

export function atualizarPerfilExtra(uid, parcial) {
    const atual = lerPerfilExtra(uid);
    const novo = { ...atual, ...parcial };
    gravarPerfilExtra(uid, novo);
    return novo;
}

function detectarBandeira(numero) {
    const primeiroDigito = numero.replace(/\D/g, '')[0];
    if (primeiroDigito === '4') return 'VISA';
    if (primeiroDigito === '5') return 'MASTERCARD';
    if (primeiroDigito === '3') return 'AMEX';
    return 'CARTÃO';
}

/** Adiciona um cartão. Guarda só os últimos 4 dígitos, nunca o número completo. */
export function adicionarCartao(uid, { numero, nomeCartao }) {
    const atual = obterPerfilExtra(uid);
    const cartoes = atual.cartoes;
    const digitos = numero.replace(/\D/g, '');

    const novoCartao = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        bandeira: detectarBandeira(numero),
        ultimosDigitos: digitos.slice(-4) || '0000',
        nomeCartao: nomeCartao.trim().toUpperCase(),
        principal: cartoes.length === 0,
    };

    cartoes.push(novoCartao);
    atualizarPerfilExtra(uid, { cartoes });
    return novoCartao;
}

export function removerCartao(uid, cartaoId) {
    const atual = obterPerfilExtra(uid);
    const cartoes = atual.cartoes.filter(c => String(c.id) !== String(cartaoId));

    if (cartoes.length && !cartoes.some(c => c.principal)) {
        cartoes[0].principal = true;
    }

    atualizarPerfilExtra(uid, { cartoes });
    return cartoes;
}

export function tornarCartaoPrincipal(uid, cartaoId) {
    const atual = obterPerfilExtra(uid);
    const cartoes = atual.cartoes.map(c => ({ ...c, principal: String(c.id) === String(cartaoId) }));
    atualizarPerfilExtra(uid, { cartoes });
    return cartoes;
}

/** Fotos de personagens já usadas em Login/Cadastro, oferecidas como opção de avatar. */
export const FOTOS_DISPONIVEIS = [
    'Assets/login/personagem-azul.png',
    'Assets/login/personagem-rosa.png',
    'Assets/cadastro/personagem.png',
    'Assets/cadastro-feito/personagem-azul.png',
    'Assets/cadastro-feito/personagem-rosa.png',
    'Assets/codigo/personagem-azul.png',
    'Assets/codigo/personagem-rosa.png',
    'Assets/nova-senha/personagem-azul.png',
    'Assets/nova-senha/personagem-rosa.png',
    'Assets/recuperacao/personagem-azul.png',
    'Assets/recuperacao/personagem-rosa.png',
    'Assets/senha-alterada/personagem-azul.png',
    'Assets/senha-alterada/personagem-rosa.png',
];
