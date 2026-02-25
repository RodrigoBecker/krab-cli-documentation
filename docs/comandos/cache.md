---
sidebar_position: 9
title: cache — Cache
---

# `krab cache` — Cache de Resultados

O comando `krab cache` gerencia o cache de resultados de analise do Krab CLI. O sistema de cache armazena resultados de comandos `analyze` para que analises repetidas em arquivos que nao mudaram retornem instantaneamente, sem recomputacao.

## Visao Geral dos Subcomandos

| Subcomando | Descricao |
|---|---|
| `krab cache stats` | Exibe tamanho e numero de entradas no cache |
| `krab cache clear` | Remove todas as entradas do cache |

---

## Como o Cache Funciona

### Storage

O cache e armazenado no diretorio `.sdd/cache/`, dentro da estrutura de memoria do projeto. Cada entrada e um arquivo JSON individual:

```
.sdd/
├── memory.json
├── skills.json
├── history.json
└── cache/
    ├── a1b2c3d4e5f67890abcd.json
    ├── f9e8d7c6b5a43210fedc.json
    └── ...
```

### Chave do Cache (Cache Key)

A chave de cada entrada e um hash SHA-256 (truncado para 24 caracteres hex) calculado a partir de tres componentes:

```
cache_key = sha256( content_hash + command + sorted(params) )
```

| Componente | Descricao | Exemplo |
|---|---|---|
| `content_hash` | SHA-256 do conteudo do arquivo analisado | `sha256("# Minha Spec\n...")` |
| `command` | Nome do comando de analise | `"analyze_tokens"`, `"analyze_readability"` |
| `params` | Parametros do comando serializados como JSON ordenado | `{"encoding": "cl100k_base"}` |

Isso significa que a mesma analise com os mesmos parametros no mesmo conteudo sempre produz a mesma chave — e resultados diferentes (conteudo diferente, parametros diferentes ou comando diferente) produzem chaves diferentes.

### Invalidacao Automatica

O cache e invalidado automaticamente quando o conteudo do arquivo muda. Como a chave inclui o hash SHA-256 do conteudo, qualquer alteracao no arquivo — mesmo um unico caractere — gera uma chave diferente, resultando em cache miss.

**Nao e necessario invalidar manualmente o cache apos editar um arquivo.** O proximo `krab analyze` nesse arquivo vai recomputar automaticamente.

Alem disso, cada entrada armazenada contem o `_content_hash` original. No momento da leitura, o Krab verifica se o hash corresponde ao conteudo atual. Se houver divergencia (cenario de colisao de hash extremamente improvavel), a entrada e descartada automaticamente.

### Atomic Writes

Para evitar corrupcao de dados (por exemplo, se o processo for interrompido durante a escrita), o cache usa **atomic writes**: os dados sao escritos em um arquivo temporario (via `tempfile.mkstemp`) e depois renomeados para o arquivo final com `Path.replace()`. Em sistemas POSIX, rename e uma operacao atomica — garantindo que o arquivo de cache nunca esta em estado parcial.

Se a escrita falhar por qualquer motivo (disco cheio, permissoes), o erro e silenciado. A falha de cache nunca interrompe o comando de analise.

### Comandos que Utilizam Cache

Os seguintes comandos de analise usam o cache automaticamente:

| Comando | Parametros na Chave |
|---|---|
| `krab analyze tokens` | `encoding` |
| `krab analyze quality` | `context_window` |
| `krab analyze entropy` | (nenhum) |
| `krab analyze readability` | (nenhum) |
| `krab analyze freq` | `min_freq`, `top` |

Os comandos `krab analyze batch` tambem utilizam cache para cada arquivo individual no lote.

### Flag `--no-cache`

Todos os comandos acima aceitam a flag `--no-cache` para forcar a recomputacao, ignorando qualquer resultado em cache:

```bash
# Forcar recomputacao da analise de tokens
krab analyze tokens spec.task.auth.md --no-cache

# Forcar recomputacao de readability
krab analyze readability spec.task.auth.md --no-cache

# Batch sem cache
krab analyze batch specs/ -a tokens --no-cache
```

A flag `--no-cache` pula a leitura do cache, mas o resultado recomputado **ainda e salvo** no cache para uso futuro.

---

## `krab cache stats`

Exibe estatisticas do cache: numero de entradas e espaco em disco utilizado.

### Sintaxe

```bash
krab cache stats
```

Nao aceita parametros.

### Exemplo de Saida

**Cache com entradas:**

```
╭─ Cache Statistics ──────────────────────────────────────────╮

┌───────────┬──────────┐
│ Cache     │          │
├───────────┼──────────┤
│ Entries   │ 42       │
│ Disk Usage│ 18.3 KB  │
└───────────┴──────────┘
```

**Cache vazio:**

```
╭─ Cache Statistics ──────────────────────────────────────────╮

┌───────────┬──────────┐
│ Cache     │          │
├───────────┼──────────┤
│ Entries   │ 0        │
│ Disk Usage│ 0 B      │
└───────────┴──────────┘
```

### Detalhes da Exibicao

