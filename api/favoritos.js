// ─────────────────────────────────────────────────────────────────────────────
// Favoritos do usuário: lista de ids de produto guardada no localStorage.
// Não há endpoint de favoritos no backend — é um recurso 100% client-side.
// ─────────────────────────────────────────────────────────────────────────────

const CHAVE = 'favoritos';

function lerFavoritos() {
    try {
        const bruto = localStorage.getItem(CHAVE);
        return bruto ? JSON.parse(bruto) : [];
    } catch {
        return [];
    }
}

function gravarFavoritos(favoritos) {
    localStorage.setItem(CHAVE, JSON.stringify(favoritos));
}

export function obterFavoritos() {
    return lerFavoritos();
}

export function ehFavorito(id) {
    return lerFavoritos().some(favoritoId => String(favoritoId) === String(id));
}

/** Adiciona ou remove o produto dos favoritos. Retorna true se ele passou a ser favorito. */
export function alternarFavorito(id) {
    const favoritos = lerFavoritos();
    const indice = favoritos.findIndex(favoritoId => String(favoritoId) === String(id));

    if (indice === -1) {
        favoritos.push(id);
        gravarFavoritos(favoritos);
        return true;
    }

    favoritos.splice(indice, 1);
    gravarFavoritos(favoritos);
    return false;
}
