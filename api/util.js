// api/util.js
// ─────────────────────────────────────────────────────────────────────────────
// Utilidades pequenas e sem dependências, compartilhadas entre as telas.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adia a execução de `fn` até passarem `espera` ms sem novas chamadas.
 *
 * Usado na busca: sem isto, cada tecla digitada dispara um re-render completo
 * dos grids de resultado — em uma palavra de 8 letras são 8 reconstruções de
 * DOM, das quais só a última interessa.
 *
 * @param {Function} fn função a executar
 * @param {number} espera intervalo de silêncio em milissegundos
 */
export function debounce(fn, espera = 250) {
    let temporizador;

    return function (...argumentos) {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => fn.apply(this, argumentos), espera);
    };
}
