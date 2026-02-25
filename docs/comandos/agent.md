---
sidebar_position: 8
title: agent — Agentes IA
---

# `krab agent` — Agentes IA

O comando `krab agent` gera arquivos de instrucao otimizados para agentes de codificacao IA. Ele le a memoria do projeto (`.sdd/`) e os arquivos de spec para produzir instrucoes no formato nativo de cada agente — garantindo que Claude Code, GitHub Copilot e OpenAI Codex conhecam o contexto completo do seu projeto.

## Visao Geral dos Subcomandos

| Subcomando | Descricao |
|---|---|
| `krab agent sync` | Gera arquivos de instrucao + slash commands |
| `krab agent preview` | Visualiza o conteudo que seria gerado (sem escrever arquivos) |
| `krab agent status` | Verifica quais arquivos de instrucao existem |
| `krab agent diff` | Mostra o que mudaria se `sync` fosse executado |

---

## Agentes Suportados

| Agente | Arquivo Gerado | Filosofia do Formato |
|---|---|---|
| **Claude Code** | `CLAUDE.md` | Conciso, progressive disclosure, menos de 150 instrucoes |
| **GitHub Copilot** | `.github/copilot-instructions.md` + `.github/instructions/krab-specs.instructions.md` | Statements curtas e autocontidas |
| **OpenAI Codex** | `AGENTS.md` + `.agents/skills/krab-workflow/SKILL.md` | Hierarquico com skills |

Cada agente tem um formato e filosofia proprios. O Krab respeita as melhores praticas documentadas de cada um para gerar instrucoes que os agentes realmente conseguem processar de forma eficiente.

---

## `krab agent sync`

Gera arquivos de instrucao e slash commands nativos para os agentes IA. Este e o comando principal — execute-o sempre que alterar a memoria, adicionar skills ou modificar specs.

### Sintaxe

```bash
krab agent sync [target] [--no-commands]
```

### Parametros

| Parametro | Obrigatorio | Default | Descricao |
|---|---|---|---|
| `target` | Nao | `all` | Agente alvo: `all`, `claude`, `copilot`, `codex` |
| `--no-commands` | Nao | `false` | Pula a geracao de slash commands nativos |

### Exemplos

**Sincronizar todos os agentes:**

```bash
krab agent sync
```

```
╭─ Agent Sync: target=all ────────────────────────────────────╮
✓ [claude] CLAUDE.md
✓ [copilot] .github/copilot-instructions.md
✓ [copilot] .github/instructions/krab-specs.instructions.md
✓ [codex] AGENTS.md
✓ [codex] .agents/skills/krab-workflow/SKILL.md
ℹ Generated 5 instruction files for 3 agents
✓ [claude/cmd] .claude/commands/sdd-spec-create.md
✓ [claude/cmd] .claude/commands/sdd-implement.md
✓ [copilot/cmd] .github/instructions/sdd-spec-create.instructions.md
ℹ Generated 3 slash command files
```

**Sincronizar apenas o Claude Code:**

```bash
krab agent sync claude
```

```
╭─ Agent Sync: target=claude ─────────────────────────────────╮
✓ [claude] CLAUDE.md
ℹ Generated 1 instruction file(s) for claude
✓ [claude/cmd] .claude/commands/sdd-spec-create.md
✓ [claude/cmd] .claude/commands/sdd-implement.md
ℹ Generated 2 slash command files
```

**Sincronizar apenas o Copilot:**

```bash
krab agent sync copilot
```

```
╭─ Agent Sync: target=copilot ───────────────────────────────╮
✓ [copilot] .github/copilot-instructions.md
✓ [copilot] .github/instructions/krab-specs.instructions.md
ℹ Generated 2 instruction file(s) for copilot
✓ [copilot/cmd] .github/instructions/sdd-spec-create.instructions.md
ℹ Generated 1 slash command files
```

**Sincronizar apenas o Codex:**

```bash
krab agent sync codex
```

```
╭─ Agent Sync: target=codex ─────────────────────────────────╮
✓ [codex] AGENTS.md
✓ [codex] .agents/skills/krab-workflow/SKILL.md
ℹ Generated 2 instruction file(s) for codex
```

**Sincronizar sem gerar slash commands:**

```bash
krab agent sync --no-commands
```

```
╭─ Agent Sync: target=all ────────────────────────────────────╮
✓ [claude] CLAUDE.md
✓ [copilot] .github/copilot-instructions.md
✓ [copilot] .github/instructions/krab-specs.instructions.md
✓ [codex] AGENTS.md
✓ [codex] .agents/skills/krab-workflow/SKILL.md
ℹ Generated 5 instruction files for 3 agents
```

---

## `krab agent preview`

Visualiza o conteudo que seria gerado para um agente especifico, sem escrever nenhum arquivo no disco. Util para revisar o conteudo antes de sincronizar.

