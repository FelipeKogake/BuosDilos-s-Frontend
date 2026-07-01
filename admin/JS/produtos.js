import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// JS/produtos.js
// ─────────────────────────────────────────────────────────────────────────────
// Integração de produtos com backend REST + Supabase Storage para imagens.
// Fotos gerenciadas via endpoint próprio /api/produtos/{id}/fotos
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL          = 'https://ecommerce-api-p2jw.onrender.com/api';
const SUPABASE_URL      = 'https://aicybssjnwtbyaequbee.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uyPVsR2YGr6RpY2wz27Ixg_en3bQ8HD';
const BUCKET            = 'produtos';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Storage ───────────────────────────────────────────────────────────────────

/**
 * Faz upload de um File para thumbs/{nomeProduto}-{lado}.ext
 * Retorna a URL pública.
 */
export async function uploadImagem(arquivo, nomeProduto, lado = '') {
    if (!arquivo) return null;

    const ext         = arquivo.name.split('.').pop();
    const nomeBase    = nomeProduto.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const sufixo      = lado ? `-${lado}` : '';
    const caminho     = `thumbs/${nomeBase}${sufixo}.${ext}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, arquivo, { contentType: arquivo.type, upsert: true });

    if (error) throw new Error(`Erro no upload: ${error.message}`);

    return supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
}

/** Remove imagem do Storage pela URL pública. Falha silenciosa. */
export async function removerImagem(imageUrl) {
    if (!imageUrl) return;
    try {
        const marcador = `/object/public/${BUCKET}/`;
        const idx      = imageUrl.indexOf(marcador);
        if (idx === -1) return;
        const caminho  = decodeURIComponent(imageUrl.slice(idx + marcador.length));
        await supabase.storage.from(BUCKET).remove([caminho]);
    } catch { /* ignora */ }
}

// ── Helpers internos ──────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
    const resposta = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });

    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => ({}));
        throw new Error(corpo.message || `Erro ${resposta.status}: ${resposta.statusText}`);
    }

    if (resposta.status === 204) return null;
    return resposta.json();
}

// ── Produtos ──────────────────────────────────────────────────────────────────

/** Lista todos os produtos. */
export async function listarProdutos() {
    return apiFetch('/produtos');
}

/** Busca um produto pelo ID. */
export async function buscarProduto(id) {
    return apiFetch(`/produtos/${id}`);
}

/** Cria um novo produto (sem imagem — foto é adicionada separadamente). */
export async function criarProduto(dados) {
    const payload = {
        nome:      dados.nome,
        preco:     dados.preco,
        sku:       dados.sku       || null,
        estoque:   dados.estoque   || null,
        categoria: dados.categoria || null,
        descricao: dados.descricao || null,
        ativo:     dados.ativo,
    };

    return apiFetch('/produtos', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/** Atualiza um produto existente (sem imagem). */
export async function atualizarProduto(id, dados) {
    const payload = {
        nome:      dados.nome,
        preco:     dados.preco,
        sku:       dados.sku       || null,
        estoque:   dados.estoque   || null,
        categoria: dados.categoria || null,
        descricao: dados.descricao || null,
        ativo:     dados.ativo,
    };

    return apiFetch(`/produtos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

/** Inativa um produto. */
export async function inativarProduto(id) {
    return apiFetch(`/produtos/${id}/inativar`, { method: 'PATCH' });
}

/** Exclui um produto. */
export async function deletarProduto(id) {
    return apiFetch(`/produtos/${id}`, { method: 'DELETE' });
}

// ── Fotos ─────────────────────────────────────────────────────────────────────

/**
 * Lista todas as fotos de um produto.
 * Retorna: Array<{ id, produtoId, fotoUrl, lado, ordem }>
 */
export async function listarFotos(produtoId) {
    return apiFetch(`/produtos/${produtoId}/fotos`);
}

/**
 * Adiciona uma foto a um produto.
 * Se `arquivo` for passado, faz upload no Supabase e usa a URL gerada.
 * Caso contrário, usa `fotoUrl` diretamente.
 */
export async function adicionarFoto(produtoId, { fotoUrl, arquivo, lado, ordem, nomeProduto }) {
    let url = fotoUrl;

    if (arquivo) {
        url = await uploadImagem(arquivo, nomeProduto, lado);
    }

    if (!url) throw new Error('É necessário uma URL ou arquivo de imagem');

    return apiFetch(`/produtos/${produtoId}/fotos`, {
        method: 'POST',
        body: JSON.stringify({ fotoUrl: url, lado, ordem }),
    });
}

/**
 * Atualiza uma foto existente (PATCH).
 */
export async function atualizarFoto(produtoId, fotoId, { fotoUrl, arquivo, lado, ordem, nomeProduto }) {
    let url = fotoUrl;

    if (arquivo) {
        url = await uploadImagem(arquivo, nomeProduto, lado);
    }

    return apiFetch(`/produtos/${produtoId}/fotos/${fotoId}`, {
        method: 'PATCH',
        body: JSON.stringify({ fotoUrl: url, lado, ordem }),
    });
}

/**
 * Remove uma foto do produto e apaga do Supabase Storage.
 */
export async function deletarFoto(produtoId, fotoId, fotoUrl) {
    await apiFetch(`/produtos/${produtoId}/fotos/${fotoId}`, { method: 'DELETE' });
    await removerImagem(fotoUrl);
}