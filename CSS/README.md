# `CSS/` — Camada de estilo compartilhada

Três arquivos carregados por **todas** as páginas, sempre **depois** do CSS específico de cada tela. A ordem não é detalhe: é o que faz essas regras vencerem.

```html
<link rel="stylesheet" href="CSS/tela_catalogo.css">      <!-- estilo da página -->
<link rel="stylesheet" href="../CSS/estados.css">
<link rel="stylesheet" href="../CSS/acessibilidade.css">  <!-- ← por último -->
<link rel="stylesheet" href="../CSS/responsivo.css">
```

**Por que existem:** o projeto tem 21 arquivos de CSS por tela, com muita regra repetida. Em vez de corrigir o mesmo problema em 21 lugares, essas três camadas corrigem uma vez para todas.

---

## `acessibilidade.css`

### O anel de foco — e o `!important` deliberado

**17 arquivos de CSS do projeto zeram o contorno padrão do navegador** (`outline: none`) para estilizar campos e botões. Em **8 deles não havia nenhuma substituição** — quem navega por teclado ficava sem saber onde estava. É reprovação direta no critério 4 da Seção 5.

```css
:is(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
    outline: 3px solid #286aa8 !important;
    outline-offset: 2px;
}
```

**O `!important` está aqui de propósito, e essa é a justificativa:** sem ele, um seletor de classe como `.busca-nav-input:focus { outline: none }` (especificidade 0,2,0) vence uma regra de elemento como `input:focus-visible` (0,1,1) — e o foco continuaria invisível. Indicador de foco é **requisito de acessibilidade, não preferência estética**. É um dos poucos casos em que `!important` é a ferramenta certa, e não uma gambiarra.

**Por que `:focus-visible` e não `:focus`:** o anel aparece para quem navega por teclado (Tab) e **não** para quem clica com o mouse. É o comportamento que o usuário espera.

### Texto selecionável

Alguns CSS aplicavam `user-select: none` no **seletor universal**, o que impedia copiar preço, nome de produto ou número de pedido. A camada devolve `user-select: text` dentro do `main`.

### Utilitário para leitor de tela

`.apenas-leitor-tela` esconde visualmente sem esconder da tecnologia assistiva — usa `clip: rect(0,0,0,0)` em vez de `display: none`, porque `display: none` remove o elemento da árvore de acessibilidade também.

### Movimento reduzido

`@media (prefers-reduced-motion: reduce)` reduz animações e transições a praticamente zero, respeitando a preferência do sistema operacional.

---

## `responsivo.css`

Criado depois de medir o projeto em 360px e encontrar **o documento com 720px de largura** — o dobro da viewport.

### Causa 1: carrossel vazando

`.bonecos-grid` já usava `overflow-x: auto` e rolava internamente, do jeito certo. `.itens-grid` ficou com `overflow: visible`, então os círculos de 169px continuavam **somando largura ao documento inteiro**, com elementos chegando a `right: 1212`.

```css
.itens-grid { overflow-x: auto; overflow-y: visible; }
```

### Causa 2: navbar sem tratamento mobile

**Nenhuma media query do projeto tocava `.navbar-actions`, `.busca-nav` ou `.btn-entrar-nav`.** Em 360px o conjunto ocupava 389px de um espaço que começava na posição 331.

Abaixo de 700px a navbar passa a quebrar em três linhas: logo / ações / links.

### Causa 3: rodapé

As três colunas somavam 309px e não quebravam linha.

### Alvos de toque

```css
@media (max-width: 700px), (pointer: coarse) { ... min-width: 44px; min-height: 44px; }
```

**A condição é por largura, e não só `pointer: coarse`.** O modo dispositivo do DevTools nem sempre emula ponteiro grosso — e é assim que o critério vai ser conferido.

### Resultado medido

| Largura | Antes | Depois |
|---|---|---|
| 360px | `scrollWidth` **720** | **360** |
| 768px | — | **753** |
| 1280px | — | **1265** |

Alvos de toque abaixo de 44px: **4 → 0**.

---

## `estados.css`

Estilo dos estados de **vazio** e **erro** das grids, usados pelo `api/produtosView.js`.

Reaproveita `.estado-carregando`, que já existia em cada página para o spinner, e acrescenta só as diferenças — mensagem e botão "Tentar novamente".

**Detalhe do critério 6 da Seção 5** ("nenhuma informação transmitida só por cor"): a mensagem de erro é **texto**, e a cor é reforço. Alguém que não distingue vermelho lê o que aconteceu.

Contraste das cores introduzidas: `#a32320` sobre fundo claro dá ~7:1, bem acima dos 4,5:1 exigidos.

---

## Nota sobre contraste no projeto

A auditoria mediu todas as combinações de texto sobre fundo pela fórmula da WCAG. Quatro variáveis reprovavam, e a pior por larga margem:

| Variável | Antes | Depois |
|---|---|---|
| `--cor-texto-secundario` (paleta rosa) | `#ccc` → **1,61:1** | `#757575` → 4,61:1 |
| `--cor-input-texto` | `#aaa` → **2,04:1** | `#6d6d6d` → 4,54:1 |
| `--cor-texto-terciario` | `#888` → 3,54:1 | `#767676` → 4,54:1 |
| `--cor-label` (rosa) | `#E3676b` → 3,27:1 | `#da383d` → 4,55:1 |

O texto secundário do tema rosa era cinza-claro sobre branco — praticamente ilegível. As substituições **preservam o matiz original** e apenas reduzem a luminosidade até cruzar 4,5:1.

Como a paleta está declarada em 19 arquivos JS além do `temaPreload.js`, a correção exigiu 188 substituições em 39 arquivos. É o custo da duplicação.
