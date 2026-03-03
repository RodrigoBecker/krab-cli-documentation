---
sidebar_position: 1
title: Algoritmos
---

# Algoritmos

O Krab CLI implementa **25 algoritmos** distribuidos em 6 categorias. Todos sao implementados em Python puro (sem dependencias de ML/IA) e operam localmente sem chamadas a APIs externas.

---

## Tabela Resumo

| # | Algoritmo | Modulo | Categoria | Funcao principal |
|---|-----------|--------|-----------|------------------|
| 1 | Huffman-inspired Aliases | `core/huffman.py` | Compressao | Aliases curtos para termos frequentes |
| 2 | Fuzzy Matching | `core/fuzzy.py` | Similaridade | Matching robusto com RapidFuzz |
| 3 | Jaccard Similarity | `core/similarity.py` | Similaridade | Intersecao / uniao de conjuntos |
| 4 | Cosine Similarity TF | `core/similarity.py` | Similaridade | Vetores de frequencia de termos |
| 5 | N-gram Overlap | `core/similarity.py` | Similaridade | Similaridade estrutural por bigrams |
| 6 | TF-IDF Cosine | `core/similarity.py` | Similaridade | Similaridade ponderada por corpus |
| 7 | Context Quality Score | `core/similarity.py` | Similaridade | Densidade + utilizacao de contexto |
| 8 | Shannon Entropy | `core/entropy.py` | Teoria da Informacao | H(X) = -sum(p*log2(p)) |
| 9 | Markov Chain | `core/entropy.py` | Teoria da Informacao | Probabilidade de transicao |
| 10 | Perplexity | `core/entropy.py` | Teoria da Informacao | 2^H, medida de surpresa |
| 11 | Flesch-Kincaid / Gunning Fog | `core/readability.py` | Legibilidade | Nivel escolar e indice de neblina |
| 12 | Coleman-Liau / ARI | `core/readability.py` | Legibilidade | Indices baseados em caracteres |
| 13 | Ambiguity Detector | `core/ambiguity.py` | Legibilidade | Dicionario de termos vagos |
| 14 | Suffix Array + LCP | `core/substrings.py` | Compressao | Substrings repetidas exatas |
| 15 | N-gram Phrase Counter | `core/substrings.py` | Compressao | Frases repetidas por contagem |
| 16 | 0/1 Knapsack | `core/budget.py` | Otimizacao | Selecao otima dentro de budget |
| 17 | MinHash + LSH | `core/minhash.py` | Busca | Duplicatas em escala O(n) |
| 18 | BM25 Ranking | `core/bm25.py` | Busca | Ranking de relevancia |
| 19 | Delta Encoding | `core/delta.py` | Compressao | Diff minimo entre versoes |
| 20 | Dependency Graph | `core/depgraph.py` | Otimizacao | Grafo de dependencias entre specs |
| 21 | Chunking Analyzer | `core/chunking.py` | Otimizacao | Comparacao de estrategias de split |
| 22 | RAKE | `core/semantic.py` | Compressao | Extracao de keywords |
| 23 | TextRank | `core/semantic.py` | Compressao | Sentencas mais importantes |
| 24 | Semantic Compression | `core/semantic.py` | Compressao | Compressao preservando significado |
| 25 | Hallucination Risk Score | `core/risk.py` | Legibilidade | 6 fatores ponderados |

---

## Compressao

### 1. Huffman-inspired Aliases

**Modulo**: `core/huffman.py`

Inspirado na codificacao de Huffman, este algoritmo atribui **aliases curtos** (como `$a`, `$b`, `$aa`) aos termos mais frequentes de uma spec, reduzindo a contagem total de tokens.

**Como funciona:**

