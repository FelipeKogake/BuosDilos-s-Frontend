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
    listarFotos,
    adicionarFoto,
    deletarFoto,
} from './produtos.js';

import {
    listarUsuarios,
    alterarStatusUsuario,
    deletarUsuario,
} from './usuarios.js';

// ============================================
// PROTEÇÃO DE ROTA
// ============================================
onAuthStateChanged(auth, (usuario) => {
    if (!usuario) window.location.replace('login.html');
});

document.getElementById('btn-sair').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'login.html';
});

// ============================================
// NAVEGAÇÃO ENTRE ABAS (sidebar)
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
// MODAL DE CONFIRMAÇÃO
// ============================================
const modalConfirmar    = document.getElementById('modal-confirmar');
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
        function aceitar()  { limpar(true);  }
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

const gridProdutos       = document.getElementById('grid-produtos');
const produtosCarregando = document.getElementById('produtos-estado-carregando');
const produtosVazio      = document.getElementById('produtos-estado-vazio');
const buscaProdutos      = document.getElementById('busca-produtos');
const filtroCategoria    = document.getElementById('filtro-categoria');
const btnRecarregarProduto = document.getElementById('btn-recarregar-produto');

function separarProdutos(produtos) {
    return {
        ativos:   produtos.filter(p => p.ativo),
        inativos: produtos.filter(p => !p.ativo),
    };
}

async function carregarProdutos() {
    produtosCarregando.hidden = false;
    gridProdutos.hidden       = true;
    produtosVazio.hidden      = true;
    document.getElementById('grid-inativos').hidden          = true;
    document.getElementById('inativos-estado-vazio').hidden  = true;

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
    const categorias = [...new Set(produtos.map(p => p.categoria).filter(Boolean))];
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
                ${p.fotoUrl
                    ? `<img src="${p.fotoUrl}" alt="${p.nome}" loading="lazy" />`
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

gridProdutos.addEventListener('click', async (e) => {
    const botao   = e.target.closest('button[data-acao]');
    if (!botao) return;

    const card    = botao.closest('.card-produto');
    const id      = card.dataset.id;
    const produto = todosProdutos.find(p => String(p.id) === String(id));
    const acao    = botao.dataset.acao;

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
            await deletarProduto(id);
            mostrarToast('Produto excluído');
            carregarProdutos();
        } catch {
            mostrarToast('Erro ao excluir produto', 'erro');
        }
    }
});

btnRecarregarProduto.addEventListener('click', async (e) => {
    renderizarProdutos()
});

// ============================================
// MODAL PRODUTO — abas internas
// ============================================
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
const btnSalvarProduto   = document.getElementById('modal-produto-salvar');
const btnToggleProduto   = document.getElementById('modal-produto-toggle');
const btnToggleTexto     = document.getElementById('modal-produto-toggle-texto');
const tabFotos           = document.getElementById('tab-fotos');
const painelFotos        = document.getElementById('painel-fotos');

// Troca de abas dentro do modal
document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        if (tab.disabled) return;
        document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('modal-tab--ativa'));
        tab.classList.add('modal-tab--ativa');

        const painel = tab.dataset.tab;
        formProduto.hidden  = painel !== 'dados';
        painelFotos.hidden  = painel !== 'fotos';
        btnSalvarProduto.hidden = painel !== 'dados';

        if (painel === 'fotos' && produtoEmEdicao) carregarFotosProduto(produtoEmEdicao.id);
    });
});

function abrirModalProduto(produto = null) {
    produtoEmEdicao = produto;
    formProduto.reset();

    // Volta para aba de dados
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('modal-tab--ativa'));
    document.querySelector('.modal-tab[data-tab="dados"]').classList.add('modal-tab--ativa');
    formProduto.hidden  = false;
    painelFotos.hidden  = true;
    btnSalvarProduto.hidden = false;

    if (produto) {
        modalProdutoTitulo.textContent = 'Editar produto';
        btnToggleProduto.hidden        = false;
        btnToggleTexto.textContent     = produto.ativo ? 'Inativar' : 'Ativar';
        btnToggleProduto.querySelector('i').className = `ti ti-${produto.ativo ? 'eye-off' : 'eye'}`;
        tabFotos.disabled = false; // habilita aba de fotos só para produtos existentes

        inputProdutoId.value  = produto.id;
        inputNome.value       = produto.nome;
        inputSku.value        = produto.sku       || '';
        inputPreco.value      = produto.preco;
        inputEstoque.value    = produto.estoque   || '';
        inputCategoria.value  = produto.categoria || '';
        inputDescricao.value  = produto.descricao || '';
        inputAtivo.checked    = produto.ativo;
    } else {
        modalProdutoTitulo.textContent = 'Novo produto';
        btnToggleProduto.hidden        = true;
        tabFotos.disabled              = true; // fotos só depois de criar
        inputProdutoId.value           = '';
        inputAtivo.checked             = true;
    }

    modalProduto.hidden = false;
}