### Sintaxe

```bash
krab agent preview <target>
```

### Parametros

| Parametro | Obrigatorio | Descricao |
|---|---|---|
| `target` | Sim | Agente para preview: `claude`, `copilot`, `codex` |

### Exemplo

```bash
krab agent preview claude
```

```
╭─ Agent Preview: claude ─────────────────────────────────────╮
╭─ CLAUDE.md ─────────────────────────────────────────────────╮
│ # meu-saas                                                  │
│                                                             │
│ Plataforma SaaS multi-tenant para gestao financeira         │
│                                                             │
│ ## Architecture                                             │
│                                                             │
│ Style: **hexagonal**                                        │
│ - backend: Python/FastAPI                                   │
│ - frontend: React/TypeScript                                │
│ - database: PostgreSQL                                      │
│                                                             │
│ ## Structure                                                │
│                                                             │
│ ```                                                         │
│   src/                                                      │
│   tests/                                                    │
│ ```                                                         │
│                                                             │
│ ## Commands                                                 │
│ - `uv run pytest` — test                                    │
│ - `uv run ruff check src/ tests/` — lint                   │
│ - `uv run ruff format src/ tests/` — format                │
│                                                             │
│ ## Conventions                                              │
│ - **commits**: conventional commits                         │
│ - **branches**: gitflow                                     │
│                                                             │
│ ## Domain Terms                                             │
│                                                             │
│ tenant (Organizacao cliente), workspace (Espaco de trabalho)│
│                                                             │
│ ## Important                                                │
│ - Sem dependencias externas em runtime                      │
│ - Python 3.12+                                              │
│                                                             │
│ ## SDD Workflow                                             │
│ ...                                                         │
╰─────────────────────────────────────────────────────────────╯
```

---

## `krab agent status`

Verifica quais arquivos de instrucao existem no projeto. Mostra o status de cada arquivo para todos os agentes suportados, alem da memoria do Krab.

### Sintaxe

```bash
krab agent status
```

Nao aceita parametros.

### Exemplo de Saida

```
╭─ Agent Status: Instruction files ───────────────────────────╮

┌──────────────────────┬─────────────────────────────────────────────────┬──────────┐
│ Agent                │ File                                            │ Status   │
├──────────────────────┼─────────────────────────────────────────────────┼──────────┤
│ Claude Code          │ CLAUDE.md                                       │ + exists │
│ Copilot              │ .github/copilot-instructions.md                 │ + exists │
│ Copilot (specs)      │ .github/instructions/krab-specs.instructions.md │ + exists │
│ Codex                │ AGENTS.md                                       │ + exists │
│ Codex (skill)        │ .agents/skills/krab-workflow/SKILL.md           │ - missing│
│ Krab Memory          │ .sdd/memory.json                                │ + exists │
└──────────────────────┴─────────────────────────────────────────────────┴──────────┘

Use `krab agent sync` to generate all files
```

O status `+ exists` (verde) indica que o arquivo existe. O status `- missing` (cinza) indica que o arquivo ainda nao foi gerado.

---

## `krab agent diff`

Mostra as diferencas entre os arquivos de instrucao existentes e o que seria gerado por um `sync`. Util para revisar mudancas antes de sobrescrever arquivos que possam ter sido editados manualmente.

### Sintaxe

```bash
krab agent diff <target>
```

### Parametros

| Parametro | Obrigatorio | Descricao |
|---|---|---|
| `target` | Sim | Agente para diff: `claude`, `copilot`, `codex` |

### Exemplo

```bash
krab agent diff claude
```

Se houver diferencas:

```
╭─ Agent Diff: claude ────────────────────────────────────────╮
--- CLAUDE.md (current)
+++ CLAUDE.md (new)
@@ -5,6 +5,7 @@
 Style: **hexagonal**
 - backend: Python/FastAPI
 - frontend: React/TypeScript
+- cache: Redis
 - database: PostgreSQL

 ## Commands
@@ -15,6 +16,7 @@
 ## Conventions
 - **commits**: conventional commits
 - **branches**: gitflow
+- **tests**: pytest com fixtures, cobertura minima 80%
```

Se nao houver diferencas:

```
╭─ Agent Diff: claude ────────────────────────────────────────╮
ℹ CLAUDE.md: no changes
```

Se o arquivo ainda nao existir:

```
╭─ Agent Diff: claude ────────────────────────────────────────╮
ℹ CLAUDE.md: new file (1423 chars)
```

---

## O que Vai em Cada Arquivo de Agente

### CLAUDE.md (Claude Code)

O arquivo `CLAUDE.md` segue as melhores praticas da Anthropic para Claude Code — conciso, com progressive disclosure (aponta para arquivos em vez de inlinear tudo) e menos de 150 instrucoes.

**Secoes geradas:**