1. **Tokenizacao**: extrai tokens significativos (CamelCase, snake_case, kebab-case, palavras 4+ chars)
2. **Tabela de frequencia**: conta ocorrencias de cada token (filtra por `min_freq`)
3. **Arvore de Huffman**: constroi a arvore binaria a partir das frequencias
4. **Geracao de codigos**: percorre a arvore para gerar codigos binarios
5. **Dicionario de aliases**: mapeia termos para aliases curtos (`$a`, `$b`, ..., `$aa`, `$ab`)
6. **Compressao**: substitui termos pelos aliases no texto
7. **Glossario**: gera header HTML comment com mapeamentos para decompressao

**Criterio de economia**: um alias so e criado se `(len(termo) - len(alias)) * frequencia > 0`.

**Exemplo:**

```python
from krab_cli.core.huffman import build_frequency_table, create_alias_dictionary

text = "authentication token validation authentication token refresh authentication"
freq = build_frequency_table(text, min_freq=2)
# {'authentication': 3, 'token': 2}

aliases = create_alias_dictionary(freq)
# {'authentication': '$a', 'token': '$b'}

# Resultado: "$a $b validation $a $b refresh $a"
# Glossario:
# <!-- SDD GLOSSARY -->
# <!-- $a = authentication -->
# <!-- $b = token -->
# <!-- /SDD GLOSSARY -->
```

**Complexidade**: O(n log n) para construcao da arvore, O(n) para compressao.

### 14. Suffix Array + LCP

**Modulo**: `core/substrings.py`

Encontra **substrings repetidas exatas** de qualquer tamanho usando Suffix Array com Longest Common Prefix. Identifica trechos verbatim duplicados como "The system must implement" que desperdicam tokens.

**Como funciona:**

1. **Suffix Array**: ordena todos os sufixos do texto por ordem lexicografica
2. **LCP Array**: calcula o prefixo comum mais longo entre sufixos adjacentes na ordenacao
3. **Candidatos**: sufixos com LCP >= `min_length` sao candidatos a substrings repetidas
4. **Trim**: corta substrings para limites de palavras
5. **Dedup**: remove substrings que sao parte de substrings maiores ja encontradas
6. **Contagem**: conta ocorrencias reais de cada substring

**Metricas calculadas**: `savings_potential = (len(texto) - alias_cost) * (count - 1)`

**Complexidade**: O(n log n) para construcao do Suffix Array (via sort nativo do Python).

### 15. N-gram Phrase Counter

**Modulo**: `core/substrings.py`

Abordagem mais simples que Suffix Arrays para detectar **frases multi-word repetidas**. Usa contagem direta de n-grams de palavras.

**Como funciona:**

1. Tokeniza o texto em palavras lowercase
2. Gera n-grams de tamanho variavel (de 10 palavras ate `min_words`)
3. Conta ocorrencias com `Counter`
4. Filtra por `min_count` e remove frases cobertas por frases maiores ja encontradas
5. Ordena por `savings_potential`

**Complexidade**: O(n * k) onde k e o range de tamanhos de n-gram.

### 19. Delta Encoding

**Modulo**: `core/delta.py`

Computa o **diff minimo** entre duas versoes de uma spec, permitindo que agentes recebam apenas as mudancas em vez da spec completa a cada iteracao.

**Como funciona:**

1. **SequenceMatcher** (difflib): compara linhas das duas versoes
2. **Opcodes**: identifica blocos `equal`, `replace`, `insert`, `delete`
3. **DeltaChange**: cada mudanca registra tipo, secao, conteudo antigo/novo, similaridade
4. **Compact Delta**: gera unified diff com contexto minimo (1 linha)
5. **Section Delta**: compara secoes (por heading) independentemente

**Metricas**: `change_ratio`, `lines_added`, `lines_removed`, `lines_modified`, `delta_token_savings`

**Economia de tokens**: se o delta e < 50% do tamanho da spec completa, recomenda usar delta.

```python
from krab_cli.core.delta import delta_token_savings

savings = delta_token_savings(old_text, new_text)
# {
#   'full_spec_tokens': 2048,
#   'delta_tokens': 256,
#   'savings_tokens': 1792,
#   'savings_pct': 87.5,
#   'recommendation': 'Use delta — significant savings'
# }
```

