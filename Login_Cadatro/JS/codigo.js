import { auth } from '../../autthentication/firebase-config.js';
import { verifyPasswordResetCode, applyActionCode } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

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
            personagem: 'Assets/codigo/personagem-azul.png',
            estrelas: 'Assets/codigo/estrelas-azul.png',
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
            personagem: 'Assets/codigo/personagem-rosa.png',
            estrelas: 'Assets/codigo/estrelas-rosa.png',
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

const params = new URLSearchParams(window.location.search);
const mode = params.get('mode');
const oobCode = params.get('oobCode');

async function processarLink() {
    if (!mode || !oobCode) {
        mostrarStatus('Link inválido. Solicite um novo e-mail de recuperação.', 'erro');
        return;
    }

    switch (mode) {
        case 'resetPassword':
            try {
                await verifyPasswordResetCode(auth, oobCode);
                window.location.href = `nova-senha.html?oobCode=${oobCode}`;
            } catch {
                mostrarStatus('Link inválido ou expirado. Solicite um novo e-mail.', 'erro');
            }
            break;

        case 'verifyEmail':
            try {
                await applyActionCode(auth, oobCode);
                mostrarStatus('E-mail verificado com sucesso! Redirecionando...', 'sucesso');
                setTimeout(() => window.location.href = 'login.html', 2500);
            } catch {
                mostrarStatus('Link inválido ou já utilizado.', 'erro');
            }
            break;

        case 'recoverEmail':
            try {
                await applyActionCode(auth, oobCode);
                mostrarStatus('E-mail recuperado com sucesso! Redirecionando...', 'sucesso');
                setTimeout(() => window.location.href = 'login.html', 2500);
            } catch {
                mostrarStatus('Não foi possível recuperar o e-mail. Tente novamente.', 'erro');
            }
            break;

        default:
            mostrarStatus('Ação desconhecida. Verifique o link recebido.', 'erro');
    }
}

function mostrarStatus(mensagem, tipo = 'carregando') {
    const el = document.querySelector('.status-mensagem');
    if (!el) return;
    el.textContent = mensagem;
    el.className = `status-mensagem status--${tipo}`;
}

processarLink();

window.toggleTema = toggleTema;