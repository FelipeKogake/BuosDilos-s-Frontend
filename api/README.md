# `api/` — Módulos compartilhados

Esta pasta é o núcleo do projeto. Nenhum arquivo aqui pertence a uma tela específica: todos são importados por várias páginas. É o que impede que a mesma lógica exista em 20 cópias.

**Regra de ouro da pasta:** se dois arquivos de `Tela_Inicia_*` ou `Login_Cadatro` precisam da mesma coisa, ela mora aqui.

---

## Mapa rápido

| Módulo | Responsabilidade | Tipo |
|---|---|---|
| `http.js` | URL base da API e wrapper de `fetch` | ES Module |
| `produtos.js` | CRUD de produto e fotos + upload no Supabase | ES Module |
| `produtosStore.js` | Cache de produtos em `sessionStorage` | ES Module |
| `produtosView.js` | Construção dos cards e estados das grids | ES Module |
| `consumidor.js` | Ponte entre identidade Firebase e `cliente_id` | ES Module |
| `pedidos.js` | Pedido, entrega, pagamento, histórico | ES Module |
| `carrinho.js` | Carrinho, cupons e cálculo de totais | ES Module |
| `cep.js` | Integração com o ViaCEP | ES Module |
| `favoritos.js` | Favoritos em `localStorage` | ES Module |
| `perfil.js` | Dados extras de perfil em `localStorage` | ES Module |
| `buscaNav.js` | Busca expansível da navbar | ES Module |
| `acoes.js` | Delegação de eventos por `data-acao` | ES Module |
| `util.js` | `debounce` | ES Module |
| `temaPreload.js` | Aplica o tema antes da primeira pintura | **Script clássico** |
| `acessibilidadeWidget.js` | Central de acessibilidade | **Script clássico** |
| `splashScreen.js` | Splash de tela cheia (não usado hoje) | **Script clássico** |

---

## Por que três arquivos são scripts clássicos

`temaPreload.js`, `acessibilidadeWidget.js` e `splashScreen.js` **não usam `type="module"`**, e isso é deliberado:

- **Módulos ES são sempre adiados** (comportamento equivalente a `defer`). O `temaPreload.js` precisa rodar **antes da primeira pintura**, senão a página aparece com o tema errado e "pisca" ao trocar — o problema conhecido como FOUC. Só um script clássico e síncrono no `<head>` consegue isso.
- Por serem clássicos, esses três usam `var` em vez de `const`/`let`. Não é descuido: é o padrão coerente para código que não é módulo. Nos 31 módulos ES da pasta não existe um único `var`.

---

## `http.js` — a camada de rede

```js
export const BASE_URL = 'https://ecommerce-api-p2jw.onrender.com/api';
export class ErroApi extends Error { ... }
export async function apiFetch(caminho, opcoes) { ... }
```

**Técnica: erro tipado com status HTTP.** O `apiFetch` não lança um `Error` genérico — lança um `ErroApi` que carrega o `status`. Isso permite que quem chama distinga "não existe" de "deu problema":

```js
try {
    consumidor = await apiFetch(`/consumidores/email/${email}`);
} catch (erro) {
    if (!(erro instanceof ErroApi) || erro.status !== 404) throw erro;
    consumidor = await criarConsumidor(usuario);   // 404 aqui é esperado
}
```

Sem o status no erro, seria preciso comparar strings de mensagem — frágil.

**Detalhe:** o wrapper lê `corpo.mensagem` antes de `corpo.message`, porque é esse o campo que o `ManipuladorGlobalExcecoes` do backend devolve.

---

## `produtosStore.js` — cache com TTL

Envolve o `produtos.js` com um cache em `sessionStorage`, válido por 5 minutos.

**Por que `sessionStorage` e não `localStorage`:** o cache morre ao fechar a aba. Um catálogo desatualizado por 5 minutos numa sessão é aceitável; desatualizado por dias, não.

**Invalidação manual:** o painel admin chama `invalidarCacheProdutos()` depois de qualquer criação, edição ou exclusão — assim o admin nunca vê o produto que acabou de salvar sumir por causa do cache.

**Separação produto/item:** a API devolve tudo numa lista só; `obterProdutos()` e `obterItens()` filtram pelo booleano `item`. Uma requisição serve as duas seções da tela.

---

## `produtosView.js` — construção de DOM

**Técnica principal: `createElement` + `textContent`, nunca `innerHTML` com dado do banco.**

```js
const nome = document.createElement('p');
nome.className = 'boneco-nome';
nome.textContent = produto.nome ?? '';
```