### 22. RAKE (Rapid Automatic Keyword Extraction)

**Modulo**: `core/semantic.py`

Extrai **keywords e frases-chave** usando o algoritmo RAKE, que opera sem modelo de linguagem — usa stop words como delimitadores.

**Como funciona:**

1. **Segmentacao**: divide texto em sentencas
2. **Candidatos**: separa frases usando stop words como delimitadores
3. **Pontuacao de palavras**: `score(w) = (degree(w) + freq(w)) / freq(w)` onde degree e o numero de co-ocorrencias em frases
4. **Pontuacao de frases**: soma dos scores das palavras componentes
5. **Ranking**: ordena frases por score e retorna top-n

**Exemplo:**

```python
from krab_cli.core.semantic import rake_extract

keywords = rake_extract("The authentication system validates JWT tokens using RSA-256 encryption.")
# [
#   RakeKeyword(phrase='rsa-256 encryption', score=4.0, word_count=2, frequency=1),
#   RakeKeyword(phrase='authentication system validates', score=3.0, word_count=3, frequency=1),
#   RakeKeyword(phrase='jwt tokens', score=2.0, word_count=2, frequency=1),
# ]
```

### 23. TextRank

**Modulo**: `core/semantic.py`

Identifica as **sentencas mais importantes** de um texto usando o algoritmo TextRank (baseado em PageRank).

**Como funciona:**

1. **Grafo**: cada sentenca e um no
2. **Arestas**: ponderadas pelo overlap de vocabulario entre sentencas
3. **PageRank**: iteracao com damping factor (default 0.85) por 30 iteracoes
4. **Ranking**: sentencas ordenadas pelo score convergido

A formula de iteracao:

```
score(i) = (1 - d) / N + d * sum(similarity(j,i) * score(j) / sum(similarity(j,*)) for j != i)
```

**Parametros**: `top_n=5`, `damping=0.85`, `iterations=30`

### 24. Semantic Compression

**Modulo**: `core/semantic.py`

Combina RAKE + TextRank para produzir uma **versao comprimida semanticamente** da spec, preservando os conceitos-chave e sentencas mais importantes.

**Como funciona:**

1. Extrai keywords via RAKE
2. Extrai sentencas-chave via TextRank
3. Constroi texto comprimido: linha de keywords + sentencas-chave na ordem original
4. Calcula `compression_ratio`

**Exemplo:**

```python
from krab_cli.core.semantic import semantic_compress

result = semantic_compress(spec_text, target_ratio=0.3)
# SemanticSummary(
#   keywords=[...],
#   key_sentences=[...],
#   compressed_text="Key concepts: jwt authentication, token validation, ...\n\n...",
#   original_tokens=2048,
#   compressed_tokens=614,
#   compression_ratio=0.3
# )
```

---

## Similaridade

### 2. Fuzzy Matching

**Modulo**: `core/fuzzy.py`

Usa a biblioteca **RapidFuzz** para matching robusto de strings com multiplos metodos de scoring.

**5 metodos disponiveis:**

| Metodo | Funcao | Peso (weighted) | Caracteristica |
|--------|--------|-----------------|----------------|
| `ratio` | `fuzz.ratio` | 0.2 | Similaridade simples caracter a caracter |
| `partial` | `fuzz.partial_ratio` | 0.2 | Melhor substring match |
| `token_sort` | `fuzz.token_sort_ratio` | 0.3 | Invariante a ordem dos tokens |
| `token_set` | `fuzz.token_set_ratio` | 0.3 | Lida com duplicatas e extras |
| `weighted` | Combinacao ponderada | — | Media ponderada dos 4 acima |

**Classificacao de matches:**

| Score | Classificacao |
|-------|---------------|
| >= 95.0 | `DUPLICATE` |
| 80.0 - 94.9 | `NEAR_DUPLICATE` |
| 60.0 - 79.9 | `SIMILAR` |
| < 60.0 | Sem match |

**Uso no Krab**: deduplicacao de secoes de specs (`krab optimize dedup`).

