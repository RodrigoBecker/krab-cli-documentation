---
sidebar_position: 7
title: memory — Memoria
---

# `krab memory` — Memoria do Projeto

O comando `krab memory` gerencia a **memoria persistente do projeto**, armazenada no diretorio `.sdd/`. Essa memoria contem contexto sobre o projeto — tech stack, convencoes, termos de dominio, skills — e e automaticamente injetada em templates de spec, instrucoes de agentes IA e prompts de workflow.

A memoria e o que diferencia specs genericas de specs que realmente conhecem o seu projeto.

## Visao Geral dos Subcomandos

| Subcomando | Descricao |
|---|---|
| `krab memory init` | Inicializa o diretorio `.sdd/` com arquivos de memoria |
| `krab memory show` | Exibe a memoria atual do projeto |
| `krab memory set` | Define campos da memoria (suporta dot notation) |
| `krab memory add-skill` | Adiciona uma skill ao projeto |
| `krab memory remove-skill` | Remove uma skill pelo nome |
| `krab memory skills` | Lista todas as skills registradas |
| `krab memory history` | Exibe o historico de geracao de specs |

---

## Estrutura do Diretorio `.sdd/`

Ao inicializar a memoria, o Krab cria a seguinte estrutura:

```
.sdd/
├── memory.json        # Contexto principal do projeto
├── skills.json        # Skills e tecnologias do projeto
├── history.json       # Historico de geracao e importacao de specs
├── registries.json    # Aliases de repos Git remotos (criado via krab spec registry add)
├── specs/             # Specs geradas e importadas (criado sob demanda)
│   └── spec.task.*.md
├── cache/             # Cache de resultados de analise (criado sob demanda)
│   ├── a1b2c3d4e5f6.json
│   └── ...
└── workflows/         # Workflows customizados YAML (criado via krab workflow new)
    └── *.yaml
```

### `memory.json`

Armazena o contexto principal do projeto: nome, descricao, tech stack, convencoes de codigo, termos de dominio, contexto do time, integracoes e constraints. Esse arquivo e o coracao da memoria — tudo que os agentes IA precisam saber para gerar codigo e specs consistentes com o projeto.

### `skills.json`

Lista de tecnologias, frameworks, padroes e ferramentas que o projeto utiliza. Cada skill tem categoria, versao, descricao e tags. As skills sao usadas para contextualizar a geracao de specs e instrucoes de agentes.

### `history.json`

Registro cronologico de todas as specs geradas (`krab spec new`) e importadas (`krab spec import`), incluindo timestamp, tipo de template, nome, arquivo de saida e fonte de importacao. Util para rastrear a evolucao das especificacoes do projeto.

### `registries.json`

