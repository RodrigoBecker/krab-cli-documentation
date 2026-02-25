---
sidebar_position: 4
title: search — Busca
---

# search — Busca e Indexacao de Specs

O grupo de comandos `krab search` fornece ferramentas de busca, deteccao de duplicatas e otimizacao de budget de tokens sobre um corpus de specs. Todos os subcomandos operam sobre um diretorio contendo arquivos `.md`.

```bash
krab search --help
```

---

## krab search bm25

Realiza busca ranqueada sobre um diretorio de specs utilizando o algoritmo **BM25** (Best Matching 25), considerado superior ao TF-IDF classico para ranking de relevancia de documentos.

### Sintaxe

```bash
krab search bm25 <directory> -q <query> [--top N]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `directory` | `Path` | Sim | — | Diretorio contendo arquivos `.md` |
| `-q` / `--query` | `string` | Sim | — | Texto da busca (query) |
| `--top` | `int` | Nao | `10` | Numero maximo de resultados retornados |

### Como o BM25 Funciona

O BM25 e um algoritmo de ranking probabilistico que resolve duas limitacoes fundamentais do TF-IDF:

#### 1. Saturacao de Term Frequency (parametro `k1`)

No TF-IDF, se um termo aparece 10 vezes em um documento, ele recebe um score 10x maior do que um documento onde o termo aparece 1 vez. Isso e desproporcional — a segunda ocorrencia de um termo e muito mais informativa do que a decima.

O BM25 aplica **saturacao logaritmica** controlada pelo parametro `k1` (default: `1.5`):

```
TF_BM25 = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dl / avgdl)))
```

Conforme `tf` (term frequency) aumenta, o ganho marginal diminui e converge para `k1 + 1`. Isso significa que um documento com 3 ocorrencias de "autenticacao" nao e dramaticamente melhor que um com 2 ocorrencias.

#### 2. Normalizacao por Tamanho do Documento (parametro `b`)

Documentos longos naturalmente contem mais termos. Sem normalizacao, eles seriam sempre favorecidos. O parametro `b` (default: `0.75`) controla o grau de normalizacao:

- `b = 0` — sem normalizacao (documentos longos sao favorecidos)
- `b = 1` — normalizacao total (comprimento e completamente compensado)
- `b = 0.75` — equilibrio recomendado

A normalizacao compara o comprimento do documento (`dl`) com a media do corpus (`avgdl`).

#### 3. IDF com Smoothing

O componente IDF (Inverse Document Frequency) penaliza termos que aparecem em muitos documentos (pouco discriminativos):

```
IDF = log((N - df + 0.5) / (df + 0.5) + 1)
```

Onde `N` e o total de documentos e `df` e o numero de documentos contendo o termo.

### Tokenizacao

O Krab CLI utiliza tokenizacao propria que:

- Converte texto para **lowercase**
- Extrai palavras via regex (`\b\w+\b`)
- Remove **stop words** em ingles (the, a, is, are, to, of, in, for, etc.)
- Filtra palavras com menos de 2 caracteres

### Exemplo Completo

Imagine um diretorio `specs/` com 5 specs de um projeto:

```bash
krab search bm25 specs/ -q "autenticacao JWT refresh token" --top 5
```

**Saida:**

```
╭─────────────────────────────────────────────────────╮
│  BM25 Search                                        │
│  Query: 'autenticacao JWT refresh token' in 5 specs │
╰─────────────────────────────────────────────────────╯

 Index Stats
┌───────────────────┬───────┐
│ total_documents   │ 5     │
│ total_terms       │ 1,847 │
│ avg_doc_length    │ 412.3 │
│ min_doc_length    │ 198   │
│ max_doc_length    │ 723   │
└───────────────────┴───────┘

 Search Results
