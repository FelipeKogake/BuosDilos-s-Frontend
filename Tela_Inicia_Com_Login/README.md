# `Tela_Inicia_Com_Login/` — Área do usuário autenticado

As 10 telas disponíveis depois do login. Cada página segue o mesmo tripé:

```
tela_x.html   →   JS/tela_x.js   →   CSS/tela_x.css
```

O HTML carrega o JS como **módulo ES** (`<script type="module">`), e o JS importa de `../../api/`.

| Página | O que faz |
|---|---|
| `tela_inicial` | Vitrine com destaques de bonecos e itens |
| `tela_catalogo` | Catálogo completo, com "Ver mais" |
| `tela_produto` | Detalhe: imagem, descrição, preço, comprar, favoritar |
| `tela_busca` | Busca por nome + filtro por categoria |
| `tela_carrinho` | Itens, quantidade, cupom, totais |
| `tela_checkout` | Endereço, pagamento, fechamento do pedido |
| `tela_pedidos` | Histórico de pedidos |
| `tela_favoritos` | Produtos favoritados |
| `tela_perfil` | Dados, cartões, endereço, foto, sair |
| `tela_notificacoes` | Avisos |

---

## `tela_checkout` — a página mais complexa do projeto

### Por que é uma página, e não um modal

O carrinho já tinha um modal de confirmação. Optamos por uma página separada por três motivos:

1. **Sem focus trap.** Um modal acessível exige prender o foco dentro dele, tratar Escape e devolver o foco ao fechar. Uma página não tem esse problema.
2. É a **"página interna"** que o protocolo Lighthouse do projeto pede auditar (a Seção 5.2 aceita "detalhe ou checkout").
3. O formulário é longo — endereço com 6 campos mais pagamento. Em modal ficaria apertado no mobile.

### Máquina de cinco estados

A página nunca fica "meio carregada". `mostrarEstado()` liga um e desliga os outros quatro:

| Estado | Quando |
|---|---|
| `checkout-carregando` | Enquanto resolve o carrinho |
| `checkout-login` | Usuário não autenticado |
| `checkout-vazio` | Carrinho sem itens |
| `checkout-conteudo` | Formulário + resumo |
| `checkout-sucesso` | Pedido confirmado |

### Validação

Cada campo tem um `<p class="campo-erro">` próprio, ligado ao input por `aria-describedby`, e o input recebe `aria-invalid="true"`. O erro é **texto**, não só borda vermelha.

Um detalhe que parece bobo mas não é:

```js
const cepOk    = definirErroCampo('cep', ...);
const numeroOk = definirErroCampo('numero', ...);
const cidadeOk = definirErroCampo('cidade', ...);
return cepOk && numeroOk && cidadeOk && ...;
```

As chamadas acontecem **antes** do `&&`, em variáveis separadas. Se estivessem encadeadas direto no `return`, o curto-circuito do `&&` pararia no primeiro erro e os campos seguintes nunca seriam marcados — o usuário corrigiria um, tentaria de novo, e descobriria o próximo. Assim todos aparecem de uma vez.

### ViaCEP

O CEP é consultado ao sair do campo (`blur`) com 8 dígitos, ou pelo botão "Buscar". Ao encontrar, preenche rua, cidade e UF e **move o foco para o campo Número** — o único que o serviço não tem como saber.

### O envio, e a decisão sobre falha parcial

```js
const consumidorId = await resolverConsumidorId(usuario);
const pedido = await criarPedido(consumidorId, itens);

try {
    await registrarEntrega(pedido.id, endereco);
    await registrarPagamento(pedido.id, tipoPagamentoId, total);
} catch (erro) {
    console.error('Pedido criado, mas entrega/pagamento não foram registrados:', erro);
}
```

**O `try` interno é intencional.** Se entrega ou pagamento falharem, o pedido **já existe** e o estoque **já foi baixado pela trigger do banco**. Desfazer exigiria uma operação de compensação que o backend não expõe. Preferimos registrar a falha a fingir que a compra não aconteceu.

### Foco após a confirmação

```js
const titulo = el('checkout-sucesso').querySelector('h2');
titulo.setAttribute('tabindex', '-1');
titulo.focus();
```

Sem isso, quem usa teclado ou leitor de tela continuaria com o foco num botão de um formulário que acabou de sumir da tela.

---

## `tela_carrinho` — cupons e totais

A tela **não calcula nada**: lê preço e quantidade do DOM e delega para `calcularTotais()` de `api/carrinho.js`, o mesmo que o checkout usa. Garante que os dois cheguem ao mesmo valor por construção.

O cupom virou um `<form>` de verdade, então funciona com Enter. O retorno é escrito num `<p role="status">` — o leitor de tela anuncia sozinho, e quem não distingue cores lê o resultado.

**Antes**, o `aplicarCupom()` só trocava a cor da borda e escrevia um texto fixo; o desconto **nunca entrava na conta**.

---

## `tela_pedidos` — histórico

Consome `GET /api/pedidos/consumidor/{id}`, resolvendo antes o `cliente_id` pelo `api/consumidor.js`.

**Selo de status com cor e texto.** As quatro classes (`selo--entregue`, `selo--enviado`, `selo--processando`, `selo--cancelado`) mudam a cor, mas o status também está escrito. Todas as combinações passam de 5,7:1 de contraste.

**`DocumentFragment` na renderização:**

```js
const fragmento = document.createDocumentFragment();
pedidos.forEach(p => fragmento.appendChild(criarCartaoPedido(p)));
lista.appendChild(fragmento);
```

Monta os cartões fora da árvore viva e insere tudo de uma vez — um reflow em vez de um por cartão.

---

## `tela_perfil` — a tela com mais interação

Seis popups (editar, cartão, excluir cartão, endereço, foto, sair), cada um com abrir, fechar e fechar-clicando-fora. São **31 atributos `data-acao`** — a maior concentração do projeto.

**Técnica de acessibilidade nos popups:**

- `overlay.inert = true/false` — a propriedade `inert` remove todo o conteúdo de trás da navegação por teclado e da árvore de acessibilidade. É melhor que só esconder visualmente.
- Ao abrir, o foco vai para a `.popup-box` (com `tabindex="-1"` aplicado por JS).
- `Escape` fecha qualquer popup aberto, via um listener único no `document`.
- `document.body.style.overflow = 'hidden'` trava a rolagem do fundo.

Os dados extras (idade, telefone, endereço, cartões, foto) vêm de `api/perfil.js` — `localStorage`, não backend.

---

## `tela_busca` — filtro em memória

**Não faz requisição por tecla.** Carrega produtos, itens e categorias uma vez, e `filtrarLista()` filtra os arrays já em memória.

O `input` usa `debounce(aplicarFiltros, 250)`: numa palavra de 8 letras, o grid é reconstruído uma vez em vez de oito.

Nome e categoria são combinados — os dois filtros valem juntos.

---

## `tela_catalogo` e `tela_inicial` — carrosséis e "Ver mais"

Os grids mostram no máximo 15 cards (5 por linha × 3 linhas). Passando disso, o último vira um botão "Ver mais" que revela o restante **sem nova requisição** — a lista completa já está em memória.

Ambas foram os alvos da correção de estado de erro: o `catch` só fazia `console.error`, e como são as funções de render que limpam o spinner, **uma falha de rede deixava "Carregando..." girando para sempre**. Hoje mostram mensagem e botão de repetir.

Isso importa mais do que parece: a API está no plano gratuito do Render, que **hiberna após inatividade**. O primeiro acesso depois de um tempo parado leva ~50 segundos.
