# `Tela_Inicia_Sem_Login/` — Área pública

As telas que um visitante não autenticado pode ver. São o espelho público de três páginas da área logada.

| Página | Equivalente logado |
|---|---|
| `tela_catalogo` | `Tela_Inicia_Com_Login/tela_catalogo` |
| `tela_produto` | `Tela_Inicia_Com_Login/tela_produto` |
| `tela_busca` | `Tela_Inicia_Com_Login/tela_busca` |

> **Observação:** `JS/tela_inicial.js` também mora aqui, mas não tem HTML próprio nesta pasta — ele é o script da **`index.html` da raiz**, que é a porta de entrada do site.

---

## A diferença real entre as duas pastas

O visitante **vê o mesmo catálogo** — produto, preço, imagem, busca, filtro. O que muda é o que acontece ao tentar uma ação que exige conta:

```js
function exigirLogin() {
    localStorage.setItem('popup', 'login-necessario');
    window.location.href = '../Login_Cadatro/login.html';
}
```

Em vez de adicionar ao carrinho ou favoritar, a ação **grava um sinalizador e redireciona para o login**. A tela de login lê esse sinalizador e mostra a mensagem explicando por que o usuário foi parar ali — em vez de jogá-lo num formulário sem contexto.

São **15 pontos de `data-acao="exigir-login"`** espalhados pelas quatro páginas públicas: os botões de comprar, favoritar e ver carrinho.

---

## A separação por pastas é convenção, não proteção

Este é um ponto importante e honesto do projeto, já registrado nas limitações do README principal:

**As páginas de `Tela_Inicia_Com_Login/` não verificam autenticação de verdade.** Digitar a URL direto abre a página. A separação em duas pastas organiza o *fluxo de navegação*, não a segurança.

As exceções são `tela_perfil`, `tela_checkout` e `tela_pedidos`, que usam `onAuthStateChanged` e redirecionam (ou mostram o estado "precisa entrar") quando não há usuário — porque essas dependem de um `cliente_id` para funcionar.

Uma proteção real exigiria validar o token do Firebase no backend a cada requisição. Está fora do escopo do MVP e é uma limitação assumida.

---

## Duplicação entre as duas pastas

Os arquivos aqui são quase idênticos aos da pasta logada:

| Arquivo | Com_Login | Sem_Login | Igual |
|---|---|---|---|
| `tela_busca.js` | 225 linhas | 235 linhas | ~96% |
| `tela_produto.js` | 290 linhas | 287 linhas | ~94% |
| `tela_catalogo.js` | 231 linhas | 233 linhas | ~93% |
| `tela_inicial.js` | 170 linhas | 176 linhas | ~87% |

São cerca de **920 linhas espelhadas**. A diferença real entre as versões é pequena — basicamente trocar "adicionar ao carrinho" por "exigir login" e ajustar caminhos relativos.

**Por que não foi unificado:** unificar exigiria uma camada de configuração por página (algo como `modo: 'publico' | 'logado'`) e reestruturar as duas pastas. É a refatoração de maior impacto que o projeto ainda comporta, mas também a de maior risco — mexeria em 8 arquivos de tela ao mesmo tempo. Ficou registrada como dívida consciente.

O que **foi** unificado ao longo do tempo está em `../api/`: cache de produtos, construção de cards, favoritos, carrinho, busca da navbar, tema e delegação de eventos. Sem isso a duplicação seria muito maior.