### 3. Jaccard Similarity

**Modulo**: `core/similarity.py`

Coeficiente de similaridade de Jaccard entre dois textos.

**Formula:**

```
J(A, B) = |A ∩ B| / |A ∪ B|
```

Onde A e B sao conjuntos de tokens (palavras) de cada texto.

- **Range**: 0.0 (nenhum termo em comum) a 1.0 (conjuntos identicos)
- **Vantagem**: simples e intuitivo, bom para similaridade lexica
- **Limitacao**: ignora frequencia dos termos

### 4. Cosine Similarity TF

**Modulo**: `core/similarity.py`

Similaridade cosseno usando vetores de frequencia de termos (Term Frequency).

**Formula:**

```
cos(A, B) = (A · B) / (||A|| × ||B||)
```

Onde A e B sao vetores de contagem de termos.

- **Range**: 0.0 a 1.0
- **Vantagem**: considera frequencia dos termos, nao apenas presenca
- **Uso**: comparacao de specs (`krab analyze compare`)

### 5. N-gram Overlap

**Modulo**: `core/similarity.py`

Mede similaridade **estrutural** comparando bigrams compartilhados.

**Formula:**

```
overlap(A, B) = |bigrams(A) ∩ bigrams(B)| / min(|bigrams(A)|, |bigrams(B)|)
```

- **Range**: 0.0 a 1.0
- **Vantagem**: captura proximidade estrutural (sequencia de palavras), nao so vocabulario
- **Default**: bigrams (n=2)

### 6. TF-IDF Cosine

**Modulo**: `core/similarity.py`

Similaridade cosseno usando vetores **TF-IDF** — considera a importancia relativa dos termos dentro de um corpus de specs.

**Formula TF-IDF:**

```
tfidf(t, d) = tf(t, d) × idf(t)
idf(t) = log(N / (1 + df(t))) + 1
```

- **Range**: 0.0 a 1.0
- **Vantagem**: termos raros no corpus tem maior peso, termos comuns sao penalizados
- **Uso**: comparacao de specs dentro de um corpus (`krab search bm25`)

### 7. Context Quality Score

**Modulo**: `core/similarity.py`

Avalia o quao bem uma spec utiliza a **janela de contexto** de um agente de IA.

**Metricas calculadas:**

| Metrica | Formula | Significado |
|---------|---------|-------------|
| `information_density` | unique_tokens / total_tokens | Riqueza de vocabulario |
| `redundancy_ratio` | 1 - density | Proporcao de repeticao |
| `utilization_pct` | estimated_tokens / context_window * 100 | % da janela utilizada |
| `density_grade` | threshold-based | EXCELLENT / GOOD / FAIR / POOR |

**Grades de densidade:**

| Densidade | Grade |
|-----------|-------|
| >= 0.7 | EXCELLENT |
| >= 0.5 | GOOD |
| >= 0.3 | FAIR |
| < 0.3 | POOR — considere deduplicacao |

---

## Teoria da Informacao

### 8. Shannon Entropy

**Modulo**: `core/entropy.py`

Calcula a **entropia de Shannon** de um texto em bits por token.

**Formula:**

```
H(X) = -Σ p(x) × log₂(p(x))
```

Onde p(x) e a probabilidade de cada token (frequencia / total).

- **Entropia alta** (>= 6.0 bits): conteudo diverso, informativo — grade EXCELLENT
- **Entropia media** (4.5 - 6.0): balanceado — grade GOOD
- **Entropia baixa** (< 3.0): repetitivo, boilerplate — grade LOW

**Exemplo:**

```python
from krab_cli.core.entropy import shannon_entropy

# Texto repetitivo:
shannon_entropy("must must must must must")  # ~0.0 bits

# Texto diverso:
shannon_entropy("authentication token validation encryption session")  # ~2.32 bits
```

### 9. Markov Chain

**Modulo**: `core/entropy.py`

Analisa **previsibilidade** do texto usando cadeias de Markov de ordem 1 ou 2.

