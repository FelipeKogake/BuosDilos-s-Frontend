import { auth } from '../../autthentication/firebase-config.js';
import { onAuthStateChanged, updateProfile, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { registrarAcao } from '../../api/acoes.js';
import {
    obterPerfilExtra,
    atualizarPerfilExtra,
    adicionarCartao,
    removerCartao,
    tornarCartaoPrincipal,
    FOTOS_DISPONIVEIS,
} from '../../api/perfil.js';

// ===================== TEMAS =====================

const temas = {
    azul: {
        "--cor-fundo": "#DCEAF7",
        "--cor-painel": "#ffffff",
        "--cor-primaria": "#cccaf1",
        "--cor-botao-principal": "#BCC7EA",
        "--cor-botao-principal-hover": "#bfd4e8",
        "--cor-label": "#4a7fa5",
        "--cor-texto-titulo": "#111",
        "--cor-texto-secundario": "#555",
        "--cor-texto-terciario": "#888",
        "--cor-borda": "#ccc",
        "--cor-divisor": "#e0e0e0",
        "--cor-top-bar": "#a0b8d4",
        imagens: { avatar: "Assets/avatar-azul.png", favicon: "Assets/logo-azul.png" },
    },
    rosa: {
        "--cor-fundo": "#F9EBEB",
        "--cor-painel": "#ffffff",
        "--cor-primaria": "#F1CECE",
        "--cor-botao-principal": "#F1CECE",
        "--cor-botao-principal-hover": "#e6b2b2",
        "--cor-label": "#E3676b",
        "--cor-texto-titulo": "#111",
        "--cor-texto-secundario": "#ccc",
        "--cor-texto-terciario": "#888",
        "--cor-borda": "#cbc3c3",
        "--cor-divisor": "#cbc3c3",
        "--cor-top-bar": "#d4a0a0",
        imagens: { avatar: "Assets/avatar-rosa.png", favicon: "Assets/logo-rosa2.png" },
    },
};

function aplicarTema(nomeTema) {
    const tema = temas[nomeTema];
    if (!tema) return;
    const root = document.documentElement;
    Object.entries(tema).forEach(([prop, val]) => {
        if (prop !== "imagens") root.style.setProperty(prop, val);
    });
    const btnTemaImg = document.querySelector(".btn-tema img");
    const favicon = document.querySelector('#favicon');
    if (btnTemaImg) btnTemaImg.src = tema.imagens.avatar;
    if (favicon) favicon.href = tema.imagens.favicon;
    localStorage.setItem("tema", nomeTema);
}

function toggleTema() {
    const atual = localStorage.getItem("tema") || "azul";
    aplicarTema(atual === "azul" ? "rosa" : "azul");
}
registrarAcao('alternar-tema', toggleTema);

aplicarTema(localStorage.getItem("tema") || "azul");

// ===================== BTN TEMA (posição) =====================

function ajustarBtnTema() {
    const btn = document.querySelector(".btn-tema");
    const footer = document.querySelector(".footer");
    if (!btn || !footer) return;
    const footerTop = footer.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    btn.style.bottom =
        footerTop < windowHeight ? windowHeight - footerTop + 20 + "px" : "2rem";
}

window.addEventListener("scroll", ajustarBtnTema);
ajustarBtnTema();

// ===================== POPUPS =====================

function abrirPopup(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add("ativo");
    overlay.inert = false;
    document.body.style.overflow = "hidden";

    const box = overlay.querySelector(".popup-box");
    if (box) {
        if (!box.hasAttribute("tabindex")) box.setAttribute("tabindex", "-1");
        box.focus();
    }
}
registrarAcao('abrir-popup', (elemento) => abrirPopup(elemento.dataset.popup));

function fecharPopup(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove("ativo");
    overlay.inert = true;
    document.body.style.overflow = "";
}
registrarAcao('fechar-popup', (elemento) => fecharPopup(elemento.dataset.popup));

// Fecha ao clicar fora (no overlay, não no popup-box)
function fecharPopupOverlay(event, id) {
    if (event.target === document.getElementById(id)) {
        fecharPopup(id);
    }
}
registrarAcao('fechar-popup-fora', (elemento, evento) => {
    if (evento.target === elemento) fecharPopup(elemento.dataset.popup);
});

// Fecha qualquer popup aberto com ESC
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        document.querySelectorAll(".popup-overlay.ativo").forEach((overlay) => {
            overlay.classList.remove("ativo");
            overlay.inert = true;
        });
        document.body.style.overflow = "";
    }
});

// ===================== PERFIL =====================

let usuarioAtual  = null;
let cartaoParaExcluir = null;
let fotoSelecionadaTemp = null;

