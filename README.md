# PopDreams — Loja Virtual de Action Figures

Projeto Integrador de **Desenvolvimento de Aplicações Dinâmicas (DAD)** — Escola Germinare Tech, 2º ano.

Loja virtual de action figures e itens colecionáveis construída em **JavaScript vanilla**, sem framework de front-end e sem build step. O usuário navega por um catálogo carregado dinamicamente, filtra por nome e categoria, favorita produtos, monta um carrinho persistente e acompanha tudo com suporte a acessibilidade (VLibras, alto contraste, ajuste de texto e narração por voz).

---

## Integrantes

<!-- PREENCHER: os nomes completos e as funções abaixo precisam ser confirmados por vocês.
     A coluna "Atuação observada" foi extraída do histórico git e serve só como ponto de
     partida — ajustem para a divisão real de trabalho do grupo. -->

| Integrante | Usuário GitHub | Função | Atuação observada no histórico git |
|---|---|---|---|
| Felipe Kogake | `FelipeKogake` | **[Front-end]** | Catálogo, carrinho, painel admin, integração com a API e Supabase |
| Luiza Cursino| `Luiza` | **[UX Design e DBA]** | Identidade visual (logos) e plugin de acessibilidade VLibras |
| Igor Quinto | `IgorQuinto5` | **[UX Design e Front-end]** | Ajustes de interface |
| Gustavo Souza | `Gustavo` | **[Back-end]** | Backend Spring Boot e modelagem do banco |

---

## Stack

**Front-end** (este repositório)

| Tecnologia | Uso | Por quê |
|---|---|---|
| JavaScript vanilla + ES Modules | Toda a interface | Exigência da atividade; `import`/`export` nativos dispensam bundler |
| HTML5 semântico + CSS3 puro | Estrutura e estilo | Sem framework de CSS; variáveis CSS controlam os dois temas |
| Firebase Authentication | Login, cadastro, recuperação de senha | Sessão persistente sem precisar escrever backend de autenticação |
| Supabase Storage | Hospedagem das imagens de produto | Bucket público com URL direta, sem servidor de arquivos próprio |
| VLibras | Tradução para Libras | Plugin oficial do governo, exigido pelo recorte de acessibilidade |

**Back-end** (repositório separado — ver abaixo)

| Tecnologia | Uso |
|---|---|
| Java + Spring Boot 3.2.5 | API REST |
| Spring Data JPA / Hibernate 6.4.4 | Persistência e mapeamento das entidades |
| PostgreSQL (Aiven) | Banco de dados |
| Render | Hospedagem da API |
| springdoc-openapi | Documentação Swagger em `/swagger-ui/index.html` |

> **Nenhuma dependência npm.** O `package.json` está vazio de propósito: Firebase e Supabase são importados por URL de CDN dentro do próprio `import`, e o navegador resolve. Não existe `npm install` neste projeto.

---

## Repositórios

| Parte | Repositório |
|---|---|
| Front-end | https://github.com/FelipeKogake/BuosDilos-s-Frontend |
| Back-end | https://github.com/gugsdf/BuosDilo-s |

---

## Como executar

### Front-end

O front-end é estático, mas **não abra os arquivos com duplo clique** (`file://`): os ES Modules são bloqueados pela política de origem do navegador e nenhuma tela carrega. É preciso servir por HTTP.

```bash
python -m http.server 5500
```

Depois abra `http://localhost:5500`. Qualquer servidor estático serve — a extensão Live Server do VS Code também funciona.

Por padrão o front aponta para a API já publicada no Render, então **isso é suficiente para rodar o projeto inteiro** sem subir o back-end localmente.

### Back-end (opcional — só se for mexer na API)

```bash
mvn spring-boot:run
```

A API sobe em `http://localhost:2102`. Para o front-end usar essa API local, inverta o comentário das duas linhas de `BASE_URL` no topo de `api/produtos.js`:

```js
// const BASE_URL = 'https://ecommerce-api-p2jw.onrender.com/api';
const BASE_URL = 'http://localhost:2102/api';
```

> ⚠️ **Não commite essa troca.** Se a linha do `localhost` subir para o repositório, a aplicação publicada para de funcionar para quem clonar.

### Variáveis de ambiente do back-end

Em produção o `application-prod.properties` espera:

| Variável | Descrição |
|---|---|
| `JDBC_DATABASE_URL` | URL JDBC do Postgres (precisa do prefixo `jdbc:`) |
| `DATABASE_USER` | Usuário do banco |
| `DATABASE_PASSWORD` | Senha do banco |
| `PORT` | Porta HTTP (o Render injeta automaticamente) |

---

## Declaração de uso de Inteligência Artificial

Conforme a Seção 10.1 do documento da atividade, declaramos o uso de IA no desenvolvimento.

**Ferramenta utilizada:** Claude (Anthropic), via Claude Code.

**Partes apoiadas por IA:**

<!-- PREENCHER: a lista abaixo cobre apenas a sessão de apoio mais recente.
     Se houve uso de IA em outras etapas (ChatGPT, Copilot, Gemini etc.),
     acrescentem aqui — a transparência é condição para o uso ser permitido. -->