**Como funciona:**

1. Constroi uma tabela de transicoes: dado um estado (1-2 tokens anteriores), qual o proximo token mais provavel?
2. Calcula a probabilidade maxima de transicao para cada estado
3. **Predictability** = media das probabilidades maximas de todos os estados

**Interpretacao:**

| Predictability | Grade |
|----------------|-------|
| >= 0.8 | HIGHLY_PREDICTABLE — boilerplate heavy |
| >= 0.6 | PREDICTABLE — alguma redundancia |
| >= 0.4 | MODERATE |
| < 0.4 | LOW_PREDICTABILITY — boa variedade |

**Saida**: top patterns com probabilidade >= 70%, como:
```
"the" -> "system" (85%)
"must" -> "implement" (73%)
```

### 10. Perplexity

**Modulo**: `core/entropy.py`

**Perplexidade** e uma medida de surpresa — quanto mais previsivel o texto, menor a perplexidade.

**Formula:**

```
Perplexity = 2^H
```

Onde H e a cross-entropy estimada via modelo n-gram.

- **Perplexidade alta** (>= 50): conteudo muito diverso
- **Perplexidade boa** (20-50): variedade balanceada
- **Perplexidade moderada** (8-20): alguma repeticao
- **Perplexidade baixa** (< 8): altamente repetitivo/boilerplate

---

## Legibilidade

### 11. Flesch-Kincaid / Gunning Fog

**Modulo**: `core/readability.py`

Dois indices de legibilidade classicos baseados em contagem de silabas e comprimento de sentencas.

**Flesch-Kincaid Grade Level:**

```
FK = 0.39 × (words/sentences) + 11.8 × (syllables/words) - 15.59
```

Retorna o nivel escolar americano necessario para entender o texto. Specs tipicas: 10-14. Acima de 16 = muito complexo.

**Flesch Reading Ease:**

```
FRE = 206.835 - 1.015 × (words/sentences) - 84.6 × (syllables/words)
```

Escala 0-100. Maior = mais facil. 90-100: muito facil. 60-70: padrao. 30-50: dificil. 0-30: muito confuso.

**Gunning Fog Index:**

```
GFI = 0.4 × ((words/sentences) + 100 × (complex_words/words))
```

Complex words = palavras com 3+ silabas. Bom para detectar specs carregadas de jargao. Abaixo de 12: legivel. 12-16: aceitavel. Acima de 16: dificil.

### 12. Coleman-Liau / ARI

**Modulo**: `core/readability.py`

Indices baseados em **contagem de caracteres** (nao silabas) — mais confiaveis para texto tecnico com abreviacoes e acronimos.

**Coleman-Liau Index:**

```
CLI = 0.0588 × L - 0.296 × S - 15.8
```

Onde L = media de letras por 100 palavras, S = media de sentencas por 100 palavras.

**Automated Readability Index (ARI):**

```
ARI = 4.71 × (characters/words) + 0.5 × (words/sentences) - 21.43
```

Baseado em caracteres, bom para documentacao tecnica com codigo.

### 13. Ambiguity Detector

**Modulo**: `core/ambiguity.py`

Detecta **termos vagos, imprecisos ou ambiguos** que aumentam o risco de alucinacao quando a spec e consumida por agentes de IA.

**Como funciona:**

1. **Dicionario de termos vagos**: 80+ termos em ingles e portugues mapeados para sugestoes de melhoria (ex: `"etc"` -> `"List all items explicitly"`)
2. **Padroes fracos**: regex para detectar `TBD`, `TODO`, `FIXME`, double hedging (`should maybe`), etc.
3. **Classificacao de severidade**:
   - HIGH: `etc`, `tbd`, `todo`, `fixme`, `hack`, `stuff`, `things`, `whatever`
   - MEDIUM: `might`, `could`, `probably`, `approximately`, `some`, `several`, `soon`, `later`
   - LOW: termos genericos como `appropriate`, `adequate`, `good`, `fast`