| Secao | Conteudo | Fonte |
|---|---|---|
| Header | Nome e descricao do projeto | `memory.json` → `project_name`, `description` |
| Architecture | Estilo arquitetural + tech stack | `memory.json` → `architecture_style`, `tech_stack` |
| Structure | Estrutura de diretorios do projeto | Auto-detectada do filesystem |
| Commands | Comandos de dev (test, lint, format) | Auto-detectados de `pyproject.toml`, `package.json`, etc. |
| Conventions | Convencoes de codigo | `memory.json` → `conventions` |
| Domain Terms | Glossario de termos do dominio | `memory.json` → `domain_terms` |
| Specs | Lista de arquivos de spec (progressive disclosure) | Auto-detectados (`spec.*.md`, `specs/*.md`) |
| Important | Constraints e restricoes | `memory.json` → `constraints` |
| Integrations | Servicos externos | `memory.json` → `integrations` |
| SDD Workflow | Instrucoes de workflow SDD | Template fixo |

**Principios de design:**

- **Progressive disclosure**: Em vez de copiar o conteudo das specs, o arquivo aponta para os arquivos. O agente le quando necessario.
- **Concisao**: Cada instrucao e uma linha. Sem paredes de texto.
- **Foco no unico**: Inclui apenas informacoes especificas do projeto, nao conhecimento geral.

### `.github/copilot-instructions.md` (GitHub Copilot)

O arquivo principal de instrucoes do Copilot segue as melhores praticas do GitHub — statements curtas e autocontidas que suplementam o contexto das conversas.

**Conteudo gerado (exemplos de statements):**

```markdown
This is the meu-saas project.

Plataforma SaaS multi-tenant para gestao financeira.

This project uses hexagonal architecture.

Tech stack: backend (Python/FastAPI), frontend (React/TypeScript), database (PostgreSQL).

For commits: conventional commits.

For branches: gitflow.

The term "tenant" means Organizacao cliente no sistema multi-tenant.

The term "workspace" means Espaco de trabalho dentro de um tenant.

Sem dependencias externas em runtime.

Development commands: `uv run pytest` for test, `uv run ruff check src/ tests/` for lint.

This project uses Spec-Driven Development (SDD). Feature specs use Gherkin format (Given/When/Then). Check spec.task.*.md files for detailed requirements before implementing features.

Project language skills: Python, TypeScript.

Project framework skills: FastAPI, React.
```

### `.github/instructions/krab-specs.instructions.md` (Copilot — path-specific)

Arquivo de instrucoes especificas para quando o Copilot esta editando arquivos de spec:

```markdown
---
applyTo: "spec.*.md"
---

These are SDD specification files using Spec-Driven Development methodology.

When editing specs:
- Maintain Gherkin format (Given/When/Then) for scenarios
- Keep language precise — avoid vague terms like 'etc', 'TBD', 'various'
- Include measurable acceptance criteria
- Reference related specs by filename
- Use Mermaid diagrams for architecture specs
```

Este arquivo usa o frontmatter `applyTo` do Copilot para ser ativado apenas quando o usuario esta trabalhando em arquivos `spec.*.md`.

### `AGENTS.md` (OpenAI Codex)

O arquivo `AGENTS.md` segue as melhores praticas da OpenAI para o Codex — Markdown padrao com hierarquia clara, incluindo comandos que o Codex pode executar.

**Secoes geradas:**

| Secao | Conteudo |
|---|---|
| Project header | Nome e descricao |
| Codebase Overview | Arquitetura e tech stack |
| Directory Structure | Estrutura de diretorios |
| Commands | Comandos de dev (Codex executa esses comandos) |
| Coding Conventions | Convencoes de codigo |
| Domain Glossary | Termos de dominio |
| Constraints and Rules | Restricoes do projeto |
| External Integrations | Servicos externos |
| Specification Files (SDD) | Referencia aos arquivos de spec |
| Testing | Instrucoes de teste (Codex roda os testes) |
| Pull Request Guidelines | Convencoes de PR |

### `.agents/skills/krab-workflow/SKILL.md` (Codex — skill)

Arquivo de skill que ensina o Codex o workflow SDD:

```markdown
---
name: krab-workflow
description: Use SDD specs before implementing features. Read spec.task.*.md for Gherkin scenarios, spec.architecture.*.md for design decisions.
---

# SDD Workflow Skill

Before implementing any feature:

1. Find the relevant spec file: `ls spec.*.md`
2. Read the spec thoroughly
3. Follow Gherkin scenarios as test cases
4. After implementation, run: `krab analyze risk <spec>`
5. Optimize the spec: `krab optimize run <spec>`
```

---

## Quando Sincronizar

Execute `krab agent sync` sempre que:

- **Alterar a memoria** (`krab memory set`): Os agentes precisam das informacoes atualizadas.
- **Adicionar ou remover skills** (`krab memory add-skill`, `krab memory remove-skill`): A lista de tecnologias nos arquivos de instrucao precisa refletir a realidade.
- **Criar ou modificar specs**: Novos arquivos de spec devem aparecer na secao de referencia dos agentes.
- **Mudar a estrutura de diretorios**: A secao de estrutura e auto-detectada.
- **Adicionar dependencias ou comandos**: Novos `package.json` scripts ou ferramentas no `pyproject.toml` sao detectados automaticamente.

:::tip Dica
Inclua `krab agent sync` no seu workflow de setup do projeto ou em um Git hook de `post-merge` para manter os arquivos sempre atualizados.
:::

---

## Integracao com Claude Code

O arquivo `CLAUDE.md` e automaticamente lido pelo Claude Code ao iniciar uma sessao no diretorio do projeto. Ele funciona como as "instrucoes do projeto" — tudo que o Claude precisa saber para trabalhar no seu codigo.

**Fluxo de uso:**

1. Inicialize a memoria: `krab memory init`
2. Configure tech stack, convencoes, etc: `krab memory set ...`
3. Sincronize: `krab agent sync claude`
4. Abra o Claude Code no diretorio do projeto — ele le o `CLAUDE.md` automaticamente

**Progressive disclosure em acao:**

Em vez de copiar todo o conteudo das specs no `CLAUDE.md` (o que consumiria tokens desnecessariamente), o Krab lista apenas os caminhos dos arquivos de spec. O Claude le cada spec sob demanda, quando relevante para a tarefa.

**Slash commands:**

Quando executado sem `--no-commands`, o `krab agent sync` tambem gera slash commands nativos do Claude Code em `.claude/commands/`. Esses comandos permitem que voce execute workflows SDD diretamente do Claude Code.

---

## Integracao com GitHub Copilot

O Copilot usa dois tipos de instrucoes:

1. **`copilot-instructions.md`**: Instrucoes globais aplicadas a todas as conversas e sugestoes no repositorio.
2. **Path-specific instructions** (`.github/instructions/*.instructions.md`): Instrucoes que se aplicam apenas quando o usuario esta trabalhando em arquivos que correspondem ao padrao `applyTo`.

**Fluxo de uso:**

1. Inicialize a memoria: `krab memory init`
2. Configure o projeto: `krab memory set ...`
3. Sincronize: `krab agent sync copilot`
4. Commit os arquivos gerados em `.github/`
5. O Copilot automaticamente aplica as instrucoes

O arquivo `krab-specs.instructions.md` e especialmente util: ele garante que o Copilot siga o formato Gherkin e as melhores praticas SDD ao editar arquivos de spec.

---

## Integracao com OpenAI Codex

O Codex le o `AGENTS.md` na raiz do repositorio como sua fonte principal de instrucoes. Ele suporta uma hierarquia:

1. **`AGENTS.md` (raiz)**: Instrucoes globais do projeto
2. **`AGENTS.md` (subdiretorios)**: Instrucoes especificas por modulo (nao geradas automaticamente pelo Krab)
3. **`.agents/skills/*/SKILL.md`**: Skills reutilizaveis

**O Codex executa comandos:**

Diferente dos outros agentes, o Codex pode executar os comandos listados no `AGENTS.md`. Por isso, a secao de "Commands" e especialmente importante — o Codex roda `uv run pytest` e `uv run ruff check` para validar suas alteracoes.

**Fluxo de uso:**

1. Inicialize a memoria: `krab memory init`
2. Configure o projeto: `krab memory set ...`
3. Sincronize: `krab agent sync codex`
4. O Codex le o `AGENTS.md` e a skill SDD automaticamente

---

## Auto-deteccao de Comandos

O Krab detecta automaticamente comandos de desenvolvimento baseados nos arquivos de configuracao do projeto:

| Arquivo Detectado | Comandos Gerados |
|---|---|
| `pyproject.toml` | `uv run pytest` (test), `uv run ruff check src/ tests/` (lint), `uv run ruff format src/ tests/` (format) |
| `package.json` | Scripts do `package.json` mapeados como `npm run <script>` |
| `docker-compose.yml` | `docker compose up -d` (docker-up), `docker compose down` (docker-down) |
| `Makefile` (com `pyproject.toml`) | `make build` (build) |
| Arquivos `spec.*.md` | `krab optimize run <spec>.md`, `krab analyze risk <spec>.md` |

---

## Auto-deteccao de Estrutura

O Krab gera automaticamente uma secao de estrutura de diretorios listando ate 15 diretorios "interessantes" na raiz do projeto. Diretorios ignorados: `.git`, `.venv`, `venv`, `node_modules`, `__pycache__`, `dist`, `build`, `.sdd`.

Exemplo de saida:

```
  src/
  tests/
  docs/
  scripts/
  migrations/
```
