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
            personagem: 'Assets/cadastro/personagem.png',
            baloes: 'Assets/cadastro/baloes-azul.png',
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
            personagem: 'Assets/cadastro/personagem.png',
            baloes: 'Assets/cadastro/baloes-rosa.png',
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

    document.querySelectorAll('.baloes').forEach(el => {
        el.src = tema.imagens.baloes;
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

const inputNome = document.getElementById('nome');
const inputEmail = document.getElementById('email');
const inputSenha = document.getElementById('senha');

function validarEmail() {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valor = inputEmail.value.trim();

    if (valor === '') {
        aplicarErro(inputEmail, 'Digite um email');
        return false;
    }

    if (!regex.test(valor)) {
        aplicarErro(inputEmail, 'Digite um email válido');
        return false;
    }

    removerErro(inputEmail);
    return true;
}

async function tentarCadastrar() {
    const nomeValido = inputNome.value.trim() !== '';
    const senhaValida = inputSenha.value.trim() !== '';
    const emailValido = validarEmail();

    if (!nomeValido) aplicarErro(inputNome, 'Digite seu nome');
    if (!senhaValida) aplicarErro(inputSenha, 'Digite uma senha');

    if (!nomeValido || !emailValido || !senhaValida) return;

    try {
        // await fetch('/api/cadastro', { method: 'POST', body: ... });
        window.location.href = 'cadastro-feito.html';
    } catch (error) {
        localStorage.setItem('popup', 'erro-cadastro');
        window.location.href = 'login.html';
    }
}

function aplicarErro(input, mensagem) {
    input.classList.add('input-erro');
    let msg = input.parentElement.querySelector('.msg-erro');
    if (!msg) {
        msg = document.createElement('span');
        msg.classList.add('msg-erro');
        msg.setAttribute('role', 'alert');
        input.parentElement.appendChild(msg);
    }
    msg.textContent = mensagem;
}

function removerErro(input) {
    input.classList.remove('input-erro');
    const msg = input.parentElement.querySelector('.msg-erro');
    if (msg) msg.remove();
}