4. **Precision Score**: `max(0, (1 - ambiguity_ratio × 10) × 100)` onde `ambiguity_ratio = matches / total_words`

**Grades:**

| Score | Grade |
|-------|-------|
| >= 90 | EXCELLENT |
| >= 75 | GOOD |
| >= 50 | FAIR |
| < 50 (ou HIGH > 5) | POOR |

### 25. Hallucination Risk Score

**Modulo**: `core/risk.py`

Combina **6 fatores ponderados** para estimar a probabilidade de um agente de IA alucinar ao consumir uma spec.

**Fatores:**

| Fator | Peso | O que mede | Risco alto quando... |
|-------|------|------------|---------------------|
| Ambiguity | 0.25 | Termos vagos e imprecisos | Muitos termos ambiguos (>10% das palavras) |
| Information Density | 0.15 | Filler vs conteudo real | Densidade < 0.33 (muita repeticao) |
| Entropy Balance | 0.15 | Equilibrio informacional | < 3 bits (boilerplate) ou > 8 bits (incoerente) |
| Readability | 0.15 | Complexidade do texto | FK Grade > 18 (muito complexo) |
| Structural Completeness | 0.15 | Secoes esperadas presentes | Requirements/Architecture/API faltando |
| Context Overflow | 0.15 | Tamanho vs janela de contexto | Spec excede a janela de contexto |

**Formula final:**

```
overall_score = Σ (factor.score × factor.weight) × 100
```

**Niveis de risco:**

| Score | Nivel | Seguro para Agentes? |
|-------|-------|----------------------|
| < 20 | LOW | Sim |
| 20-39 | MODERATE | Sim |
| 40-59 | HIGH | Nao |
| >= 60 | CRITICAL | Nao |

---

## Busca

### 17. MinHash + LSH

**Modulo**: `core/minhash.py`

Substitui comparacao pairwise O(n^2) por **fingerprinting O(n)** + bucketing para deteccao escalavel de duplicatas.

**MinHash — Como funciona:**

1. **Shingling**: converte texto em conjunto de k-shingles (word ou character n-grams)
2. **Funcoes hash**: gera 128 funcoes hash da forma `h(x) = (ax + b) % p`
3. **Assinatura**: para cada funcao hash, o MinHash e o menor valor hash entre todos os shingles
4. **Estimativa de similaridade**: proporcao de posicoes iguais entre duas assinaturas ≈ similaridade de Jaccard

**LSH (Locality-Sensitive Hashing) — Como funciona:**

1. Divide a assinatura MinHash em **bands** (default: 16 bands de 8 rows)
2. Documentos que compartilham **pelo menos uma band identica** sao candidatos
3. Pares candidatos sao verificados com MinHash para similaridade exata

**Complexidade**: O(n) para indexacao + O(candidatos) para verificacao, muito melhor que O(n^2).

**Parametros:**

| Parametro | Default | Descricao |
|-----------|---------|-----------|
| `num_perm` | 128 | Numero de permutacoes hash (mais = mais preciso) |
| `num_bands` | 16 | Numero de bands LSH (mais = mais candidatos) |
| `shingle_mode` | `word` | `word` ou `char` |
| `shingle_k` | 2 | Tamanho do shingle |
| `threshold` | 0.5 | Similaridade minima |

### 18. BM25 Ranking

**Modulo**: `core/bm25.py`

**BM25 (Best Matching 25)** e superior a TF-IDF para ranking de relevancia. Normaliza por tamanho de documento e aplica retornos decrescentes na frequencia de termos.

**Formula:**

```
BM25(q, d) = Σ IDF(t) × (tf(t,d) × (k1 + 1)) / (tf(t,d) + k1 × (1 - b + b × |d|/avgdl))
```