Aliases reutilizaveis para repositorios Git remotos que contem specs. Criado automaticamente ao executar `krab spec registry add`. Cada entrada armazena nome, URL, subdiretorio padrao e branch. Veja [`krab spec registry`](./spec#krab-spec-registry) para detalhes.

---

## `krab memory init`

Inicializa o diretorio `.sdd/` com os tres arquivos JSON vazios. Se o diretorio ja existir, os arquivos sao sobrescritos.

### Sintaxe

```bash
krab memory init [--name/-n <nome>] [--desc/-d <descricao>]
```

### Parametros

| Parametro | Alias | Obrigatorio | Descricao |
|---|---|---|---|
| `--name` | `-n` | Nao* | Nome do projeto. *Se omitido, um prompt interativo sera exibido. |
| `--desc` | `-d` | Nao | Descricao breve do projeto |

### Exemplos

**Inicializacao com parametros:**

```bash
krab memory init -n "meu-saas" -d "Plataforma SaaS multi-tenant para gestao financeira"
```

Saida:

```
✓ Projeto inicializado: .sdd/
ℹ Nome: meu-saas
ℹ Use `krab memory set` para configurar stack, convenções, etc.
```

**Inicializacao interativa (sem `--name`):**

```bash
krab memory init
```

```
Nome do projeto: meu-saas
✓ Projeto inicializado: .sdd/
ℹ Nome: meu-saas
ℹ Use `krab memory set` para configurar stack, convenções, etc.
```

**Resultado no filesystem:**

```bash
$ tree .sdd/
.sdd/
├── memory.json
├── skills.json
└── history.json
```

O `memory.json` criado tera a seguinte estrutura inicial:

```json
{
  "project_name": "meu-saas",
  "description": "Plataforma SaaS multi-tenant para gestao financeira",
  "tech_stack": {},
  "architecture_style": "",
  "conventions": {},
  "domain_terms": {},
  "team_context": {},
  "integrations": [],
  "constraints": [],
  "decisions": [],
  "created_at": "2026-02-24T12:00:00+00:00",
  "updated_at": "2026-02-24T12:00:00+00:00"
}
```

---

## `krab memory show`

Exibe a memoria completa do projeto em formato de tabela.

### Sintaxe

```bash
krab memory show
```

Nao aceita parametros. Requer que o projeto tenha sido inicializado com `krab memory init`.

### Exemplo de Saida

```
╭─ Project Memory: meu-saas ─────────────────────────────────╮

┌──────────────────────┬────────────────────────────────────────┐
│ Campo                │ Valor                                  │
├──────────────────────┼────────────────────────────────────────┤
│ project_name         │ meu-saas                               │
│ description          │ Plataforma SaaS multi-tenant           │
│ architecture_style   │ hexagonal                              │
│ created_at           │ 2026-02-24T12:00:00+00:00              │
│ updated_at           │ 2026-02-24T14:30:00+00:00              │
│ tech_stack.backend   │ Python/FastAPI                         │
│ tech_stack.frontend  │ React/TypeScript                       │
│ tech_stack.database  │ PostgreSQL                             │
│ conventions.commits  │ conventional commits                   │
│ conventions.branches │ gitflow                                │
│ domain_terms.tenant  │ Organizacao cliente no sistema         │
│ team_context.size    │ 5 devs                                 │
│ integrations         │ Stripe, SendGrid, AWS S3               │
│ constraints          │ Sem dependencias externas em runtime,  │
│                      │ Python 3.12+                           │
└──────────────────────┴────────────────────────────────────────┘
```

Se o projeto nao foi inicializado, o comando retorna um erro:

```
✗ Projeto não inicializado. Use `krab memory init` primeiro.
```

---

## `krab memory set`

Define campos da memoria do projeto. Suporta tres tipos de campos: top-level (string), dict (dot notation) e list (auto-append).

### Sintaxe

```bash
krab memory set <key> <value>
```

### Parametros

| Parametro | Obrigatorio | Descricao |
|---|---|---|
| `key` | Sim | Chave do campo. Suporta dot notation para dicts (ex: `tech_stack.backend`) |
| `value` | Sim | Valor a ser definido |

### Tipos de Campos

#### Campos Top-level (string simples)

Esses campos aceitam um valor string direto:

| Campo | Descricao |
|---|---|
| `project_name` | Nome do projeto |
| `description` | Descricao do projeto |
| `architecture_style` | Estilo arquitetural (monolith, microservices, hexagonal, etc.) |

```bash
# Definir estilo arquitetural
krab memory set architecture_style "hexagonal"
```

```
✓ Configurado: architecture_style = hexagonal
```

```bash
# Atualizar descricao do projeto
krab memory set description "Plataforma SaaS multi-tenant para gestao financeira com foco em PMEs"
```

```
✓ Configurado: description = Plataforma SaaS multi-tenant para gestao financeira com foco em PMEs
```

#### Campos Dict (dot notation)

Esses campos sao dicionarios e usam dot notation (`campo.chave`) para definir pares chave-valor. Se a chave ja existir, o valor e sobrescrito.

| Campo | Descricao |
|---|---|
| `tech_stack.*` | Tecnologias do projeto (backend, frontend, database, infra, etc.) |
| `conventions.*` | Convencoes de desenvolvimento (commits, branches, naming, etc.) |
| `domain_terms.*` | Glossario de termos do dominio de negocio |
| `team_context.*` | Informacoes sobre o time (tamanho, experiencia, processo, etc.) |

**Tech Stack — exemplos:**

```bash
krab memory set tech_stack.backend "Python/FastAPI"
```

```
✓ Configurado: tech_stack.backend = Python/FastAPI
```

```bash
krab memory set tech_stack.frontend "React/TypeScript"
```

```
✓ Configurado: tech_stack.frontend = React/TypeScript
```

```bash
krab memory set tech_stack.database "PostgreSQL"
```

```
✓ Configurado: tech_stack.database = PostgreSQL
```

```bash
krab memory set tech_stack.cache "Redis"
```

```
✓ Configurado: tech_stack.cache = Redis
```

```bash
krab memory set tech_stack.infra "AWS ECS + Terraform"
```

```
✓ Configurado: tech_stack.infra = AWS ECS + Terraform
```

**Conventions — exemplos:**

```bash
krab memory set conventions.commits "conventional commits"
```

```
✓ Configurado: conventions.commits = conventional commits
```

```bash
krab memory set conventions.branches "gitflow"
```

```
✓ Configurado: conventions.branches = gitflow
```

```bash
krab memory set conventions.naming "snake_case para Python, camelCase para TypeScript"
```

```
✓ Configurado: conventions.naming = snake_case para Python, camelCase para TypeScript
```

```bash
krab memory set conventions.tests "pytest com fixtures, cobertura minima 80%"
```

```
✓ Configurado: conventions.tests = pytest com fixtures, cobertura minima 80%
```

**Domain Terms — exemplos:**

```bash
krab memory set domain_terms.tenant "Organizacao cliente no sistema multi-tenant"
```

```
✓ Configurado: domain_terms.tenant = Organizacao cliente no sistema multi-tenant
```

```bash
krab memory set domain_terms.workspace "Espaco de trabalho dentro de um tenant"
```

```
✓ Configurado: domain_terms.workspace = Espaco de trabalho dentro de um tenant
```

```bash
krab memory set domain_terms.billing_cycle "Periodo de cobranca mensal do tenant"
```

```
✓ Configurado: domain_terms.billing_cycle = Periodo de cobranca mensal do tenant
```

**Team Context — exemplos:**

```bash
krab memory set team_context.size "5 devs"
```

```
✓ Configurado: team_context.size = 5 devs
```

```bash
krab memory set team_context.seniority "2 seniors, 2 plenos, 1 junior"
```

```
✓ Configurado: team_context.seniority = 2 seniors, 2 plenos, 1 junior
```

```bash
krab memory set team_context.process "Scrum com sprints de 2 semanas"
```

```
✓ Configurado: team_context.process = Scrum com sprints de 2 semanas
```

#### Campos List (auto-append)

Esses campos sao listas. Cada chamada a `set` **adiciona** um novo item a lista (nao sobrescreve):

| Campo | Descricao |
|---|---|
| `constraints` | Restricoes e regras do projeto |
| `integrations` | Integracoes externas |

```bash
krab memory set constraints "Sem dependencias externas em runtime"
```

```
✓ Configurado: constraints = Sem dependencias externas em runtime
```

```bash
krab memory set constraints "Python 3.12+ obrigatorio"
```

```
✓ Configurado: constraints = Python 3.12+ obrigatorio
```

```bash
krab memory set constraints "Tempo de resposta da API < 200ms p95"
```

```
✓ Configurado: constraints = Tempo de resposta da API < 200ms p95
```

```bash
krab memory set integrations "Stripe para pagamentos"
```

```
✓ Configurado: integrations = Stripe para pagamentos
```

```bash
krab memory set integrations "SendGrid para emails transacionais"
```

```
✓ Configurado: integrations = SendGrid para emails transacionais
```

```bash
krab memory set integrations "AWS S3 para armazenamento de arquivos"
```

```
✓ Configurado: integrations = AWS S3 para armazenamento de arquivos
```

### Erros Comuns

Se voce tentar usar dot notation em um campo que nao e dict:

```bash
krab memory set constraints.first "alguma coisa"
```

```
✗ Field 'constraints' is not a dict, cannot set 'first'
```

Se voce tentar definir um campo inexistente:

```bash
krab memory set campo_invalido "valor"
```

```
✗ Unknown field: campo_invalido
```

---

## `krab memory add-skill`

Adiciona uma skill (tecnologia, ferramenta, padrao) ao projeto. Se uma skill com o mesmo `category/name` ja existir, ela e atualizada.

### Sintaxe

```bash
krab memory add-skill <name> [--cat/-c <categoria>] [--ver/-v <versao>] [--desc/-d <descricao>] [--tags/-t <tags>]
```

### Parametros

| Parametro | Alias | Obrigatorio | Default | Descricao |
|---|---|---|---|---|
| `name` | — | Sim | — | Nome da skill |
| `--cat` | `-c` | Nao | `tool` | Categoria: `language`, `framework`, `tool`, `pattern`, `infra`, `service` |
| `--ver` | `-v` | Nao | `""` | Versao da skill |
| `--desc` | `-d` | Nao | `""` | Descricao da skill |
| `--tags` | `-t` | Nao | `""` | Tags separadas por virgula |

### Categorias Disponiveis

| Categoria | Descricao | Exemplos |
|---|---|---|
| `language` | Linguagens de programacao | Python, TypeScript, Rust |
| `framework` | Frameworks e bibliotecas | FastAPI, React, Django |
| `tool` | Ferramentas de desenvolvimento | pytest, Ruff, Docker |
| `pattern` | Padroes arquiteturais e de design | CQRS, Event Sourcing, Repository |
| `infra` | Infraestrutura e cloud | AWS, Terraform, Kubernetes |
| `service` | Servicos externos | Stripe, SendGrid, Datadog |

### Exemplos por Categoria

**Language:**

```bash
krab memory add-skill Python -c language -v "3.12" -d "Linguagem principal do backend" -t "backend,core"
```

```
✓ Skill adicionada: language/Python
```

```bash
krab memory add-skill TypeScript -c language -v "5.3" -d "Frontend e tooling" -t "frontend"
```

```
✓ Skill adicionada: language/TypeScript
```

**Framework:**

```bash
krab memory add-skill FastAPI -c framework -v "0.109" -d "Framework web async" -t "api,rest"
```

```
✓ Skill adicionada: framework/FastAPI
```

```bash
krab memory add-skill React -c framework -v "18" -d "UI library" -t "frontend,spa"
```

```
✓ Skill adicionada: framework/React
```

**Tool:**

```bash
krab memory add-skill pytest -c tool -d "Test framework com fixtures" -t "testing"
```

```
✓ Skill adicionada: tool/pytest
```

```bash
krab memory add-skill Ruff -c tool -d "Linter e formatter Python" -t "linting,formatting"
```

```
✓ Skill adicionada: tool/Ruff
```

**Pattern:**

```bash
krab memory add-skill "Repository Pattern" -c pattern -d "Abstracao de acesso a dados" -t "ddd,persistence"
```

```
✓ Skill adicionada: pattern/Repository Pattern
```

```bash
krab memory add-skill CQRS -c pattern -d "Command Query Responsibility Segregation" -t "architecture"
```

```
✓ Skill adicionada: pattern/CQRS
```

**Infra:**

```bash
krab memory add-skill "AWS ECS" -c infra -d "Container orchestration" -t "cloud,containers"
```

```
✓ Skill adicionada: infra/AWS ECS
```

```bash
krab memory add-skill Terraform -c infra -v "1.7" -d "Infrastructure as Code" -t "iac"
```

```
✓ Skill adicionada: infra/Terraform
```

**Service:**

```bash
krab memory add-skill Stripe -c service -d "Processamento de pagamentos" -t "billing,payments"
```

```
✓ Skill adicionada: service/Stripe
```

### Como as Skills sao Utilizadas

As skills sao usadas em tres contextos principais:

1. **Geracao de specs** (`krab spec new`): O template inclui o contexto de skills para que as specs geradas ja referenciem as tecnologias corretas do projeto.

2. **Instrucoes de agentes** (`krab agent sync`): As skills sao listadas nos arquivos de instrucao (CLAUDE.md, copilot-instructions.md, AGENTS.md) para que os agentes IA conhecam as tecnologias do projeto.

3. **Prompts de workflow** (`krab workflow run`): As skills contextualizam os prompts enviados aos agentes durante a execucao de workflows.

---

## `krab memory remove-skill`

Remove uma skill do projeto pelo nome.

### Sintaxe

```bash
krab memory remove-skill <name>
```

### Parametros

| Parametro | Obrigatorio | Descricao |
|---|---|---|
| `name` | Sim | Nome da skill a ser removida |

### Exemplo

```bash
krab memory remove-skill Stripe
```

```
✓ Skill removida: Stripe
```

:::info
A remocao e feita pelo nome da skill, independente da categoria. Se nao existir uma skill com esse nome, o comando executa sem erro (operacao idempotente).
:::

---

## `krab memory skills`

Lista todas as skills registradas no projeto, organizadas por categoria.

### Sintaxe

```bash
krab memory skills
```

Nao aceita parametros.

### Exemplo de Saida

```
╭─ Project Skills: 8 skills ─────────────────────────────────╮

┌──────────┬────────────────────┬────────┬──────────────────────────────┬─────────────────────┐
│ Categoria│ Nome               │ Versao │ Descricao                    │ Tags                │
├──────────┼────────────────────┼────────┼──────────────────────────────┼─────────────────────┤
│ framework│ FastAPI            │ 0.109  │ Framework web async          │ api, rest           │
│ framework│ React              │ 18     │ UI library                   │ frontend, spa       │
│ infra    │ AWS ECS            │        │ Container orchestration      │ cloud, containers   │
│ infra    │ Terraform          │ 1.7    │ Infrastructure as Code       │ iac                 │
│ language │ Python             │ 3.12   │ Linguagem principal          │ backend, core       │
│ language │ TypeScript         │ 5.3    │ Frontend e tooling           │ frontend            │
│ pattern  │ Repository Pattern │        │ Abstracao de acesso a dados  │ ddd, persistence    │
│ tool     │ pytest             │        │ Test framework com fixtures  │ testing             │
└──────────┴────────────────────┴────────┴──────────────────────────────┴─────────────────────┘
```

Se nao houver skills registradas:

```
╭─ Project Skills: 0 skills ─────────────────────────────────╮
ℹ Nenhuma skill registrada. Use `krab memory add-skill` para adicionar.
```

---

## `krab memory history`

Exibe o historico de geracao de specs pelo `krab spec new`.

### Sintaxe

```bash
krab memory history [--top <n>]
```

### Parametros

| Parametro | Obrigatorio | Default | Descricao |
|---|---|---|---|
| `--top` | Nao | `20` | Numero maximo de entradas a exibir (as mais recentes) |

### Exemplo de Saida

```bash
krab memory history --top 5
```

```
╭─ Generation History: 12 entries ────────────────────────────╮

┌─────────────────────┬──────────┬──────────────┬────────────────────────────────┐
│ Timestamp           │ Action   │ Template     │ Name/File                      │
├─────────────────────┼──────────┼──────────────┼────────────────────────────────┤
│ 2026-02-24T10:30:00 │ spec_new │ task         │ implementar-autenticacao       │
│ 2026-02-24T11:15:00 │ spec_new │ architecture │ sistema-de-billing             │
│ 2026-02-24T14:00:00 │ spec_new │ task         │ crud-workspaces                │
│ 2026-02-24T15:45:00 │ spec_new │ plan         │ migracao-v2                    │
│ 2026-02-24T16:20:00 │ spec_new │ refining     │ crud-workspaces                │
└─────────────────────┴──────────┴──────────────┴────────────────────────────────┘
```

Cada entrada no historico e registrada automaticamente pelo `krab spec new` e contem:

- **timestamp**: Data/hora UTC da geracao
- **action**: Sempre `spec_new` para geracao de specs
- **template**: Tipo do template usado (`task`, `architecture`, `plan`, `skill`, `refining`)
- **name**: Nome da spec ou caminho do arquivo gerado

---

## Como a Memoria e Utilizada

A memoria do projeto e automaticamente injetada em varios pontos do Krab CLI:

### 1. Templates de Spec (`krab spec new`)

Quando voce gera uma nova spec, o Krab injeta o contexto da memoria no template. Isso inclui:

- Nome e descricao do projeto
- Estilo arquitetural
- Tech stack (formatada como `Stack: backend: Python/FastAPI, frontend: React/TypeScript`)
- Termos de dominio (para manter a linguagem consistente)
- Constraints (para que a spec ja considere as restricoes)
- Integracoes (para que a spec referencie servicos relevantes)

### 2. Instrucoes de Agentes (`krab agent sync`)

O `krab agent sync` le a memoria e as skills para gerar arquivos de instrucao otimizados para cada agente IA:

- **CLAUDE.md**: Tech stack, convencoes, termos de dominio, constraints
- **copilot-instructions.md**: Statements curtas e autocontidas baseadas na memoria
- **AGENTS.md**: Visao completa do projeto com comandos, convencoes e glossario

### 3. Prompts de Workflow (`krab workflow run`)

Workflows que enviam prompts para agentes IA incluem o contexto da memoria para que os agentes trabalhem com informacoes atualizadas do projeto.

### 4. Context Block

Internamente, o Krab gera um "context block" a partir da memoria. Exemplo do que e gerado pelo metodo `to_context_block()`:

```
Project: meu-saas
Description: Plataforma SaaS multi-tenant para gestao financeira
Architecture: hexagonal
Stack: backend: Python/FastAPI, frontend: React/TypeScript, database: PostgreSQL
Domain: tenant (Organizacao cliente no sistema), workspace (Espaco de trabalho)
Constraints: Sem dependencias externas em runtime; Python 3.12+
Integrations: Stripe, SendGrid, AWS S3
```

---

## Boas Praticas

### O que Colocar na Memoria

Para obter os melhores resultados na geracao de specs e instrucoes de agentes:

1. **Tech Stack completa**: Inclua backend, frontend, database, cache, message broker, infra. Quanto mais completa, melhor os agentes entendem o projeto.

2. **Convencoes de codigo**: Commits, branches, naming, testes, code review. Isso evita que os agentes gerem codigo fora do padrao do projeto.

3. **Termos de dominio**: Defina termos especificos do negocio. Isso evita ambiguidade nas specs e garante que os agentes usem a terminologia correta.

4. **Constraints reais**: Inclua restricoes tecnicas (versao minima do Python, limites de performance), regulatorias (LGPD, PCI-DSS) e de negocio (SLA, uptime).

5. **Contexto do time**: Tamanho, senioridade e processo. Isso ajuda a calibrar a complexidade das specs geradas.

6. **Skills com versoes**: Sempre que possivel, inclua a versao das tecnologias. Isso evita que os agentes sugiram features de versoes mais recentes.

### O que Evitar

- **Informacoes obvias**: Nao inclua "usa Git para controle de versao" — isso nao agrega contexto.
- **Informacoes volateis**: Nao coloque numeros que mudam frequentemente (ex: "42 endpoints"). Use informacoes estaveis.
- **Segredos**: Nunca coloque senhas, tokens ou chaves de API na memoria. O `.sdd/` pode (e deve) ser commitado no repositorio.

### Workflow Recomendado

```bash
# 1. Inicializar o projeto
krab memory init -n "meu-projeto" -d "Descricao do projeto"

# 2. Configurar tech stack
krab memory set tech_stack.backend "Python/FastAPI"
krab memory set tech_stack.frontend "React/TypeScript"
krab memory set tech_stack.database "PostgreSQL"

# 3. Definir convencoes
krab memory set conventions.commits "conventional commits"
krab memory set conventions.branches "trunk-based development"
krab memory set conventions.tests "pytest, cobertura minima 80%"

# 4. Adicionar termos de dominio
krab memory set domain_terms.tenant "Organizacao cliente"
krab memory set domain_terms.workspace "Espaco de trabalho"

# 5. Registrar skills
krab memory add-skill Python -c language -v "3.12"
krab memory add-skill FastAPI -c framework -v "0.109"
krab memory add-skill pytest -c tool

# 6. Definir constraints
krab memory set constraints "Python 3.12+ obrigatorio"
krab memory set constraints "API response time < 200ms p95"

# 7. Sincronizar com agentes IA
krab agent sync

# 8. Verificar a memoria completa
krab memory show
```

---

## Referencia Tecnica

### Formato do `memory.json`

```json
{
  "project_name": "string",
  "description": "string",
  "tech_stack": {
    "chave": "valor"
  },
  "architecture_style": "string",
  "conventions": {
    "chave": "valor"
  },
  "domain_terms": {
    "termo": "definicao"
  },
  "team_context": {
    "chave": "valor"
  },
  "integrations": ["string"],
  "constraints": ["string"],
  "decisions": [
    {
      "title": "string",
      "status": "proposed | accepted | deprecated | superseded",
      "context": "string",
      "decision": "string",
      "consequences": "string",
      "date": "string",
      "supersedes": "string"
    }
  ],
  "created_at": "ISO 8601",
  "updated_at": "ISO 8601"
}
```

### Formato do `skills.json`

```json
[
  {
    "name": "string",
    "category": "language | framework | tool | pattern | infra | service",
    "version": "string",
    "description": "string",
    "tags": ["string"]
  }
]
```

### Formato do `history.json`

```json
[
  {
    "action": "spec_new",
    "template": "task | architecture | plan | skill | refining",
    "name": "string",
    "file": "string",
    "timestamp": "ISO 8601"
  }
]
```
