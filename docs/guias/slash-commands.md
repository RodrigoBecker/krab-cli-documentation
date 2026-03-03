---
sidebar_position: 1
title: Slash Commands
---

# Slash Commands

Este guia detalha o **gerador de slash commands** do Krab CLI e como ele integra nativamente com Claude Code, GitHub Copilot e o padrao cross-agent de Skills.

Cada workflow do Krab (built-in ou customizado) e transformado automaticamente em arquivos de comando nativos que podem ser invocados diretamente dentro do ambiente de cada agente de IA.

---

## Como Funciona

O Krab CLI age como um **transpilador de workflows**: um unico workflow YAML e convertido em multiplos formatos de comando, um para cada agente suportado.

```
                         ┌──────────────────────────────────┐
                         │   Workflow Definition (YAML)      │
                         │   name: implement                 │
                         │   steps: [gate, krab, agent, ...] │
                         └──────────┬───────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
           ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
           │ Claude Code  │ │   Copilot   │ │ Cross-Agent  │
           │ .claude/     │ │ .github/    │ │ .github/     │
           │ commands/    │ │ agents/     │ │ skills/      │
           │ *.md         │ │ prompts/    │ │ */SKILL.md   │
           └──────────────┘ │ skills/     │ └──────────────┘
                            └─────────────┘
```

O processo e disparado por:

```bash
# Gera para todos os agentes e workflows
krab workflow commands

# Ou automaticamente durante o sync de agentes
krab agent sync all  # (inclui geracao de commands por padrao)

# Pular geracao de commands no sync
krab agent sync all --no-commands
```

---

## Claude Code Commands

### Localizacao

```
.claude/commands/*.md
```

### Formato

Cada arquivo de comando Claude Code e um Markdown com YAML frontmatter. O campo `description` no frontmatter define a descricao que aparece no autocomplete. A variavel especial `$ARGUMENTS` captura o input do usuario.

### Convencao de Nomes

O nome do arquivo define o namespace do comando usando pontos como separadores de dois-pontos:

| Arquivo | Comando no Claude Code |
|---------|----------------------|
| `krab.md` | `/project:krab` |
| `krab-implement.md` | `/project:krab-implement` |
| `krab-review.md` | `/project:krab-review` |
| `krab-full-cycle.md` | `/project:krab-full-cycle` |
| `krab-verify.md` | `/project:krab-verify` |
| `krab-spec-create.md` | `/project:krab-spec-create` |
| `krab-agent-init.md` | `/project:krab-agent-init` |

### Comando Router: /project:krab

O arquivo `krab.md` atua como um **router** — aceita o nome do workflow e a spec como argumentos, identifica qual workflow executar, e orquestra a execucao.

**Conteudo gerado** (`.claude/commands/krab.md`):

```markdown
---
description: "Krab SDD workflow router — run any krab workflow by name"
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Project Context

- **Project**: meu-app
- **Description**: API de autenticacao
- **Architecture**: hexagonal
- **Tech stack**: backend: Python 3.11, framework: FastAPI
- **Conventions**: naming: snake_case; test: pytest + fixtures

## Available Workflows

- **spec-create**: Create a new spec from template, enrich, refine, analyze risk, and sync agents (5 steps)
- **implement**: Implement a feature from spec: gate, risk check, sync, agent delegate, test (5 steps)
- **review**: Review implementation against spec: gate, ambiguity check, agent review (3 steps)
- **full-cycle**: Complete SDD lifecycle from spec creation through implementation and review (9 steps)
- **verify**: Run all quality checks on a spec: risk, ambiguity, readability, entropy, refine (6 steps)
- **agent-init**: Initialize agent instruction files: check memory, sync all, show status (3 steps)

## Instructions

1. Parse `$ARGUMENTS` to identify the workflow name and optional spec file path.
   - Example: `implement spec.task.auth.md` -> workflow=implement, spec=spec.task.auth.md
   - Example: `verify spec.task.auth.md` -> workflow=verify, spec=spec.task.auth.md
   - If only a workflow name is given, ask for the spec file.

2. Execute the workflow by running `krab workflow run <name> --spec <spec>` in the terminal.
   - If the workflow includes agent steps, you ARE the agent — execute those tasks directly.
   - For krab/shell steps, run the commands in the terminal.
   - For gate steps, check the condition and proceed or stop.

3. If the spec file contains Gherkin scenarios (Given/When/Then), treat them as acceptance criteria.

4. After completing all steps, provide a summary of what was done.

**Tip**: Use `/project:krab-implement`, `/project:krab-review`, etc. for direct access.
```