Onde:
- `IDF(t) = log((N - df(t) + 0.5) / (df(t) + 0.5) + 1)` — Inverse Document Frequency com smoothing
- `tf(t,d)` — frequencia do termo t no documento d
- `k1 = 1.5` — parametro de saturacao de TF (maior = mais peso para frequencia)
- `b = 0.75` — normalizacao por tamanho (0 = sem normalizacao, 1 = total)
- `|d|` — tamanho do documento
- `avgdl` — tamanho medio dos documentos

**Vantagens sobre TF-IDF:**

1. **Saturacao**: frequencia alta tem retornos decrescentes (tf=10 nao e 10x melhor que tf=1)
2. **Normalizacao de tamanho**: documentos longos nao sao injustamente favorecidos
3. **Smoothing de IDF**: evita divisao por zero e pesos negativos

---

## Otimizacao

### 16. 0/1 Knapsack

**Modulo**: `core/budget.py`

Dado um **budget de tokens** (janela de contexto), seleciona a combinacao otima de specs/secoes que maximiza o valor informacional.

**3 estrategias:**

| Estrategia | Complexidade | Descricao |
|------------|-------------|-----------|
| `knapsack` | O(n × W) | Programacao dinamica — solucao otima |
| `greedy` | O(n log n) | Ordena por eficiencia (value/cost) e preenche |
| `priority` | O(n log n) | Respeita prioridades manuais, preenche com greedy |

**Valor informacional de uma secao** (`_calculate_info_value`):

```
value = (richness × 0.3) + (content_ratio × 0.3) + (tech_density × 0.2) + code_bonus
```

Onde:
- `richness` = unique_words / total_words
- `content_ratio` = non-stop-words / total_words
- `tech_density` = min(tech_patterns / total_words, 0.3)
- `code_bonus` = +0.15 se tem code blocks, +0.1 se tem endpoints REST

**Eficiencia**: `efficiency = info_value / token_cost`

### 20. Dependency Graph

**Modulo**: `core/depgraph.py`

Analisa **referencias cruzadas** entre specs para construir um grafo de dependencias, ajudando agentes a determinar quais specs carregar juntas na janela de contexto.

**Deteccao de referencias:**

- **Explicitas**: `[text](file.md)`, `see \`file.md\``, `defined in file`
- **Implicitas**: keywords de dominio compartilhadas (auth, user, api, database, payment, etc.)

**Analises disponiveis:**

| Metodo | Descricao |
|--------|-----------|
| `get_dependencies(spec)` | Specs das quais uma spec depende (outgoing) |
| `get_dependents(spec)` | Specs que dependem de uma spec (incoming) |
| `get_context_cluster(spec, depth=2)` | Cluster de specs relacionadas dentro de N hops |
| `find_root_specs()` | Specs sem dependencias (entry points) |
| `find_leaf_specs()` | Specs sem dependentes (folhas) |
| `find_hub_specs(min=3)` | Specs altamente conectadas (hubs) |
| `topological_order()` | Ordem topologica (dependencias primeiro) — Kahn's algorithm |
| `to_mermaid()` | Exporta grafo como diagrama Mermaid |

### 21. Chunking Analyzer

**Modulo**: `core/chunking.py`

Compara **4 estrategias de split** e recomenda a melhor para alimentar agentes de IA com specs longas.

**Estrategias:**

| Estrategia | Descricao |
|------------|-----------|
| `heading` | Split por headings Markdown — preserva secoes semanticas |
| `paragraph` | Split por paragrafos (duplo newline) — preserva coerencia |
| `fixed_size` | Chunks de tamanho fixo (512 tokens) com 20% overlap |
| `semantic` | Split por headings + code blocks + separadores — mais sofisticado |

**Score de coerencia:**

```
coherence = adjacent_overlap × 0.5 + self_containedness × 0.5
```

Onde `adjacent_overlap` mede o vocabulario compartilhado entre chunks adjacentes, e `self_containedness` verifica se o chunk comeca com heading.

**Score combinado para ranking:**

```
combined = coherence × 0.6 + uniformity × 0.4
```

Onde `uniformity = 1 - (variance / max_variance)` mede quao uniformes sao os tamanhos dos chunks.