┌──────┬──────────────────────────────────┬─────────┬───────────────────────────┬────────┐
│ Rank │ Spec                             │ Score   │ Matched Terms             │ Length │
├──────┼──────────────────────────────────┼─────────┼───────────────────────────┼────────┤
│ 1    │ spec.architecture.auth-system.md │ 12.431  │ jwt, refresh, token       │ 723    │
│ 2    │ spec.task.login-flow.md          │ 8.217   │ jwt, token                │ 456    │
│ 3    │ spec.task.user-management.md     │ 3.892   │ token                     │ 312    │
│ 4    │ spec.architecture.api-gateway.md │ 2.104   │ jwt                       │ 598    │
│ 5    │ spec.plan.sprint-03.md           │ 0.987   │ token                     │ 198    │
└──────┴──────────────────────────────────┴─────────┴───────────────────────────┴────────┘
```

### Interpretacao dos Resultados

- **Rank**: Posicao no ranking (1 = mais relevante)
- **Score**: Score BM25 combinado (IDF * TF normalizado para cada termo da query). Valores maiores indicam maior relevancia
- **Matched Terms**: Quais termos da query foram encontrados no documento (apos tokenizacao e remoção de stop words)
- **Length**: Numero de tokens no documento (apos tokenizacao)

### Casos de Uso

```bash
# Encontrar specs que falam sobre "deploy kubernetes"
krab search bm25 .specify/ -q "deploy kubernetes cluster scaling"

# Busca focada nos top 3 resultados
krab search bm25 .specify/ -q "validacao de input sanitizacao" --top 3

# Buscar em subdiretorio especifico
krab search bm25 .specify/architecture/ -q "event sourcing CQRS"
```

---

## krab search duplicates

Detecta **near-duplicates** (documentos quase identicos) em um corpus de specs utilizando a combinacao de **MinHash** + **Locality-Sensitive Hashing (LSH)**. A complexidade e **O(n)**, tornando-o escalavel mesmo para centenas de specs.

### Sintaxe

```bash
krab search duplicates <directory> [--threshold T]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `directory` | `Path` | Sim | — | Diretorio contendo arquivos `.md` |
| `--threshold` | `float` | Nao | `0.5` | Similaridade minima de Jaccard (0.0 a 1.0) |

### Como MinHash + LSH Funciona

#### Problema

Comparar todos os pares de documentos para encontrar duplicatas e **O(n^2)** — inviavel para corpus grandes. Se voce tem 100 specs, sao 4.950 comparacoes. Com 1.000 specs, sao 499.500.

#### Solucao: MinHash Signatures

O MinHash comprime cada documento em uma **assinatura compacta** (fingerprint) que preserva a informacao de similaridade:

1. **Shingling**: O texto e dividido em **word-level shingles** (bigramas de palavras). Por exemplo, "o sistema deve validar" gera os shingles: `{"o sistema", "sistema deve", "deve validar"}`

2. **Hash Permutations**: Cada shingle e processado por 128 funcoes hash independentes (parametro `num_perm`). Para cada funcao hash, o **valor minimo** entre todos os shingles e mantido

3. **Signature**: O resultado e um vetor de 128 inteiros — a assinatura MinHash do documento

A propriedade fundamental e:

```
P(sig_a[i] == sig_b[i]) ≈ Jaccard(A, B)
```

Ou seja, a fracao de posicoes iguais entre duas assinaturas **estima a similaridade de Jaccard** entre os conjuntos originais de shingles.

#### LSH Bands: Reducao de Candidatos

Comparar todas as assinaturas ainda seria O(n^2). O LSH resolve isso dividindo cada assinatura em **bands** (bandas):

- 128 permutacoes / 16 bands = 8 rows por band
- Cada band e hasheada independentemente para um bucket
- Documentos que compartilham **pelo menos 1 band identica** sao candidatos a duplicata

Isso significa que:
- Pares com similaridade **alta** tem alta probabilidade de cair no mesmo bucket em pelo menos uma band
- Pares com similaridade **baixa** quase nunca compartilham um bucket
- Apenas os **pares candidatos** sao verificados com a comparacao completa

#### Jaccard Similarity

A metrica final e a **similaridade de Jaccard**, definida como:

```
J(A, B) = |A ∩ B| / |A ∪ B|
```

Onde A e B sao os conjuntos de shingles de cada documento:

- `J = 0.0` — documentos completamente diferentes
- `J = 0.5` — 50% dos shingles sao compartilhados (threshold default)
- `J = 1.0` — documentos identicos

### Exemplo Completo

```bash
krab search duplicates specs/ --threshold 0.6
```

**Saida:**

