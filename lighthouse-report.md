# Relatório de Acessibilidade — PopDreams

Auditoria de acessibilidade do projeto, seguindo o protocolo da **Seção 5.2** do documento da atividade.

---

## 1. Protocolo de execução

As execuções seguiram exatamente o procedimento exigido, para evitar variação entre rodadas:

| Item | Configuração |
|---|---|
| Navegador | Google Chrome em janela anônima, **sem extensões** |
| Categoria auditada | Apenas **Acessibilidade** |
| Dispositivo | **Desktop** |
| Número de execuções | **3 consecutivas** por página |
| Valor considerado | **Mediana** das 3 execuções |
| Páginas auditadas | Página principal + 1 página interna (detalhe do produto) |

> **Como rodar:** abra o Chrome anônimo → `F12` → aba **Lighthouse** → desmarque tudo menos *Accessibility* → *Device: Desktop* → **Analyze page load**. Repita 3 vezes seguidas sem fechar a aba.

---

## 2. Resultados

### 2.1 Página principal — `index.html`

<!-- PREENCHER: rode 3 vezes e anote score e data/hora de cada execução -->

| Execução | Data e hora | Score |
|---|---|---|
| 1ª | `__/__/2026 __:__` | `__` |
| 2ª | `__/__/2026 __:__` | `__` |
| 3ª | `__/__/2026 __:__` | `__` |
| **Mediana** | — | **`__`** |

**Capturas de tela:**

<!-- PREENCHER: salve os prints em uma pasta (ex.: docs/lighthouse/) e referencie aqui.
     A rubrica 8.4 pede "3 execuções + capturas" para o nível Excelente. -->

![Execução 1 — index](docs/lighthouse/index-run1.png)
![Execução 2 — index](docs/lighthouse/index-run2.png)
![Execução 3 — index](docs/lighthouse/index-run3.png)

---

### 2.2 Página interna — `Tela_Inicia_Sem_Login/tela_produto.html`

<!-- PREENCHER -->

| Execução | Data e hora | Score |
|---|---|---|
| 1ª | `__/__/2026 __:__` | `__` |
| 2ª | `__/__/2026 __:__` | `__` |
| 3ª | `__/__/2026 __:__` | `__` |
| **Mediana** | — | **`__`** |

**Capturas de tela:**

![Execução 1 — produto](docs/lighthouse/produto-run1.png)
![Execução 2 — produto](docs/lighthouse/produto-run2.png)
![Execução 3 — produto](docs/lighthouse/produto-run3.png)

---

## 3. Checklist da Seção 5.1

Os 10 critérios objetivos exigidos pela atividade. **Regra de pontuação:** 8/10 = 100% · 7/10 = 70% · 6/10 = 50% · 5 ou menos = 0%.

| # | Critério | Como verificar | Status | Evidência |
|---|---|---|---|---|
| 1 | Imagens significativas com `alt` descritivo; decorativas com `alt=""` | Inspeção HTML | ✅ **Aprovado** | **74 de 74** imagens com `alt`; as decorativas usam `alt=""` + `aria-hidden="true"` |
| 2 | Contraste ≥ 4.5:1 (texto normal) | WebAIM Contrast Checker | ✅ **Aprovado** | Todas as combinações medidas — ver seção 4 |
| 3 | Navegação completa por teclado | Teste presencial: carrinho e checkout sem mouse | `[ ]` | **Testar manualmente** |
| 4 | Foco visível em todos os elementos interativos | Inspeção visual | ✅ **Aprovado** | Regra global `:focus-visible` em `CSS/acessibilidade.css`, carregada nas 22 páginas |
| 5 | HTML semântico (`header`, `nav`, `main`, `button`, `label`) | Lighthouse / axe DevTools | ✅ **Aprovado** | Todas as páginas com `main`; landmarks `header`/`footer` em todas; 0 botões sem nome acessível |
| 6 | Formulários com labels associados e erros acessíveis | Inspeção HTML; NVDA | ✅ **Aprovado** | **0 de 51** campos sem rótulo (`label for` ou `aria-label`) |
| 7 | Nenhuma informação transmitida só por cor | Filtro de daltonismo | `[ ]` | **Testar manualmente** — erros de formulário e cupom têm texto além da cor |
| 8 | Zoom até 200% sem quebrar layout | `Ctrl` + scroll | `[ ]` | **Testar manualmente** |
| 9 | `lang="pt-BR"` no `<html>` | Inspeção HTML | ✅ **Aprovado** | **22 de 22** páginas |
| 10 | Lighthouse Acessibilidade ≥ 90 | Execução em sala | `[ ]` | Depende da seção 2 |