O nome e a categoria do produto são editáveis pelo painel admin. Se fossem interpolados em `innerHTML`, um produto chamado `<img onerror=...>` seria **executado** pelo navegador. `textContent` trata tudo como texto puro — o ataque vira literalmente o texto na tela.

**O card inteiro é um `<a>` nativo**, não uma `<div>` com `onclick`. Assim ele já é focável e ativável por teclado sem `role`/`tabindex` artificiais. O botão de favoritar por cima usa `stopPropagation()` para não disparar a navegação do link.

**Estados das grids.** Três funções cuidam do que a tela mostra quando não há cards:

| Estado | Como aparece |
|---|---|
| Carregando | `<div class="estado-carregando">` com spinner, já no HTML |
| Vazio | Guarda dentro das funções de render — lista vazia vira mensagem, não grid em branco |
| Erro | `mostrarErroEmGrids()` troca o spinner por mensagem + botão "Tentar novamente" |

O estado de erro tem `role="alert"`, então o leitor de tela anuncia a falha sem o usuário precisar navegar até ela. **Antes disso existir, uma falha de rede deixava o spinner girando para sempre** — as funções de render é que limpam o grid, e elas nunca chegavam a rodar.

---

## `acoes.js` — delegação de eventos

Substituiu **100 atributos `onclick` inline** espalhados pelo HTML.

```js
// HTML
<button data-acao="salvar-perfil">Salvar</button>
<button data-navegar="tela_perfil.html">Perfil</button>

// JS
registrarAcao('salvar-perfil', salvarPerfil);
```

**Dois problemas resolvidos de uma vez:**

1. `onclick="foo()"` só funciona se `foo` for global. Como as telas são módulos ES (escopo próprio), era preciso escrever `window.foo = foo` — **furando o encapsulamento do módulo de propósito**. Eram 42 dessas atribuições.
2. Um listener por botão vira centenas de listeners. Aqui há **um único listener no `document`**, que descobre o alvo com `closest('[data-acao]')`. Funciona inclusive para elementos criados depois, o que um listener direto não faz.

**Caso que exigiu cuidado:** fechar o popup ao clicar fora só deve agir se o clique foi no overlay, não dentro da caixa. Como `closest()` sobe na árvore, isso se perderia. A solução:

```js
registrarAcao('fechar-popup-fora', (elemento, evento) => {
    if (evento.target === elemento) fecharPopup(elemento.dataset.popup);
});
```

**Quatro páginas não usam este módulo:** `cadastro-feito`, `senha-alterada`, `nova-senha` e `tela_notificacoes` são scripts clássicos e não podem `import`. Elas têm uma delegação local equivalente, com comentário explicando.

---

## `consumidor.js` — a ponte entre duas identidades

O problema mais interessante do projeto.

**Quem autentica é o Firebase**, que identifica o usuário por `uid` e e-mail. **Quem guarda pedidos é o Postgres**, que identifica o comprador por `cliente_id` (um `Integer`). Nenhum dos dois conhece o outro — e `POST /api/pedidos` exige o `consumidorId`.

A solução usa o **e-mail como chave de ligação**:

```
usuário Firebase
    ↓ e-mail
GET /api/consumidores/email/{email}
    ├── 200 → usa o id devolvido
    └── 404 → POST /api/consumidores (cria) → usa o id novo
    ↓
grava no localStorage para não repetir a busca
```

**Sobre a senha:** ao criar o registro, gravamos `firebase-${crypto.randomUUID()}` na coluna `cliente.senha`. Ela é `NOT NULL` e existe no schema desde antes do Firebase entrar no projeto. Como toda autenticação acontece no Firebase e **o backend não expõe nenhum endpoint de login**, essa coluna nunca é lida para autenticar ninguém — virou vestigial. O valor aleatório existe só para satisfazer a restrição do banco.

---

## `carrinho.js` — carrinho, cupons e totais

O carrinho é `localStorage`: uma lista de `{ id, qtd }`. O backend não tem endpoint de carrinho — só de pedido.

**Por que os cupons e o cálculo moram aqui e não na tela:** o carrinho e o checkout precisam chegar **exatamente ao mesmo total**. Se cada tela fizesse sua conta, uma divergência de centavos seria questão de tempo. `calcularTotais()` é a única fonte da verdade:

```js
subtotal − desconto + frete = total
```

Quatro cupons fixos, com três comportamentos diferentes:

| Cupom | Tipo | Efeito |
|---|---|---|
| `GERMINARE10` | percentual | 10% do subtotal |
| `POPDREAMS20` | percentual | 20% do subtotal |
| `BEMVINDO15` | fixo | R$ 15 (limitado ao subtotal) |
| `FRETEGRATIS` | frete | zera o frete |

O cupom aplicado também vive no `localStorage`, então sobrevive ao recarregar a página e à navegação para o checkout.

---

## `pedidos.js` — o fechamento da compra

O backend separa a compra em três recursos, e a ordem importa:

```
POST /pedidos     → cria pedido + itens (triggers validam e baixam o estoque)
POST /entregas    → endereço, apontando para o pedidoId devolvido
POST /pagamentos  → forma e valor, idem
```

**O preço não é enviado.** O `ItemPedidoDTO.Requisicao` aceita apenas `produtoId` e `quantidade` — o backend lê o preço atual do produto. Isso impede que o cliente forje o valor pela requisição.

---

## `cep.js` — a API externa

Integração com o **ViaCEP**, dos Correios. É a "API externa funcional" exigida pela Seção 3.2 do projeto.

**Armadilha tratada:** o ViaCEP responde **HTTP 200 com `{ "erro": true }`** quando o CEP tem formato válido mas não existe. Checar só `resposta.ok` não basta — é preciso olhar o corpo.

O módulo também separa `limparCep` (só dígitos) de `formatarCep` (máscara `00000-000`), para o campo formatar enquanto o usuário digita sem atrapalhar a digitação.

---

## `favoritos.js` e `perfil.js` — o que é client-side por escolha

Ambos usam `localStorage` e **não** persistem no backend.

- `favoritos.js` — lista de ids. Não existe endpoint de favoritos.
- `perfil.js` — idade, telefone, endereço, cartões e foto, chaveados pelo `uid` do Firebase. Nome e e-mail continuam vindo do Firebase Auth.

**Limitação conhecida e assumida:** nada disso sincroniza entre dispositivos, e some se o navegador limpar os dados do site. As tabelas `endereco_cliente` e `telefone_cliente` existem no banco e hoje não recebem linha.

**Detalhe de segurança em `perfil.js`:** o cartão nunca é guardado inteiro. `adicionarCartao` extrai só os **últimos 4 dígitos** e a bandeira (detectada pelo primeiro dígito: 4 = Visa, 5 = Mastercard, 3 = Amex). O número completo é descartado assim que a função termina.

---

## `temaPreload.js` — o anti-FOUC

Script clássico, síncrono, no `<head>`, **antes de qualquer `<link rel="stylesheet">`**.

```html
<script src="../api/temaPreload.js" data-paleta="app"></script>
```

Lê o tema salvo no `localStorage` e aplica as variáveis CSS **direto no elemento raiz via `style.setProperty()`**, antes da primeira pintura.

**Por que `.style` e não uma classe:** estilo inline tem precedência sobre qualquer regra de folha de estilo. Assim o tema vale mesmo que o CSS carregue depois.

O atributo `data-paleta` escolhe entre dois conjuntos de cores: `app` (telas internas) e `login` (fluxo de autenticação, com tons um pouco diferentes).

O módulo expõe `window.TemaPopDreams` com `aplicar`, `temaAtual` e `alternar`, para as telas trocarem o tema sem redeclarar a paleta de 20 variáveis.

---

## `acessibilidadeWidget.js` — a central de acessibilidade

Vai bem além do checklist mínimo do projeto. Oferece:

| Recurso | O que faz |
|---|---|
| Alto contraste | Reforça as cores da interface |
| Reduzir animações | Desliga transições e animações |
| Tamanho do texto | Aumenta e diminui a escala tipográfica |
| Espaçamento | Ajusta entrelinha e espaçamento entre letras |
| Modo de leitura | Simplifica a apresentação |
| Narração por voz | Usa a `speechSynthesis` nativa do navegador |

Também injeta o **skip link** ("Pular para o conteúdo principal") apontando para `#conteudo-principal`, presente em todas as páginas.

O próprio widget é acessível: usa `aria-pressed` nos interruptores, `aria-expanded` no botão que abre o painel, `aria-live` para anunciar mudanças e `aria-labelledby` no diálogo. As preferências ficam no `localStorage`.

---

## `util.js` — `debounce`

Uma função só, mas com motivo concreto.

A busca filtra uma lista já carregada em memória — **não faz requisição por tecla**. Mas re-renderizava os dois grids a cada tecla digitada. Numa palavra de 8 letras eram 8 reconstruções completas de DOM, das quais só a última importava. Com `debounce(aplicarFiltros, 250)`, passa a ser uma.
