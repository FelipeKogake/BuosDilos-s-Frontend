// JS/admin.js
import { auth } from '../../autthentication/firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

import {
    listarProdutos,
    buscarProduto,
    criarProduto,
    atualizarProduto,
    deletarProduto,
    inativarProduto,
} from './produtos.js';

import {
    listarUsuarios,
    alterarStatusUsuario,
    deletarUsuario,
} from './usuarios.js';

// ============================================
// PROTEÇÃO DE ROTA — só admin logado acessa
// ============================================
onAuthStateChanged(auth, (usuario) => {
    if (!usuario) window.location.replace('login.html');
});

document.getElementById('btn-sair').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'login.html';
});

// ============================================
// NAVEGAÇÃO ENTRE ABAS
// ============================================
const navItens = document.querySelectorAll('.nav-item');
const abas     = document.querySelectorAll('.aba');

navItens.forEach((item) => {
    item.addEventListener('click', () => {
        const abaAlvo = item.dataset.aba;

        navItens.forEach((i) => i.classList.remove('nav-item--ativo'));
        item.classList.add('nav-item--ativo');

        abas.forEach((aba) => {
            const estaAtiva = aba.id === `aba-${abaAlvo}`;
            aba.hidden = !estaAtiva;
            aba.classList.toggle('aba--ativa', estaAtiva);
        });

        if (abaAlvo === 'usuarios' && !usuariosCarregados) carregarUsuarios();
    });
});

// ============================================
// TOAST
// ============================================
function mostrarToast(mensagem, tipo = 'sucesso') {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo === 'erro' ? 'toast--erro' : ''}`;
    toast.innerHTML = `
        <i class="ti ti-${tipo === 'erro' ? 'alert-circle' : 'circle-check'}" aria-hidden="true"></i>
        <span>${mensagem}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ============================================
// MODAL DE CONFIRMAÇÃO (genérico)
// ============================================
const modalConfirmar   = document.getElementById('modal-confirmar');
const confirmarMensagem = document.getElementById('confirmar-mensagem');
const confirmarAceitar  = document.getElementById('confirmar-aceitar');
const confirmarCancelar = document.getElementById('confirmar-cancelar');

function pedirConfirmacao(mensagem) {
    return new Promise((resolve) => {
        confirmarMensagem.textContent = mensagem;
        modalConfirmar.hidden = false;

        function limpar(resultado) {
            modalConfirmar.hidden = true;
            confirmarAceitar.removeEventListener('click', aceitar);
            confirmarCancelar.removeEventListener('click', cancelar);
            resolve(resultado);
        }
        function aceitar() { limpar(true); }
        function cancelar() { limpar(false); }

        confirmarAceitar.addEventListener('click', aceitar);
        confirmarCancelar.addEventListener('click', cancelar);
    });
}

// ============================================
// PRODUTOS
// ============================================

let todosProdutos          = [];
let produtoEmEdicao        = null;
let arquivoImagemSelecionado = null;

const gridProdutos      = document.getElementById('grid-produtos');
const produtosCarregando = document.getElementById('produtos-estado-carregando');
const produtosVazio     = document.getElementById('produtos-estado-vazio');
const buscaProdutos     = document.getElementById('busca-produtos');
const filtroCategoria   = document.getElementById('filtro-categoria');

function separarProdutos(produtos) {
    return {
        ativos:   produtos.filter(p => p.ativo),
        inativos: produtos.filter(p => !p.ativo),
    };
}

async function carregarProdutos() {
    produtosCarregando.hidden = false;
    gridProdutos.hidden = true;
    produtosVazio.hidden = true;
    document.getElementById('grid-inativos').hidden = true;
    document.getElementById('inativos-estado-vazio').hidden = true;

    try {
        todosProdutos = await listarProdutos();
        const { ativos, inativos } = separarProdutos(todosProdutos);
        preencherFiltroCategorias(ativos);
        renderizarProdutos(ativos,   'grid-produtos', 'produtos-estado-vazio');
        renderizarProdutos(inativos, 'grid-inativos', 'inativos-estado-vazio');
    } catch (error) {
        mostrarToast('Erro ao carregar produtos', 'erro');
        console.error(error);
    } finally {
        produtosCarregando.hidden = true;
    }
}

function preencherFiltroCategorias(produtos) {
    const categorias = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))];
    filtroCategoria.innerHTML = '<option value="">Todas as categorias</option>';
    categorias.forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        filtroCategoria.appendChild(opt);
    });
}

