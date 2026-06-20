import { auth, db } from '../../autthentication/firebase-config.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { traduzirErroFirebase } from '../../autthentication/firebase-erros.js';

history.pushState(null, null, location.href);
history.replaceState(null, null, location.href);

window.addEventListener('popstate', () => {
    history.pushState(null, null, location.href);
    history.replaceState(null, null, location.href);
});

const temas = {
    azul: {
        '--cor-fundo': '#DCEAF7',
        '--cor-painel': '#ffffff',
        '--cor-primaria': '#b0aed4',
        '--cor-primaria-hover': '#7b78b0',
        '--cor-label': '#4a7fa5',
        '--cor-input-fundo': '#f0f0f0',
        '--cor-input-texto': '#aaa',
        '--cor-texto-titulo': '#111',
        '--cor-texto-secundario': '#555',
        '--cor-texto-terciario': '#888',
        '--cor-borda': '#ccc',
        '--cor-divisor': '#e0e0e0',
        '--sombra-painel': '6px 6px 20px rgba(0, 9, 169, 0.4)',
        '--sombra-input': '0 2px 8px rgba(0, 0, 0, 0.4)',
        '--cor-sombra-inicio': '#BFD7EE',
        '--cor-sombra-fim': '#DCEAF7',
        imagens: {
            personagem: 'Assets/login/personagem-azul.png',
            bolhas: 'Assets/login/bolhas-azul.png',
            avatar: 'Assets/avatar-azul.png',
        }
    },
    rosa: {
        '--cor-fundo': '#F9EBEB',
        '--cor-painel': '#ffffff',
        '--cor-primaria': '#F1CECE',
        '--cor-primaria-hover': '#d4b6b6',
        '--cor-label': '#E3676b',
        '--cor-input-fundo': '#f0f0f0',
        '--cor-input-texto': '#aaa',
        '--cor-texto-titulo': '#111',
        '--cor-texto-secundario': '#ccc',
        '--cor-texto-terciario': '#888',
        '--cor-borda': '#444',
        '--cor-divisor': '#333',
        '--sombra-painel': '6px 6px 20px rgba(243, 162, 162, 0.6)',
        '--sombra-input': '0 2px 8px rgba(0, 0, 0, 0.6)',
        '--cor-sombra-inicio': '#F1CECE',
        '--cor-sombra-fim': '#F9EBEB',
        imagens: {
            personagem: 'Assets/login/personagem-rosa.png',
            bolhas: 'Assets/login/bolhas-rosa.png',
            avatar: 'Assets/avatar-rosa.png',
        }
    }
};

function aplicarTema(nomeTema) {
    const tema = temas[nomeTema];
    if (!tema) return;

    const root = document.documentElement;
    Object.entries(tema).forEach(([propriedade, valor]) => {
        if (propriedade !== 'imagens') {
            root.style.setProperty(propriedade, valor);
        }
    });

    document.querySelectorAll('.bolhas').forEach(el => {
        el.src = tema.imagens.bolhas;
    });
    document.querySelector('.personagemImg').src = tema.imagens.personagem;
    document.querySelector('.btn-tema img').src = tema.imagens.avatar;

    localStorage.setItem('tema', nomeTema);
}

function toggleTema() {
    const atual = localStorage.getItem('tema') || 'azul';
    const proximo = atual === 'azul' ? 'rosa' : 'azul';
    aplicarTema(proximo);
}

const temaSalvo = localStorage.getItem('tema') || 'azul';
aplicarTema(temaSalvo);

const inputEmail = document.getElementById('email');
const inputSenha = document.getElementById('senha');

inputEmail.addEventListener('blur', () => validarEmail());

inputEmail.addEventListener('input', () => {
    if (inputEmail.classList.contains('input-erro')) validarEmail();
});

inputSenha.addEventListener('input', () => {
    if (inputSenha.classList.contains('input-erro') && inputSenha.value.trim() !== '') {
        removerErro(inputSenha);
    }
});

