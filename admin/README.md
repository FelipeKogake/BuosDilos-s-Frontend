# `admin/` — Painel administrativo

CRUD completo de produtos, com gestão de fotos. É a funcionalidade adicional de **Grupo A** ("Área administrativa de produtos") da Seção 3.2 do projeto.

```
admin.html
JS/admin.js             ← 745 linhas: o painel inteiro
JS/supabase-client.js   ← cliente Supabase centralizado
JS/usuarios.js          ← listagem de usuários (ver limitação abaixo)
CSS/admin.css
```

É o maior arquivo JS do projeto — `admin.js` sozinho tem 745 linhas e 23 funções.

---

## A técnica central: fábrica de abas

O painel tem duas abas quase idênticas — **Produtos** e **Itens** — que diferem só na fonte dos dados e nos ids dos elementos. Em vez de duplicar a lógica, existe uma fábrica:

```js
function criarGerenciadorDeAba({ obterLista, gridId, carregandoId, vazioId,
                                 buscaInputId, filtroCategoriaId, rotuloErro }) { ... }

const abaProdutos = criarGerenciadorDeAba({
    obterLista: obterProdutos,
    gridId: 'grid-produtos',
    filtroCategoriaId: 'filtro-categoria',
    ...
});

const abaItens = criarGerenciadorDeAba({
    obterLista: obterItens,
    gridId: 'grid-itens',
    filtroCategoriaId: 'filtro-categoria-itens',
    ...
});
```

Cada chamada devolve um objeto com a aba já montada: carrega, renderiza, filtra por nome e categoria, e trata editar e excluir. **Uma implementação, duas abas.** É o padrão *factory* aplicado a um caso concreto — e é o melhor exemplo de organização modular do projeto.

---

## Fluxo de uma edição

```
abrirModalProduto(produto)
    ↓ preenche nome, descrição, categoria, preço, SKU, ativo, item
    ↓ carregarFotosProduto(id) → GET /api/produtos/{id}/fotos
salvar
    ↓ validação campo a campo (aplicarErroCampo)
    ↓ PUT /api/produtos/{id}
    ↓ invalidarCacheProdutos()      ← essencial
    ↓ mostrarToast('Produto atualizado')
    ↓ recarregarTudo()
```

**Por que `invalidarCacheProdutos()` é essencial:** o `api/produtosStore.js` cacheia o catálogo por 5 minutos em `sessionStorage`. Sem invalidar, o admin salvaria um produto e continuaria vendo a versão antiga na lista — parecendo que nada foi salvo.

---

## Gestão de fotos — dois sistemas conversando

Uma foto de produto vive em **dois lugares**:

| Onde | O quê |
|---|---|
| Supabase Storage | O arquivo de imagem |
| Postgres (`produto_fotos`) | A URL pública, o `lado` e a `ordem` |

O upload em `api/produtos.js` monta o caminho a partir do nome do produto:

```js
const nomeBase = nomeProduto.trim().toLowerCase()
                   .replace(/\s+/g, '-')
                   .replace(/[^a-z0-9-]/g, '');
const caminho  = `thumbs/${nomeBase}${sufixo}.${ext}`;
```

Ou seja: normaliza acentos e espaços para um *slug*, evitando nome de arquivo quebrado no bucket. O `upsert: true` deixa substituir a imagem de um produto sem precisar apagar antes.

Ao excluir uma foto, o `deletarFoto` faz as duas pontas — remove o registro na API **e** o arquivo no Storage. Se a remoção do Storage falhar, ela é silenciosa (`removerImagem` engole o erro): perder o registro é o que importa, um arquivo órfão no bucket não quebra nada.

---

## Confirmação e feedback

Duas funções pequenas resolvem a interação do painel:

- **`mostrarToast(mensagem, tipo)`** — aviso temporário de sucesso ou erro, em vez de `alert()`
- **`pedirConfirmacao(mensagem)`** — devolve uma `Promise` que resolve `true`/`false`, permitindo `if (await pedirConfirmacao('Excluir?'))` em vez do `confirm()` nativo, que trava a página e não é estilizável

---

## Sobre as chaves do Supabase

`supabase-client.js` tem a URL e a chave no código:

```js
const SUPABASE_ANON_KEY = 'sb_publishable_uyPVsR2YGr6RpY2wz27Ixg_en3bQ8HD';
```

**Isso é esperado e não é vazamento.** É a chave *publishable* (anônima), projetada para ficar no cliente. A segurança real do Supabase está nas *Row Level Security policies* do lado do servidor, não em esconder essa chave. O mesmo vale para as credenciais do Firebase em `autthentication/firebase-config.js`.

O que **não** pode aparecer no repositório é a *service role key* do Supabase e a senha do Postgres — e essas não aparecem: a senha do banco está em `application.properties`, que é ignorado pelo git.

---

## Duas limitações conhecidas

### 1. `usuarios.js` depende de um serviço que não existe no repositório

```js
const API_BASE_URL = 'http://localhost:3001/api';
```

Listar usuários do Firebase Auth **não é possível pelo front-end** — o SDK cliente não expõe essa operação, por segurança. Seria preciso um backend com o **Firebase Admin SDK**.

Esse serviço Node/Express foi previsto (o `usuarios.js` já envia o token do admin via `getIdToken()` para autenticar as chamadas), mas **não está em nenhum dos dois repositórios**. Na prática, a aba de usuários não funciona nem local nem publicada.

### 2. A verificação de admin acontece só no login

`admin.html` confirma que existe um usuário autenticado, mas **não revalida que ele é administrador**. Quem souber a URL e tiver qualquer conta chega ao painel.

Uma proteção real exigiria *custom claims* no Firebase e validação do token no backend a cada requisição — fora do escopo do MVP, e registrado como limitação assumida.

---

## Detalhe de inconsistência

O `supabase-client.js` importa o SDK do **jsdelivr**:

```js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
```

Enquanto o `api/produtos.js` importa do **esm.sh**:

```js
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
```

Dois CDNs para a mesma biblioteca. Funciona, mas significa baixar o SDK duas vezes em páginas que usam os dois módulos. Vale unificar.