**Uso no Claude Code:**

```
> /project:krab implement spec.task.auth.md
```

O Claude Code recebe os argumentos, identifica o workflow `implement` e a spec `spec.task.auth.md`, e executa todos os steps — rodando comandos krab/shell no terminal e executando steps de agente diretamente com suas proprias ferramentas.

### Comandos Per-Workflow: /project:krab-implement

Cada workflow gera seu proprio arquivo de comando dedicado com instrucoes detalhadas para aquele pipeline especifico.

**Conteudo gerado** (`.claude/commands/krab-implement.md`):

```markdown
---
description: "Krab workflow: implement — Implement a feature from spec"
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).
If `$ARGUMENTS` contains a file path, use it as the spec file.

## Project Context

- **Project**: meu-app
- **Tech stack**: backend: Python 3.11, framework: FastAPI

## Workflow: implement

Implement a feature from spec: gate, risk check, sync, agent delegate, test

## Steps

1. **Gate**: Check condition `file_exists:{spec}`
2. **Run**: `krab analyze risk {spec}`
   - On failure: continue to next step
3. **Run**: `krab agent sync all`
   - On failure: continue to next step
4. **Agent** (`{agent}`) — **Implement**:
   > Implement the feature described in the specification. Follow all Gherkin scenarios as acceptance criteria. Create or update tests to match the scenarios.

   **Instructions for the agent:**
   - Follow the specification above precisely
   - Implement all Gherkin scenarios as tests
   - Respect project conventions and constraints
   - Run existing tests after changes to verify nothing breaks
5. **Shell**: `uv run pytest`
   - On failure: continue to next step

## Krab Commands

Run these in the terminal:

- `krab analyze risk {spec}`
- `krab agent sync all`

## Execution Rules

- For **krab** and **shell** steps: run the command in the terminal.
- For **agent** steps: you ARE the agent — execute the task directly using your tools.
- For **gate** steps: check the condition (e.g., file existence) and stop if it fails.
- Steps with "on failure: continue" should not block the pipeline.
- If the spec contains Gherkin scenarios (Given/When/Then), treat them as acceptance criteria.
- After completion, summarize what was done and any issues encountered.
```

:::info Prompt Completo para Agentes
Note que o step **Agent** agora inclui o prompt **completo** da tarefa e instrucoes detalhadas por modo de execucao. Isso garante que agentes externos (Copilot, Claude Code) tenham todo o contexto necessario para executar o step corretamente, sem depender do krab workflow runner.
:::

**Uso no Claude Code:**

```
> /project:krab-implement spec.task.auth.md
```

```
> /project:krab-review spec.task.payments.md
```

```
> /project:krab-verify spec.task.auth.md
```

```
> /project:krab-full-cycle auth-module
```

---

## Integracao com Copilot

O Krab CLI gera **tres tipos de arquivo** para o GitHub Copilot, cobrindo todas as superficies de integracao disponiveis:

### 1. Agent (`.github/agents/krab.agent.md`)

O arquivo de **custom agent** registra o `@krab` como um agente disponivel no dropdown do Copilot Chat.

**Conteudo gerado:**