```
╭──────────────────────────────────────────────────╮
│  MinHash + LSH Duplicate Detection               │
│  8 specs, threshold=0.6                          │
╰──────────────────────────────────────────────────╯

 Near-Duplicate Pairs
┌──────────────────────────────────┬──────────────────────────────────┬────────────┐
│ Spec A                           │ Spec B                           │ Similarity │
├──────────────────────────────────┼──────────────────────────────────┼────────────┤
│ spec.task.login-v1.md            │ spec.task.login-v2.md            │ 87.50%     │
│ spec.task.user-crud.md           │ spec.task.admin-crud.md          │ 72.66%     │
│ spec.architecture.api-v1.md      │ spec.architecture.api-v2.md      │ 64.84%     │
└──────────────────────────────────┴──────────────────────────────────┴────────────┘
```

### Interpretacao do Threshold

| Threshold | Significado | Quando Usar |
|-----------|-------------|-------------|
| `0.3` | Similaridade baixa — captura refatoracoes significativas | Auditoria ampla de redundancia |
| `0.5` | Similaridade moderada — default equilibrado | Uso geral, detectar specs derivadas |
| `0.7` | Similaridade alta — documentos muito parecidos | Encontrar versoes levemente editadas |
| `0.9` | Quase identico — copias com mudancas minimas | Detectar copias acidentais |

### Casos de Uso

```bash
# Detectar specs muito similares (possivel redundancia)
krab search duplicates .specify/ --threshold 0.5

# Encontrar copias quase identicas
krab search duplicates .specify/ --threshold 0.85

# Auditoria ampla de sobreposicao
krab search duplicates .specify/ --threshold 0.3
```

### Por que Usar em Vez de `krab analyze compare`?

| Aspecto | `analyze compare` | `search duplicates` |
|---------|-------------------|---------------------|
| Escopo | 2 arquivos especificos | Diretorio inteiro |
| Complexidade | O(1) por par | O(n) para n documentos |
| Metricas | Jaccard, Cosine, N-gram | Jaccard estimado (MinHash) |
| Uso | Comparar 2 specs conhecidas | Encontrar duplicatas desconhecidas |

---

## krab search budget

Otimiza a selecao de specs para caber em uma **janela de contexto** (token budget) de um agente de IA, maximizando o valor informacional. Utiliza o algoritmo **0/1 Knapsack** (programacao dinamica) ou uma estrategia **greedy** mais rapida.

### Sintaxe

```bash
krab search budget <directory> [--budget N] [--strategy S]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `directory` | `Path` | Sim | — | Diretorio contendo arquivos `.md` |
| `--budget` | `int` | Nao | `8192` | Budget maximo em tokens |
| `--strategy` | `string` | Nao | `"knapsack"` | Estrategia de selecao: `knapsack`, `greedy` ou `priority` |

### O Problema

Ao alimentar um agente de IA com specs de um projeto, voce enfrenta um dilema:

> **Dado N specs, qual subconjunto cabe na janela de contexto do modelo enquanto maximiza a quantidade de informacao util?**

Cada spec tem:
- **Custo em tokens** (`token_cost`) — estimado como `len(texto) / 4`
- **Valor informacional** (`info_value`) — calculado a partir de:
  - **Riqueza de vocabulario** (palavras unicas / total) — peso 30%
  - **Densidade de conteudo** (ratio de palavras nao-stop-word) — peso 30%
  - **Densidade de termos tecnicos** (APIs, snake_case, URLs) — peso 20%
  - **Bonus por codigo/exemplos** (presenca de blocos ```` ``` ````, endpoints REST) — ate +25%
- **Eficiencia** (`efficiency`) — `info_value / token_cost` (valor por token)

### Estrategias

#### `knapsack` (default) — Otimo, mais lento

Utiliza **programacao dinamica** para resolver o problema classico do Knapsack 0/1:

- **Garantia**: Encontra a **combinacao otima** que maximiza o valor total dentro do budget
- **Complexidade**: O(n * budget), onde n e o numero de specs
- **Memoria**: Usa rolling array otimizado mas cria tabela de decisao `keep[n][budget]`
- **Quando usar**: Budget apertado (poucas specs cabem) ou quando cada token importa

