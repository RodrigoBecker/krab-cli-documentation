---
sidebar_position: 1
title: optimize — Otimizacao
---

# optimize — Otimizacao de Specs

O comando `krab optimize` executa pipelines de otimizacao para reduzir o consumo de tokens quando specs SDD sao enviadas para agentes de IA. Ele combina **compressao inspirada em Huffman** (alias de termos frequentes) com **deduplicacao fuzzy** (deteccao de secoes duplicadas via RapidFuzz).

## Subcomandos

| Subcomando | Descricao |
|---|---|
| [`krab optimize run`](#krab-optimize-run) | Pipeline completo de otimizacao |
| [`krab optimize aliases`](#krab-optimize-aliases) | Mostra o dicionario de aliases sem aplicar |
| [`krab optimize dedup`](#krab-optimize-dedup) | Encontra secoes duplicadas |

---

## krab optimize run

Executa o pipeline completo de otimizacao em um arquivo de spec. O pipeline segue estes passos:

1. **Analise de qualidade** do texto original (density, redundancy, utilization)
2. **Split em secoes** por headings Markdown (`#`, `##`, `###`, `####`)
3. **Deduplicacao fuzzy** — remove secoes com similaridade acima do threshold
4. **Construcao da tabela de frequencia** — identifica termos multi-palavra repetidos
5. **Criacao do dicionario de aliases** — gera aliases curtos (`$a`, `$b`, ..., `$aa`) para os termos mais frequentes
6. **Compressao** — substitui termos longos pelos aliases no texto
7. **Analise de qualidade** do texto otimizado (comparacao antes/depois)
8. **Escrita do resultado** com glossario embutido como comentarios HTML

### Sintaxe

```bash
krab optimize run <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Caminho para o arquivo de spec (Markdown) |
| `-o`, `--output` | Path | Nao | `<file>.optimized.md` | Caminho do arquivo de saida |
| `--no-compress` | bool | Nao | `false` | Pula a etapa de compressao Huffman |
| `--no-dedup` | bool | Nao | `false` | Pula a etapa de deduplicacao |
| `--min-freq` | int | Nao | `3` | Frequencia minima para um termo ser elegivel a alias |
| `--max-aliases` | int | Nao | `50` | Numero maximo de aliases a criar |
| `--threshold` | float | Nao | `90.0` | Threshold de similaridade para deduplicacao (0-100) |
| `--context-window` | int | Nao | `8192` | Tamanho da context window alvo para analise de qualidade |

### Exemplos

#### Uso basico

```bash
$ krab optimize run spec.task.autenticacao.md
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Krab Optimizer — Processing: spec.task.autenticacao.md
╚══════════════════════════════════════════════════╝

┌─────────────────────── Compression Metrics ───────────────────────┐
│ original_chars          │ 12847                                   │
│ compressed_chars        │ 10234                                   │
│ glossary_chars          │ 486                                     │
│ savings_chars           │ 2613                                    │
│ compression_ratio       │ 0.7966                                  │
│ savings_pct             │ 20.34                                   │
│ alias_count             │ 18                                      │
└───────────────────────────────────────────────────────────────────┘

┌──────────────── Context Quality (Before → After) ─────────────────┐
│ Metric                  │ Before        │ After                   │
│ word_count              │ 2148          │ 1872                    │
│ unique_words            │ 687           │ 652                     │
│ estimated_tokens        │ 2857          │ 2490                    │
│ utilization_pct         │ 34.87         │ 30.39                   │
│ information_density     │ 0.3199        │ 0.3483                  │
│ redundancy_ratio        │ 0.6801        │ 0.6517                  │
│ density_grade           │ FAIR          │ FAIR                    │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────── Alias Dictionary ──────────────────────────┐
│ Alias   │ Original Term                                          │
│ $a      │ autenticacao                                           │
│ $b      │ usuario                                                │
│ $c      │ endpoint                                               │
│ $d      │ implementar                                            │
│ $e      │ requisito                                              │
│ $f      │ validacao                                              │
│ $g      │ retornar                                               │
│ ...     │ ...                                                    │
└───────────────────────────────────────────────────────────────────┘

ℹ Duplicates found: 3
ℹ Sections removed: 2

✓ Optimized spec saved to: spec.task.autenticacao.optimized.md
```

#### Salvando em arquivo especifico

```bash
$ krab optimize run spec.task.pagamentos.md -o output/pagamentos-otimizado.md
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Krab Optimizer — Processing: spec.task.pagamentos.md
╚══════════════════════════════════════════════════╝

┌─────────────────────── Compression Metrics ───────────────────────┐
│ original_chars          │ 8432                                    │
│ compressed_chars        │ 7105                                    │
│ glossary_chars          │ 312                                     │
│ savings_chars           │ 1327                                    │
│ compression_ratio       │ 0.8427                                  │
│ savings_pct             │ 15.73                                   │
│ alias_count             │ 12                                      │
└───────────────────────────────────────────────────────────────────┘

...

✓ Optimized spec saved to: output/pagamentos-otimizado.md
```

#### Apenas deduplicacao (sem compressao)

Util quando voce quer remover secoes repetidas mas manter o texto legivel sem aliases:

```bash
$ krab optimize run spec.architecture.md --no-compress --threshold 85.0
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Krab Optimizer — Processing: spec.architecture.md
╚══════════════════════════════════════════════════╝

┌─────────────────────── Compression Metrics ───────────────────────┐
│ original_chars          │ 15200                                   │
│ compressed_chars        │ 13480                                   │
│ glossary_chars          │ 0                                       │
│ savings_chars           │ 1720                                    │
│ compression_ratio       │ 0.8868                                  │
│ savings_pct             │ 11.32                                   │
│ alias_count             │ 0                                       │
└───────────────────────────────────────────────────────────────────┘

ℹ Duplicates found: 5
ℹ Sections removed: 4

✓ Optimized spec saved to: spec.architecture.optimized.md
```

#### Apenas compressao (sem deduplicacao)

Util para specs que ja foram deduplicadas ou que nao possuem secoes repetidas:

```bash
$ krab optimize run spec.task.crud.md --no-dedup --min-freq 2 --max-aliases 30
```

#### Parametros customizados para spec grande

Para specs grandes que ultrapassam a context window de 4096 tokens:

```bash
$ krab optimize run spec.plan.mvp.md \
    --context-window 4096 \
    --threshold 80.0 \
    --min-freq 2 \
    --max-aliases 100 \
    -o spec.plan.mvp.compressed.md
```

### Estrutura do arquivo de saida

O arquivo otimizado inclui um glossario no topo como comentarios HTML, seguido do texto comprimido:

```markdown
<!-- SDD GLOSSARY -->
<!-- $a = autenticacao -->
<!-- $b = usuario -->
<!-- $c = endpoint -->
<!-- $d = implementar -->
<!-- /SDD GLOSSARY -->

# Spec: Sistema de $a

## Requisitos

O $b deve se autenticar via $c de login.
O sistema deve $d rate limiting no $c de $a.
```

:::tip Dica de uso
O glossario HTML nao e renderizado visualmente no Markdown, mas agentes de IA conseguem le-lo e usar os aliases para descomprimir o texto durante o processamento. Isso reduz tokens sem perda de informacao.
:::

---

## krab optimize aliases

Mostra o dicionario de aliases que **seria gerado** para uma spec, sem aplicar nenhuma modificacao. Util para inspecionar quais termos seriam comprimidos antes de executar o pipeline completo.

### Sintaxe

```bash
krab optimize aliases <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Caminho para o arquivo de spec |
| `--min-freq` | int | Nao | `2` | Frequencia minima para incluir na tabela |
| `--max-aliases` | int | Nao | `50` | Numero maximo de aliases |

### Exemplo

```bash
$ krab optimize aliases spec.task.autenticacao.md --min-freq 3
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Alias Analysis — spec.task.autenticacao.md
╚══════════════════════════════════════════════════╝

┌─────────────────────── Top Frequencies ───────────────────────────┐
│ autenticacao            │ 47                                      │
│ usuario                 │ 38                                      │
│ endpoint                │ 31                                      │
│ implementar             │ 24                                      │
│ requisito               │ 22                                      │
│ validacao               │ 19                                      │
│ retornar                │ 17                                      │
│ sistema                 │ 16                                      │
│ token                   │ 15                                      │
│ sessao                  │ 14                                      │
│ password                │ 12                                      │
│ request                 │ 11                                      │
│ response                │ 10                                      │
│ middleware              │ 9                                       │
│ controller              │ 8                                       │
│ database                │ 7                                       │
│ refresh                 │ 6                                       │
│ permission              │ 5                                       │
│ authorization           │ 4                                       │
│ header                  │ 3                                       │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────── Alias Dictionary ──────────────────────────┐
│ Alias   │ Original Term                                          │
│ $a      │ autenticacao                                           │
│ $b      │ usuario                                                │
│ $c      │ endpoint                                               │
│ $d      │ implementar                                            │
│ $e      │ requisito                                              │
│ $f      │ validacao                                              │
│ $g      │ retornar                                               │
│ $h      │ sistema                                                │
│ $i      │ token                                                  │
│ $j      │ sessao                                                 │
│ $k      │ password                                               │
│ $l      │ request                                                │
│ $m      │ response                                               │
│ $n      │ middleware                                              │
│ $o      │ controller                                             │
│ $p      │ database                                               │
│ $q      │ refresh                                                │
│ $r      │ permission                                             │
│ $s      │ authorization                                          │
│ $t      │ header                                                 │
└───────────────────────────────────────────────────────────────────┘
```

:::tip Dica de uso
Use `krab optimize aliases` antes de `krab optimize run` para validar quais termos serao comprimidos. Se um termo tecnico importante estiver na lista e voce nao quiser comprimi-lo, ajuste `--min-freq` para um valor mais alto.
:::

### Como o algoritmo funciona

O Krab CLI usa uma abordagem **inspirada em Huffman** para compressao de specs:

1. **Tokenizacao**: O texto e dividido em tokens usando padroes regex que detectam CamelCase, snake_case, kebab-case e palavras com 4+ caracteres
2. **Tabela de frequencia**: Um `Counter` conta a frequencia de cada token, filtrando os que aparecem menos que `min_freq` vezes
3. **Arvore de Huffman**: Uma arvore binaria e construida com heap — os termos mais frequentes recebem os codigos mais curtos
4. **Dicionario de aliases**: Os termos sao ordenados por `(-frequencia, -comprimento)` e recebem aliases sequenciais: `$a`, `$b`, ..., `$z`, `$aa`, `$ab`, etc.
5. **Economia**: Um alias so e criado se `(comprimento_original - comprimento_alias) * frequencia > 0` — ou seja, so quando ha economia real de caracteres

---

## krab optimize dedup

Encontra secoes duplicadas ou quase-duplicadas em uma spec usando **matching fuzzy**. Nao modifica o arquivo — apenas reporta as duplicatas encontradas.

### Sintaxe

```bash
krab optimize dedup <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Caminho para o arquivo de spec |
| `--threshold` | float | Nao | `80.0` | Threshold de similaridade (0-100) |
| `--method` | str | Nao | `"weighted"` | Metodo de scoring: `weighted`, `ratio`, `token_set` |

### Metodos de scoring disponiveis

| Metodo | Descricao | Uso recomendado |
|---|---|---|
| `weighted` | Combinacao ponderada de ratio (0.2), partial_ratio (0.2), token_sort (0.3) e token_set (0.3) | **Default** — melhor para specs tecnicas com jargao variado |
| `ratio` | Similaridade simples entre duas strings (Levenshtein normalizado) | Deteccao de duplicatas quase identicas |
| `token_set` | Ignora ordem das palavras e duplicatas internas | Secoes reescritas com as mesmas palavras em ordem diferente |

### Exemplo

```bash
$ krab optimize dedup spec.architecture.microservicos.md --threshold 75.0
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Deduplication Analysis — spec.architecture.microservicos.md — 14 sections
╚══════════════════════════════════════════════════╝

┌─────────────────── Duplicate Matches ─────────────────────────────┐
│ Score   │ Source                        │ Target                  │
│ 94.32   │ ## Autenticacao JWT           │ ## Auth JWT Token       │
│         │ O servico de autenticacao     │ O servico de auth deve  │
│         │ deve validar tokens JWT...    │ validar JWT tokens...   │
│ 87.15   │ ### Rate Limiting             │ ### Controle de Taxa    │
│         │ Implementar rate limiting     │ Implementar controle    │
│         │ com bucket de 100 req/s...    │ de taxa 100 req/s...    │
│ 78.44   │ ## Error Handling             │ ## Tratamento de Erros  │
│         │ Todos os endpoints devem      │ Endpoints devem         │
│         │ retornar erros no formato...  │ retornar erro padrao... │
└───────────────────────────────────────────────────────────────────┘

ℹ Total matches above 75.0%: 3
```

#### Usando metodo token_set

```bash
$ krab optimize dedup spec.plan.md --method token_set --threshold 70.0
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Deduplication Analysis — spec.plan.md — 22 sections
╚══════════════════════════════════════════════════╝

┌─────────────────── Duplicate Matches ─────────────────────────────┐
│ Score   │ Source                        │ Target                  │
│ 91.20   │ ## Sprint 1 - Setup           │ ## Fase 1 - Setup       │
│ 85.67   │ ### Deploy Pipeline           │ ### CI/CD Pipeline      │
│ 72.33   │ ## Testes de Integracao       │ ## Integration Tests    │
└───────────────────────────────────────────────────────────────────┘

ℹ Total matches above 70.0%: 3
```

### Como o algoritmo de deduplicacao funciona

A deduplicacao usa a biblioteca **RapidFuzz** (implementacao C++ de fuzzy matching) com scoring ponderado:

1. **Split em secoes**: O texto Markdown e dividido por headings (`#{1,4}`)
2. **Comparacao par-a-par**: Cada secao e comparada com todas as outras (complexidade O(n^2))
3. **Scoring weighted** (default):
   - `ratio` (0.2 peso) — Levenshtein normalizado, penaliza diferencas de caracteres
   - `partial_ratio` (0.2 peso) — melhor substring match, bom para secoes onde uma e subconjunto da outra
   - `token_sort_ratio` (0.3 peso) — ordena tokens antes de comparar, ignora ordem das palavras
   - `token_set_ratio` (0.3 peso) — compara conjuntos de tokens, ignora duplicatas e extras
4. **Classificacao**: Score >= 95% = `DUPLICATE`, 80-95% = `NEAR_DUPLICATE`, 60-80% = `SIMILAR`
5. **Remocao**: Na deduplicacao efetiva (via `krab optimize run`), entre duas secoes duplicadas, a **mais longa** e mantida

:::tip Quando usar cada subcomando
- Use `krab optimize aliases` para **inspecionar** quais termos seriam comprimidos
- Use `krab optimize dedup` para **encontrar** duplicatas sem modificar nada
- Use `krab optimize run` para **executar** o pipeline completo e gerar o arquivo otimizado
:::