function renderizarProdutos(produtos, gridId = 'grid-produtos', vazioId = 'produtos-estado-vazio') {
    const grid  = document.getElementById(gridId);
    const vazio = document.getElementById(vazioId);

    if (produtos.length === 0) {
        grid.hidden  = true;
        vazio.hidden = false;
        return;
    }

    vazio.hidden = true;
    grid.hidden  = false;

    grid.innerHTML = produtos.map((p) => `
        <article class="card-produto" data-id="${p.id}">
            <div class="card-produto-imagem">
                ${p.image
                    ? `<img src="${p.image}" alt="${p.nome}" loading="lazy" />`
                    : `<i class="ti ti-photo" aria-hidden="true"></i>`
                }
            </div>
            <div class="card-produto-corpo">
                <span class="card-produto-badge ${p.ativo ? 'card-produto-badge--ativo' : 'card-produto-badge--inativo'}">
                    ${p.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <p class="card-produto-nome">${p.nome}</p>
                ${p.categoria ? `<span class="card-produto-categoria">${p.categoria}</span>` : ''}
                <span class="card-produto-preco">R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="card-produto-acoes">
                <button class="btn-acao-editar" data-acao="editar">Editar</button>
                <button class="btn-acao-excluir" data-acao="excluir">Excluir</button>
            </div>
        </article>
    `).join('');
}

function filtrarProdutos() {
    const termo     = buscaProdutos.value.trim().toLowerCase();
    const categoria = filtroCategoria.value;
    const ativos    = todosProdutos.filter(p => p.ativo);

    const filtrados = ativos.filter((p) => {
        const bateTermo     = !termo     || p.nome.toLowerCase().includes(termo);
        const bateCategoria = !categoria || p.categoria === categoria;
        return bateTermo && bateCategoria;
    });

    renderizarProdutos(filtrados, 'grid-produtos', 'produtos-estado-vazio');
}

buscaProdutos.addEventListener('input', filtrarProdutos);
filtroCategoria.addEventListener('change', filtrarProdutos);

// Delegação de eventos nos cards
gridProdutos.addEventListener('click', async (e) => {
    const botao  = e.target.closest('button[data-acao]');
    if (!botao) return;

    const card   = botao.closest('.card-produto');
    const id     = card.dataset.id;
    const produto = todosProdutos.find((p) => String(p.id) === String(id));
    const acao   = botao.dataset.acao;

    if (acao === 'editar') {
        try {
            const produtoAtualizado = await buscarProduto(produto.id);
            abrirModalProduto(produtoAtualizado);
        } catch {
            mostrarToast('Erro ao carregar produto', 'erro');
        }
    }

    if (acao === 'excluir') {
        const confirmado = await pedirConfirmacao(`Excluir "${produto.nome}" permanentemente?`);
        if (!confirmado) return;
        try {
            await deletarProduto(id, produto.image);
            mostrarToast('Produto excluído');
            carregarProdutos();
        } catch {
            mostrarToast('Erro ao excluir produto', 'erro');
        }
    }
});

// ── Modal de produto ──────────────────────────────────────────────────────────

const modalProduto       = document.getElementById('modal-produto');
const modalProdutoTitulo = document.getElementById('modal-produto-titulo');
const formProduto        = document.getElementById('form-produto');
const inputProdutoId     = document.getElementById('produto-id');
const inputNome          = document.getElementById('produto-nome');
const inputSku           = document.getElementById('produto-sku');
const inputPreco         = document.getElementById('produto-preco');
const inputEstoque       = document.getElementById('produto-estoque');
const inputCategoria     = document.getElementById('produto-categoria');
const inputDescricao     = document.getElementById('produto-descricao');
const inputAtivo         = document.getElementById('produto-ativo');
const inputImagem        = document.getElementById('produto-imagem-input');
const inputImageUrl      = document.getElementById('produto-image-url');
const previewImagem      = document.getElementById('preview-imagem');
const uploadPlaceholder  = document.getElementById('upload-placeholder');
const uploadWrapper      = document.getElementById('upload-imagem-wrapper');
const btnSalvarProduto   = document.getElementById('modal-produto-salvar');
const btnToggleProduto   = document.getElementById('modal-produto-toggle');
const btnToggleTexto     = document.getElementById('modal-produto-toggle-texto');