O algoritmo escala os valores informacionais por 1000 (para inteiros) e constroi a tabela DP iterando de `budget` ate `cost[i] - 1` para evitar selecao duplicada. Traceback reconstroi a solucao otima.

#### `greedy` — Rapido, aproximado

Ordena specs por **eficiencia** (valor/custo) e adiciona greedily:

- **Garantia**: Solucao **aproximada** — pode nao ser otima
- **Complexidade**: O(n log n) — apenas ordenacao
- **Quando usar**: Corpus grande, budget folgado, ou quando velocidade importa mais que otimalidade
- **Trade-off**: Pode ignorar uma spec grande mas valiosa em favor de varias pequenas

#### `priority` — Prioridade manual primeiro

Respeita prioridades definidas manualmente, depois preenche com greedy:

- Specs com `priority > 0` sao adicionadas primeiro (maior prioridade antes)
- Specs com `priority = 0` sao adicionadas por eficiencia
- Util quando voce sabe que certas specs sao obrigatorias

### Exemplo Completo

```bash
krab search budget specs/ --budget 4096 --strategy knapsack
```

**Saida:**

```
╭───────────────────────────────────────────────────────╮
│  Token Budget Optimizer                               │
│  Budget: 4096 tokens, Strategy: knapsack              │
╰───────────────────────────────────────────────────────╯

 Budget Result
┌──────────────────┬────────┐
│ Budget           │ 4096   │
│ Used Tokens      │ 3,847  │
│ Utilization      │ 93.92% │
│ Total Value      │ 1.8724 │
│ Selected Specs   │ 4      │
│ Excluded Specs   │ 3      │
└──────────────────┴────────┘

 Selected Specs
┌──────────────────────────────────────┬────────┬────────┬────────────┐
│ Spec                                 │ Tokens │ Value  │ Efficiency │
├──────────────────────────────────────┼────────┼────────┼────────────┤
│ spec.task.autenticacao.md            │ 856    │ 0.5821 │ 0.0007     │
│ spec.architecture.api-gateway.md     │ 1,204  │ 0.5103 │ 0.0004     │
│ spec.task.user-management.md         │ 943    │ 0.4412 │ 0.0005     │
│ spec.skill.stack-backend.md          │ 844    │ 0.3388 │ 0.0004     │
└──────────────────────────────────────┴────────┴────────┴────────────┘

ℹ Excluded: spec.architecture.infra.md, spec.plan.sprint-04.md, spec.task.reports.md
```

### Comparacao Knapsack vs Greedy

```bash
# Solucao otima (pode ser mais lento para budgets grandes)
krab search budget specs/ --budget 4096 --strategy knapsack

# Solucao rapida (boa o suficiente na maioria dos casos)
krab search budget specs/ --budget 4096 --strategy greedy
```

| Aspecto | Knapsack | Greedy |
|---------|----------|--------|
| Otimalidade | **Otima** | Aproximada |
| Complexidade | O(n * budget) | O(n log n) |
| Memoria | O(n * budget) | O(n) |
| Melhor para | Budget apertado, poucas specs | Corpus grande, budget folgado |
| Risco | Lento se budget >> 100k | Pode desperdicar 5-15% do budget |

### Cenarios Praticos

```bash
# Claude 3.5 Sonnet — janela de 200k, mas context efetivo ~8k para instructions
krab search budget .specify/ --budget 8192

# GPT-4 — otimizar para prompt system de 4k
krab search budget .specify/ --budget 4096 --strategy knapsack

# Corpus grande, budget folgado — greedy e suficiente
krab search budget .specify/ --budget 16384 --strategy greedy

# Priorizar specs de arquitetura manualmente (requer priority no codigo)
krab search budget .specify/ --budget 8192 --strategy priority
```

### Dica: Combinando com Outros Comandos

Use `search budget` como parte de um pipeline para preparar contexto para agentes:

```bash
# 1. Encontrar e eliminar duplicatas primeiro
krab search duplicates .specify/ --threshold 0.7

# 2. Otimizar budget com as specs restantes
krab search budget .specify/ --budget 8192

# 3. Verificar tokens das specs selecionadas
krab analyze batch .specify/ -a tokens
```