```markdown
---
description: "Krab SDD assistant — executes spec-driven development workflows
  including spec creation, analysis, implementation, and review."
tools: ['read', 'search', 'edit', 'execute']
---

You are the **Krab** assistant, an AI agent specialized in Spec-Driven Development (SDD).

## Project Context

- **Project**: meu-app
- **Architecture**: hexagonal
- **Tech stack**: backend: Python 3.11, framework: FastAPI
- **Conventions**: naming: snake_case; test: pytest + fixtures

## Capabilities

You know how to execute these krab workflows:

- **spec-create**: Create a new spec from template, refine, analyze risk, and sync agents
- **implement**: Implement a feature from spec: gate, risk check, sync, agent delegate, test
- **review**: Review implementation against spec: gate, ambiguity check, agent review
- **full-cycle**: Complete SDD lifecycle from spec creation through implementation and review
- **verify**: Run all quality checks on a spec: risk, ambiguity, readability, entropy, refine
- **agent-init**: Initialize agent instruction files: check memory, sync all, show status

## Krab CLI Commands

Use the terminal to run these krab commands:

- `krab agent sync all`
- `krab analyze ambiguity {spec}`
- `krab analyze entropy {spec}`
- `krab analyze readability {spec}`
- `krab analyze risk {spec}`
- `krab analyze risk spec.task.{spec}.md`
- `krab optimize run spec.task.{spec}.md`
- `krab spec new task -n "{spec}"`
- `krab spec refine {spec}`
- `krab spec refine spec.task.{spec}.md`

## How to Work

1. When the user describes a task, identify which workflow applies.
2. If a spec file is referenced, read it first to understand the requirements.
3. Execute krab CLI commands in the terminal for analysis/optimization steps.
4. For implementation and review steps, use your own tools (read, edit, search) directly.
5. If the spec contains Gherkin scenarios (Given/When/Then), treat them as acceptance criteria.
6. After completing a workflow, summarize what was done.

## Workflow Execution

For each workflow step:
- **gate**: Check the condition (e.g., file existence). Stop if it fails.
- **krab**: Run `krab <command>` in the terminal.
- **shell**: Run the shell command in the terminal.
- **agent**: Execute the task directly using your tools.
- Steps with `on_failure: continue` should not block the pipeline.
```

**Campos obrigatorios do frontmatter:**

| Campo | Descricao |
|-------|-----------|
| `description` | Texto descritivo (obrigatorio para o dropdown funcionar) |
| `tools` | Lista de ferramentas que o agente pode usar: `read`, `search`, `edit`, `execute` |

**Uso no VS Code:**

```
@krab implement spec.task.auth.md
```

### 2. Prompts (`.github/prompts/*.prompt.md`)

Cada workflow gera um **prompt file** que aparece como um slash command no Copilot Chat. Prompts aceitam variaveis de input do usuario.

**Conteudo gerado** (`.github/prompts/krab-implement.prompt.md`):

```markdown
---
agent: 'agent'
description: "Krab workflow: implement — Implement a feature from spec"
---

Spec file: ${input:spec:Path to spec file (e.g. spec.task.auth.md)}

## Project Context

- **Project**: meu-app
- **Tech stack**: backend: Python 3.11, framework: FastAPI

## Workflow: implement

Implement a feature from spec: gate, risk check, sync, agent delegate, test

## Steps

1. **Gate**: Check condition `file_exists:{spec}`
2. **Run**: `krab analyze risk {spec}`
   - On failure: continue to next step
3. **Run**: `krab agent sync all`
   - On failure: continue to next step
4. **Agent** (`{agent}`) — **Implement**:
   > Implement the feature described in the specification. Follow all Gherkin scenarios as acceptance criteria. Create or update tests to match the scenarios.

   **Instructions for the agent:**
   - Follow the specification above precisely
   - Implement all Gherkin scenarios as tests
   - Respect project conventions and constraints
   - Run existing tests after changes to verify nothing breaks
5. **Shell**: `uv run pytest`
   - On failure: continue to next step

Run in terminal:

- `krab analyze risk {spec}`
- `krab agent sync all`

## Rules

- Run krab/shell commands in the terminal.
- For agent steps, execute the task directly.
- For gate steps, check the condition and stop if it fails.
- If the spec contains Gherkin scenarios, treat them as acceptance criteria.
```

**Campos do frontmatter:**

| Campo | Descricao |
|-------|-----------|
| `agent` | Modo de execucao. `'agent'` = modo agente (pode editar arquivos) |
| `description` | Texto descritivo para o autocomplete |

**Variaveis de input:**

A sintaxe `${input:name:hint}` cria um campo de input no Copilot Chat:

- `${input:spec:Path to spec file}` — o usuario digita o caminho da spec

**Uso no VS Code Chat:**