function fecharModalProduto() {
    modalProduto.hidden = true;
    produtoEmEdicao     = null;
    arquivoFotoSelecionado = null;
    resetarFormFoto();
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

formProduto.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dados = {
        nome:      inputNome.value.trim(),
        sku:       inputSku.value.trim()      || null,
        preco:     parseFloat(inputPreco.value),
        estoque:   parseInt(inputEstoque.value, 10) || null,
        categoria: inputCategoria.value.trim() || null,
        descricao: inputDescricao.value.trim() || null,
        ativo:     inputAtivo.checked,
    };

    if (!dados.nome) {
        aplicarErroCampo(inputNome, 'Digite o nome do produto');
        return;
    }

    btnSalvarProduto.disabled = true;
    btnSalvarProduto.querySelector('.btn-texto').hidden   = true;
    btnSalvarProduto.querySelector('.btn-spinner').hidden = false;

    try {
        if (produtoEmEdicao) {
            await atualizarProduto(produtoEmEdicao.id, dados);
            mostrarToast('Produto atualizado!');
        } else {
            const novoProduto = await criarProduto(dados);
            mostrarToast('Produto criado! Agora adicione as fotos na aba Fotos.');
            // Abre o modal no produto recém criado com aba de fotos disponível
            const produtoCriado = await buscarProduto(novoProduto.id);
            fecharModalProduto();
            abrirModalProduto(produtoCriado);
            // Muda automaticamente para aba de fotos
            document.querySelector('.modal-tab[data-tab="fotos"]').click();
            return;
        }
        fecharModalProduto();
        carregarProdutos();
    } catch (error) {
        console.error(error);
        mostrarToast('Erro ao salvar produto', 'erro');
    } finally {
        btnSalvarProduto.disabled = false;
        btnSalvarProduto.querySelector('.btn-texto').hidden   = false;
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
// FOTOS
// ============================================
let fotosDoProduto         = [];
let arquivoFotoSelecionado = null;

const fotosGrid          = document.getElementById('fotos-grid');
const inputFotoArquivo   = document.getElementById('foto-arquivo-input');
const inputFotoUrl       = document.getElementById('foto-url');
const inputFotoLado      = document.getElementById('foto-lado');
const inputFotoOrdem     = document.getElementById('foto-ordem');
const previewFoto        = document.getElementById('preview-foto');
const uploadFotoWrapper  = document.getElementById('upload-foto-wrapper');
const uploadFotoPlaceholder = document.getElementById('upload-foto-placeholder');
const btnAdicionarFoto   = document.getElementById('btn-adicionar-foto');

const LADOS = ['caixa', 'frontal', 'direita', 'esquerda', 'traseira'];
const LABEL_LADO = {
    caixa:     'Caixa (principal)',
    frontal:   'Frontal',
    direita:   'Direita',
    esquerda:  'Esquerda',
    traseira:  'Traseira',
};

async function carregarFotosProduto(produtoId) {
    fotosGrid.innerHTML = '<p style="color:#aaa;font-size:0.85rem">Carregando fotos...</p>';
    try {
        fotosDoProduto = await listarFotos(produtoId);
        renderizarFotos();
    } catch {
        fotosGrid.innerHTML = '<p style="color:var(--cor-erro);font-size:0.85rem">Erro ao carregar fotos.</p>';
    }
}

function renderizarFotos() {
    if (fotosDoProduto.length === 0) {
        fotosGrid.innerHTML = '<p style="color:#aaa;font-size:0.85rem">Nenhuma foto adicionada ainda.</p>';
        return;
    }

    fotosGrid.innerHTML = fotosDoProduto
        .sort((a, b) => a.ordem - b.ordem)
        .map(foto => `
            <div class="foto-card" data-foto-id="${foto.id}">
                <img src="${foto.fotoUrl}" alt="${foto.lado}" />
                <div class="foto-card-info">
                    <span class="foto-card-lado">${LABEL_LADO[foto.lado] || foto.lado}</span>
                    <span class="foto-card-ordem">Ordem ${foto.ordem}</span>
                </div>
                <button class="foto-card-remover" data-acao="remover-foto" aria-label="Remover foto">
                    <i class="ti ti-trash"></i>
                </button>
            </div>
        `).join('');
}

// Delegação para remover foto
fotosGrid.addEventListener('click', async (e) => {
    const botao = e.target.closest('[data-acao="remover-foto"]');
    if (!botao) return;

    const card   = botao.closest('.foto-card');
    const fotoId = card.dataset.fotoId;
    const foto   = fotosDoProduto.find(f => String(f.id) === String(fotoId));

    const confirmado = await pedirConfirmacao(`Remover foto "${LABEL_LADO[foto.lado] || foto.lado}"?`);
    if (!confirmado) return;

    try {
        await deletarFoto(produtoEmEdicao.id, fotoId, foto.fotoUrl);
        mostrarToast('Foto removida');
        fotosDoProduto = fotosDoProduto.filter(f => String(f.id) !== String(fotoId));
        renderizarFotos();
        carregarProdutos(); // atualiza card no grid
    } catch {
        mostrarToast('Erro ao remover foto', 'erro');
    }
});

// Upload de arquivo
uploadFotoWrapper.addEventListener('click', () => inputFotoArquivo.click());

inputFotoArquivo.addEventListener('change', () => {
    const arquivo = inputFotoArquivo.files[0];
    if (!arquivo) return;

    arquivoFotoSelecionado = arquivo;
    inputFotoUrl.value     = '';

    const leitor = new FileReader();
    leitor.onload = (e) => {
        previewFoto.src             = e.target.result;
        previewFoto.hidden          = false;
        uploadFotoPlaceholder.hidden = true;
    };
    leitor.readAsDataURL(arquivo);
});

// URL manual
inputFotoUrl.addEventListener('input', () => {
    const url = inputFotoUrl.value.trim();
    if (url) {
        previewFoto.src              = url;
        previewFoto.hidden           = false;
        uploadFotoPlaceholder.hidden = true;
        arquivoFotoSelecionado       = null;
    } else {
        previewFoto.hidden           = true;
        uploadFotoPlaceholder.hidden = false;
    }
});

btnAdicionarFoto.addEventListener('click', async () => {
    const fotoUrl = inputFotoUrl.value.trim();
    const lado    = inputFotoLado.value;
    const ordem   = parseInt(inputFotoOrdem.value, 10) || 1;

    if (!arquivoFotoSelecionado && !fotoUrl) {
        mostrarToast('Selecione um arquivo ou cole uma URL', 'erro');
        return;
    }

    btnAdicionarFoto.disabled = true;
    btnAdicionarFoto.querySelector('.btn-texto').hidden   = true;
    btnAdicionarFoto.querySelector('.btn-spinner').hidden = false;

    try {
        await adicionarFoto(produtoEmEdicao.id, {
            fotoUrl,
            arquivo:     arquivoFotoSelecionado,
            lado,
            ordem,
            nomeProduto: produtoEmEdicao.nome,
        });
        mostrarToast('Foto adicionada!');
        resetarFormFoto();
        await carregarFotosProduto(produtoEmEdicao.id);
        carregarProdutos();
    } catch (error) {
        console.error(error);
        mostrarToast('Erro ao adicionar foto', 'erro');
    } finally {
        btnAdicionarFoto.disabled = false;
        btnAdicionarFoto.querySelector('.btn-texto').hidden   = false;
        btnAdicionarFoto.querySelector('.btn-spinner').hidden = true;
    }
});

function resetarFormFoto() {
    arquivoFotoSelecionado       = null;
    inputFotoArquivo.value       = '';
    inputFotoUrl.value           = '';
    inputFotoLado.value          = 'caixa';
    inputFotoOrdem.value         = '1';
    previewFoto.hidden           = true;
    uploadFotoPlaceholder.hidden = false;
}

// ============================================
// USUÁRIOS
// ============================================
let todosUsuarios     = [];
let usuariosCarregados = false;

const usuariosCarregando    = document.getElementById('usuarios-estado-carregando');
const usuariosVazio         = document.getElementById('usuarios-estado-vazio');
const tabelaUsuariosWrapper = document.getElementById('tabela-usuarios-wrapper');
const tabelaUsuariosCorpo   = document.getElementById('tabela-usuarios-corpo');
const buscaUsuarios         = document.getElementById('busca-usuarios');

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
        mostrarToast('Erro ao carregar usuários', 'erro');
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
    const termo     = buscaUsuarios.value.trim().toLowerCase();
    const filtrados = todosUsuarios.filter(u =>
        u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)
    );
    renderizarUsuarios(filtrados);
});

document.getElementById('btn-atualizar-usuarios').addEventListener('click', carregarUsuarios);

tabelaUsuariosCorpo.addEventListener('click', async (e) => {
    const botao   = e.target.closest('button[data-acao]');
    if (!botao) return;

    const linha   = botao.closest('tr');
    const uid     = linha.dataset.uid;
    const usuario = todosUsuarios.find(u => u.uid === uid);
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