function mostrarPopup(mensagem, tipo = 'sucesso') {
    const popup = document.createElement('div');
    popup.classList.add('popup', `popup--${tipo}`);
    popup.setAttribute('role', 'alert');
    popup.innerHTML = `
        <div class="popup-conteudo">
            <span class="popup-mensagem">${mensagem}</span>
            <button class="popup-fechar" aria-label="Fechar">✕</button>
        </div>
        <div class="popup-barra"></div>
    `;

    popup.querySelector('.popup-fechar').addEventListener('click', () => fecharPopup(popup));
    document.body.appendChild(popup);
    setTimeout(() => fecharPopup(popup), 4000);
}

function fecharPopup(popup) {
    popup.classList.add('popup--saindo');
    popup.addEventListener('animationend', () => popup.remove(), { once: true });
}

const popupFlag = localStorage.getItem('popup');
if (popupFlag === 'senha-alterada') {
    localStorage.removeItem('popup');
    mostrarPopup('Senha alterada com sucesso!');
} else if (popupFlag === 'erro-senha') {
    localStorage.removeItem('popup');
    mostrarPopup('Erro ao alterar a senha. Tente novamente.', 'erro');
} else if (popupFlag === 'cadastro-feito') {
    localStorage.removeItem('popup');
    mostrarPopup('Conta já disponível.');
} else if (popupFlag === 'erro-cadastro') {
    localStorage.removeItem('popup');
    mostrarPopup('Erro ao realizar cadastro. Tente novamente.', 'erro');
}

function validarEmail() {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valor = inputEmail.value.trim();

    if (valor === '') { removerErro(inputEmail); return; }

    if (!regex.test(valor)) {
        aplicarErro(inputEmail, 'Digite um e-mail válido');
    } else {
        removerErro(inputEmail);
        return true;
    }
}

function aplicarErro(input, mensagem) {
    input.classList.add('input-erro');

    const campo = input.closest('.campo');
    let msg = campo.querySelector('.msg-erro');
    if (!msg) {
        msg = document.createElement('span');
        msg.classList.add('msg-erro');
        msg.setAttribute('role', 'alert');

        const esqueceu = campo.querySelector('.esqueceu');
        const wrapper = campo.querySelector('.input-wrapper');

        if (esqueceu) {
            campo.insertBefore(msg, esqueceu);
        } else if (wrapper) {
            wrapper.insertAdjacentElement('afterend', msg);
        } else {
            input.insertAdjacentElement('afterend', msg);
        }
    }
    msg.textContent = mensagem;
}

function removerErro(input) {
    input.classList.remove('input-erro');
    const campo = input.closest('.campo');
    const msg = campo.querySelector('.msg-erro');
    if (msg) msg.remove();
}

function validarCampoObrigatorio(input, mensagem) {
    if (input.value.trim() === '') {
        aplicarErro(input, mensagem);
        return false;
    }
    return true;
}

async function tentarLogin(e) {
    e.preventDefault();

    const emailValido = validarCampoObrigatorio(inputEmail, 'Digite seu e-mail') && validarEmail();
    const senhaValida = validarCampoObrigatorio(inputSenha, 'Digite sua senha');
    if (!emailValido || !senhaValida) return;

    try {
        const credencial = await signInWithEmailAndPassword(auth, inputEmail.value.trim(), inputSenha.value);

        // Verifica se é admin no Firestore
        const snap = await getDoc(doc(db, 'admins', credencial.user.uid));

        if (snap.exists()) {
            window.location.href = '/BuosDilos-s-Frontend/admin/admin.html'; // redireciona para painel admin
        } else {
            window.location.href = ''; // redireciona para área comum
            mostrarPopup('Login realizado com sucesso!', 'sucesso');
        }

    } catch (error) {
        console.log(error);
        mostrarPopup(traduzirErroFirebase(error.code), 'erro');
    }
}

function toggleSenha(inputId, btn) {
    const input = document.getElementById(inputId);
    const visivel = input.type === 'text';

    input.type = visivel ? 'password' : 'text';
    btn.innerHTML = visivel ? '&#xf06e;' : '&#xf070;';
    btn.setAttribute('aria-label', visivel ? 'Mostrar senha' : 'Esconder senha');
}

// ← expõe as funções para os onclick do HTML
window.toggleTema = toggleTema;
window.tentarLogin = tentarLogin;
window.toggleSenha = toggleSenha;