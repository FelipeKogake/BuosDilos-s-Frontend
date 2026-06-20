import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// JS/produtos.js
// ─────────────────────────────────────────────────────────────────────────────
// Integração de produtos com backend REST + Supabase Storage para imagens.
// ─────────────────────────────────────────────────────────────────────────────

// ── Configuração ──────────────────────────────────────────────────────────────

const BASE_URL          = 'https://ecommerce-api-p2jw.onrender.com/api'; // ← ajuste para produção
const SUPABASE_URL      = 'https://aicybssjnwtbyaequbee.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uyPVsR2YGr6RpY2wz27Ixg_en3bQ8HD';
const BUCKET            = 'produtos';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Storage ───────────────────────────────────────────────────────────────────

/**
 * Faz upload de um File para thumbs/{nomeProduto}.ext
 * Retorna a URL pública. Retorna null se sem arquivo.
 */
async function uploadImagem(arquivo, nomeProduto) {
    if (!arquivo) return null;

    const ext          = arquivo.name.split('.').pop();
    const nomeArquivo  = nomeProduto.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const caminho      = `thumbs/${nomeArquivo}.${ext}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, arquivo, { contentType: arquivo.type, upsert: true });

    if (error) throw new Error(`Erro no upload: ${error.message}`);

    return supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
}

/** Remove imagem do Storage pela URL pública. Falha silenciosa. */
async function removerImagem(imageUrl) {
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

/** Faz fetch no backend e trata erros HTTP, devolvendo o JSON parseado. */
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

// ── API pública ───────────────────────────────────────────────────────────────

/** Lista todos os produtos. Retorna: Array<{ id, nome, preco, sku, ativo, image }> */
export async function listarProdutos() {
    return apiFetch('/produtos');
}

/** Busca um produto pelo ID. */
export async function buscarProduto(id) {
    return apiFetch(`/produtos/${id}`);
}

/**
 * Cria um novo produto.
 * Se `arquivo` for passado, faz upload em thumbs/{nome}.ext e usa a URL como `image`.
 * Caso contrário, usa `dados.image` (URL digitada manualmente).
 */
export async function criarProduto(dados, arquivo = null) {
    const imageUrl = await uploadImagem(arquivo, dados.nome);

    const payload = {
        nome:  dados.nome,
        preco: dados.preco,
        sku:   dados.sku,
        ativo: dados.ativo,
        image: imageUrl ?? dados.image ?? null,
    };

    return apiFetch('/produtos', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Atualiza um produto existente.
 * Se novo `arquivo` for enviado, faz upload, remove a imagem antiga e usa a nova URL.
 * Caso contrário, usa `dados.image` (URL editada manualmente no campo).
 */
export async function atualizarProduto(id, dados, arquivo = null, imageUrlAtual = null) {
    let imageUrl = dados.image ?? imageUrlAtual;

    console.log('dados.image:', dados.image);
    console.log('imageUrlAtual:', imageUrlAtual);
    console.log('imageUrl final:', imageUrl);

    if (arquivo) {
        const novaUrl = await uploadImagem(arquivo, dados.nome);
        await removerImagem(imageUrlAtual);
        imageUrl = novaUrl;
    }

    const payload = {
        nome:  dados.nome,
        preco: dados.preco,
        sku:   dados.sku,
        ativo: dados.ativo,
        image: imageUrl ?? null,
    };

    console.log('payload enviado:', JSON.stringify(payload)); // ← adiciona isso
    console.log('id:', id); // ← e isso

    return apiFetch(`/produtos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

/**
 * Inativa um produto via PATCH /produtos/{id}/inativar.
 * (Endpoint de ativar ainda não disponível)
 */
export async function inativarProduto(id) {
    return apiFetch(`/produtos/${id}/inativar`, { method: 'PATCH' });
}

/** Exclui um produto e remove sua imagem do Storage. */
export async function deletarProduto(id, imageUrl = null) {
    await apiFetch(`/produtos/${id}`, { method: 'DELETE' });
    await removerImagem(imageUrl);
}