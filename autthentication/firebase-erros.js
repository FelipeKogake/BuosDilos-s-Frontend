// JS/firebase-erros.js
export function traduzirErroFirebase(codigo) {
    const erros = {
        'auth/email-already-in-use': 'Este email já está cadastrado.',
        'auth/invalid-email': 'Email inválido.',
        'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
        'auth/user-not-found': 'Email não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
        'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
        'auth/invalid-credential': 'Email ou senha incorretos.',
    };
    return erros[codigo] || 'Ocorreu um erro. Tente novamente.';
}