function formatarEndereco(endereco) {
    if (!endereco || !endereco.rua) {
        return { linha1: 'Endereço não cadastrado', linha2: '' };
    }
    return {
        linha1: endereco.rua,
        linha2: [endereco.cidade, endereco.estado, endereco.cep].filter(Boolean).join(', '),
    };
}

function criarCartaoElemento(cartao) {
    const div = document.createElement('div');
    div.className = 'cartao';
    div.innerHTML = `
        <div class="cartao-esquerda">
            <span class="cartao-bandeira">${cartao.bandeira}</span>
            <span class="cartao-numero">•••• •••• •••• ${cartao.ultimosDigitos}</span>
            <span class="cartao-nome">${cartao.nomeCartao}</span>
        </div>
        <div class="cartao-acoes">
            ${cartao.principal
                ? '<span class="cartao-tag">PRIMARY</span>'
                : '<button class="btn-tornar-primary" title="Tornar principal">Tornar primary</button>'}
            <button class="btn-excluir-cartao" title="Excluir cartão">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
            </button>
        </div>
    `;

    const btnPrimary = div.querySelector('.btn-tornar-primary');
    if (btnPrimary) {
        btnPrimary.addEventListener('click', () => {
            tornarCartaoPrincipal(usuarioAtual.uid, cartao.id);
            renderizarPerfil();
        });
    }

    div.querySelector('.btn-excluir-cartao').addEventListener('click', () => {
        cartaoParaExcluir = cartao.id;
        abrirPopup('popup-excluir-cartao');
    });

    return div;
}

function renderizarCartoes(cartoes) {
    const lista = document.querySelector('.cartoes-lista');
    const botaoAdicionar = lista.querySelector('.btn-adicionar-cartao');

    lista.querySelectorAll('.cartao').forEach(el => el.remove());
    lista.querySelector('.cartoes-vazio')?.remove();

    if (cartoes.length === 0) {
        const vazio = document.createElement('p');
        vazio.className = 'cartoes-vazio';
        vazio.textContent = 'Nenhum cartão cadastrado.';
        lista.insertBefore(vazio, botaoAdicionar);
        return;
    }

    cartoes.forEach(cartao => lista.insertBefore(criarCartaoElemento(cartao), botaoAdicionar));
}

function renderizarPerfil() {
    if (!usuarioAtual) return;
    const extra = obterPerfilExtra(usuarioAtual.uid);

    document.querySelector('.perfil-nome').textContent = usuarioAtual.displayName || 'Sem nome cadastrado';
    document.querySelector('.perfil-info').innerHTML = `
        <span>Idade: ${extra.idade ? extra.idade + ' anos' : 'não informada'}</span>
        <span>Telefone: ${extra.telefone || 'não informado'}</span>
        <span>Email: ${usuarioAtual.email || '-'}</span>
    `;

    if (extra.fotoPerfil) {
        const avatarImg = document.querySelector('.perfil-avatar img');
        if (avatarImg) avatarImg.src = extra.fotoPerfil;
    }

    const endereco = formatarEndereco(extra.endereco);
    document.querySelector('.endereco-linha1').textContent = endereco.linha1;
    document.querySelector('.endereco-linha2').textContent = endereco.linha2;

    renderizarCartoes(extra.cartoes);
}

// ---------- Editar Perfil ----------

function abrirEditarPerfil() {
    if (!usuarioAtual) return;
    const extra = obterPerfilExtra(usuarioAtual.uid);

    document.getElementById('input-editar-nome').value = usuarioAtual.displayName || '';
    document.getElementById('input-editar-idade').value = extra.idade ?? '';
    document.getElementById('input-editar-telefone').value = extra.telefone ?? '';
    document.getElementById('input-editar-email').value = usuarioAtual.email || '';

    abrirPopup('popup-editar');
}
registrarAcao('abrir-editar-perfil', abrirEditarPerfil);

async function salvarPerfil() {
    if (!usuarioAtual) return;

    const nome = document.getElementById('input-editar-nome').value.trim();
    const idade = document.getElementById('input-editar-idade').value.trim();
    const telefone = document.getElementById('input-editar-telefone').value.trim();

    try {
        if (nome && nome !== usuarioAtual.displayName) {
            await updateProfile(usuarioAtual, { displayName: nome });
        }
    } catch (error) {
        console.error('Erro ao atualizar nome:', error);
    }

    atualizarPerfilExtra(usuarioAtual.uid, {
        idade: idade ? Number(idade) : null,
        telefone: telefone || null,
    });

    renderizarPerfil();
    fecharPopup('popup-editar');
}
registrarAcao('salvar-perfil', salvarPerfil);