function abrirModalProduto(produto = null) {
    produtoEmEdicao          = produto;
    arquivoImagemSelecionado = null;
    formProduto.reset();

    if (produto) {
        modalProdutoTitulo.textContent = 'Editar produto';
        btnToggleProduto.hidden        = false;
        btnToggleTexto.textContent     = produto.ativo ? 'Inativar' : 'Ativar';
        btnToggleProduto.querySelector('i').className = `ti ti-${produto.ativo ? 'eye-off' : 'eye'}`;

        inputProdutoId.value   = produto.id;
        inputNome.value        = produto.nome;
        inputSku.value         = produto.sku   || '';
        inputPreco.value       = produto.preco;
        inputEstoque.value     = produto.estoque || '';
        inputCategoria.value   = produto.categoria || '';
        inputDescricao.value   = produto.descricao || '';
        inputAtivo.checked     = produto.ativo;
        inputImageUrl.value    = produto.image || '';

        if (produto.image) {
            previewImagem.src    = produto.image;
            previewImagem.hidden = false;
            uploadPlaceholder.hidden = true;
        } else {
            previewImagem.hidden     = true;
            uploadPlaceholder.hidden = false;
        }
    } else {
        modalProdutoTitulo.textContent   = 'Novo produto';
        btnToggleProduto.hidden          = true;
        inputProdutoId.value             = '';
        inputAtivo.checked               = true;
        inputImageUrl.value              = '';
        previewImagem.hidden             = true;
        uploadPlaceholder.hidden         = false;
    }

    modalProduto.hidden = false;
}

function fecharModalProduto() {
    modalProduto.hidden      = true;
    produtoEmEdicao          = null;
    arquivoImagemSelecionado = null;
}

document.getElementById('btn-novo-produto').addEventListener('click', () => abrirModalProduto());
document.getElementById('modal-produto-fechar').addEventListener('click', fecharModalProduto);
document.getElementById('modal-produto-cancelar').addEventListener('click', fecharModalProduto);

btnToggleProduto.addEventListener('click', async () => {
    if (!produtoEmEdicao || !produtoEmEdicao.ativo) return;
    const confirmado = await pedirConfirmacao(`Inativar "${produtoEmEdicao.nome}"?`);
    if (!confirmado) return;
    try {
        await inativarProduto(produtoEmEdicao.id);
        mostrarToast('Produto inativado');
        fecharModalProduto();
        carregarProdutos();
    } catch {
        mostrarToast('Erro ao inativar produto', 'erro');
    }
});

// Upload de arquivo — atualiza preview e limpa campo de URL
uploadWrapper.addEventListener('click', () => inputImagem.click());

inputImagem.addEventListener('change', () => {
    const arquivo = inputImagem.files[0];
    if (!arquivo) return;

    arquivoImagemSelecionado = arquivo;
    inputImageUrl.value      = ''; // será substituída pela URL do Storage após salvar

    const leitor = new FileReader();
    leitor.onload = (e) => {
        previewImagem.src        = e.target.result;
        previewImagem.hidden     = false;
        uploadPlaceholder.hidden = true;
    };
    leitor.readAsDataURL(arquivo);
});

// Campo de URL — atualiza preview ao digitar
inputImageUrl.addEventListener('input', () => {
    const url = inputImageUrl.value.trim();
    if (url) {
        previewImagem.src        = url;
        previewImagem.hidden     = false;
        uploadPlaceholder.hidden = true;
        arquivoImagemSelecionado = null; // URL manual tem prioridade sobre arquivo
    } else {
        previewImagem.hidden     = true;
        uploadPlaceholder.hidden = false;
    }
});

formProduto.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dados = {
        nome:      inputNome.value.trim(),
        sku:       inputSku.value.trim() || null,
        preco:     parseFloat(inputPreco.value),
        estoque:   parseInt(inputEstoque.value, 10) || null,
        categoria: inputCategoria.value.trim() || null,
        descricao: inputDescricao.value.trim() || null,
        ativo:     inputAtivo.checked,
        image:     inputImageUrl.value.trim() || null,
    };

    if (!dados.nome) {
        aplicarErroCampo(inputNome, 'Digite o nome do produto');
        return;
    }

    btnSalvarProduto.disabled = true;
    btnSalvarProduto.querySelector('.btn-texto').hidden  = true;
    btnSalvarProduto.querySelector('.btn-spinner').hidden = false;

    try {
        if (produtoEmEdicao) {
            await atualizarProduto(produtoEmEdicao.id, dados, arquivoImagemSelecionado, produtoEmEdicao.image);
            mostrarToast('Produto atualizado com sucesso!');
        } else {
            await criarProduto(dados, arquivoImagemSelecionado);
            mostrarToast('Produto criado com sucesso!');
        }
        fecharModalProduto();
        carregarProdutos();
    } catch (error) {
        console.error(error);
        mostrarToast('Erro ao salvar produto', 'erro');
    } finally {
        btnSalvarProduto.disabled = false;
        btnSalvarProduto.querySelector('.btn-texto').hidden  = false;
        btnSalvarProduto.querySelector('.btn-spinner').hidden = true;
    }
});

