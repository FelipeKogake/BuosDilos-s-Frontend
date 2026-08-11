# `autthentication/` — Configuração do Firebase

Dois arquivos pequenos, mas importados por praticamente toda tela que precisa saber quem é o usuário.

> **Sobre o nome da pasta:** `autthentication` tem um `t` a mais. É erro de digitação original, mantido porque renomear quebraria os `import` de 12 arquivos. Fica registrado para ninguém achar que é proposital.

---

## `firebase-config.js`

```js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth }       from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "...", ... };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

**Uma única instância de `auth`, exportada.** Todo o resto do projeto importa daqui:

```js
import { auth } from '../../autthentication/firebase-config.js';
```

Isso garante que login, logout e `onAuthStateChanged` conversem com a mesma instância. Se cada tela chamasse `initializeApp` por conta própria, o Firebase avisaria sobre inicialização duplicada e o estado de sessão poderia divergir.

### Sobre a `apiKey` estar no código

**É esperado e não é vazamento.** A `apiKey` do Firebase não é um segredo: ela identifica o projeto, não autoriza nada. O próprio Google documenta que ela pode ficar no cliente.

A segurança real vem de:
- **Security Rules** no Firestore/Storage (lado do servidor)
- **Domínios autorizados** no console do Firebase — só as origens listadas conseguem autenticar

O que seria vazamento é a *service account key* do Firebase Admin SDK, que **não está em nenhum lugar deste repositório**.

### Por que importar por URL de CDN

O projeto não tem build step nem `node_modules`. Os módulos ES do navegador aceitam importar de URL absoluta, então o SDK é baixado direto do `gstatic.com`. É o que permite o "vanilla JS sem bundler" exigido pela Seção 4.1 do projeto continuar valendo mesmo usando bibliotecas de terceiros.

---

## `firebase-erros.js`

Dicionário que traduz códigos do Firebase para português:

```js
export function traduzirErroFirebase(codigo) {
    const erros = {
        'auth/email-already-in-use':   'Este email já está cadastrado.',
        'auth/wrong-password':         'Senha incorreta.',
        'auth/too-many-requests':      'Muitas tentativas. Tente novamente mais tarde.',
        'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
        ...
    };
    return erros[codigo] || 'Ocorreu um erro. Tente novamente.';
}
```

**Por que existe:** o Firebase devolve `auth/wrong-password`. Mostrar isso ao usuário é ruim de usabilidade e cai direto no descritor de insuficiente da rubrica ("erros genéricos"). O `||` no fim garante que um código não previsto ainda produza uma mensagem legível em vez de `undefined`.

Todas as sete telas de `Login_Cadatro/` passam o erro por aqui antes de exibir.

---

## Quem usa este módulo

| Arquivo | Para quê |
|---|---|
| `Login_Cadatro/JS/login.js` | `signInWithEmailAndPassword` |
| `Login_Cadatro/JS/cadastro.js` | `createUserWithEmailAndPassword`, `updateProfile` |
| `Login_Cadatro/JS/recuperacao.js` | `sendPasswordResetEmail` |
| `Login_Cadatro/JS/codigo.js` | `verifyPasswordResetCode` |
| `Login_Cadatro/JS/nova-senha.js` | `confirmPasswordReset` |
| `Tela_Inicia_Com_Login/JS/tela_perfil.js` | `onAuthStateChanged`, `updateProfile`, `signOut` |
| `Tela_Inicia_Com_Login/JS/tela_checkout.js` | `onAuthStateChanged` |
| `Tela_Inicia_Com_Login/JS/tela_pedidos.js` | `onAuthStateChanged` |
| `admin/JS/admin.js` | `onAuthStateChanged` |
| `admin/JS/usuarios.js` | `getIdToken` |

---

## O ponto de atenção arquitetural

O Firebase sabe **quem** o usuário é (uid, e-mail, nome). O Postgres sabe **o que** ele comprou (`cliente_id`). **Nenhum dos dois conhece o outro.**

Quem faz essa ponte é o `api/consumidor.js`, usando o e-mail como chave. Vale ler aquele módulo junto com este — é a decisão de design mais provável de ser questionada sobre autenticação neste projeto.