- **Auditoria do projeto contra a rubrica** — levantamento de lacunas em relação às Seções 3.1, 3.2, 4.1 e 8.9 do documento da atividade.
- **Diagnóstico do erro de boot do Spring** (`Schema-validation: missing table [endereco_estoque]`) — identificação da divergência entre as entidades JPA e o script de banco.
- **Script de banco e carga de dados** — os arquivos `banco_schema.sql` e `banco_dataload.sql` no repositório do back-end foram gerados com apoio de IA a partir das entidades existentes.
- **Endpoint `GET /api/consumidores/email/{email}`** — método `buscarPorEmail` no `ConsumidorServico` e no `ConsumidorControlador`.
- **Esta seção do README.**

**O que não foi gerado por IA:** toda a interface, o CSS, as telas, a integração com Firebase e Supabase, a modelagem original do banco e as entidades JPA foram escritos pelo grupo.

Todo código gerado com apoio de IA foi lido e revisado antes de entrar no projeto, e qualquer integrante pode explicá-lo na arguição.

---

## Documentação complementar

- [`lighthouse-report.md`](lighthouse-report.md) — auditoria de acessibilidade seguindo o protocolo da Seção 5.2
- O guia técnico abaixo detalha o funcionamento interno de cada parte do código

---

# Guia Técnico — PopDreams (Frontend)

Este documento explica, tecnologia por tecnologia, **como** cada peça do projeto funciona por baixo do capô — não é um manual de uso, é material de estudo. Cada seção mostra o código real do projeto e explica o mecanismo.

## Sumário

