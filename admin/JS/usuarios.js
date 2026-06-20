// JS/usuarios.js
// Consome o backend Node/Express que usa o Firebase Admin SDK
// (listar usuários do Auth não é possível direto do front-end, por segurança)

import { auth } from '../../autthentication/firebase-config.js';

// ⚠️ Trocar pela URL real do seu backend quando for pra produção
const API_BASE_URL = 'http://localhost:3001/api';

// Pega o token do usuário admin logado para autenticar as chamadas à API
async function obterToken() {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error('Nenhum admin autenticado');
    return await usuario.getIdToken();
}

async function chamarApi(caminho, opcoes = {}) {
    const token = await obterToken();

    const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
        ...opcoes,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(opcoes.headers || {}),
        },
    });

    if (!resposta.ok) {
        const erro = await resposta.json().catch(() => ({}));
        throw new Error(erro.erro || `Erro na requisição (${resposta.status})`);
    }

    return resposta.json();
}

export async function listarUsuarios(pageToken) {
    const query = pageToken ? `?pageToken=${pageToken}` : '';
    return chamarApi(`/usuarios${query}`);
}

export async function alterarStatusUsuario(uid, desabilitado) {
    return chamarApi(`/usuarios/${uid}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ desabilitado }),
    });
}

export async function deletarUsuario(uid) {
    return chamarApi(`/usuarios/${uid}`, { method: 'DELETE' });
}
