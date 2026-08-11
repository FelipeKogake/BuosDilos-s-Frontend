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

| # | Critério | Como verificar | Status | Observação |
|---|---|---|---|---|
| 1 | Imagens significativas com `alt` descritivo; decorativas com `alt=""` | Inspeção HTML | ⚠️ Parcial | 64 imagens têm `alt`. **6 imagens decorativas não têm o atributo** — ver seção 4 |
| 2 | Contraste ≥ 4.5:1 (texto normal) | WebAIM Contrast Checker | `[ ]` | |
| 3 | Navegação completa por teclado | Teste presencial: carrinho e checkout sem mouse | `[ ]` | |
| 4 | Foco visível em todos os elementos interativos | Inspeção visual | `[ ]` | |
| 5 | HTML semântico (`header`, `nav`, `main`, `button`, `label`) | Lighthouse / axe DevTools | `[ ]` | |
| 6 | Formulários com labels associados e erros acessíveis | Inspeção HTML; NVDA | `[ ]` | |
| 7 | Nenhuma informação transmitida só por cor | Filtro de daltonismo | `[ ]` | |
| 8 | Zoom até 200% sem quebrar layout | `Ctrl` + scroll | `[ ]` | |
| 9 | `lang="pt-BR"` no `<html>` | Inspeção HTML | ✅ **Aprovado** | Verificado nas **20 de 20** páginas |
| 10 | Lighthouse Acessibilidade ≥ 90 | Execução em sala | `[ ]` | Depende da seção 2 |

**Total:** `__ / 10` → **`__%`**

---

## 4. Pendência identificada no critério 1

Seis imagens decorativas têm `aria-hidden="true"` mas **não têm o atributo `alt`**. O critério pede `alt=""` para decorativas. A correção é adicionar `alt=""` em cada uma:

| Arquivo | Elemento |
|---|---|
| `Login_Cadatro/codigo.html` | `estrelas-azul.png` (back e front) |
| `Login_Cadatro/login.html` | `bolhas-azul.png` (back e front) |
| `Login_Cadatro/recuperacao.html` | `estrelas-azul.png` (back e front) |

São 6 atributos. Vale corrigir antes de rodar o Lighthouse.

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