```
/krab-implement
> spec: spec.task.auth.md
```

### 3. Skills (`.github/skills/*/SKILL.md`)

Skills sao **auto-loaded contextualmente** pelo agente. Quando o contexto da conversa se encaixa com a descricao da skill, o conteudo e automaticamente injetado.

**Conteudo gerado** (`.github/skills/krab-implement/SKILL.md`):

```markdown
---
name: krab-implement
description: "Implement a feature from spec: gate, risk check, sync, agent delegate, test"
---

## Workflow: implement

1. **Gate**: Check condition `file_exists:{spec}`
2. **Run**: `krab analyze risk {spec}`
   - On failure: continue to next step
3. **Run**: `krab agent sync all`
   - On failure: continue to next step
4. **Agent** (`{agent}`) — **Implement**:
   > Implement the feature described in the specification. Follow all Gherkin scenarios as acceptance criteria. Create or update tests to match the scenarios.

   **Instructions for the agent:**
   - Follow the specification above precisely
   - Implement all Gherkin scenarios as tests
   - Respect project conventions and constraints
   - Run existing tests after changes to verify nothing breaks
5. **Shell**: `uv run pytest`
   - On failure: continue to next step

Krab CLI commands to run:

- `krab analyze risk {spec}`
- `krab agent sync all`

Execute krab and shell commands in the terminal. For agent steps, perform the task directly.
If the spec contains Gherkin scenarios (Given/When/Then), treat them as acceptance criteria.
```

**Campos obrigatorios do frontmatter:**

| Campo | Descricao |
|-------|-----------|
| `name` | Nome unico da skill (obrigatorio) |
| `description` | Descricao que o agente usa para matching contextual (obrigatorio) |

---

## Modo Enrich nos Slash Commands

O workflow `spec-create` e o `full-cycle` incluem um step especial chamado `enrich-spec` que usa o modo `enrich` do Agent Executor. Nos slash commands gerados, este step aparece com instrucoes completas e detalhadas para que o agente externo (Copilot ou Claude Code) saiba exatamente como reescrever a spec.

**Exemplo de step enrich no slash command gerado:**

```markdown
2. **Agent** (`{agent}`) — **Enrich spec** (rewrite in-place):
   > Leia o arquivo .sdd/specs/spec.task.{spec}.md que acabou de ser criado.
   > Ele contem um template com placeholders genericos. Reescreva o arquivo
   > IN-PLACE substituindo TODOS os placeholders com conteudo real e especifico
   > para a feature '{spec}'.

   **Enrich rules for the agent:**
   - Read the spec file indicated above
   - Rewrite the file **IN-PLACE**, keeping the heading structure
   - Replace **ALL** placeholders (`<!-- ... -->`, `<tipo de usuario>`, `<acao desejada>`, etc.) with real, specific content
   - Use the project context (tech_stack, conventions) to generate relevant content
   - Write concrete Gherkin scenarios for the described feature
   - Generate real acceptance criteria and relevant technical notes
   - Write in **pt-BR**
```

O prefixo interno `[mode:enrich]` e automaticamente removido e substituido por instrucoes legiveis e detalhadas. Isso garante que qualquer agente de IA consiga executar o step de enriquecimento sem depender do workflow runner do Krab.

---

## Padrao Cross-Agent de Skills

O formato `.github/skills/*/SKILL.md` e um **padrao convergente** que funciona em multiplos agentes:

| Agente | Suporte a Skills | Localizacao |
|--------|------------------|-------------|
| Claude Code | Sim (via `.claude/commands/` ou `.github/skills/`) | Qualquer SKILL.md no projeto |
| GitHub Copilot | Sim (nativo) | `.github/skills/*/SKILL.md` |
| OpenAI Codex | Sim (via `.agents/skills/`) | `.agents/skills/*/SKILL.md` |

O Krab gera skills em `.github/skills/` que funcionam nativamente no Copilot e sao lidas como contexto por Claude Code e Codex quando presentes no repositorio.

**Regras do padrao:**

1. Cada skill fica em seu proprio diretorio: `.github/skills/<nome>/SKILL.md`
2. O frontmatter **deve** conter `name` e `description`
3. O conteudo e Markdown livre — instrucoes, comandos, exemplos
4. Agentes carregam skills automaticamente quando o contexto da conversa faz match com a `description`

