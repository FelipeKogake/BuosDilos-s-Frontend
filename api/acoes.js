// api/acoes.js
// ─────────────────────────────────────────────────────────────────────────────
// Registro de ações por delegação de eventos.
//
// Antes o projeto misturava dois estilos: `onclick="algumaCoisa()"` no HTML
// (que exige expor a função em `window`, furando o escopo de módulo) e
// `addEventListener` no JS. Aqui tudo passa a ser listener.
//
// Um único listener no `document` atende a página inteira, inclusive elementos
// criados depois — é o "event delegation" no lugar de um listener por botão.
//
// Uso no HTML:   <button data-acao="salvar-perfil">Salvar</button>
//                <button data-navegar="tela_perfil.html">Perfil</button>
//                <button data-acao="voltar">Voltar</button>
//
// Uso no JS:     registrarAcao('salvar-perfil', salvarPerfil);
// ─────────────────────────────────────────────────────────────────────────────

const acoes = new Map();

/**
 * Associa um nome de ação a um manipulador.
 * O manipulador recebe (elemento, evento) — o elemento é quem carrega o
 * data-acao, útil para ler outros data-* como data-popup ou data-campo.
 */
export function registrarAcao(nome, manipulador) {
    acoes.set(nome, manipulador);
}

// Ações genéricas, disponíveis em qualquer página que importe este módulo.
registrarAcao('voltar', () => history.back());

document.addEventListener('click', (evento) => {
    // Navegação simples: o botão só leva para outra página.
    const destino = evento.target.closest('[data-navegar]');
    if (destino) {
        window.location.href = destino.dataset.navegar;
        return;
    }

    const elemento = evento.target.closest('[data-acao]');
    if (!elemento) return;

    const manipulador = acoes.get(elemento.dataset.acao);
    if (!manipulador) return;

    // Sem preventDefault aqui de propósito: o comportamento anterior com
    // onclick também não bloqueava o padrão, e alguns manipuladores dependem
    // disso (ex.: botões dentro de formulário).
    manipulador(elemento, evento);
});