function aplicarErroCampo(input, mensagem) {
    input.classList.add('input-erro');
    let msg = input.parentElement.querySelector('.msg-erro');
    if (!msg) {
        msg = document.createElement('span');
        msg.className = 'msg-erro';
        input.parentElement.appendChild(msg);
    }
    msg.textContent = mensagem;
    input.addEventListener('input', () => {
        input.classList.remove('input-erro');
        msg.remove();
    }, { once: true });
}

// ============================================
// USUÁRIOS
// ============================================

let todosUsuarios    = [];
let usuariosCarregados = false;

const usuariosCarregando     = document.getElementById('usuarios-estado-carregando');
const usuariosVazio          = document.getElementById('usuarios-estado-vazio');
const tabelaUsuariosWrapper  = document.getElementById('tabela-usuarios-wrapper');
const tabelaUsuariosCorpo    = document.getElementById('tabela-usuarios-corpo');
const buscaUsuarios          = document.getElementById('busca-usuarios');

async function carregarUsuarios() {
    usuariosCarregando.hidden    = false;
    tabelaUsuariosWrapper.hidden = true;
    usuariosVazio.hidden         = true;

    try {
        const resultado    = await listarUsuarios();
        todosUsuarios      = resultado.usuarios;
        usuariosCarregados = true;
        renderizarUsuarios(todosUsuarios);
    } catch (error) {
        console.error(error);
        mostrarToast('Erro ao carregar usuários — verifique se o backend está rodando', 'erro');
    } finally {
        usuariosCarregando.hidden = true;
    }
}

function formatarData(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function iniciaisNome(nome, email) {
    const base = nome && nome !== '—' ? nome : email;
    return base.slice(0, 2).toUpperCase();
}

function renderizarUsuarios(usuarios) {
    if (usuarios.length === 0) {
        tabelaUsuariosWrapper.hidden = true;
        usuariosVazio.hidden         = false;
        return;
    }

    usuariosVazio.hidden         = true;
    tabelaUsuariosWrapper.hidden = false;

    tabelaUsuariosCorpo.innerHTML = usuarios.map((u) => `
        <tr data-uid="${u.uid}">
            <td>
                <div class="usuario-cell">
                    <div class="usuario-avatar">
                        ${u.foto ? `<img src="${u.foto}" alt="" />` : iniciaisNome(u.nome, u.email)}
                    </div>
                    <span class="usuario-nome">${u.nome}</span>
                </div>
            </td>
            <td>${u.email}</td>
            <td>${formatarData(u.criadoEm)}</td>
            <td>${formatarData(u.ultimoLogin)}</td>
            <td>
                <span class="status-pill ${u.desabilitado ? 'status-pill--desabilitado' : 'status-pill--ativo'}">
                    ${u.desabilitado ? 'Desabilitado' : 'Ativo'}
                </span>
            </td>
            <td>
                <div class="tabela-acoes">
                    <button class="btn-icone btn-icone--neutro" data-acao="toggle-status" aria-label="${u.desabilitado ? 'Habilitar' : 'Desabilitar'} usuário">
                        <i class="ti ti-${u.desabilitado ? 'lock-open' : 'lock'}" aria-hidden="true"></i>
                    </button>
                    <button class="btn-icone" data-acao="excluir" aria-label="Excluir usuário">
                        <i class="ti ti-trash" aria-hidden="true"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

buscaUsuarios.addEventListener('input', () => {
    const termo    = buscaUsuarios.value.trim().toLowerCase();
    const filtrados = todosUsuarios.filter((u) =>
        u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)
    );
    renderizarUsuarios(filtrados);
});

document.getElementById('btn-atualizar-usuarios').addEventListener('click', carregarUsuarios);

tabelaUsuariosCorpo.addEventListener('click', async (e) => {
    const botao  = e.target.closest('button[data-acao]');
    if (!botao) return;

    const linha   = botao.closest('tr');
    const uid     = linha.dataset.uid;
    const usuario = todosUsuarios.find((u) => u.uid === uid);
    const acao    = botao.dataset.acao;

    if (acao === 'toggle-status') {
        try {
            await alterarStatusUsuario(uid, !usuario.desabilitado);
            mostrarToast(`Usuário ${!usuario.desabilitado ? 'desabilitado' : 'habilitado'}`);
            carregarUsuarios();
        } catch {
            mostrarToast('Erro ao atualizar usuário', 'erro');
        }
    }

    if (acao === 'excluir') {
        const confirmado = await pedirConfirmacao(`Excluir permanentemente "${usuario.nome}" (${usuario.email})?`);
        if (!confirmado) return;
        try {
            await deletarUsuario(uid);
            mostrarToast('Usuário excluído');
            carregarUsuarios();
        } catch {
            mostrarToast('Erro ao excluir usuário', 'erro');
        }
    }
});

// ============================================
// INICIALIZAÇÃO
// ============================================
carregarProdutos();