| Metrica | Descricao |
|---|---|
| **Entries** | Numero total de arquivos `.json` no diretorio `.sdd/cache/` |
| **Disk Usage** | Tamanho total em disco, formatado automaticamente (B, KB, MB) |

---

## `krab cache clear`

Remove todas as entradas do cache. Util quando voce quer forcar a recomputacao de todas as analises ou liberar espaco em disco.

### Sintaxe

```bash
krab cache clear
```

Nao aceita parametros.

### Exemplo de Saida

**Cache com entradas:**

```bash
krab cache clear
```

```
✓ Cleared 42 cached entries.
```

**Cache ja vazio:**

```bash
krab cache clear
```

```
ℹ Cache is already empty.
```

:::info
O comando `krab cache clear` remove apenas os arquivos `.json` dentro de `.sdd/cache/`. O diretorio `.sdd/cache/` nao e removido, e os outros arquivos de memoria (`memory.json`, `skills.json`, `history.json`) nao sao afetados.
:::

---

## Comparacao de Performance

A tabela abaixo mostra a diferenca de tempo entre cache miss (primeira execucao, conteudo recomputado) e cache hit (execucao seguinte, resultado lido do disco) para os comandos de analise:

### Arquivo Individual

| Comando | Cache Miss | Cache Hit | Speedup |
|---|---|---|---|
| `krab analyze tokens spec.md` | ~120ms | ~8ms | **15x** |
| `krab analyze quality spec.md` | ~95ms | ~7ms | **13.5x** |
| `krab analyze entropy spec.md` | ~180ms | ~8ms | **22.5x** |
| `krab analyze readability spec.md` | ~85ms | ~7ms | **12x** |
| `krab analyze freq spec.md` | ~70ms | ~7ms | **10x** |

:::note
Os tempos acima sao aproximados e variam de acordo com o tamanho do arquivo, hardware e carga do sistema. Medidos em um arquivo de spec com ~2.000 palavras em uma maquina com SSD NVMe.
:::

### Batch Mode (10 Arquivos)

| Cenario | Tempo Total | Tempo Medio/Arquivo |
|---|---|---|
| `krab analyze batch specs/ -a tokens` (cache miss, 1a execucao) | ~1.2s | ~120ms |
| `krab analyze batch specs/ -a tokens` (cache hit, 2a execucao) | ~80ms | ~8ms |
| `krab analyze batch specs/ -a readability` (cache miss) | ~850ms | ~85ms |
| `krab analyze batch specs/ -a readability` (cache hit) | ~70ms | ~7ms |
| `krab analyze batch specs/ -a tokens --no-cache` (forcar recomputacao) | ~1.2s | ~120ms |

O ganho e especialmente significativo no modo batch: analisar 10 arquivos com cache hit leva menos de 100ms no total, enquanto sem cache pode levar mais de 1 segundo.

---

## Cenarios de Uso

### Desenvolvimento Iterativo

Durante o desenvolvimento, voce frequentemente roda `krab analyze` nos mesmos arquivos para verificar qualidade. O cache garante que apenas arquivos que mudaram sao recomputados:

```bash
# Primeira execucao — computa tudo (cache miss)
krab analyze batch specs/ -a quality

# Edita spec.task.auth.md...

# Segunda execucao — so recomputa o arquivo editado
krab analyze batch specs/ -a quality
# 9 arquivos: cache hit (instantaneo)
# 1 arquivo: cache miss (recomputado)
```

### CI/CD Pipeline

Em pipelines de CI, o cache pode nao estar disponivel entre execucoes (a menos que o diretorio `.sdd/cache/` seja persistido). Nesse caso, use `--no-cache` explicitamente:

```bash
# No CI, sempre recomputar para garantir resultados frescos
krab analyze batch specs/ -a quality --no-cache
```

### Limpeza Periodica

O cache cresce a medida que arquivos sao analisados. Entradas antigas (de arquivos que nao existem mais ou mudaram) permanecem no cache ate serem limpas manualmente:

```bash
# Verificar tamanho do cache
krab cache stats

# Se necessario, limpar
krab cache clear
```

---

## Estrutura Interna de uma Entrada de Cache

Cada arquivo `.json` no cache tem a seguinte estrutura:

```json
{
  "_content_hash": "a1b2c3d4e5f6...full sha256 hex digest...",
  "_command": "analyze_tokens",
  "_params": {
    "encoding": "cl100k_base"
  },
  "result": {
    "summary": {
      "characters": 5432,
      "words": 987,
      "tokens": 1456,
      "chars_per_token": 3.7
    },
    "cost": {
      "total_cost_usd": 0.0022
    }
  }
}
```

| Campo | Descricao |
|---|---|
| `_content_hash` | SHA-256 completo do conteudo original. Usado para verificacao de integridade na leitura. |
| `_command` | Nome do comando que gerou esse resultado. Apenas para depuracao. |
| `_params` | Parametros usados na analise. Apenas para depuracao. |
| `result` | O resultado da analise propriamente dito — estrutura varia por comando. |

Os campos prefixados com `_` sao metadados internos. O campo `result` contem os dados que sao retornados ao usuario na segunda execucao (cache hit).