**Verificados: 6 de 10.** Os quatro em aberto (3, 7, 8, 10) exigem navegador e não podem ser conferidos por inspeção de código.

**Total após os testes manuais:** `__ / 10` → **`__%`**

---

## 4. Medição de contraste (critério 2)

Razões calculadas pela fórmula da WCAG 2.1, para as combinações de texto sobre fundo usadas nas duas paletas. Mínimo exigido: **4.5:1** para texto normal.

| Elemento | Cor | Sobre | Razão |
|---|---|---|---|
| Título | `#111` | Fundo azul `#DCEAF7` | 15.43:1 |
| Título | `#111` | Fundo rosa `#F9EBEB` | 16.29:1 |
| Texto secundário (azul) | `#555` | Painel `#ffffff` | 7.46:1 |
| Texto secundário (rosa) | `#757575` | Painel `#ffffff` | 4.61:1 |
| Texto terciário | `#767676` | Painel `#ffffff` | 4.54:1 |
| Texto de campo | `#6d6d6d` | Fundo de campo `#f0f0f0` | 4.54:1 |
| Label (azul) | `#477a9e` | Painel `#ffffff` | 4.62:1 |
| Label (rosa) | `#da383d` | Painel `#ffffff` | 4.55:1 |
| Anel de foco | `#286aa8` | Fundo azul `#DCEAF7` | 4.62:1 |

**Correções aplicadas.** A auditoria encontrou quatro variáveis reprovando, e a pior por larga margem:

| Variável | Antes | Razão | Depois | Razão |
|---|---|---|---|---|
| `--cor-texto-secundario` (paleta rosa) | `#ccc` | **1.61:1** | `#757575` | 4.61:1 |
| `--cor-input-texto` | `#aaa` | **2.04:1** | `#6d6d6d` | 4.54:1 |
| `--cor-label` (rosa) | `#E3676b` | 3.27:1 | `#da383d` | 4.55:1 |
| `--cor-texto-terciario` | `#888` | 3.54:1 | `#767676` | 4.54:1 |

O texto secundário da paleta rosa era `#ccc` sobre branco — praticamente ilegível. As substituições preservam o matiz original e apenas reduzem a luminosidade até cruzar o limite de 4.5:1.

---

## 5. Recursos de acessibilidade implementados

Registrados aqui porque vão além do checklist mínimo e sustentam a Seção 8.4:

- **Central de acessibilidade própria** (`api/acessibilidadeWidget.js`) — alto contraste, reduzir animações, aumentar/diminuir tamanho do texto, ajustar espaçamento, modo de leitura e narração por voz.
- **Skip link** — "Pular para o conteúdo principal" em todas as páginas, apontando para `#conteudo-principal`.
- **VLibras** — plugin oficial de tradução para Libras, presente em todas as telas.
- **Dois temas com persistência** — aplicados antes da primeira pintura (`api/temaPreload.js`) para evitar flash de conteúdo com o tema errado.
- **`aria-label` em botões de ícone** — os botões da navbar que só têm SVG são rotulados para leitores de tela.

---

## 6. Observações da equipe

<!-- PREENCHER: anotem aqui o que o Lighthouse apontou e o que decidiram fazer a respeito.
     Isso é o que diferencia o nível "Adequado" do "Excelente" na rubrica 8.4 —
     mostrar que vocês leram o resultado e agiram sobre ele. -->

