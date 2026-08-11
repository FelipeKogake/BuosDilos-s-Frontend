# `Login_Cadatro/` — Autenticação

As 7 telas do fluxo de conta, todas apoiadas no **Firebase Authentication**. O projeto não escreve nenhum código de autenticação próprio: não há hash de senha, não há sessão no servidor, não há endpoint de login no backend.

---

## As telas e o que cada uma chama no Firebase

| Tela | Função do Firebase | Papel |
|---|---|---|
| `login.html` | `signInWithEmailAndPassword` | Entrar |
| `cadastro.html` | `createUserWithEmailAndPassword` + `updateProfile` | Criar conta e gravar o nome |
| `cadastro-feito.html` | — | Confirmação |
| `recuperacao.html` | `sendPasswordResetEmail` | Pede o e-mail de recuperação |
| `codigo.html` | `verifyPasswordResetCode` | Valida o código do link |
| `nova-senha.html` | `confirmPasswordReset` | Grava a senha nova |
| `senha-alterada.html` | — | Confirmação |

---

## O fluxo de recuperação de senha

É o fluxo mais elaborado da pasta, e usa o mecanismo de **`oobCode`** do Firebase (*out-of-band code*):

```
recuperacao.html
    sendPasswordResetEmail(auth, email)
        ↓ Firebase envia e-mail com link contendo ?oobCode=...
codigo.html
    verifyPasswordResetCode(auth, codigo)   ← valida antes de deixar digitar
        ↓
nova-senha.html
    confirmPasswordReset(auth, codigo, senhaNova)
        ↓
senha-alterada.html
```

**Por que `verifyPasswordResetCode` existe como passo separado:** valida o código **antes** de o usuário digitar a senha nova. Sem essa checagem, ele preencheria o formulário inteiro para só então descobrir que o link expirou.

O `recuperacao.js` configura a URL de retorno do e-mail apontando para a página hospedada no GitHub Pages — é por isso que existe uma URL absoluta ali.

---

## Tradução de erros — `../autthentication/firebase-erros.js`

O Firebase devolve códigos como `auth/wrong-password`. Mostrá-los cru é ruim para o usuário e péssimo na rubrica, que cita "erros genéricos" como descritor de insuficiente.

```js
export function traduzirErroFirebase(codigo) {
    const erros = {
        'auth/email-already-in-use':    'Este email já está cadastrado.',
        'auth/invalid-email':           'Email inválido.',
        'auth/weak-password':           'A senha deve ter pelo menos 6 caracteres.',
        'auth/user-not-found':          'Email não encontrado.',
        'auth/wrong-password':          'Senha incorreta.',
        'auth/too-many-requests':       'Muitas tentativas. Tente novamente mais tarde.',
        'auth/network-request-failed':  'Erro de conexão. Verifique sua internet.',
        'auth/invalid-credential':      'Email ou senha incorretos.',
    };
    return erros[codigo] || 'Ocorreu um erro. Tente novamente.';
}
```

Um dicionário simples, com fallback. Toda tela do fluxo passa o erro por aqui antes de mostrar.

---

## Layout: por que o header e o rodapé são `position: fixed`

Todas as 7 páginas têm o mesmo esqueleto CSS:

```css
body {
    display: flex;         /* linha horizontal */
    overflow: hidden;
    min-height: 100vh;
}
.painel-login {
    flex: 0 0 480px;
    margin-left: 50vw;     /* empurra o painel para a direita */
    align-self: center;
}
```

O `<body>` é um **flex row**. Isso significa que qualquer elemento adicionado como filho direto vira um item da linha e **fica ao lado do painel**, não acima ou abaixo.

Foi exatamente o problema ao adicionar os landmarks `<header>` e `<footer>` que a Seção 4.1 exige. A solução em `CSS/auth-landmarks.css` usa `position: fixed`, tirando os dois do fluxo do flex — **a mesma estratégia que as imagens de fundo (`.bolhas`, `.personagem`) já usavam** nessas páginas.

O rodapé leva `pointer-events: none` para não bloquear cliques no painel, e some abaixo de 860px, onde o painel ocupa quase toda a tela.

---

## Detalhe: `nova-senha.js`, `cadastro-feito.js` e `senha-alterada.js` são scripts clássicos

Três dos sete JS **não** são módulos ES. Por isso não podem `import { registrarAcao }` de `../../api/acoes.js`.

Essas páginas têm uma **delegação local equivalente** no fim do arquivo:

```js
document.addEventListener('click', (evento) => {
    const elemento = evento.target.closest('[data-acao]');
    if (!elemento) return;
    switch (elemento.dataset.acao) {
        case 'alternar-tema':     toggleTema(); break;
        case 'voltar-para-login': voltarParaLogin(); break;
    }
});
```

Mesmo padrão, mesmo resultado — sem `onclick` inline e sem funções globais. A diferença é só que o registro é local em vez de compartilhado.

---

## O botão de mostrar senha

```js
function toggleSenha(inputId, btn) { ... }
```

Alterna o `type` do input entre `password` e `text` e troca o ícone. No HTML virou:

```html
<button type="button" class="btn-olho" data-acao="alternar-senha"
        data-campo="senha" aria-label="Mostrar senha">
```

O `data-campo` carrega qual input controlar — foi o que permitiu tirar o `onclick="toggleSenha('senha', this)"` sem perder o parâmetro.