// ---------- Cartões ----------

function abrirAdicionarCartao() {
    document.getElementById('input-cartao-numero').value = '';
    document.getElementById('input-cartao-nome').value = '';
    document.getElementById('input-cartao-validade').value = '';
    document.getElementById('input-cartao-cvv').value = '';
    abrirPopup('popup-adicionar-cartao');
}
registrarAcao('abrir-adicionar-cartao', abrirAdicionarCartao);

function salvarNovoCartao() {
    if (!usuarioAtual) return;

    const numero = document.getElementById('input-cartao-numero').value.trim();
    const nomeCartao = document.getElementById('input-cartao-nome').value.trim();

    if (!numero || !nomeCartao) return;

    adicionarCartao(usuarioAtual.uid, { numero, nomeCartao });
    renderizarPerfil();
    fecharPopup('popup-adicionar-cartao');
}
registrarAcao('salvar-cartao', salvarNovoCartao);

function confirmarExclusaoCartao() {
    if (!usuarioAtual || !cartaoParaExcluir) return;
    removerCartao(usuarioAtual.uid, cartaoParaExcluir);
    cartaoParaExcluir = null;
    renderizarPerfil();
    fecharPopup('popup-excluir-cartao');
}
registrarAcao('confirmar-exclusao-cartao', confirmarExclusaoCartao);

// ---------- Endereço ----------

function abrirAlterarEndereco() {
    if (!usuarioAtual) return;
    const extra = obterPerfilExtra(usuarioAtual.uid);
    const endereco = extra.endereco || {};

    document.getElementById('input-endereco-rua').value = endereco.rua ?? '';
    document.getElementById('input-endereco-cidade').value = endereco.cidade ?? '';
    document.getElementById('input-endereco-estado').value = endereco.estado ?? '';
    document.getElementById('input-endereco-cep').value = endereco.cep ?? '';

    abrirPopup('popup-alterar-endereco');
}
registrarAcao('abrir-alterar-endereco', abrirAlterarEndereco);

function salvarEndereco() {
    if (!usuarioAtual) return;

    const rua = document.getElementById('input-endereco-rua').value.trim();
    const cidade = document.getElementById('input-endereco-cidade').value.trim();
    const estado = document.getElementById('input-endereco-estado').value.trim();
    const cep = document.getElementById('input-endereco-cep').value.trim();

    atualizarPerfilExtra(usuarioAtual.uid, {
        endereco: rua ? { rua, cidade, estado, cep } : null,
    });

    renderizarPerfil();
    fecharPopup('popup-alterar-endereco');
}
registrarAcao('salvar-endereco', salvarEndereco);

// ---------- Foto de perfil ----------

function abrirFotoPerfil() {
    if (!usuarioAtual) return;
    const extra = obterPerfilExtra(usuarioAtual.uid);
    fotoSelecionadaTemp = extra.fotoPerfil || null;

    const grid = document.getElementById('fotos-grid');
    grid.innerHTML = '';

    FOTOS_DISPONIVEIS.forEach(caminho => {
        const btn = document.createElement('button');
        btn.className = 'foto-opcao' + (caminho === fotoSelecionadaTemp ? ' selecionada' : '');
        btn.setAttribute('aria-label', 'Selecionar esta foto');
        btn.innerHTML = `<img src="${caminho}" alt="" />`;
        btn.addEventListener('click', () => {
            fotoSelecionadaTemp = caminho;
            grid.querySelectorAll('.foto-opcao').forEach(el => el.classList.remove('selecionada'));
            btn.classList.add('selecionada');
        });
        grid.appendChild(btn);
    });

    abrirPopup('popup-foto-perfil');
}
registrarAcao('abrir-foto-perfil', abrirFotoPerfil);

function salvarFotoPerfil() {
    if (!usuarioAtual || !fotoSelecionadaTemp) {
        fecharPopup('popup-foto-perfil');
        return;
    }
    atualizarPerfilExtra(usuarioAtual.uid, { fotoPerfil: fotoSelecionadaTemp });
    renderizarPerfil();
    fecharPopup('popup-foto-perfil');
}
registrarAcao('salvar-foto', salvarFotoPerfil);

// ---------- Sair da conta ----------

async function confirmarSaida() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Erro ao sair da conta:', error);
    }
    window.location.href = '../Login_Cadatro/login.html';
}
registrarAcao('confirmar-saida', confirmarSaida);

// ===================== INICIALIZAÇÃO =====================

onAuthStateChanged(auth, (usuario) => {
    if (!usuario) {
        window.location.replace('../Login_Cadatro/login.html');
        return;
    }
    usuarioAtual = usuario;
    renderizarPerfil();
});