---

## Arvore Completa de Arquivos Gerados

Para os 6 workflows built-in, o comando `krab workflow commands` gera **20 arquivos**:

```
projeto/
├── .claude/
│   └── commands/
│       ├── krab.md                          # Router: /project:krab
│       ├── krab-spec-create.md              # /project:krab-spec-create
│       ├── krab-implement.md                # /project:krab-implement
│       ├── krab-review.md                   # /project:krab-review
│       ├── krab-full-cycle.md               # /project:krab-full-cycle
│       ├── krab-verify.md                   # /project:krab-verify
│       └── krab-agent-init.md               # /project:krab-agent-init
├── .github/
│   ├── agents/
│   │   └── krab.agent.md                    # @krab custom agent
│   ├── prompts/
│   │   ├── krab-spec-create.prompt.md       # /krab-spec-create
│   │   ├── krab-implement.prompt.md         # /krab-implement
│   │   ├── krab-review.prompt.md            # /krab-review
│   │   ├── krab-full-cycle.prompt.md        # /krab-full-cycle
│   │   ├── krab-verify.prompt.md            # /krab-verify
│   │   └── krab-agent-init.prompt.md        # /krab-agent-init
│   └── skills/
│       ├── krab-spec-create/
│       │   └── SKILL.md
│       ├── krab-implement/
│       │   └── SKILL.md
│       ├── krab-review/
│       │   └── SKILL.md
│       ├── krab-full-cycle/
│       │   └── SKILL.md
│       ├── krab-verify/
│       │   └── SKILL.md
│       └── krab-agent-init/
│           └── SKILL.md
```

Se voce tiver workflows customizados em `.sdd/workflows/`, eles tambem serao incluidos, aumentando o numero de arquivos proporcionalmente.

---

## Integracao com Agent Sync

O comando `krab agent sync` gera automaticamente os slash commands como parte do processo de sincronizacao:

```bash
# Gera instruction files (CLAUDE.md, AGENTS.md, etc.)
# E tambem gera slash commands
krab agent sync all
```

```
╭─ Agent Sync — target=all ────────────────────────────────────────────────╮

  [claude]      CLAUDE.md
  [copilot]     .github/copilot-instructions.md
  [copilot]     .github/instructions/krab-specs.instructions.md
  [codex]       AGENTS.md
  [codex]       .agents/skills/krab-workflow/SKILL.md
  Generated 5 instruction files for 3 agents

  [claude/cmd]  .claude/commands/krab.md
  [claude/cmd]  .claude/commands/krab-spec-create.md
  [claude/cmd]  .claude/commands/krab-implement.md
  ...
  [copilot/cmd] .github/agents/krab.agent.md
  [copilot/cmd] .github/prompts/krab-implement.prompt.md
  ...
  Generated 20 slash command files
```

Para **pular** a geracao de slash commands:

```bash
krab agent sync all --no-commands
```

Isso gera apenas os instruction files (CLAUDE.md, AGENTS.md, etc.) sem gerar os slash commands.

---

## Fluxo de Trabalho Recomendado

1. **Inicialize o projeto**:
   ```bash
   krab memory init -n "meu-app"
   krab memory set tech_stack.backend "Python 3.11"
   krab memory set tech_stack.framework "FastAPI"
   ```

2. **Sincronize agentes** (gera instructions + commands):
   ```bash
   krab agent sync all
   ```

3. **Use os slash commands** no seu agente:
   ```
   # Claude Code
   > /project:krab-implement spec.task.auth.md

   # Copilot Chat
   > @krab implement the auth feature from spec.task.auth.md
   > /krab-review spec.task.auth.md
   ```

4. **Ao criar novos workflows customizados**, regenere:
   ```bash
   krab workflow new meu-pipeline -d "Pipeline customizado"
   # Edite .sdd/workflows/meu-pipeline.yaml
   krab workflow commands  # Regenera incluindo o novo workflow
   ```

5. **Limpe e regenere** quando necessario:
   ```bash
   krab workflow commands --clean
   krab workflow commands
   ```