1. [Arquitetura geral](#1-arquitetura-geral)
2. [Sistema de temas e anti-flash (FOUC)](#2-sistema-de-temas-e-anti-flash-fouc)
3. [Acessibilidade](#3-acessibilidade)
4. [Autenticação com Firebase](#4-autenticação-com-firebase)
5. [Backend REST e integração de produtos](#5-backend-rest-e-integração-de-produtos)
6. [Cache client-side (sessionStorage)](#6-cache-client-side-sessionstorage)
7. [Supabase Storage (imagens)](#7-supabase-storage-imagens)
8. [Painel Admin](#8-painel-admin)
9. [Loading progressivo (spinners por seção)](#9-loading-progressivo-spinners-por-seção)
10. [Favoritos e perfil extra (localStorage)](#10-favoritos-e-perfil-extra-localstorage)
11. [Busca e navegação](#11-busca-e-navegação)
12. [Limitações e pontos de atenção conhecidos](#12-limitações-e-pontos-de-atenção-conhecidos)

---

## 1. Arquitetura geral

O projeto é **Vanilla JS puro** — sem React/Vue/build step (Webpack, Vite etc.). Isso é possível graças a dois recursos nativos do navegador:

- **ES Modules** (`<script type="module">`): permite `import`/`export` entre arquivos `.js` direto no navegador, sem bundler. Cada página tem um script de entrada (`type="module"`) que importa módulos de `api/` (código compartilhado).
- **Import de URL absoluta**: módulos de terceiros (Firebase, Supabase) são importados direto de uma URL CDN dentro do próprio `import`, ex.:
  ```js
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
  ```
  O navegador baixa e executa esse módulo como se fosse local. Não existe `node_modules` nem `npm install` para essas libs no frontend — o único pacote no `package.json` é o `@supabase/supabase-js` (usado só como referência/typing local, já que o admin também importa a versão CDN via `esm.sh`/`jsdelivr`).

**Camadas do projeto:**

```
Frontend/
├── api/                    ← módulos compartilhados por TODAS as páginas (dados, view, acessibilidade)
├── autthentication/        ← config e helpers do Firebase Auth
├── Tela_Inicia_Com_Login/  ← páginas do usuário logado
├── Tela_Inicia_Sem_Login/  ← páginas do visitante (espelham as de cima, sem ações que exigem login)
├── Login_Cadatro/          ← login, cadastro, recuperação de senha
├── admin/                  ← painel administrativo (protegido por Firebase)
└── index.html              ← home do visitante (usa os módulos de Tela_Inicia_Sem_Login/JS)
```

Isso explica um padrão que se repete o projeto inteiro: **duas telas quase idênticas** (`Tela_Inicia_Com_Login/tela_X.html` e `Tela_Inicia_Sem_Login/tela_X.html`), cada uma com seu próprio `JS/tela_X.js`. Não há componentização/reuso de UI entre elas — é duplicação deliberada (cada JS de tela repete o objeto `temas`, `aplicarTema()`, `ajustarBtnTema()` etc.). Só a **camada de dados** (`api/produtos.js`, `api/produtosStore.js`, `api/produtosView.js`, `api/favoritos.js`, `api/buscaNav.js`) é de fato compartilhada.

**Backend**: o frontend consome uma API REST externa hospedada no Render (plano free):
```js
const BASE_URL = 'https://ecommerce-api-p2jw.onrender.com/api';
```
Planos free do Render "dormem" a aplicação após um tempo sem tráfego — a primeira requisição depois disso pode levar de 30s a 2min (cold start). Isso motivou várias decisões de UX do projeto (cache agressivo, mensagens de "ainda carregando..." etc.), detalhadas nas seções 6 e 9.

---

## 2. Sistema de temas e anti-flash (FOUC)

O site tem dois temas visuais, "azul" e "rosa", trocáveis a qualquer momento pelo botão flutuante (`.btn-tema`). Cada tema é só um **mapa de CSS custom properties** (variáveis CSS):

```js
const temas = {
    azul: { '--cor-fundo': '#DCEAF7', '--cor-primaria': '#cccaf1', /* ... */ },
    rosa: { '--cor-fundo': '#F9EBEB', '--cor-primaria': '#F1CECE', /* ... */ },
};

function aplicarTema(nomeTema) {
    const root = document.documentElement;
    Object.entries(temas[nomeTema]).forEach(([prop, val]) => root.style.setProperty(prop, val));
    localStorage.setItem('tema', nomeTema);
}
```

Como o CSS de cada página já é escrito em cima de `var(--cor-fundo)`, `var(--cor-primaria)` etc., trocar o tema é só sobrescrever essas variáveis no `<html>` — nenhum re-render, nenhuma troca de classe por elemento.

**O problema do FOUC (Flash Of Unstyled Content):** o tema escolhido fica salvo em `localStorage`. Se a aplicação dele dependesse só do `type="module"` (que só roda depois do HTML já ter sido parseado e, geralmente, depois da primeira pintura), o usuário veria um flash da paleta "azul" padrão antes do JS trocar pra "rosa". A solução é [`api/temaPreload.js`](api/temaPreload.js):

```html
<script src="../api/temaPreload.js" data-paleta="app"></script>
```

Pontos técnicos desse script:
- **Não é `type="module"`** e **não tem `defer`/`async`** — script clássico, síncrono, colocado logo no `<head>`, **antes** de qualquer `<link rel="stylesheet">`. Isso garante que ele executa e aplica as variáveis **antes do navegador montar a árvore de renderização**.
- Lê `localStorage.getItem('tema')` e aplica as variáveis via `element.style.setProperty(...)` — estilo inline tem prioridade sobre qualquer regra de stylesheet (especificidade máxima), então mesmo que o `<link>` do CSS carregue depois, a cor certa já está lá.
- O atributo `data-paleta` (lido via `document.currentScript.dataset.paleta`) escolhe entre duas paletas de cores diferentes (`app` para as telas normais, `login` para as telas de Login/Cadastro), reaproveitando o mesmo script nos dois contextos.

Esse é o mesmo truque usado por qualquer site com dark mode que "não pisca": aplicar o tema salvo o mais cedo possível na cadeia de carregamento, via JS síncrono no `<head>`.

---

## 3. Acessibilidade

### 3.1 Central de Acessibilidade ([api/acessibilidadeWidget.js](api/acessibilidadeWidget.js))

Widget flutuante (botão + painel) injetado via JS puro em **todas** as páginas, com um único `<script defer>`. Não depende de nenhum serviço externo — tudo roda no navegador do usuário.

**Persistência de preferências**: um objeto `state` é salvo em `localStorage` (`a11y-widget-prefs`) e reaplicado a cada carregamento de página:

```js
var defaults = { contrast: false, reduceMotion: false, fontStep: 0, spacingStep: 0, reading: false, narration: false };
```

Na primeira visita (sem preferência salva), o widget respeita a preferência do **sistema operacional** via media query:
```js
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) prefs.reduceMotion = true;
```
Isso é a API `matchMedia`, que expõe media queries de CSS para JS — aqui usada para ler a flag de acessibilidade do SO/navegador (Windows "reduzir animação", macOS "reduce motion" etc.) sem o usuário precisar configurar nada no site.

**As 6 funcionalidades, tecnicamente:**

| Recurso | Mecanismo |
|---|---|
| **Alto contraste** | Classe `a11y-contrast` no `<html>`; CSS força `background:#000;color:#fff` em (quase) tudo, exceto o próprio painel de acessibilidade, e some com imagens `aria-hidden="true"` (puramente decorativas) que ficariam "flutuando" coloridas sobre o preto. |
| **Reduzir animações** | Classe `a11y-reduce-motion`; CSS zera `animation-duration`/`transition-duration` de **tudo** via seletor universal `*`, e força `scroll-behavior:auto` (mata scroll suave). |
| **Tamanho do texto** | 5 níveis (`FONT_STEPS = [100,112,125,137,150]`, em %). Aplicado via `--a11y-font-scale` na variável CSS, e `html{font-size:var(--a11y-font-scale)}`. Como o resto do CSS do site usa `rem` (relativo ao `font-size` do `<html>`), escalar essa única variável escala a tipografia inteira do site proporcionalmente. |
| **Espaçamento** | 3 níveis de `letter-spacing`/`line-height`, aplicados via variáveis CSS só no corpo do texto (não no painel do próprio widget). |
| **Modo de leitura** | Classe `a11y-reading`; troca a fonte de textos (`p`, `li`, `h1`...) para serifada (Georgia) e reduz a opacidade de imagens decorativas — pensado para reduzir ruído visual na leitura. |
| **Narração por voz** | **Web Speech API** (`SpeechSynthesisUtterance`), nativa do navegador — não chama nenhum serviço de TTS externo. |

**Como funciona a narração por voz** (a parte mais interessante tecnicamente):

```js
var LEITURA_SELETOR = "h1, h2, h3, h4, h5, h6, p, a, button, label, li, span, [aria-label]";

function aoPassarMouseNarracao(e) {
    var el = e.target.closest(LEITURA_SELETOR);
    if (el) narrarElemento(el);
}
document.addEventListener("mouseover", aoPassarMouseNarracao);
document.addEventListener("focusin", aoFocarNarracao);
```

- Escuta `mouseover` (mouse) **e** `focusin` (navegação por teclado/Tab) — funciona tanto para quem usa mouse quanto para quem navega só com teclado.
- `e.target.closest(seletor)` sobe na árvore do DOM a partir do elemento clicado/focado até achar o ancestral mais próximo que bate com o seletor — é assim que, por exemplo, passar o mouse sobre um `<svg>` dentro de um `<button>` narra o botão, não o SVG.
- **Debounce de 250ms** (`setTimeout`) antes de falar: evita que passar o mouse rapidamente por vários elementos dispare uma fila de falas simultâneas — só narra o elemento onde o cursor ficou parado.
- `window.speechSynthesis.cancel()` antes de cada nova fala corta a fala anterior no meio, para não empilhar.
- O texto narrado é `aria-label` (se existir) ou `textContent` — a mesma fonte que um leitor de tela real (NVDA, VoiceOver) usaria, o que reforça a importância de o HTML ter `aria-label` correto nos ícones/botões.
- O elemento narrado ganha um contorno visual (`outline`) via classe, dando feedback visual de qual elemento está sendo lido — importante para quem tem baixa visão mas ainda enxerga.

**Skip link**: o widget injeta automaticamente um link "Pular para o conteúdo principal" como primeiro filho do `<body>`, posicionado fora da tela (`left:-9999px`) e que só aparece quando recebe foco por Tab (`:focus{left:0}`). É o padrão de acessibilidade mais comum da web para permitir pular a navbar repetida em toda navegação por teclado.

### 3.2 VLibras

```html
<script src="https://vlibras.gov.br/app/vlibras-plugin.js"></script>
<script>new window.VLibras.Widget('https://vlibras.gov.br/app');</script>
```

Widget do **governo federal** que traduz o conteúdo da página para Libras (Língua Brasileira de Sinais) via um avatar 3D animado. É um serviço de terceiro embutido via script — o projeto só precisa colocar a `<div vw>` de marcação (já presente no HTML de cada página) e os dois `<script>`. Todo o processamento de tradução acontece nos servidores do próprio VLibras.

### 3.3 Uso de ARIA e semântica ao longo do site

Padrões que se repetem em todo o HTML do projeto:
- `aria-label` em todo ícone sem texto visível (botões só com SVG).
- `aria-pressed`/`role="switch"` nos toggles do widget de acessibilidade — comunica estado ligado/desligado a leitores de tela.
- `aria-live="polite"` em textos que mudam dinamicamente (ex.: valor do zoom de fonte), para que leitores de tela anunciem a mudança sem interromper o que estava sendo lido.
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` nos popups/modais (central de acessibilidade, modal de confirmação do admin).
- `aria-hidden="true"` em imagens puramente decorativas (fundos, ícones redundantes ao lado de texto).

---

## 4. Autenticação com Firebase

### 4.1 Inicialização ([autthentication/firebase-config.js](autthentication/firebase-config.js))

```js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "buosdilo-s", /* ... */ };
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

Duas coisas importantes tecnicamente:
- A `firebaseConfig` (incluindo `apiKey`) **não é um segredo** — é normal e esperado que ela fique exposta no bundle client-side. Ela só identifica o projeto Firebase perante o Google; quem protege os dados de verdade são as **Regras de Segurança** do Firestore/Auth, configuradas no console do Firebase (não estão neste repositório).
- `initializeApp` roda **uma vez** por módulo carregado — como ES Modules são *singletons* (o navegador cacheia o módulo pela URL e reexecuta o mesmo objeto para todo `import` seguinte), toda página que importa `firebase-config.js` reaproveita a mesma instância de `auth`/`db`, sem reconectar.

### 4.2 Cadastro ([Login_Cadatro/JS/cadastro.js](Login_Cadatro/JS/cadastro.js))

```js
const credencial = await createUserWithEmailAndPassword(auth, email, senha);
await updateProfile(credencial.user, { displayName: nome });
```

- `createUserWithEmailAndPassword` cria o usuário no Firebase Auth (hash de senha, validação de força mínima etc. tudo do lado do Firebase — o frontend nunca vê nem processa a senha em texto puro além de enviá-la por HTTPS).
- `updateProfile` é uma chamada **separada** porque a API de criação de usuário não aceita `displayName` direto — por isso o nome só é gravado depois que a conta já existe.
- Depois do cadastro, `sessionStorage.setItem('veio-de-cadastro', 'true')` marca que o próximo carregamento da tela de sucesso veio de um cadastro real (não de acesso direto pela URL) — um guard simples contra acesso indevido àquela página.

### 4.3 Login e verificação de admin ([Login_Cadatro/JS/login.js](Login_Cadatro/JS/login.js))

```js
const credencial = await signInWithEmailAndPassword(auth, email, senha);
const snap = await getDoc(doc(db, 'admins', credencial.user.uid));

if (snap.exists()) {
    window.location.href = '../admin/admin.html';
} else {
    window.location.href = '../Tela_Inicia_Com_Login/tela_inicial.html';
}
```

Isso é o mecanismo de **RBAC (controle de acesso por papel) simplificado**: não existe um campo "role" no próprio usuário do Firebase Auth — em vez disso, existe uma coleção `admins` no **Firestore** (banco NoSQL de documentos do Firebase) onde o **ID do documento é o UID do usuário**. Depois do login, o código pergunta "existe um documento `admins/{uid}`?" (`getDoc`). Se sim, é admin. Essa checagem roda **client-side** — a segurança de verdade contra um usuário comum tentando acessar dados de admin direto pela API teria que estar nas Regras de Segurança do Firestore/backend, não só nesse `if`.

### 4.4 Recuperação de senha (fluxo em duas telas)

Firebase Auth tem um fluxo pronto de "esqueci minha senha" baseado em **e-mail com link mágico**, usado assim:

1. **`recuperacao.html`** → `sendPasswordResetEmail(auth, email, { url: 'https://.../senha-alterada.html' })`. O Firebase manda um e-mail com um link que aponta para a URL configurada, com um parâmetro `?oobCode=...` (**O**ut **O**f **B**and code — um token de uso único).
2. **`nova-senha.html`** → lê `oobCode` da URL (`new URLSearchParams(window.location.search).get('oobCode')`) e chama `confirmPasswordReset(auth, oobCode, novaSenha)`. Se não houver `oobCode` na URL (ex.: alguém acessou a página direto, sem vir do link do e-mail), a página redireciona pra login imediatamente — é a validação de que o acesso é legítimo.

Não existe um "código de verificação digitado manualmente" — o `oobCode` já viaja embutido na URL do e-mail; a tela `codigo.html` no projeto é só uma etapa de UI, o token real é sempre o da URL.

### 4.5 Tradução de erros ([autthentication/firebase-erros.js](autthentication/firebase-erros.js))

O Firebase retorna erros como `error.code` (string tipo `'auth/wrong-password'`). Um dicionário simples mapeia esses códigos para mensagens em português — sem isso, o usuário veria a mensagem crua em inglês do SDK.

### 4.6 Proteção de rotas — `onAuthStateChanged`

```js
onAuthStateChanged(auth, (usuario) => {
    if (!usuario) window.location.replace('login.html');
});
```

`onAuthStateChanged` é um **listener assíncrono**: o Firebase Auth mantém o estado de sessão em `IndexedDB`/cookies e, a cada carregamento de página, precisa validar o token localmente (e possivelmente renová-lo) antes de saber se o usuário está logado — por isso é um callback, não um valor síncrono disponível na primeira linha do script. `window.location.replace` (em vez de `.href`) troca a página **sem** deixar entrada no histórico do navegador, então o botão "voltar" não retorna para a página protegida depois do redirect.

**Importante (característica real do projeto, não um bug a corrigir agora):** esse guard só existe em **duas** páginas: [admin/JS/admin.js](admin/JS/admin.js) e [Tela_Inicia_Com_Login/JS/tela_perfil.js](Tela_Inicia_Com_Login/JS/tela_perfil.js). As demais páginas de `Tela_Inicia_Com_Login/` (tela_inicial, catálogo, busca, produto, favoritos, carrinho, notificações) **não verificam login** — a separação Com/Sem Login é uma convenção de navegação (pra onde o app te leva depois de logar), não uma barreira técnica de acesso.

---

## 5. Backend REST e integração de produtos

### 5.1 Cliente HTTP ([api/produtos.js](api/produtos.js))

Todo acesso à API do backend passa por uma função central:

```js
async function apiFetch(path, options = {}) {
    const resposta = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => ({}));
        throw new Error(corpo.message || `Erro ${resposta.status}: ${resposta.statusText}`);
    }
    if (resposta.status === 204) return null;
    return resposta.json();
}
```

Pontos técnicos:
- **`fetch.ok`** só é `false` para status HTTP de erro (4xx/5xx) — diferente de bibliotecas como axios, `fetch` **não rejeita a Promise** em erro HTTP, só em falha de rede. Por isso o `if (!resposta.ok) throw ...` manual: sem ele, um 404/500 passaria batido como "sucesso".
- **`204 No Content`**: alguns endpoints (delete, inativar) não retornam corpo. Chamar `.json()` num corpo vazio lançaria erro de parse — por isso o `if (resposta.status === 204) return null` antes de tentar parsear.
- `.catch(() => ({}))` no parse do corpo de erro: se o backend responder um erro sem JSON válido (ex.: página de erro HTML do próprio Render), o parse falharia e mascararia o erro original — o catch garante um objeto vazio como fallback, e a mensagem cai no `|| \`Erro ${status}\``.

Cada função exportada (`listarProdutos`, `criarProduto`, `atualizarProduto`, `inativarProduto`, `deletarProduto`, `listarCategorias`...) é uma casca fina sobre `apiFetch`, montando o path e o `body` (serializado com `JSON.stringify`).

**Soft delete (`inativar`) vs. hard delete**: o backend distingue `PATCH /produtos/{id}/inativar` (marca `ativo: false`, produto some da loja mas continua existindo) de `DELETE /produtos/{id}` (apaga de vez). O admin usa os dois conforme a ação escolhida pelo usuário.

### 5.2 Modelo de dados: "produto" vs. "item"

Não existem duas tabelas — o mesmo endpoint `/produtos` retorna registros com um campo booleano `item`:
```js
export async function obterProdutos(opcoes) {
    const todos = await obterTodosOsRegistros(opcoes);
    return todos.filter(p => !p.item);   // "bonecos"
}
export async function obterItens(opcoes) {
    const todos = await obterTodosOsRegistros(opcoes);
    return todos.filter(p => p.item);    // "itens colecionáveis"
}
```
A separação visual (bonecos em cards retangulares, itens em círculos) é só de apresentação — no banco é a mesma entidade.

---

## 6. Cache client-side (sessionStorage)

O carregamento de produtos é caro (Render cold start) e a mesma lista de produtos é usada em quase toda página (tela inicial, catálogo, busca, produto, favoritos). Em vez de cada página refazer o `GET /produtos`, existe um cache com TTL em [api/produtosStore.js](api/produtosStore.js):

```js
const CHAVE_CACHE = 'produtosCache';
const TTL_MS = 5 * 60 * 1000; // 5 minutos

function lerCache() {
    const registro = JSON.parse(sessionStorage.getItem(CHAVE_CACHE));
    if (Date.now() - registro.timestamp >= TTL_MS) return null; // expirado
    return registro.produtos;
}

function gravarCache(produtos) {
    sessionStorage.setItem(CHAVE_CACHE, JSON.stringify({ timestamp: Date.now(), produtos }));
}

async function obterTodosOsRegistros({ forcarAtualizacao = false } = {}) {
    if (!forcarAtualizacao) {
        const emCache = lerCache();
        if (emCache) return emCache;
    }
    const registros = await listarProdutos(); // GET /produtos de verdade
    gravarCache(registros);
    return registros;
}
```

**Por que `sessionStorage` e não `localStorage`**: `sessionStorage` é isolado por **aba** e some quando a aba fecha — é o comportamento certo para um cache de dados que podem ficar desatualizados (preço, estoque), diferente de uma preferência de UI (tema, acessibilidade) que faz sentido persistir para sempre, e por isso essas usam `localStorage`.

**Estratégia de invalidação**: é um cache "TTL + invalidação manual" — expira sozinho depois de 5 minutos, **e** qualquer mutação no admin (criar/editar/excluir/inativar produto, adicionar/remover foto) chama `invalidarCacheProdutos()`:
```js
export function invalidarCacheProdutos() {
    sessionStorage.removeItem(CHAVE_CACHE);
}
```
Isso evita o cenário clássico de cache obsoleto: o admin edita um produto e, sem essa chamada, o próprio admin (na mesma aba) continuaria vendo os dados antigos por até 5 minutos.

**Por que cachear a lista inteira e filtrar em memória**: `obterProdutos()`/`obterItens()` sempre buscam **todos** os registros (produtos + itens juntos) e filtram com `.filter()` no JS, em vez de existirem endpoints separados. Isso significa 1 requisição de rede serve todo o site inteiro — o custo é sempre transferir a lista completa, mesmo em telas que só precisam de 5 itens (compensado pelo `.slice()` feito depois da busca).

---

## 7. Supabase Storage (imagens)

Supabase é usado só para **armazenamento de arquivos** (Storage), não como banco de dados principal — os dados de produto (nome, preço, categoria) ficam no backend REST/banco relacional; só a **imagem em si** vive no Supabase.

### 7.1 Cliente

```js
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

A `SUPABASE_ANON_KEY` ("chave anônima/pública") é, assim como a `apiKey` do Firebase, **feita para ficar exposta no client** — ela só concede as permissões que as *Row Level Security policies* do bucket permitirem (aqui, upload/leitura pública de imagens de produto). Não é uma credencial de admin do banco.

### 7.2 Upload

```js
export async function uploadImagem(arquivo, nomeProduto, lado = '') {
    const ext = arquivo.name.split('.').pop();
    const nomeBase = nomeProduto.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const caminho = `thumbs/${nomeBase}${lado ? `-${lado}` : ''}.${ext}`;

    await supabase.storage.from(BUCKET).upload(caminho, arquivo, { contentType: arquivo.type, upsert: true });
    return supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
}
```

- O **caminho do arquivo é determinístico** (slug do nome do produto + lado da foto, ex.: `thumbs/luiza-versao-10-frontal.png`), não um UUID aleatório. Isso é uma escolha deliberada: `upsert: true` faz o upload **sobrescrever** o arquivo existente no mesmo caminho em vez de criar um novo — reenviar a foto "frontal" do mesmo produto substitui a anterior, sem acumular lixo no bucket nem precisar apagar o arquivo velho manualmente.
- `getPublicUrl` não faz uma chamada de rede — é só concatenação de string (`SUPABASE_URL + /storage/v1/object/public/BUCKET/caminho`), já que o bucket é público. A URL retornada é o que fica salvo no campo `fotoUrl` do produto, no backend.
- A **exclusão** (`removerImagem`) faz o caminho inverso: extrai o `caminho` de dentro da URL pública salva (procurando o marcador `/object/public/{bucket}/`) e chama `.remove([caminho])` — e é **best-effort** (`try { } catch { /* ignora */ }`): se falhar (ex.: arquivo já não existe), não trava o fluxo principal de deletar o produto.

### 7.3 Dois clientes Supabase distintos no projeto

Existem **dois** arquivos que criam cliente Supabase — [api/produtos.js](api/produtos.js) (usado pelas telas públicas, via `import` de URL `esm.sh`) e [admin/JS/supabase-client.js](admin/JS/supabase-client.js) (usado só pelo admin, via `jsdelivr`, exportando o client centralizado para os outros módulos do admin importarem). Mesma técnica, CDNs diferentes — não há problema em ter duas instâncias de cliente Supabase coexistindo na mesma aba, já que o SDK não guarda estado de sessão de usuário aqui (só é usado para Storage, sem autenticação Supabase).

---

## 8. Painel Admin

### 8.1 Proteção de rota

```js
onAuthStateChanged(auth, (usuario) => {
    if (!usuario) window.location.replace('login.html');
});
```
Mesmo mecanismo da seção 4.6 — mas aqui é o **único** guard: qualquer usuário autenticado (não só quem está na coleção `admins`) consegue abrir `admin.html`. A checagem de "é admin de verdade" só acontece no momento do **login** (redirecionar pra cá ou não) — não há uma segunda verificação Firestore dentro do próprio `admin.js`. Ou seja, tecnicamente, alguém que descubra a URL `admin.html` e já esteja logado como usuário comum consegue ver a interface (a segurança de dados de verdade dependeria das regras do backend/Firestore, não é coberta aqui).

### 8.2 Padrão "gerenciador de aba" (reuso de lógica CRUD)

Em vez de duplicar a lógica de listar/filtrar/editar/excluir para "Produtos" e "Itens" (que são visualmente abas separadas, mas tecnicamente o mesmo tipo de dado — ver seção 5.2), o admin usa uma **factory function**:

```js
function criarGerenciadorDeAba({ obterLista, gridId, carregandoId, vazioId, buscaInputId, filtroCategoriaId, rotuloErro }) {
    let todos = [];
    // ...lógica de carregar, filtrar, renderizar, editar, excluir...
    return { carregar };
}

const gerenciadorProdutos = criarGerenciadorDeAba({ obterLista: obterProdutos, gridId: 'grid-produtos', /* ... */ });
const gerenciadorItens    = criarGerenciadorDeAba({ obterLista: obterItens,    gridId: 'grid-itens',    /* ... */ });
```

Isso é o padrão **closure/factory**: cada chamada de `criarGerenciadorDeAba` cria um novo escopo com sua própria variável `todos` (fechada sobre pelas funções internas `filtrar`/`carregar`), então os dois gerenciadores não compartilham estado entre si mesmo usando o mesmo código. É a forma "funcional" do que, em POO, seria uma classe instanciada duas vezes.

### 8.3 Estados de carregamento (`estado-carregando`)

```js
async function carregar() {
    carregandoEl.hidden = false;
    grid.hidden = true;
    vazioEl.hidden = true;
    try {
        todos = await obterLista();
        preencherFiltroCategorias(todos.filter(p => p.ativo), filtroSelect);
        filtrar();
    } catch (error) {
        mostrarToast(rotuloErro, 'erro');
    } finally {
        carregandoEl.hidden = true;
    }
}
```
Três elementos mutuamente exclusivos por seção (`estado-carregando`/spinner, `estado-vazio`, o grid de verdade) — cada `hidden` é ligado/desligado conforme a fase (carregando → dados vazios ou grid populado). Esse é exatamente o padrão que foi replicado nas demais páginas do site (ver seção 9).

### 8.4 Usuários (Firebase Admin SDK via backend próprio)

O SDK client-side do Firebase Auth **não permite listar todos os usuários** de um projeto (por design de segurança — só permite operar sobre o usuário logado). Listar/desabilitar/excluir qualquer usuário exige o **Firebase Admin SDK**, que só roda em ambiente de servidor (Node.js), nunca no navegador (precisa de uma *service account key* privada). Por isso [admin/JS/usuarios.js](admin/JS/usuarios.js) não fala com o Firebase diretamente — fala com um **backend próprio** (Node/Express, fora deste repositório):

```js
const API_BASE_URL = 'http://localhost:3001/api';

async function obterToken() {
    const usuario = auth.currentUser;
    return await usuario.getIdToken();
}

async function chamarApi(caminho, opcoes = {}) {
    const token = await obterToken();
    const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
        ...opcoes,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opcoes.headers || {}) },
    });
    // ...
}
```

Mecanismo: `usuario.getIdToken()` pega o **JWT (JSON Web Token)** de sessão do usuário logado no Firebase Auth — um token assinado que prova quem é o usuário sem precisar reenviar senha. Esse token vai no header `Authorization: Bearer <token>` em cada chamada. O backend Node, ao receber a requisição, verifica a assinatura do JWT usando o **Firebase Admin SDK** (`admin.auth().verifyIdToken(token)`) — só assim confirma que quem está pedindo "listar todos os usuários" é realmente um admin autenticado, sem precisar reimplementar autenticação própria. É o padrão **Bearer Token** clássico de API REST autenticada.

(Nota: `API_BASE_URL` aponta pra `localhost:3001` — esse backend de usuários não está incluído/implantado neste repositório; é um serviço à parte que precisaria rodar separadamente para essa aba do admin funcionar em produção.)

---

## 9. Loading progressivo (spinners por seção)

Implementado nesta mesma sessão de trabalho — documentado aqui porque é a peça mais recente e o padrão que agora está espalhado pelo site inteiro.

**Antes**: uma splash screen cobria a página inteira (`position:fixed;inset:0`) enquanto **todos** os dados de produto carregavam, escondida só no fim (`window.SplashScreen.esconder()`), com mensagens que trocavam ao longo do tempo pra disfarçar esperas longas (cold start do Render).

**Agora** (mesma técnica do admin, seção 8.3): a página HTML já nasce com os grids contendo um placeholder:
```html
<div class="bonecos-grid">
    <div class="estado-carregando">
        <div class="spinner" aria-hidden="true"></div>
        <p>Carregando bonecos...</p>
    </div>
</div>
```
E o CSS do spinner é só um `border` com uma borda colorida diferente das outras, girando via `@keyframes`:
```css
.spinner {
    width: 32px; height: 32px;
    border: 3px solid var(--cor-borda);
    border-top-color: var(--cor-primaria);
    border-radius: 50%;
    animation: girar 0.7s linear infinite;
}
@keyframes girar { to { transform: rotate(360deg); } }
```
(Só a borda superior tem cor diferente — o `border-radius:50%` faz o quadrado virar círculo, e girar esse círculo cria a ilusão de um arco rotativo, sem nenhuma imagem/GIF.)

Quando os dados chegam, a função de render (`renderizarBonecosEmGrids`, em [api/produtosView.js](api/produtosView.js)) faz `grid.innerHTML = ''` e reconstrói o conteúdo do zero com os cards reais — isso **apaga** o placeholder de carregando automaticamement, sem precisar de um passo extra de "esconder spinner". A splash screen full-page (`api/splashScreen.js`) continua no projeto (com tempos reduzidos, `TEMPO_MAX_MS` de 120s para 30s) mas sem nenhuma página usando ela no momento — fica disponível para um cenário futuro que precise bloquear a tela inteira.

**Por que essa abordagem é melhor** (motivo dado pelo usuário do projeto, e tecnicamente correto): a página fica interativa (navbar, footer, texto) desde o primeiro instante — só a seção que depende de rede fica "carregando", em vez do usuário olhar pra uma tela em branco/spinner genérico até a API inteira responder.

---

## 10. Favoritos e perfil extra (localStorage)

Duas features rodam **inteiramente no navegador**, sem endpoint de backend:

**Favoritos** ([api/favoritos.js](api/favoritos.js)): um array de IDs de produto salvo em `localStorage['favoritos']`. `alternarFavorito(id)` faz toggle (adiciona se não existe, remove se existe) e retorna o novo estado — padrão comum pra simplificar quem chama (`if (alternarFavorito(id)) { /* virou favorito */ }`).

**Perfil extra** ([api/perfil.js](api/perfil.js)): idade, telefone, endereço, cartões e foto de perfil — dados que o backend/Firebase **não armazena** (só nome e e-mail vêm do Firebase Auth). Guardado em `localStorage`, **chaveado por UID** do usuário:
```js
const chave = (uid) => `perfilExtra_${uid}`;
```
Isso evita que o perfil extra de um usuário vaze para outro no mesmo navegador/dispositivo (ex.: computador compartilhado com múltiplas contas), mas — por ser `localStorage` puro — **não sincroniza entre dispositivos** e some se o usuário limpar os dados do site. É uma limitação conhecida e documentada no próprio comentário do arquivo, não um bug.

Detalhe de segurança consciente em `adicionarCartao`: só os **4 últimos dígitos** do número do cartão são persistidos (`digitos.slice(-4)`) — o número completo nunca é salvo, mesmo em localStorage.

---

## 11. Busca e navegação

**Ícone de busca expansível da navbar** ([api/buscaNav.js](api/buscaNav.js)): o input começa com `width:0;opacity:0` (escondido via CSS, não `display:none`, pra permitir transição animada) e ganha a classe `.aberto` no clique do ícone, que a CSS anima até a largura final. Enter ou clicar no ícone de novo navega para `tela_busca.html?q=termo` — a **página de busca lê o parâmetro da URL** (`preencherTermoDaUrl`) e já dispara a busca com o termo pré-preenchido, então o fluxo funciona mesmo vindo de outra página (a busca não é "ao vivo" entre páginas, é passada via query string).

**Filtro combinado nome + categoria** (`tela_busca.js`): busca por nome ignora acento e caixa:
```js
function normalizar(texto) {
    return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}
```
`normalize('NFD')` decompõe caracteres acentuados em base + diacrítico (ex.: `"é"` vira `"e" + "´"` como dois "caracteres" Unicode separados); o regex `\p{M}` (Unicode property escape para "Mark", com a flag `u`) remove só os diacríticos, sobrando o texto sem acento. Assim, buscar "luiza" encontra "Luíza" e vice-versa.

As categorias (implementadas na sessão anterior) vêm de `GET /produtos/categorias` — uma lista canônica do backend, independente de quais produtos estão carregados no momento (diferente da versão antiga, que derivava a lista de categorias só a partir dos produtos já buscados).

---

## 12. Limitações e pontos de atenção conhecidos

Registradas aqui porque são características reais do estado atual do projeto — úteis de saber ao estudar/evoluir o código:

- **Páginas "Com_Login" não são protegidas de verdade** (seção 4.6) — a separação de pastas é só uma convenção de fluxo de navegação.
- **Verificação de admin só acontece no login** (seção 4.3/8.1) — `admin.html` não confirma de novo que o usuário é admin, só que está autenticado.
- **`usuarios.js` do admin aponta para `localhost:3001`** — depende de um backend Node separado (Firebase Admin SDK) que não está neste repositório.
- **Perfil extra e favoritos não sincronizam entre dispositivos** — são só `localStorage`, por escolha (documentado no próprio código).
- **Cache de produtos é por aba** (`sessionStorage`) — abrir o site em duas abas nunca compartilha o mesmo cache; cada uma faz sua própria requisição inicial.
- **Chaves do Firebase e Supabase expostas no client** — comportamento esperado/normal para esses serviços (a segurança real está nas regras do lado do servidor), não é um vazamento acidental.
