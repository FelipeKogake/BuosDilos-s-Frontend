// api/http.js
// ─────────────────────────────────────────────────────────────────────────────
// Ponto único de configuração e acesso à API REST.
//
// Antes o BASE_URL e o apiFetch viviam dentro de produtos.js. Com o checkout,
// o histórico de pedidos e as avaliações consumindo a mesma API, manter uma
// cópia em cada módulo significaria quatro lugares para trocar a URL.
// ─────────────────────────────────────────────────────────────────────────────

// Para desenvolver localmente, troque as duas linhas abaixo de lugar.
export const BASE_URL = 'https://ecommerce-api-p2jw.onrender.com/api';
// export const BASE_URL = 'http://localhost:2102/api';

/**
 * Erro de API que carrega o status HTTP, para quem chama poder distinguir
 * "não existe" (404) de uma falha real.
 */
export class ErroApi extends Error {
    constructor(mensagem, status) {
        super(mensagem);
        this.name = 'ErroApi';
        this.status = status;
    }
}

/**
 * Wrapper de fetch para a API. Lança ErroApi em respostas não-ok e devolve
 * null em 204 (No Content).
 */
export async function apiFetch(caminho, opcoes = {}) {
    const resposta = await fetch(`${BASE_URL}${caminho}`, {
        headers: { 'Content-Type': 'application/json', ...opcoes.headers },
        ...opcoes,
    });

    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => ({}));
        // O ManipuladorGlobalExcecoes do backend devolve o campo "mensagem";
        // "message" fica como reserva para erros que não passam por ele.
        const mensagem = corpo.mensagem || corpo.message
            || `Erro ${resposta.status}: ${resposta.statusText}`;
        throw new ErroApi(mensagem, resposta.status);
    }

    if (resposta.status === 204) return null;
    return resposta.json();
}
