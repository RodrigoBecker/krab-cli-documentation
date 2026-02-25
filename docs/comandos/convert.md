---
sidebar_position: 2
title: convert — Conversao
---

# convert — Conversao de Formatos

O comando `krab convert` converte specs SDD entre os formatos **Markdown**, **JSON** e **YAML**. Isso permite que specs escritas em Markdown sejam consumidas por pipelines automatizados (JSON), ferramentas de configuracao (YAML), ou que dados estruturados sejam transformados de volta em documentacao legivel (Markdown).

## Subcomandos

| Subcomando | Descricao | Direcao |
|---|---|---|
| [`krab convert md2json`](#krab-convert-md2json) | Markdown para JSON | MD → JSON |
| [`krab convert json2md`](#krab-convert-json2md) | JSON para Markdown | JSON → MD |
| [`krab convert md2yaml`](#krab-convert-md2yaml) | Markdown para YAML | MD → YAML |
| [`krab convert yaml2md`](#krab-convert-yaml2md) | YAML para Markdown | YAML → MD |
| [`krab convert auto`](#krab-convert-auto) | Auto-deteccao de formato | Qualquer → Qualquer |

### Conversoes suportadas

```
     ┌──────────┐
     │ Markdown │
     └────┬─────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌──────┐   ┌──────┐
│ JSON │   │ YAML │
└──────┘   └──────┘
```

Todas as conversoes sao bidirecionais: MD ↔ JSON e MD ↔ YAML. A conversao direta JSON ↔ YAML nao e suportada — use Markdown como formato intermediario.

---

## Como o parser de Markdown funciona

O Krab CLI usa um parser customizado (nao depende de bibliotecas externas de Markdown) que converte documentos Markdown estruturados em uma representacao de dicionario normalizada. O parser reconhece:

### Elementos suportados

| Elemento | Exemplo | Representacao no JSON |
|---|---|---|
| **Front-matter YAML** | `---`/`---` delimitado | Chave `_meta` com pares chave-valor |
| **Headings** (h1-h6) | `# Titulo`, `## Secao` | Array `sections` com `heading`, `level`, `content` |
| **Listas nao-ordenadas** | `- item`, `* item` | Object `type: "list"`, `list_type: "unordered"` |
| **Listas ordenadas** | `1. item`, `2. item` | Object `type: "list"`, `list_type: "ordered"` |
| **Listas aninhadas** | Indentacao de 2 espacos | Campo `depth` no item (0, 1, 2, ...) |
| **Code blocks** | `` ```python `` ... `` ``` `` | Object `type: "code_block"`, `language`, `content` |
| **Paragrafos** | Texto livre | Object `type: "paragraph"`, `text` |

### Estrutura de saida

O resultado do parser sempre segue este schema:

```json
{
  "_meta": {                    // Opcional — apenas se houver front-matter
    "title": "valor",
    "version": "1.0"
  },
  "sections": [                 // Array de secoes
    {
      "heading": "Titulo da Secao",
      "level": 1,               // 1 = h1, 2 = h2, etc.
      "content": [              // Array de blocos de conteudo
        { "type": "paragraph", "text": "Texto do paragrafo." },
        {
          "type": "list",
          "list_type": "unordered",
          "items": [
            { "text": "Item 1", "depth": 0 },
            { "text": "Sub-item", "depth": 1 }
          ]
        },
        {
          "type": "code_block",
          "language": "python",
          "content": "def hello():\n    print('world')"
        }
      ]
    }
  ]
}
```

### Logica de deteccao de formato

O comando `auto` detecta o formato de entrada pela extensao do arquivo:

| Extensao | Formato detectado |
|---|---|
| `.md`, `.markdown` | `md` |
| `.json` | `json` |
| `.yaml`, `.yml` | `yaml` |

Se a extensao nao for reconhecida, o comando retorna um erro.

---

## krab convert md2json

Converte um arquivo Markdown para JSON estruturado.

### Sintaxe

```bash
krab convert md2json <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Arquivo Markdown de entrada |
| `-o`, `--output` | Path | Nao | — (stdout) | Arquivo JSON de saida |
| `--indent` | int | Nao | `2` | Indentacao do JSON |

### Exemplo completo

Dado o arquivo `spec.task.login.md`:

```markdown
---
title: Login Feature
version: 1.0
---

# Login Feature

Implementar sistema de login com JWT.

## Requisitos Funcionais

- Usuario deve informar email e senha
- Sistema deve validar credenciais contra o banco
- Retornar JWT token com expiracao de 24h

## API

### POST /auth/login

Endpoint de autenticacao.

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

### Resposta de Sucesso

```json
{
  "token": "eyJhbGciOi...",
  "expires_in": 86400
}
```
```

Executando:

```bash
$ krab convert md2json spec.task.login.md
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Convert — MD → JSON: spec.task.login.md
╚══════════════════════════════════════════════════╝

{
  "_meta": {
    "title": "Login Feature",
    "version": "1.0"
  },
  "sections": [
    {
      "heading": "Login Feature",
      "level": 1,
      "content": [
        {
          "type": "paragraph",
          "text": "Implementar sistema de login com JWT."
        }
      ]
    },
    {
      "heading": "Requisitos Funcionais",
      "level": 2,
      "content": [
        {
          "type": "list",
          "list_type": "unordered",
          "items": [
            { "text": "Usuario deve informar email e senha", "depth": 0 },
            { "text": "Sistema deve validar credenciais contra o banco", "depth": 0 },
            { "text": "Retornar JWT token com expiracao de 24h", "depth": 0 }
          ]
        }
      ]
    },
    {
      "heading": "API",
      "level": 2,
      "content": []
    },
    {
      "heading": "POST /auth/login",
      "level": 3,
      "content": [
        {
          "type": "paragraph",
          "text": "Endpoint de autenticacao."
        },
        {
          "type": "code_block",
          "language": "json",
          "content": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"secret123\"\n}"
        }
      ]
    },
    {
      "heading": "Resposta de Sucesso",
      "level": 3,
      "content": [
        {
          "type": "code_block",
          "language": "json",
          "content": "{\n  \"token\": \"eyJhbGciOi...\",\n  \"expires_in\": 86400\n}"
        }
      ]
    }
  ]
}
```

#### Salvando em arquivo

```bash
$ krab convert md2json spec.task.login.md -o spec.task.login.json --indent 4
```

```
╔══════════════════════════════════════════════════╗
║  Convert — MD → JSON: spec.task.login.md
╚══════════════════════════════════════════════════╝

✓ Saved to: spec.task.login.json
```

---

## krab convert json2md

Converte um arquivo JSON estruturado de volta para Markdown.

### Sintaxe

```bash
krab convert json2md <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Arquivo JSON de entrada |
| `-o`, `--output` | Path | Nao | — (stdout) | Arquivo Markdown de saida |

### Exemplo

```bash
$ krab convert json2md spec.task.login.json
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Convert — JSON → MD: spec.task.login.json
╚══════════════════════════════════════════════════╝

---
title: Login Feature
version: 1.0
---

# Login Feature

Implementar sistema de login com JWT.

## Requisitos Funcionais

- Usuario deve informar email e senha
- Sistema deve validar credenciais contra o banco
- Retornar JWT token com expiracao de 24h

## API

### POST /auth/login

Endpoint de autenticacao.

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

### Resposta de Sucesso

```json
{
  "token": "eyJhbGciOi...",
  "expires_in": 86400
}
```
```

:::tip Round-trip fidelity
A conversao MD → JSON → MD preserva a estrutura e o conteudo. Code blocks, listas, headings e front-matter sao reconstruidos fielmente. Paragrafos adjacentes podem ser consolidados em um unico bloco de texto.
:::

---

## krab convert md2yaml {#krab-convert-md2yaml}

Converte um arquivo Markdown para YAML.

### Sintaxe

```bash
krab convert md2yaml <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Arquivo Markdown de entrada |
| `-o`, `--output` | Path | Nao | — (stdout) | Arquivo YAML de saida |

### Exemplo

Dado o mesmo `spec.task.login.md` do exemplo anterior:

```bash
$ krab convert md2yaml spec.task.login.md
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Convert — MD → YAML: spec.task.login.md
╚══════════════════════════════════════════════════╝

_meta:
  title: Login Feature
  version: '1.0'
sections:
- heading: Login Feature
  level: 1
  content:
  - type: paragraph
    text: Implementar sistema de login com JWT.
- heading: Requisitos Funcionais
  level: 2
  content:
  - type: list
    list_type: unordered
    items:
    - text: Usuario deve informar email e senha
      depth: 0
    - text: Sistema deve validar credenciais contra o banco
      depth: 0
    - text: Retornar JWT token com expiracao de 24h
      depth: 0
- heading: API
  level: 2
  content: []
- heading: POST /auth/login
  level: 3
  content:
  - type: paragraph
    text: Endpoint de autenticacao.
  - type: code_block
    language: json
    content: "{\n  \"email\": \"user@example.com\",\n  \"password\": \"secret123\"\n}"
- heading: Resposta de Sucesso
  level: 3
  content:
  - type: code_block
    language: json
    content: "{\n  \"token\": \"eyJhbGciOi...\",\n  \"expires_in\": 86400\n}"
```

#### Salvando em arquivo

```bash
$ krab convert md2yaml spec.task.login.md -o spec.task.login.yaml
```

```
✓ Saved to: spec.task.login.yaml
```

---

## krab convert yaml2md

Converte um arquivo YAML de volta para Markdown.

### Sintaxe

```bash
krab convert yaml2md <file> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Arquivo YAML de entrada |
| `-o`, `--output` | Path | Nao | — (stdout) | Arquivo Markdown de saida |

### Exemplo

```bash
$ krab convert yaml2md spec.task.login.yaml -o spec.task.login.restored.md
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Convert — YAML → MD: spec.task.login.yaml
╚══════════════════════════════════════════════════╝

✓ Saved to: spec.task.login.restored.md
```

O conteudo do arquivo restaurado sera identico ao Markdown original, incluindo front-matter, headings, listas e code blocks.

### Tratamento de erros

Se o conteudo YAML nao tiver um `dict` na raiz, o comando retorna erro:

```bash
$ krab convert yaml2md lista.yaml
```

```
✗ Error: YAML content must be a mapping (dict) at the root level.
```

---

## krab convert auto

Auto-detecta o formato do arquivo de entrada pela extensao e converte para o formato de destino especificado com `--to`.

### Sintaxe

```bash
krab convert auto <file> --to <formato> [opcoes]
```

### Parametros

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `file` | Path | Sim | — | Arquivo de entrada (qualquer formato suportado) |
| `--to` | str | Sim | — | Formato alvo: `md`, `json`, `yaml` |
| `-o`, `--output` | Path | Nao | — (stdout) | Arquivo de saida |

### Exemplos de todas as direcoes

#### Markdown para JSON (auto-detectado)

```bash
$ krab convert auto spec.task.login.md --to json
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Convert — MD → JSON: spec.task.login.md
╚══════════════════════════════════════════════════╝

{
  "_meta": {
    "title": "Login Feature",
    "version": "1.0"
  },
  "sections": [
    ...
  ]
}
```

#### JSON para Markdown (auto-detectado)

```bash
$ krab convert auto spec.task.login.json --to md
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Convert — JSON → MD: spec.task.login.json
╚══════════════════════════════════════════════════╝

---
title: Login Feature
version: 1.0
---

# Login Feature

Implementar sistema de login com JWT.
...
```

#### YAML para Markdown (auto-detectado)

```bash
$ krab convert auto spec.task.login.yaml --to md -o spec.restored.md
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Convert — YAML → MD: spec.task.login.yaml
╚══════════════════════════════════════════════════╝

✓ Saved to: spec.restored.md
```

#### Markdown para YAML (auto-detectado)

```bash
$ krab convert auto spec.architecture.md --to yaml -o spec.architecture.yaml
```

Saida esperada:

```
╔══════════════════════════════════════════════════╗
║  Convert — MD → YAML: spec.architecture.md
╚══════════════════════════════════════════════════╝

✓ Saved to: spec.architecture.yaml
```

#### Extensao nao reconhecida

```bash
$ krab convert auto documento.txt --to json
```

```
✗ Error: Unrecognized file extension: .txt
```

#### Conversao nao suportada

Se voce tentar converter JSON para YAML diretamente:

```bash
$ krab convert auto spec.json --to yaml
```

```
✗ Error: Unsupported conversion: json→yaml. Supported: md→json, json→md, md→yaml, yaml→md, ...
```

:::tip Dica de uso
Para converter JSON para YAML (ou vice-versa), use Markdown como formato intermediario:

```bash
krab convert auto spec.json --to md -o temp.md
krab convert auto temp.md --to yaml -o spec.yaml
```
:::

---

## Dicionario de dict flat para Markdown

Quando o JSON/YAML de entrada nao segue o schema `sections` mas e um `dict` simples com chaves de texto, o builder de Markdown converte automaticamente:

- **Chaves** viram headings (com `_` e `-` convertidos em espacos e Title Case)
- **Valores string** viram paragrafos
- **Valores lista** viram listas nao-ordenadas
- **Valores dict** geram sub-headings recursivamente

Exemplo de JSON flat:

```json
{
  "project_name": "Krab CLI",
  "tech_stack": {
    "backend": "Python 3.12",
    "cli_framework": "Typer"
  },
  "features": ["optimize", "convert", "analyze"]
}
```

Resultado Markdown:

```markdown
# Project Name

Krab CLI

# Tech Stack

**backend**: Python 3.12 | **cli_framework**: Typer

## Backend

Python 3.12

## Cli Framework

Typer

# Features

- optimize
- convert
- analyze
```
