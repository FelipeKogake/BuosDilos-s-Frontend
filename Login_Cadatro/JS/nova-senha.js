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
            personagem: 'Assets/nova-senha/personagem-azul.png',
            estrelas: 'Assets/nova-senha/estrelas-azul.png',
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
            personagem: 'Assets/nova-senha/personagem-rosa.png',
            estrelas: 'Assets/nova-senha/estrelas-rosa.png',
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

    document.querySelectorAll('.estrelas').forEach(el => {
        el.src = tema.imagens.estrelas;
    });
    document.querySelector('.personagem img').src = tema.imagens.personagem;
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

const inputSenhaNova = document.getElementById('senha-nova');
const inputConfirmaSenha = document.getElementById('confirma-senha');

async function tentarAlterar() {
    const senhaValida = validarCampoObrigatorio(inputSenhaNova, 'Digite sua nova senha');
    const confirmaValida = validarCampoObrigatorio(inputConfirmaSenha, 'Confirme sua senha');

    if (!senhaValida || !confirmaValida) return;

    if (inputSenhaNova.value !== inputConfirmaSenha.value) {
        aplicarErroInput(inputConfirmaSenha, 'As senhas não coincidem');
        return;
    }

    try {
        window.location.href = 'senha-alterada.html';
    } catch (error) {
        localStorage.setItem('popup', 'erro-senha');
        window.location.href = 'login.html';
    }
}

function validarCampoObrigatorio(input, mensagem) {
    if (input.value.trim() === '') {
        aplicarErroInput(input, mensagem);
        return false;
    }
    removerErro(input);
    return true;
}

function aplicarErroInput(input, mensagem) {
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

// limpa erro ao digitar
inputSenhaNova.addEventListener('input', () => {
    if (inputSenhaNova.classList.contains('input-erro') && inputSenhaNova.value.trim() !== '') {
        removerErro(inputSenhaNova);
    }
});

inputConfirmaSenha.addEventListener('input', () => {
    if (inputConfirmaSenha.classList.contains('input-erro') && inputConfirmaSenha.value.trim() !== '') {
        removerErro(inputConfirmaSenha);
    }
});

function aplicarErroInput(input, mensagem) {
    input.classList.add('input-erro');
    
    const campo = input.closest('.campo');
    let msg = campo.querySelector('.msg-erro');
    if (!msg) {
        msg = document.createElement('span');
        msg.classList.add('msg-erro');
        msg.setAttribute('role', 'alert');

        const wrapper = campo.querySelector('.input-wrapper');
        wrapper.insertAdjacentElement('afterend', msg);  // ← insere depois do wrapper
    }
    msg.textContent = mensagem;
}

function removerErro(input) {
    input.classList.remove('input-erro');
    const campo = input.closest('.campo');
    const msg = campo.querySelector('.msg-erro');
    if (msg) msg.remove();
}

function toggleSenha(inputId, btn) {
    const input1 = document.getElementById('senha-nova');
    const input2 = document.getElementById('confirma-senha');
    const btns = document.querySelectorAll('.btn-olho');

    const visivel = input1.type === 'text';

    input1.type = visivel ? 'password' : 'text';
    input2.type = visivel ? 'password' : 'text';

    btns.forEach(b => {
        b.innerHTML = visivel ? '&#xf06e;' : '&#xf070;';
        b.setAttribute('aria-label', visivel ? 'Mostrar senha' : 'Esconder senha');
    });
}