---
sidebar_position: 3
title: analyze — Analise
---

# analyze — Analise de Specs

O comando `krab analyze` oferece **12 subcomandos** de analise para avaliar qualidade, eficiencia, risco e estrutura de specs SDD. Cada subcomando fornece metricas especificas que ajudam a otimizar specs para consumo por agentes de IA.

## Subcomandos

| Subcomando | Descricao | Cache |
|---|---|---|
| [`tokens`](#krab-analyze-tokens) | Contagem de tokens e estimativa de custo | Sim |
| [`quality`](#krab-analyze-quality) | Densidade de informacao e utilizacao de contexto | Sim |
| [`compare`](#krab-analyze-compare) | Similaridade entre duas specs | Nao |
| [`freq`](#krab-analyze-freq) | Frequencia de termos | Sim |
| [`entropy`](#krab-analyze-entropy) | Entropia de Shannon, Markov, perplexidade | Sim |
| [`readability`](#krab-analyze-readability) | Flesch-Kincaid, Gunning Fog, Coleman-Liau, ARI | Sim |
| [`ambiguity`](#krab-analyze-ambiguity) | Deteccao de termos vagos | Nao |
| [`substrings`](#krab-analyze-substrings) | Frases repetidas que desperdicam tokens | Nao |
| [`risk`](#krab-analyze-risk) | Score de risco de alucinacao | Nao |
| [`chunking`](#krab-analyze-chunking) | Comparacao de estrategias de chunking | Nao |
| [`keywords`](#krab-analyze-keywords) | Extracao de keywords via RAKE + TextRank | Nao |
| [`batch`](#krab-analyze-batch) | Analise em lote de um diretorio inteiro | Sim |

### Sistema de cache

Os comandos marcados com "Sim" na coluna Cache armazenam resultados localmente. Execucoes subsequentes no mesmo arquivo (sem alteracoes) retornam instantaneamente. Para forcar re-calculo, use a flag `--no-cache`. Para gerenciar o cache, use:

```bash
krab cache stats    # Ver estatisticas do cache
krab cache clear    # Limpar todo o cache
```

---

## krab analyze tokens

Conta tokens usando **tiktoken** e estima o custo de API para consumo da spec por modelos de IA.

### Sintaxe

```bash
krab analyze tokens <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Caminho para o arquivo de spec |
| `--encoding` | str | Nao | `cl100k_base` | Encoding do tokenizer: `cl100k_base` (GPT-4/Claude) ou `o200k_base` (GPT-4o) |
| `--no-cache` | bool | Nao | `false` | Pular cache e recalcular |

### Exemplo

```bash
$ krab analyze tokens spec.task.autenticacao.md
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Token Analysis — spec.task.autenticacao.md
╚══════════════════════════════════════════════════╝

┌─────────────────────── Token Summary ─────────────────────────────┐
│ characters              │ 12847                                   │
│ words                   │ 2148                                    │
│ tokens                  │ 3842                                    │
│ chars_per_token         │ 3.34                                    │
│ words_per_token         │ 0.56                                    │
│ encoding                │ cl100k_base                             │
└───────────────────────────────────────────────────────────────────┘

┌──────────────── Estimated Cost (per call) ────────────────────────┐
│ total_tokens            │ 3842                                    │
│ input_tokens            │ 3073                                    │
│ output_tokens           │ 769                                     │
│ input_cost_usd          │ 0.009219                                │
│ output_cost_usd         │ 0.011535                                │
│ total_cost_usd          │ 0.020754                                │
└───────────────────────────────────────────────────────────────────┘
```

#### Com encoding diferente

```bash
$ krab analyze tokens spec.task.autenticacao.md --encoding o200k_base --no-cache
```

Saida esperada:

```
┌─────────────────────── Token Summary ─────────────────────────────┐
│ characters              │ 12847                                   │
│ words                   │ 2148                                    │
│ tokens                  │ 3215                                    │
│ chars_per_token         │ 4.00                                    │
│ words_per_token         │ 0.67                                    │
│ encoding                │ o200k_base                              │
└───────────────────────────────────────────────────────────────────┘
```

:::tip Quando usar
Use `krab analyze tokens` para verificar se sua spec cabe na context window do modelo alvo. Se `tokens > context_window`, considere usar `krab optimize run` para comprimir.
:::

---

## krab analyze quality

Avalia a **densidade de informacao** e a **utilizacao do contexto** de uma spec. Mede quantos tokens unicos vs. repetidos existem e qual percentual da context window esta sendo utilizado.

### Sintaxe

```bash
krab analyze quality <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Caminho para o arquivo de spec |
| `--context-window` | int | Nao | `8192` | Tamanho da context window alvo |
| `--no-cache` | bool | Nao | `false` | Pular cache e recalcular |

### Exemplo

```bash
$ krab analyze quality spec.architecture.md --context-window 4096
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Quality Analysis — spec.architecture.md
╚══════════════════════════════════════════════════╝

┌─────────────────────── Context Quality ───────────────────────────┐
│ word_count              │ 1847                                    │
│ unique_words            │ 923                                     │
│ estimated_tokens        │ 2456                                    │
│ context_window          │ 4096                                    │
│ utilization_pct         │ 59.96                                   │
│ information_density     │ 0.4997                                  │
│ redundancy_ratio        │ 0.5003                                  │
│ density_grade           │ GOOD                                    │
└───────────────────────────────────────────────────────────────────┘
```

### Grades de densidade

| Grade | Densidade | Interpretacao |
|---|---|---|
| `EXCELLENT` | `>=` 0.70 | Vocabulario muito diverso, quase nenhuma repeticao |
| `GOOD` | `>=` 0.50 | Boa variedade de termos |
| `FAIR` | `>=` 0.30 | Repeticao moderada — considere deduplicar |
| `POOR` | `<` 0.30 | Alta redundancia — use `krab optimize run` |

:::tip Quando usar
Use `krab analyze quality` para diagnosticar se uma spec esta desperdicando tokens com repeticao. Se `density_grade` for `FAIR` ou `POOR`, execute `krab optimize run` ou `krab optimize dedup`.
:::

---

## krab analyze compare

Compara duas specs usando **4 metricas de similaridade** e reporta termos compartilhados e unicos.

### Sintaxe

```bash
krab analyze compare <file_a> <file_b>
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file_a` | Path | Sim | — | Primeira spec |
| `file_b` | Path | Sim | — | Segunda spec |

### Exemplo

```bash
$ krab analyze compare spec.task.login.md spec.task.registro.md
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Spec Comparison — spec.task.login.md vs spec.task.registro.md
╚══════════════════════════════════════════════════╝

┌─────────────────────── Similarity Scores ─────────────────────────┐
│ Jaccard                 │ 0.4523                                  │
│ Cosine                  │ 0.6187                                  │
│ N-gram Overlap          │ 0.3892                                  │
│ Combined                │ 0.5002                                  │
│ Verdict                 │ MODERATE_SIMILARITY                     │
└───────────────────────────────────────────────────────────────────┘

ℹ Shared terms: autenticacao, email, endpoint, password, request, response, sistema, token, usuario, validacao
ℹ Unique to A: jwt, login, sessao, expiracao, refresh, middleware
ℹ Unique to B: registro, cadastro, confirmacao, ativacao, nome, perfil
```

### Metricas explicadas

| Metrica | Formula | O que mede |
|---|---|---|
| **Jaccard** | \|A ∩ B\| / \|A ∪ B\| | Sobreposicao de vocabulario (conjuntos de palavras) |
| **Cosine** | (A . B) / (\|\|A\|\| x \|\|B\|\|) | Similaridade de vetores de frequencia de termos |
| **N-gram Overlap** | N-gramas compartilhados / min(N-gramas) | Similaridade estrutural (sequencias de 2 palavras) |
| **Combined** | Jaccard*0.3 + Cosine*0.4 + N-gram*0.3 | Score ponderado combinando as tres metricas |

### Vereditos

| Veredito | Score Combined | Significado |
|---|---|---|
| `DUPLICATE` | `>=` 0.90 | Specs praticamente identicas |
| `HIGH_SIMILARITY` | `>=` 0.70 | Muito conteudo compartilhado — considere consolidar |
| `MODERATE_SIMILARITY` | `>=` 0.40 | Alguma sobreposicao — podem compartilhar secoes base |
| `LOW_SIMILARITY` | `<` 0.40 | Specs tratam de assuntos distintos |

:::tip Quando usar
Use `krab analyze compare` antes de adicionar uma nova spec ao projeto para verificar se ja existe conteudo similar. Se o veredito for `HIGH_SIMILARITY` ou `DUPLICATE`, considere refatorar em uma spec base compartilhada.
:::

---

## krab analyze freq

Mostra a **tabela de frequencia de termos** da spec. Identifica palavras e identificadores (CamelCase, snake_case, kebab-case) que aparecem repetidamente.

### Sintaxe

```bash
krab analyze freq <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Caminho para o arquivo de spec |
| `--min-freq` | int | Nao | `2` | Frequencia minima para incluir |
| `--top` | int | Nao | `30` | Numero de termos a exibir |
| `--no-cache` | bool | Nao | `false` | Pular cache |

### Exemplo

```bash
$ krab analyze freq spec.task.crud.md --top 15 --min-freq 3
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Frequency Analysis — spec.task.crud.md
╚══════════════════════════════════════════════════╝

┌──────────── Top 15 Terms (min_freq=3) ────────────────────────────┐
│ endpoint                │ 34                                      │
│ usuario                 │ 28                                      │
│ request                 │ 22                                      │
│ response                │ 21                                      │
│ validacao               │ 18                                      │
│ database                │ 15                                      │
│ retornar                │ 14                                      │
│ implementar             │ 12                                      │
│ tabela                  │ 11                                      │
│ campo                   │ 10                                      │
│ status                  │ 9                                       │
│ error                   │ 8                                       │
│ listagem                │ 7                                       │
│ paginacao               │ 5                                       │
│ filtro                  │ 4                                       │
└───────────────────────────────────────────────────────────────────┘
```

:::tip Quando usar
Use `krab analyze freq` para identificar candidatos a compressao. Termos com alta frequencia sao os que mais economizam tokens quando recebem aliases via `krab optimize run`.
:::

---

## krab analyze entropy

Analisa a **entropia de Shannon**, **previsibilidade de Markov** e **perplexidade** do texto da spec. Mede o conteudo real de informacao vs. repeticao/boilerplate.

### Sintaxe

```bash
krab analyze entropy <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Caminho para o arquivo de spec |
| `--no-cache` | bool | Nao | `false` | Pular cache |

### Exemplo

```bash
$ krab analyze entropy spec.architecture.microservicos.md
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Entropy Analysis — spec.architecture.microservicos.md
╚══════════════════════════════════════════════════╝

┌────────────── Information Theory Metrics ─────────────────────────┐
│ Shannon Entropy (bits)  │ 5.8723                                  │
│ Entropy Grade           │ GOOD                                    │
│ Perplexity              │ 34.2100                                 │
│ Perplexity Grade        │ GOOD — balanced variety                 │
│ Markov Predictability   │ 0.4832                                  │
│ Predictability Grade    │ MODERATE                                │
│ Token Count             │ 2847                                    │
│ Unique Tokens           │ 892                                     │
│ Vocabulary Richness     │ 0.3133                                  │
└───────────────────────────────────────────────────────────────────┘

ℹ Top predictable patterns:
  the -> system (87%)
  must -> implement (82%)
  should -> return (79%)
  each -> service (75%)
  api -> endpoint (73%)
```

### Grades de entropia

A entropia de Shannon mede bits de informacao por token. O valor ideal para specs tecnicas fica entre 4.5 e 7.0 bits.

| Grade | Entropia | Interpretacao |
|---|---|---|
| `EXCELLENT` | `>=` 6.0 | Alto conteudo informacional, vocabulario muito diverso |
| `GOOD` | `>=` 4.5 | Boa variedade, equilibrio entre repeticao e diversidade |
| `FAIR` | `>=` 3.0 | Repeticao moderada, pode conter boilerplate |
| `LOW — high redundancy` | `<` 3.0 | Altamente repetitivo, muitas frases de template |
| `TOO_SHORT` | (`<` 10 tokens) | Texto muito curto para analise significativa |

### Grades de perplexidade

Perplexidade = 2^H (cross-entropy). Mede quao "surpreso" um modelo n-gram ficaria ao ler o texto.

| Grade | Perplexidade | Interpretacao |
|---|---|---|
| `HIGH — very diverse content` | `>=` 50 | Conteudo muito variado, possivelmente incoerente |
| `GOOD — balanced variety` | `>=` 20 | Equilibrio ideal para specs |
| `MODERATE — some repetition` | `>=` 8 | Alguma repeticao, mas aceitavel |
| `LOW — highly repetitive/boilerplate` | `<` 8 | Muito repetitivo, provavelmente boilerplate |

### Grades de previsibilidade Markov

Mede a probabilidade media de prever o proximo token dado o anterior (ordem 1 = bigram).

| Grade | Previsibilidade | Interpretacao |
|---|---|---|
| `HIGHLY_PREDICTABLE — boilerplate heavy` | `>=` 0.80 | Quase todo o texto segue padroes previsiveis |
| `PREDICTABLE — some redundancy` | `>=` 0.60 | Estrutura repetitiva moderada |
| `MODERATE` | `>=` 0.40 | Equilibrio saudavel |
| `LOW_PREDICTABILITY — good variety` | `<` 0.40 | Texto variado e informativo |

:::tip Quando usar
Use `krab analyze entropy` para diagnosticar se sua spec esta cheia de boilerplate. Se a grade for `FAIR` ou `LOW`, considere reescrever secoes repetitivas ou usar `krab optimize run` para comprimir.
:::

---

## krab analyze readability

Calcula **4 indices de legibilidade** consagrados na linguistica computacional, adaptados para documentacao tecnica.

### Sintaxe

```bash
krab analyze readability <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Caminho para o arquivo de spec |
| `--no-cache` | bool | Nao | `false` | Pular cache |

### Exemplo

```bash
$ krab analyze readability spec.task.autenticacao.md
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Readability Analysis — spec.task.autenticacao.md
╚══════════════════════════════════════════════════╝

┌─────────────────────── Readability Scores ────────────────────────┐
│ Flesch-Kincaid Grade    │ 12.40                                   │
│ Flesch Reading Ease     │ 38.72                                   │
│ Coleman-Liau Index      │ 14.18                                   │
│ Gunning Fog Index       │ 15.33                                   │
│ ARI Score               │ 13.87                                   │
│ Avg Words/Sentence      │ 18.3                                    │
│ Complex Word %          │ 24.7                                    │
│ Overall Grade           │ MODERATE                                │
└───────────────────────────────────────────────────────────────────┘

ℹ Recommendation: Spec readability is appropriate for technical documentation.
```

### Explicacao de cada metrica

#### Flesch-Kincaid Grade Level

```
FK = 0.39 * (palavras/sentencas) + 11.8 * (silabas/palavras) - 15.59
```

Estima o nivel escolar americano necessario para compreender o texto. Para specs tecnicas, valores entre 10-14 sao normais. Acima de 16 indica complexidade excessiva.

#### Flesch Reading Ease

```
FRE = 206.835 - 1.015 * (palavras/sentencas) - 84.6 * (silabas/palavras)
```

Escala de 0-100, onde maior = mais facil de ler:

| Score | Nivel |
|---|---|
| 90-100 | Muito facil |
| 60-70 | Padrao |
| 30-50 | Dificil |
| 0-30 | Muito confuso |

#### Gunning Fog Index

```
GFI = 0.4 * ((palavras/sentencas) + 100 * (palavras_complexas/palavras))
```

Palavras complexas = 3+ silabas. Bom para detectar jargao excessivo. Abaixo de 12 = legivel, 12-16 = aceitavel, acima de 16 = dificil.

#### Coleman-Liau Index

```
CLI = 0.0588 * L - 0.296 * S - 15.8
(L = letras por 100 palavras, S = sentencas por 100 palavras)
```

Baseado em contagem de caracteres (nao silabas) — mais confiavel para texto tecnico com siglas e abreviacoes.

#### ARI (Automated Readability Index)

```
ARI = 4.71 * (caracteres/palavras) + 0.5 * (palavras/sentencas) - 21.43
```

Baseado em caracteres como Coleman-Liau. Bom para documentacao tecnica com muitos termos em codigo.

### Grades gerais

| Grade | Media dos indices | Recomendacao |
|---|---|---|
| `EASY` | `<=` 10 | Texto simples, possivelmente faltando detalhes tecnicos |
| `MODERATE` | `<=` 14 | Nivel ideal para specs tecnicas |
| `COMPLEX` | `<=` 18 | Considere simplificar sentencas longas |
| `VERY_COMPLEX` | `>` 18 | Reescrever — reduzir jargao e sentencas longas |

:::tip Quando usar
Use `krab analyze readability` para garantir que agentes de IA conseguem processar sua spec sem confusao. Specs com grade `COMPLEX` ou `VERY_COMPLEX` correlacionam com maior risco de alucinacao.
:::

---

## krab analyze ambiguity

Detecta **termos vagos e ambiguos** que aumentam o risco de alucinacao quando specs sao consumidas por agentes de IA. Verifica um dicionario de 90+ termos problematicos em ingles e portugues, alem de padroes fracos (TBD, TODO, FIXME, double hedging).

### Sintaxe

```bash
krab analyze ambiguity <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Caminho para o arquivo de spec |
| `--top` | int | Nao | `20` | Numero maximo de findings a exibir |

### Exemplo

```bash
$ krab analyze ambiguity spec.task.pagamentos.md --top 10
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Ambiguity Analysis — spec.task.pagamentos.md
╚══════════════════════════════════════════════════╝

┌─────────────────────── Precision Metrics ─────────────────────────┐
│ Precision Score         │ 72.34                                   │
│ Grade                   │ GOOD                                    │
│ Total Words             │ 1847                                    │
│ Ambiguous Terms Found   │ 23                                      │
│ HIGH Severity           │ 4                                       │
│ MEDIUM Severity         │ 8                                       │
│ LOW Severity            │ 11                                      │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────── Ambiguity Findings ────────────────────────┐
│ #    │ Term          │ Line  │ Severity │ Suggestion              │
│ 1    │ TBD           │ 45    │ HIGH     │ Define or create a      │
│      │               │       │          │ follow-up ticket        │
│ 2    │ etc           │ 23    │ HIGH     │ List all items          │
│      │               │       │          │ explicitly              │
│ 3    │ etc           │ 67    │ HIGH     │ List all items          │
│      │               │       │          │ explicitly              │
│ 4    │ TODO          │ 112   │ HIGH     │ Resolve before spec     │
│      │               │       │          │ is finalized            │
│ 5    │ approximately │ 34    │ MEDIUM   │ Specify exact value     │
│      │               │       │          │ or range                │
│ 6    │ several       │ 56    │ MEDIUM   │ Specify exact number    │
│ 7    │ might         │ 78    │ MEDIUM   │ Use 'must' or 'should'  │
│      │               │       │          │ with conditions         │
│ 8    │ soon          │ 89    │ MEDIUM   │ Specify deadline or SLA │
│ 9    │ appropriate   │ 15    │ LOW      │ Specify exact conditions│
│ 10   │ properly      │ 92    │ LOW      │ Define validation       │
│      │               │       │          │ criteria                │
└───────────────────────────────────────────────────────────────────┘

ℹ Fix 4 high-severity issues first (TBD, etc, vague placeholders). Most frequent issue: 'etc' appears 3x.
```

### Categorias de severidade

| Severidade | Exemplos de termos | Por que e arriscado |
|---|---|---|
| **HIGH** | `etc`, `TBD`, `TODO`, `FIXME`, `HACK`, `stuff`, `whatever` | Termos que criam lacunas diretas no conhecimento do agente |
| **MEDIUM** | `might`, `could`, `probably`, `approximately`, `several`, `various`, `soon`, `eventually` | Hedging e imprecisao que permitem ao agente inventar detalhes |
| **LOW** | `appropriate`, `properly`, `efficiently`, `scalable`, `robust`, `intuitive` | Termos subjetivos que cada agente pode interpretar diferente |

### Grades de precisao

| Grade | Score | Condicao |
|---|---|---|
| `EXCELLENT` | `>=` 90 | Pouquissimos termos ambiguos |
| `GOOD` | `>=` 75 | Spec precisa com poucos problemas |
| `FAIR` | `>=` 50 | Repeticao moderada de termos vagos |
| `POOR` | `<` 50 ou > 5 HIGH | Muitos termos problematicos — alto risco de alucinacao |

:::tip Quando usar
Execute `krab analyze ambiguity` antes de enviar uma spec para um agente de IA. Corrija todos os findings de severidade HIGH — cada `etc`, `TBD` ou `TODO` e um ponto onde o agente vai inventar informacao.
:::

---

## krab analyze substrings

Encontra **frases repetidas** no texto que desperdicam tokens. Usa duas tecnicas: suffix arrays para substrings exatas e contagem de n-gramas para frases multi-palavra.

### Sintaxe

```bash
krab analyze substrings <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Caminho para o arquivo de spec |
| `--min-words` | int | Nao | `3` | Minimo de palavras por frase |
| `--top` | int | Nao | `20` | Numero maximo de resultados |

### Exemplo

```bash
$ krab analyze substrings spec.task.crud.md --min-words 3 --top 10
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Repeated Substring Analysis — spec.task.crud.md
╚══════════════════════════════════════════════════╝

┌─────────────────────── Waste Summary ─────────────────────────────┐
│ repeated_substrings     │ 12                                      │
│ repeated_phrases        │ 18                                      │
│ char_waste_substrings   │ 1847                                    │
│ char_waste_phrases      │ 923                                     │
│ estimated_token_savings │ 692                                     │
│ text_length             │ 12847                                   │
│ waste_pct               │ 14.37                                   │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────── Repeated Phrases ──────────────────────────┐
│ #    │ Phrase                                 │ Count │ Savings   │
│ 1    │ o sistema deve implementar             │ 8     │ 196 chars │
│ 2    │ retornar status code                   │ 7     │ 126 chars │
│ 3    │ validar os campos obrigatorios         │ 5     │ 120 chars │
│ 4    │ endpoint deve aceitar                  │ 6     │ 110 chars │
│ 5    │ em caso de erro                        │ 9     │ 96 chars  │
│ 6    │ com paginacao e filtros                │ 4     │ 84 chars  │
│ 7    │ deve ser implementado                  │ 5     │ 80 chars  │
│ 8    │ campo obrigatorio do tipo              │ 4     │ 72 chars  │
│ 9    │ conforme especificado na secao         │ 3     │ 64 chars  │
│ 10   │ resposta de sucesso                    │ 4     │ 48 chars  │
└───────────────────────────────────────────────────────────────────┘
```

A coluna **Savings** mostra quantos caracteres seriam economizados se a frase fosse substituida por um alias curto (ex: `$ab`). O calculo e: `(comprimento - 4) * (contagem - 1)`.

:::tip Quando usar
Use `krab analyze substrings` para encontrar candidatos a aliases antes de executar `krab optimize run`. Se `waste_pct` for acima de 10%, a spec tem espaco significativo para compressao.
:::

---

## krab analyze risk

Calcula um **score de risco de alucinacao** (0-100) combinando 6 fatores de qualidade ponderados. Este e o comando mais abrangente — internamente executa analise de ambiguidade, densidade, entropia, legibilidade, completude e overflow de contexto.

### Sintaxe

```bash
krab analyze risk <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Caminho para o arquivo de spec |
| `--context-window` | int | Nao | `8192` | Tamanho da context window alvo |

### Exemplo

```bash
$ krab analyze risk spec.task.autenticacao.md --context-window 4096
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Hallucination Risk Assessment — spec.task.autenticacao.md
╚══════════════════════════════════════════════════╝

┌─────────────────────── Risk Overview ─────────────────────────────┐
│ Overall Risk Score      │ 28.45/100                               │
│ Risk Level              │ MODERATE                                │
│ Safe for Agents         │ Yes                                     │
│ Spec Word Count         │ 2148                                    │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────── Risk Factors ──────────────────────────────┐
│ Factor                  │ Score  │ Weight │ Severity  │ Detail    │
│ Ambiguity               │ 0.35   │ 0.25   │ MEDIUM    │ 12 vague  │
│                         │        │        │           │ terms (3  │
│                         │        │        │           │ high-sev) │
│ Information Density     │ 0.22   │ 0.15   │ MEDIUM    │ Density:  │
│                         │        │        │           │ 0.500,    │
│                         │        │        │           │ Redundancy│
│                         │        │        │           │ : 0.500   │
│ Entropy Balance         │ 0.10   │ 0.15   │ LOW       │ Entropy:  │
│                         │        │        │           │ 5.87 bits,│
│                         │        │        │           │ Predict.: │
│                         │        │        │           │ 0.483     │
│ Readability             │ 0.15   │ 0.15   │ LOW       │ FK Grade: │
│                         │        │        │           │ 12.4, Fog:│
│                         │        │        │           │ 15.3,     │
│                         │        │        │           │ Ease: 38.7│
│ Structural Completeness │ 0.30   │ 0.15   │ MEDIUM    │ Missing:  │
│                         │        │        │           │ API docs  │
│ Context Overflow        │ 0.30   │ 0.15   │ MEDIUM    │ Util.:    │
│                         │        │        │           │ 91.2% of  │
│                         │        │        │           │ 4096 toks │
└───────────────────────────────────────────────────────────────────┘

⚠ Replace vague terms (etc, TBD, some) with specific values
⚠ Add missing sections (requirements, architecture, API docs)
```

### Os 6 fatores de risco

Cada fator recebe um score de 0.0 a 1.0 (maior = mais risco) e um peso que define sua contribuicao para o score final.

| # | Fator | Peso | O que avalia | Como e calculado |
|---|---|---|---|---|
| 1 | **Ambiguity** | 0.25 | Termos vagos (etc, TBD, various...) | `min(termos_ambiguos / total_palavras * 15, 1.0)` |
| 2 | **Information Density** | 0.15 | Conteudo de preenchimento que gasta contexto | `max(0, 1 - density * 1.5)` — baixa densidade = alto risco |
| 3 | **Entropy Balance** | 0.15 | Repeticao excessiva OU incoerencia | Faixas: `<3` bits = 0.7, 3-4 = 0.3, 4-7 = 0.1, `>7` = 0.5 |
| 4 | **Readability** | 0.15 | Complexidade excessiva confunde modelos | FK Grade: `>18` = 0.8, `>14` = 0.4, `>10` = 0.15, `<=10` = 0.05 |
| 5 | **Structural Completeness** | 0.15 | Secoes faltantes geram alucinacao de preenchimento | Verifica presenca de Requirements, Architecture, API + TBD/TODO |
| 6 | **Context Overflow** | 0.15 | Spec grande demais perde informacao na truncagem | Utilization `>100%` = `min((util - 1.0) * 2, 1.0)`, `>90%` = 0.3 |

### Formula do score final

```
overall_score = sum(fator.score * fator.weight) * 100
```

### Niveis de risco

| Nivel | Score | Interpretacao | `safe_for_agents` |
|---|---|---|---|
| `LOW` | `<` 20 | Spec segura para agentes de IA | `Yes` |
| `MODERATE` | 20-40 | Aceitavel, mas com pontos de atencao | `Yes` |
| `HIGH` | 40-60 | Risco significativo — recomendado corrigir antes de usar | `No` |
| `CRITICAL` | `>=` 60 | Spec provavelmente causara alucinacoes | `No` |

### Severidade por fator

| Score do fator | Severidade |
|---|---|
| `>=` 0.70 | `CRITICAL` |
| `>=` 0.40 | `HIGH` |
| `>=` 0.20 | `MEDIUM` |
| `<` 0.20 | `LOW` |

:::tip Quando usar
`krab analyze risk` e o comando mais completo para avaliar uma spec antes de enviar para producao. Execute-o como ultimo passo de validacao. Se o score for >= 40 (HIGH ou CRITICAL), corrija os fatores de maior peso primeiro (Ambiguity tem peso 0.25 — comece por ai).
:::

---

## krab analyze chunking

Compara **4 estrategias de chunking** para determinar a melhor forma de dividir uma spec quando ela precisa ser segmentada para caber em context windows menores.

### Sintaxe

```bash
krab analyze chunking <file>
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Caminho para o arquivo de spec |

### Exemplo

```bash
$ krab analyze chunking spec.plan.mvp.md
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Chunking Strategy Comparison — spec.plan.mvp.md
╚══════════════════════════════════════════════════╝

┌─────────────────── Strategy Comparison ───────────────────────────┐
│ Strategy       │ Chunks │ Avg Tokens │ Min  │ Max  │ Coherence │ Verdict           │
│ semantic       │ 12     │ 342        │ 87   │ 612  │ 0.623     │ RECOMMENDED —     │
│                │        │            │      │      │           │ Score: 0.712      │
│ heading        │ 8      │ 513        │ 124  │ 987  │ 0.587     │ Score: 0.658      │
│ paragraph      │ 24     │ 171        │ 12   │ 445  │ 0.412     │ Score: 0.502      │
│ fixed_size     │ 10     │ 384        │ 342  │ 412  │ 0.345     │ Score: 0.489      │
└───────────────────────────────────────────────────────────────────┘
```

### Estrategias disponiveis

| Estrategia | Como divide | Melhor para |
|---|---|---|
| **heading** | Por headings Markdown (`#{1,4}`) | Specs bem estruturadas com secoes claras |
| **paragraph** | Por linhas em branco duplas (`\n\n`) | Specs com paragrafos independentes |
| **semantic** | Por headings + code blocks + mudancas de topico | Specs com codigo e topicos variados |
| **fixed_size** | Chunks de tamanho fixo (512 tokens) com 20% overlap | Specs sem estrutura clara |

### Metricas explicadas

- **Chunks**: Numero total de pedacos gerados
- **Avg Tokens**: Media de tokens por chunk (estimativa: ~4 chars/token)
- **Min/Max**: Menor e maior chunk em tokens
- **Coherence**: Score de coerencia (0-1) — mede sobreposicao de vocabulario entre chunks adjacentes e auto-suficiencia de cada chunk
- **Verdict**: Score combinado = coherence * 0.6 + uniformity * 0.4

:::tip Quando usar
Use `krab analyze chunking` quando sua spec e grande demais para uma unica context window e voce precisa decidir como dividi-la. A estrategia `RECOMMENDED` e a que melhor preserva o contexto em cada pedaco.
:::

---

## krab analyze keywords

Extrai os termos-chave mais importantes usando dois algoritmos complementares: **RAKE** (Rapid Automatic Keyword Extraction) e **TextRank** (baseado em PageRank).

### Sintaxe

```bash
krab analyze keywords <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Caminho para o arquivo de spec |
| `--top` | int | Nao | `20` | Numero de keywords a exibir |

### Exemplo

```bash
$ krab analyze keywords spec.architecture.microservicos.md --top 10
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Keyword Extraction — spec.architecture.microservicos.md
╚══════════════════════════════════════════════════╝

┌─────────────────────── RAKE Keywords ─────────────────────────────┐
│ #    │ Keyword Phrase                   │ Score   │ Freq          │
│ 1    │ message broker rabbitmq          │ 9.67    │ 3             │
│ 2    │ api gateway authentication       │ 8.33    │ 4             │
│ 3    │ service discovery consul         │ 7.50    │ 2             │
│ 4    │ circuit breaker pattern          │ 7.00    │ 5             │
│ 5    │ distributed tracing              │ 5.50    │ 3             │
│ 6    │ load balancer                    │ 4.00    │ 6             │
│ 7    │ health check endpoint            │ 3.67    │ 4             │
│ 8    │ database migration               │ 3.50    │ 3             │
│ 9    │ rate limiting                    │ 3.00    │ 7             │
│ 10   │ container orchestration          │ 3.00    │ 2             │
└───────────────────────────────────────────────────────────────────┘

ℹ Top sentences by TextRank:
  [0.087] Each microservice must implement a health check endpoint that returns...
  [0.072] The API gateway handles authentication, rate limiting, and request ro...
  [0.065] Service discovery is managed by Consul with automatic registration on...
  [0.058] All inter-service communication uses RabbitMQ as the message broker w...
  [0.051] Circuit breaker pattern must be implemented for all external service c...
```

### Como os algoritmos funcionam

#### RAKE (Rapid Automatic Keyword Extraction)

1. **Tokenizacao**: Texto e dividido em sentencas
2. **Delimitacao**: Stop words (a, the, is, of, ...) servem como delimitadores de frases candidatas
3. **Scoring por palavra**: `score(w) = (degree(w) + freq(w)) / freq(w)` onde degree e a soma dos co-ocorrentes
4. **Scoring por frase**: Soma dos scores das palavras componentes
5. **Ranking**: Frases ordenadas por score decrescente

#### TextRank (para sentencas)

1. **Grafo**: Cada sentenca e um no
2. **Arestas**: Peso = sobreposicao de vocabulario entre sentencas (Jaccard simplificado)
3. **PageRank**: Iteracao com damping factor 0.85, 30 iteracoes
4. **Resultado**: Sentencas mais "centrais" no grafo de topicos

:::tip Quando usar
Use `krab analyze keywords` para identificar os conceitos centrais de uma spec. Isso e util para: (1) criar resumos comprimidos, (2) validar que os termos-chave estao presentes, (3) comparar o foco de diferentes specs.
:::

---

## krab analyze batch

Executa uma analise em **todos os arquivos** de um diretorio, gerando uma tabela comparativa. Suporta cache — execucoes repetidas em arquivos inalterados sao instantaneas.

### Sintaxe

```bash
krab analyze batch <directory> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `directory` | Path | Sim | — | Diretorio contendo arquivos de spec |
| `-a`, `--analysis` | str | Nao | `"tokens"` | Tipo de analise: `tokens`, `quality`, `entropy`, `readability` |
| `-p`, `--pattern` | str | Nao | `"*.md"` | Glob pattern para filtrar arquivos |
| `--context-window` | int | Nao | `8192` | Context window (para `quality`) |
| `--encoding` | str | Nao | `"cl100k_base"` | Encoding do tokenizer (para `tokens`) |
| `--no-cache` | bool | Nao | `false` | Pular cache |

### Exemplo: Batch de tokens

```bash
$ krab analyze batch specs/ -a tokens
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Batch Analysis — tokens | 6 files in specs/
╚══════════════════════════════════════════════════╝

┌────────────── Token Analysis (6 files) ───────────────────────────┐
│ File                       │ Chars  │ Words │ Tokens │ Chars/Tok │ Cost (USD) │
│ spec.task.autenticacao.md  │ 12847  │ 2148  │ 3842   │ 3.3       │ $0.0208    │
│ spec.task.pagamentos.md    │ 8432   │ 1423  │ 2567   │ 3.3       │ $0.0139    │
│ spec.task.crud.md          │ 15200  │ 2534  │ 4312   │ 3.5       │ $0.0233    │
│ spec.architecture.md       │ 9876   │ 1647  │ 2945   │ 3.4       │ $0.0159    │
│ spec.plan.mvp.md           │ 21340  │ 3567  │ 6234   │ 3.4       │ $0.0337    │
│ spec.skill.deploy.md       │ 4523   │ 756   │ 1345   │ 3.4       │ $0.0073    │
└───────────────────────────────────────────────────────────────────┘

ℹ Total tokens: 21,245
```

### Exemplo: Batch de quality

```bash
$ krab analyze batch specs/ -a quality --context-window 4096
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Batch Analysis — quality | 6 files in specs/
╚══════════════════════════════════════════════════╝

┌────────────── Quality Analysis (6 files) ─────────────────────────┐
│ File                       │ Words │ Tokens │ Util % │ Density │ Redundancy │ Grade     │
│ spec.task.autenticacao.md  │ 2148  │ 2857   │ 69.8   │ 0.320   │ 0.680      │ FAIR      │
│ spec.task.pagamentos.md    │ 1423  │ 1893   │ 46.2   │ 0.412   │ 0.588      │ FAIR      │
│ spec.task.crud.md          │ 2534  │ 3370   │ 82.3   │ 0.287   │ 0.713      │ POOR      │
│ spec.architecture.md       │ 1647  │ 2191   │ 53.5   │ 0.523   │ 0.477      │ GOOD      │
│ spec.plan.mvp.md           │ 3567  │ 4744   │ 100.0  │ 0.345   │ 0.655      │ FAIR      │
│ spec.skill.deploy.md       │ 756   │ 1006   │ 24.6   │ 0.634   │ 0.366      │ GOOD      │
└───────────────────────────────────────────────────────────────────┘
```

### Exemplo: Batch de entropy

```bash
$ krab analyze batch specs/ -a entropy
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Batch Analysis — entropy | 6 files in specs/
╚══════════════════════════════════════════════════╝

┌────────────── Entropy Analysis (6 files) ─────────────────────────┐
│ File                       │ Entropy │ Grade     │ Perplexity │ Predict. │ Vocab Rich. │
│ spec.task.autenticacao.md  │ 5.87    │ GOOD      │ 34.21      │ 0.483    │ 0.313       │
│ spec.task.pagamentos.md    │ 6.12    │ EXCELLENT │ 41.87      │ 0.412    │ 0.387       │
│ spec.task.crud.md          │ 4.23    │ FAIR      │ 15.43      │ 0.612    │ 0.245       │
│ spec.architecture.md       │ 6.45    │ EXCELLENT │ 48.32      │ 0.387    │ 0.445       │
│ spec.plan.mvp.md           │ 5.34    │ GOOD      │ 28.76      │ 0.523    │ 0.298       │
│ spec.skill.deploy.md       │ 5.98    │ GOOD      │ 36.54      │ 0.445    │ 0.412       │
└───────────────────────────────────────────────────────────────────┘
```

### Exemplo: Batch de readability

```bash
$ krab analyze batch specs/ -a readability
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Batch Analysis — readability | 6 files in specs/
╚══════════════════════════════════════════════════╝

┌────────────── Readability Analysis (6 files) ─────────────────────┐
│ File                       │ FK Grade │ Ease  │ Fog   │ ARI   │ Grade     │
│ spec.task.autenticacao.md  │ 12.4     │ 38.7  │ 15.3  │ 13.9  │ MODERATE  │
│ spec.task.pagamentos.md    │ 11.2     │ 42.1  │ 13.8  │ 12.4  │ MODERATE  │
│ spec.task.crud.md          │ 10.8     │ 44.5  │ 12.9  │ 11.7  │ MODERATE  │
│ spec.architecture.md       │ 14.7     │ 31.2  │ 17.4  │ 15.8  │ COMPLEX   │
│ spec.plan.mvp.md           │ 13.1     │ 35.8  │ 16.2  │ 14.3  │ MODERATE  │
│ spec.skill.deploy.md       │ 9.8      │ 48.3  │ 11.5  │ 10.2  │ EASY      │
└───────────────────────────────────────────────────────────────────┘
```

### Filtrando por glob pattern

Para analisar apenas specs de task:

```bash
$ krab analyze batch specs/ -a tokens -p "spec.task.*.md"
```

Para analisar arquivos YAML:

```bash
$ krab analyze batch specs/ -a tokens -p "*.yaml"
```

:::tip Quando usar
Use `krab analyze batch` para ter uma visao geral de todas as specs do projeto em uma unica tabela. E ideal para:
- **Auditoria**: Identificar specs com problemas (grade POOR, entropy LOW)
- **Budget**: Somar tokens totais e estimar custo de todas as specs
- **Priorizacao**: Encontrar quais specs precisam de otimizacao primeiro (alta redundancia, baixa densidade)
- **CI/CD**: Integrar em pipelines para validar qualidade minima de specs
:::

---

## Guia de uso pratico

### Fluxo recomendado de analise

Para avaliar e otimizar uma spec, siga esta ordem:

```bash
# 1. Visao geral rapida — tokens e custo
krab analyze tokens minha-spec.md

# 2. Qualidade — densidade e redundancia
krab analyze quality minha-spec.md

# 3. Termos problematicos — ambiguidade e risco
krab analyze ambiguity minha-spec.md

# 4. Avaliacao completa de risco
krab analyze risk minha-spec.md

# 5. Se necessario, otimizar
krab optimize run minha-spec.md
```

### Comparando antes e depois da otimizacao

```bash
# Antes
krab analyze tokens spec.original.md
krab analyze risk spec.original.md

# Otimizar
krab optimize run spec.original.md -o spec.optimized.md

# Depois
krab analyze tokens spec.optimized.md
krab analyze risk spec.optimized.md
```

### Auditoria de projeto inteiro

```bash
# Visao geral de todos os arquivos
krab analyze batch specs/ -a tokens
krab analyze batch specs/ -a quality
krab analyze batch specs/ -a readability
krab analyze batch specs/ -a entropy

# Encontrar duplicatas entre specs
krab analyze compare spec-a.md spec-b.md
```
