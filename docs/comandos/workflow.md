---
sidebar_position: 10
title: workflow — Workflows
---

# workflow — Workflows

O grupo `krab workflow` e o **workflow engine** do Krab CLI: um sistema de pipelines multi-step que encadeia comandos internos do krab, comandos shell, delegacoes a agentes de IA, gates condicionais e prompts interativos em uma unica execucao orquestrada.

```bash
krab workflow --help
```

```
Usage: krab workflow [OPTIONS] COMMAND [ARGS]...

  Executa workflows SDD multi-step (spec-create, implement, review, full-cycle)

Commands:
  list          Lista todos os workflows disponiveis (built-in + custom).
  show          Mostra os steps de um workflow especifico.
  run           Executa um workflow pipeline.
  new           Cria um novo template YAML de workflow customizado.
  export        Exporta um workflow built-in como YAML para stdout.
  agents-check  Verifica quais CLIs de agentes IA estao instalados e disponiveis.
  commands      Gera slash commands nativos para agentes IA a partir dos workflows krab.
```

---

## Conceitos Fundamentais

### 5 Tipos de Step

Todo workflow e uma sequencia ordenada de **steps**. Cada step tem um tipo que define como ele e executado:

| Tipo | Descricao | Campo Principal | Exemplo |
|------|-----------|-----------------|---------|
| `krab` | Executa um comando interno do Krab CLI | `command` | `analyze risk {spec}` |
| `shell` | Executa qualquer comando no terminal | `command` | `uv run pytest` |
| `agent` | Delega uma tarefa a um agente de IA (Claude Code, Codex, Copilot) | `prompt` + `agent` | Implementar feature descrita na spec |
| `gate` | Verifica uma condicao antes de prosseguir | `condition` | `file_exists:{spec}` |
| `prompt` | Solicita input do usuario durante a execucao | `prompt` | Pergunta interativa |

**Steps `krab`** preparam o prefixo `krab` automaticamente. Voce escreve apenas `analyze risk {spec}`, e o engine executa `krab analyze risk {spec}`.

**Steps `shell`** executam qualquer comando. Ideal para rodar testes, builds, ou scripts customizados.

**Steps `agent`** sao o diferencial: o workflow constroi um prompt estruturado com contexto do projeto + conteudo da spec e delega a execucao ao CLI do agente escolhido.

**Steps `gate`** funcionam como guardas condicionais. Se a condicao falha e `on_failure` e `stop`, o pipeline inteiro para. Condicoes suportadas:

- `file_exists:{path}` — verifica se um arquivo existe
- `env:{VAR}` — verifica se uma variavel de ambiente esta definida
- Qualquer string truthy/falsy

**Steps `prompt`** pausam o pipeline e pedem input do usuario via terminal.

### Variaveis de Runtime

Tres variaveis sao resolvidas automaticamente em todos os campos de cada step:

| Variavel | Descricao | Fonte |
|----------|-----------|-------|
| `{spec}` | Caminho do arquivo de spec | Flag `--spec` ou argumento do workflow |
| `{agent}` | Nome do agente (claude, codex, copilot) | Flag `--agent` ou `default_agent` do workflow |
| `{root}` | Diretorio raiz do projeto | `Path.cwd()` no momento da execucao |

Exemplo de resolucao:

```yaml
command: "analyze risk {spec}"
# Com --spec spec.task.auth.md resolve para:
# krab analyze risk spec.task.auth.md
```

```yaml
condition: "file_exists:{root}/.sdd/memory.json"
# Com root=/home/user/projeto resolve para:
# file_exists:/home/user/projeto/.sdd/memory.json
```

### on_failure: Controle de Falha

Cada step define o que acontece quando falha:

| Valor | Comportamento |
|-------|---------------|
| `stop` (default) | **Para o pipeline inteiro**. Steps subsequentes nao executam. |
| `continue` | **Pula o step e segue**. O pipeline continua normalmente. |

Regra pratica: steps criticos (gates, implementacao) usam `stop`. Steps informativos (analises, status) usam `continue`.

### Built-in vs Custom Workflows

O Krab CLI vem com **6 workflows built-in** prontos para uso. Alem disso, voce pode criar **workflows customizados ilimitados** como arquivos YAML em `.sdd/workflows/`.

O engine carrega ambos automaticamente. Workflows customizados podem sobrescrever built-ins (mesmo nome = customizado tem prioridade).

---

## 6 Workflows Built-in

| Workflow | Steps | Descricao |
|----------|-------|-----------|
| `spec-create` | 5 | Cria spec via template, enriquece com agente IA, refina com Tree-of-Thought, analisa risco de alucinacao, sincroniza agentes |
| `implement` | 5 | Gate de existencia -> verifica risco -> sincroniza agentes -> delega implementacao ao agente -> roda testes |
| `review` | 3 | Gate de existencia -> verifica ambiguidade -> agente revisa codigo contra a spec |
| `full-cycle` | 9 | Ciclo completo: criar -> enriquecer -> refinar -> risco -> otimizar -> sincronizar -> implementar -> testar -> revisar |
| `verify` | 6 | Gate de existencia -> risco + ambiguidade + readability + entropy + refinamento |
| `agent-init` | 3 | Verifica memory -> sincroniza todos os agentes -> mostra status |

### Detalhes de Cada Built-in

#### spec-create (5 steps)

1. **krab**: `spec new task -n "{spec}"` — gera spec a partir do template task
2. **agent** (enrich): Le a spec recem-criada e reescreve IN-PLACE substituindo todos os placeholders por conteudo real — cenarios Gherkin concretos, criterios de aceitacao, notas tecnicas relevantes para a stack do projeto (escrita em pt-BR)
3. **krab**: `spec refine .sdd/specs/spec.task.{spec}.md` — refina com Tree-of-Thought
4. **krab**: `analyze risk .sdd/specs/spec.task.{spec}.md` — analisa risco (on_failure: continue)
5. **krab**: `agent sync all` — sincroniza arquivos de instrucao (on_failure: continue)

:::info Step Enrich
O step `enrich-spec` e o diferencial do workflow `spec-create`. Enquanto o template gera uma spec com placeholders genericos (`<!-- ... -->`, `<tipo de usuario>`, `<acao desejada>`), o agente de IA reescreve o arquivo completo com conteudo real e especifico para a feature. O agente usa o contexto do projeto (tech_stack, convencoes, constraints) de `.sdd/memory.json` para gerar conteudo relevante.
:::

#### implement (5 steps)

1. **gate**: `file_exists:{spec}` — verifica se a spec existe (para se nao)
2. **krab**: `analyze risk {spec}` — verifica risco (on_failure: continue)
3. **krab**: `agent sync all` — sincroniza agentes (on_failure: continue)
4. **agent**: Delega implementacao ao agente com prompt estruturado
5. **shell**: `uv run pytest` — roda testes (on_failure: continue)

#### review (3 steps)

1. **gate**: `file_exists:{spec}` — verifica se a spec existe
2. **krab**: `analyze ambiguity {spec}` — analisa ambiguidade (on_failure: continue)
3. **agent**: Delega revisao ao agente — compara implementacao com a spec

#### full-cycle (9 steps)

1. **krab**: `spec new task -n "{spec}"` — cria spec
2. **agent** (enrich): Enriquece a spec recem-criada, substituindo placeholders por conteudo real (cenarios Gherkin, criterios de aceitacao, notas tecnicas em pt-BR)
3. **krab**: `spec refine .sdd/specs/spec.task.{spec}.md` — refina com Tree-of-Thought
4. **krab**: `analyze risk .sdd/specs/spec.task.{spec}.md` — analisa risco (continue)
5. **krab**: `optimize run .sdd/specs/spec.task.{spec}.md` — otimiza tokens (continue)
6. **krab**: `agent sync all` — sincroniza agentes (continue)
7. **agent**: Implementacao delegada ao agente
8. **shell**: `uv run pytest` — testes (continue)
9. **agent**: Revisao delegada ao agente (continue)

#### verify (6 steps)

1. **gate**: `file_exists:{spec}` — verifica existencia
2. **krab**: `analyze risk {spec}` — risco (continue)
3. **krab**: `analyze ambiguity {spec}` — ambiguidade (continue)
4. **krab**: `analyze readability {spec}` — legibilidade (continue)
5. **krab**: `analyze entropy {spec}` — entropia (continue)
6. **krab**: `spec refine {spec}` — gera plano de refinamento (continue)

#### agent-init (3 steps)

1. **gate**: `file_exists:{root}/.sdd/memory.json` — verifica se memory existe
2. **krab**: `agent sync all` — gera todos os arquivos de instrucao
3. **krab**: `agent status` — mostra status dos arquivos (continue)

---

## Agent Executor

Quando um step do tipo `agent` e executado, o Krab CLI:

1. **Detecta o modo** do step:
   - Se o prompt comeca com `[mode:enrich]`, o modo e `enrich` (reescrita de spec)
   - Caso contrario, o modo e `implement` (implementacao padrao)

2. **Constroi um prompt estruturado** com:
   - Contexto do projeto (de `.sdd/memory.json`): nome, descricao, stack, convencoes, constraints
   - Conteudo completo do arquivo de spec (se `--spec` foi fornecido)
   - Prompt da tarefa especifica do step
   - Instrucoes dependentes do modo (veja abaixo)

3. **Delega ao CLI do agente** usando o comando nativo:

| Agente | Comando Executado | Pre-requisito |
|--------|-------------------|---------------|
| Claude Code | `claude -p "<prompt>"` | `npm i -g @anthropic-ai/claude-code` |
| Codex | `codex exec "<prompt>"` | `npm i -g codex` |
| Copilot | `gh issue create --body "<prompt>" --label copilot` | `gh` CLI + auth configurado |

**Timeout padrao**: 600 segundos (10 minutos) por execucao de agente.

### Modos de Execucao do Agent

O Agent Executor suporta dois modos que alteram as instrucoes finais do prompt:

#### Modo `implement` (padrao)

Instrucoes geradas:
- Siga a especificacao acima com precisao
- Implemente todos os cenarios Gherkin como testes
- Respeite as convencoes e constraints do projeto
- Execute os testes existentes apos as mudancas para verificar que nada quebrou

#### Modo `enrich`

Ativado automaticamente quando o prompt do step comeca com `[mode:enrich]`. Este modo e usado pelo step `enrich-spec` nos workflows `spec-create` e `full-cycle`.

Instrucoes geradas (em pt-BR):
- Leia o arquivo spec indicado
- Reescreva o arquivo IN-PLACE mantendo a estrutura de headings
- Substitua TODOS os placeholders (`<!-- ... -->`, `<tipo de usuario>`, `<acao desejada>`, etc.) por conteudo real e especifico
- Use o contexto do projeto (tech_stack, conventions) para gerar conteudo relevante
- Escreva cenarios Gherkin concretos para a feature descrita
- Gere criterios de aceitacao reais e notas tecnicas relevantes
- Escreva em pt-BR

**Exemplo de prompt gerado — modo implement** (simplificado):

```markdown
## Project Context
Project: meu-app
Description: API de autenticacao
Architecture: hexagonal
Tech stack: backend: Python 3.11, framework: FastAPI, db: PostgreSQL
Conventions: naming: snake_case; test: pytest + fixtures
Constraints: sem dependencias externas nao-auditadas

## Specification (spec.task.auth.md)

# Autenticacao JWT

## Cenarios

### Scenario: Login com credenciais validas
Given um usuario cadastrado com email "test@x.com"
When enviar POST /auth/login com email e senha corretos
Then receber status 200 com access_token e refresh_token

...

## Task

Implement the feature described in the specification.
Follow all Gherkin scenarios as acceptance criteria.
Create or update tests to match the scenarios.

## Instructions

- Follow the specification above precisely
- Implement all Gherkin scenarios as tests
- Respect project conventions and constraints
- Run existing tests after changes to verify nothing breaks
```

---

## Subcomandos

### krab workflow list

Lista todos os workflows disponiveis — tanto built-in quanto customizados.

```bash
krab workflow list
```

**Saida exemplo:**

```
╭─ Workflows — Built-in + custom ─────────────────────────────────────────╮

┌─────────────┬───────┬──────────┬────────────────────────────────────────────────────────┐
│ Nome        │ Steps │ Tipo     │ Descricao                                              │
├─────────────┼───────┼──────────┼────────────────────────────────────────────────────────┤
│ agent-init  │     3 │ built-in │ Inicializa arquivos de instrucao de agentes: memory,   │
│             │       │          │ sync                                                   │
│ full-cycle  │     9 │ built-in │ Ciclo SDD completo desde criacao de spec ate impl      │
│ implement   │     5 │ built-in │ Implementa feature a partir de spec: gate, risco, sync │
│ review      │     3 │ built-in │ Revisa implementacao contra a spec: gate, ambiguidade  │
│ spec-create │     5 │ built-in │ Cria spec a partir de template, enriquece, refina,     │
│             │       │          │ risco                                                  │
│ verify      │     6 │ built-in │ Executa todas as verificacoes de qualidade: risco,      │
│             │       │          │ ambiguidade, legibilidade                               │
│ deploy-prep │     4 │ custom   │ Pipeline de validacao pre-deploy                        │
└─────────────┴───────┴──────────┴────────────────────────────────────────────────────────┘
```

Workflows customizados (YAML em `.sdd/workflows/`) aparecem com tipo `custom`.

---

### krab workflow show

Mostra os steps detalhados de um workflow especifico.

```bash
krab workflow show <name>
```

**Parametros:**

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `name` | argumento | sim | Nome do workflow (built-in ou custom) |

**Exemplo: implement**

```bash
krab workflow show implement
```

```
╭─ Workflow: implement — Implementar feature a partir de spec ─────────────╮

┌───┬───────────────────┬────────┬────────────────────────────────────────────────────────┬──────────┐
│ # │ Step              │ Tipo   │ Comando / Prompt                                       │ Em Falha │
├───┼───────────────────┼────────┼────────────────────────────────────────────────────────┼──────────┤
│ 1 │ check-spec-exists │ gate   │ file_exists:{spec}                                     │ stop     │
│ 2 │ risk-check        │ krab   │ analyze risk {spec}                                    │ continue │
│ 3 │ sync-agents       │ krab   │ agent sync all                                         │ continue │
│ 4 │ delegate-to-agent │ agent  │ Implement the feature described in the specificat...    │ stop     │
│ 5 │ run-tests         │ shell  │ uv run pytest                                          │ continue │
└───┴───────────────────┴────────┴────────────────────────────────────────────────────────┴──────────┘

Agente padrao: claude
```

**Exemplo: full-cycle**

```bash
krab workflow show full-cycle
```

```
╭─ Workflow: full-cycle — Ciclo SDD completo ──────────────────────────────╮

┌───┬────────────────┬────────┬────────────────────────────────────────────────────────┬──────────┐
│ # │ Step           │ Tipo   │ Comando / Prompt                                       │ Em Falha │
├───┼────────────────┼────────┼────────────────────────────────────────────────────────┼──────────┤
│ 1 │ create-spec    │ krab   │ spec new task -n "{spec}"                              │ stop     │
│ 2 │ enrich-spec    │ agent  │ [enrich] Rewrite spec with real content                │ stop     │
│ 3 │ refine-spec    │ krab   │ spec refine .sdd/specs/spec.task.{spec}.md             │ stop     │
│ 4 │ risk-analysis  │ krab   │ analyze risk .sdd/specs/spec.task.{spec}.md            │ continue │
│ 5 │ optimize-spec  │ krab   │ optimize run .sdd/specs/spec.task.{spec}.md            │ continue │
│ 6 │ sync-agents    │ krab   │ agent sync all                                         │ continue │
│ 7 │ implement      │ agent  │ Implement the feature described in the specificat...    │ stop     │
│ 8 │ run-tests      │ shell  │ uv run pytest                                          │ continue │
│ 9 │ review         │ agent  │ Review the implementation against the specificati...    │ continue │
└───┴────────────────┴────────┴────────────────────────────────────────────────────────┴──────────┘

Agente padrao: claude
```

---

### krab workflow run

Executa um workflow pipeline. Este e o comando principal do engine.

```bash
krab workflow run <name> [OPTIONS]
```

**Parametros:**

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `name` | argumento | sim | — | Nome do workflow |
| `-s` / `--spec` | opcao | nao | `""` | Caminho do arquivo de spec |
| `-a` / `--agent` | opcao | nao | `claude` | Agente: claude, codex, copilot |
| `--dry-run` | flag | nao | `false` | Simula execucao sem executar de fato |

#### Dry Run — Simulacao Completa

O modo `--dry-run` mostra exatamente o que **seria** executado sem tocar em nada:

```bash
krab workflow run implement --spec spec.task.auth.md --dry-run
```

```
╭─ Workflow: implement — DRY RUN  spec=spec.task.auth.md  agent=claude ────╮

  OK  check-spec-exists: [dry-run] Would check: file_exists:spec.task.auth.md
  OK  risk-check: [dry-run] Would run: krab analyze risk spec.task.auth.md
  OK  sync-agents: [dry-run] Would run: krab agent sync all
  OK  delegate-to-agent: [dry-run] Would delegate to claude: Implement the feature described...
  OK  run-tests: [dry-run] Would run: uv run pytest

  Workflow 'implement' concluido: 5 aprovados, 0 ignorados
```

Cada tipo de step mostra uma mensagem diferente no dry-run:

- **krab**: `Would run: krab <command>`
- **shell**: `Would run: <command>`
- **agent**: `Would delegate to <agent>: <prompt preview>...`
- **gate**: `Would check: <condition>`
- **prompt**: `Would ask: <question>`

#### O Que Acontece em Cada Tipo de Step

**Step `gate`**: Avalia a condicao. Se verdadeira, retorna `OK`. Se falsa e `on_failure: stop`, para o pipeline com erro.

**Step `krab`**: Localiza o binario `krab` no PATH, concatena o comando, executa como subprocesso com timeout de 300s.

**Step `shell`**: Executa diretamente no shell (`shell=True`) com timeout de 300s no diretorio raiz do projeto.

**Step `agent`**: Instancia `AgentExecutor`, constroi o prompt com contexto do projeto + spec, chama o CLI do agente como subprocesso com timeout de 600s.

**Step `prompt`**: Exibe a mensagem e aguarda `input()` do usuario. Ctrl+C cancela o step.

#### Exemplo: Implementar com Claude Code

```bash
krab workflow run implement --spec spec.task.auth.md --agent claude
```

```
╭─ Workflow: implement — LIVE  spec=spec.task.auth.md  agent=claude ───────╮

  OK    check-spec-exists: Gate passed
  OK    risk-check: done
  OK    sync-agents: done
  OK    delegate-to-agent: <saida do claude code>
  FAIL  run-tests: 2 tests failed

  Workflow 'implement' concluido: 4 aprovados, 0 ignorados
```

#### Exemplo: Verificar Qualidade de uma Spec

```bash
krab workflow run verify --spec spec.task.payments.md
```

```
╭─ Workflow: verify — LIVE  spec=spec.task.payments.md  agent=claude ──────╮

  OK  check-spec-exists: Gate passed
  OK  risk-analysis: done
  OK  ambiguity-check: done
  OK  readability-check: done
  OK  entropy-analysis: done
  OK  generate-refinement: done

  Workflow 'verify' concluido: 6 aprovados, 0 ignorados
```

#### Exemplo: Ciclo Completo

```bash
krab workflow run full-cycle --spec auth-module --agent claude
```

Este comando executa os 9 steps em sequencia: cria a spec `spec.task.auth-module.md`, enriquece a spec com conteudo real via agente IA (substituindo placeholders por cenarios Gherkin concretos e criterios de aceitacao), refina com Tree-of-Thought, analisa risco, otimiza tokens, sincroniza agentes, delega implementacao ao Claude Code, roda testes, e finalmente delega revisao ao Claude Code.

---

### krab workflow new

Cria um template YAML para um workflow customizado em `.sdd/workflows/`.

```bash
krab workflow new <name> [OPTIONS]
```

**Parametros:**

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `name` | argumento | sim | Nome do workflow |
| `-d` / `--desc` | opcao | nao | Descricao do workflow |

**Exemplo:**

```bash
krab workflow new deploy-prep -d "Pre-deploy validation pipeline"
```

```
  Template de workflow criado: .sdd/workflows/deploy-prep.yaml
  Edite o arquivo YAML para customizar os steps do workflow.
```

**Arquivo gerado** (`.sdd/workflows/deploy-prep.yaml`):

```yaml
name: deploy-prep
description: Pre-deploy validation pipeline
default_agent: claude
steps:
- name: check-spec
  type: gate
  condition: file_exists:{spec}
- name: analyze
  type: krab
  command: analyze risk {spec}
  on_failure: continue
- name: implement
  type: agent
  agent: '{agent}'
  prompt: Implement the changes described in the specification.
```

**Campos do template:**

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `name` | string | Nome unico do workflow |
| `description` | string | Descricao legivel para humanos |
| `default_agent` | string | Agente padrao (claude, codex, copilot) |
| `steps` | lista | Sequencia ordenada de steps |
| `steps[].name` | string | Nome unico do step dentro do workflow |
| `steps[].type` | enum | `krab`, `shell`, `agent`, `gate`, `prompt` |
| `steps[].command` | string | Comando para steps `krab` e `shell` |
| `steps[].prompt` | string | Prompt para steps `agent` e `prompt` |
| `steps[].agent` | string | Agente especifico para steps `agent` (usa `{agent}` para herdar) |
| `steps[].condition` | string | Condicao para steps `gate` |
| `steps[].on_failure` | enum | `stop` (default) ou `continue` |

---

### krab workflow export

Exporta um workflow built-in como YAML para stdout. Util para usar como base para customizacao.

```bash
krab workflow export <name>
```

**Parametros:**

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `name` | argumento | sim | Nome do workflow built-in |

**Exemplo: Exportar implement**

```bash
krab workflow export implement
```

**Saida completa:**

```yaml
name: implement
description: 'Implement a feature from spec: gate, risk check, sync, agent delegate,
  test'
default_agent: claude
steps:
- name: check-spec-exists
  type: gate
  condition: file_exists:{spec}
- name: risk-check
  type: krab
  command: analyze risk {spec}
  on_failure: continue
- name: sync-agents
  type: krab
  command: agent sync all
  on_failure: continue
- name: delegate-to-agent
  type: agent
  agent: '{agent}'
  prompt: Implement the feature described in the specification. Follow all Gherkin
    scenarios as acceptance criteria. Create or update tests to match the scenarios.
- name: run-tests
  type: shell
  command: uv run pytest
  on_failure: continue
```

**Exemplo: Exportar full-cycle**

```bash
krab workflow export full-cycle
```

```yaml
name: full-cycle
description: Complete SDD lifecycle from spec creation through implementation and
  review
default_agent: claude
steps:
- name: create-spec
  type: krab
  command: spec new task -n "{spec}"
- name: enrich-spec
  type: agent
  agent: '{agent}'
  prompt: '[mode:enrich]Leia o arquivo .sdd/specs/spec.task.{spec}.md que acabou
    de ser criado. Reescreva o arquivo IN-PLACE substituindo TODOS os placeholders
    com conteudo real e especifico para a feature.'
- name: refine-spec
  type: krab
  command: spec refine .sdd/specs/spec.task.{spec}.md
- name: risk-analysis
  type: krab
  command: analyze risk .sdd/specs/spec.task.{spec}.md
  on_failure: continue
- name: optimize-spec
  type: krab
  command: optimize run .sdd/specs/spec.task.{spec}.md
  on_failure: continue
- name: sync-agents
  type: krab
  command: agent sync all
  on_failure: continue
- name: implement
  type: agent
  agent: '{agent}'
  prompt: Implement the feature described in the specification. Follow all Gherkin
    scenarios as acceptance criteria. Create or update tests to match the scenarios.
- name: run-tests
  type: shell
  command: uv run pytest
  on_failure: continue
- name: review
  type: agent
  agent: '{agent}'
  prompt: Review the implementation against the specification. Verify all Gherkin
    scenarios are covered. Report any deviations or missing edge cases.
  on_failure: continue
```

**Dica**: redirecione para um arquivo e edite para criar seu workflow customizado:

```bash
krab workflow export implement > .sdd/workflows/my-implement.yaml
```

---

### krab workflow agents-check

Verifica quais CLIs de agentes de IA estao instalados e acessiveis no PATH.

```bash
krab workflow agents-check
```

**Saida exemplo:**

```
╭─ Disponibilidade de Agentes — CLIs no PATH ──────────────────────────────╮

┌────────────────────┬──────────┬────────────┬───────────────────────────────────────────────────────┐
│ Agente             │ Comando  │ Status     │ Descricao                                             │
├────────────────────┼──────────┼────────────┼───────────────────────────────────────────────────────┤
│ Claude Code        │ claude   │ instalado  │ Claude Code CLI da Anthropic — agente interativo       │
│ OpenAI Codex CLI   │ codex    │ nao encontrado │ OpenAI Codex CLI — agente autonomo de codificacao │
│ GitHub Copilot     │ gh       │ instalado  │ GitHub Copilot — delega via gh issue com copilot       │
└────────────────────┴──────────┴────────────┴───────────────────────────────────────────────────────┘
```

A coluna **Status** indica:

- `instalado` (verde) — CLI encontrado no PATH, pronto para uso
- `nao encontrado` (vermelho) — CLI nao encontrado, instale antes de usar

---

### krab workflow commands

Gera **slash commands nativos** para agentes de IA a partir dos workflows do Krab. Cada workflow se transforma em comandos nativos que podem ser invocados diretamente dentro do agente.

```bash
krab workflow commands [OPTIONS]
```

**Parametros:**

| Parametro | Tipo | Default | Descricao |
|-----------|------|---------|-----------|
| `-a` / `--agent` | opcao | todos | Agente especifico: `claude`, `copilot` |
| `-w` / `--workflow` | opcao | todos | Workflow especifico para gerar |
| `--preview` | flag | false | Preview sem escrever arquivos |
| `--clean` | flag | false | Remove todos os arquivos gerados |

#### Preview — Ver Antes de Gerar

```bash
krab workflow commands --preview
```

```
╭─ Workflow Commands — Preview (nenhum arquivo escrito) ────────────────────╮

╭─ [claude] .claude/commands/krab.md ──────────────────────────────────────╮
│ ---                                                                      │
│ description: "Krab SDD workflow router — run any krab workflow by name"   │
│ ---                                                                      │
│                                                                          │
│ ## User Input                                                            │
│ ...                                                                      │
╰──────────────────────────────────────────────────────────────────────────╯

╭─ [claude] .claude/commands/krab-implement.md ────────────────────────────╮
│ ---                                                                      │
│ description: "Krab workflow: implement — Implement a feature from spec"   │
│ ---                                                                      │
│ ...                                                                      │
╰──────────────────────────────────────────────────────────────────────────╯

... (mais arquivos)

  Seriam gerados 20 arquivo(s)
```

#### Gerar Slash Commands

```bash
krab workflow commands
```

```
╭─ Workflow Commands — Gerando slash commands nativos ─────────────────────╮

  [claude]  .claude/commands/krab.md
  [claude]  .claude/commands/krab-spec-create.md
  [claude]  .claude/commands/krab-implement.md
  [claude]  .claude/commands/krab-review.md
  [claude]  .claude/commands/krab-full-cycle.md
  [claude]  .claude/commands/krab-verify.md
  [claude]  .claude/commands/krab-agent-init.md
  [copilot] .github/agents/krab.agent.md
  [copilot] .github/prompts/krab-spec-create.prompt.md
  [copilot] .github/prompts/krab-implement.prompt.md
  [copilot] .github/prompts/krab-review.prompt.md
  [copilot] .github/prompts/krab-full-cycle.prompt.md
  [copilot] .github/prompts/krab-verify.prompt.md
  [copilot] .github/prompts/krab-agent-init.prompt.md
  [copilot] .github/skills/krab-spec-create/SKILL.md
  [copilot] .github/skills/krab-implement/SKILL.md
  [copilot] .github/skills/krab-review/SKILL.md
  [copilot] .github/skills/krab-full-cycle/SKILL.md
  [copilot] .github/skills/krab-verify/SKILL.md
  [copilot] .github/skills/krab-agent-init/SKILL.md
  Gerados 20 arquivo(s) de slash command
```

#### Limpar Arquivos Gerados

```bash
krab workflow commands --clean
```

```
╭─ Workflow Commands — Removendo arquivos gerados ─────────────────────────╮

  Removido: .claude/commands/krab.md
  Removido: .claude/commands/krab-implement.md
  ... (todos os arquivos krab*)
  Removidos 20 arquivo(s)
```

#### Filtrar por Agente ou Workflow

```bash
# Apenas Claude Code
krab workflow commands --agent claude

# Apenas o workflow implement
krab workflow commands --workflow implement

# Combinado
krab workflow commands --agent copilot --workflow review
```

---

## Referencia YAML para Workflows Customizados

### Schema Completo

```yaml
# Nome unico do workflow (usado em 'krab workflow run <name>')
name: meu-workflow

# Descricao legivel — aparece em 'krab workflow list'
description: "Pipeline customizado para deploy"

# Agente padrao quando --agent nao e especificado
default_agent: claude  # claude | codex | copilot

# Sequencia ordenada de steps
steps:

  # ──── Step tipo GATE ────
  # Verifica uma condicao antes de prosseguir.
  # Se falha e on_failure=stop, o pipeline para.
  - name: verificar-spec
    type: gate
    condition: "file_exists:{spec}"
    # on_failure: stop  (default — nao precisa declarar)

  # ──── Step tipo KRAB ────
  # Executa um comando interno do Krab CLI.
  # O prefixo 'krab' e adicionado automaticamente.
  - name: analisar-risco
    type: krab
    command: "analyze risk {spec}"
    on_failure: continue

  # ──── Step tipo SHELL ────
  # Executa qualquer comando no terminal.
  # Roda no diretorio raiz do projeto com timeout de 300s.
  - name: rodar-testes
    type: shell
    command: "uv run pytest -x --tb=short"
    on_failure: continue

  # ──── Step tipo AGENT ────
  # Delega uma tarefa a um agente de IA.
  # O prompt e enriquecido com contexto do projeto + spec.
  - name: implementar
    type: agent
    agent: "{agent}"  # herda do --agent ou default_agent
    prompt: >
      Implementar a feature descrita na especificacao.
      Seguir todos os cenarios Gherkin como criterios de aceitacao.
      Criar ou atualizar testes para cobrir os cenarios.

  # ──── Step tipo PROMPT ────
  # Solicita input do usuario durante a execucao.
  # O pipeline pausa e aguarda resposta.
  - name: confirmar-deploy
    type: prompt
    prompt: "Deploy para producao? (sim/nao)"

  # ──── Gate com variavel de ambiente ────
  - name: verificar-ci
    type: gate
    condition: "env:CI"  # verdadeiro se CI esta definida
```

### Exemplos de Workflows Customizados

#### Pipeline de Pre-Deploy

```yaml
name: pre-deploy
description: "Validacao completa antes de deploy"
default_agent: claude
steps:
  - name: check-spec
    type: gate
    condition: "file_exists:{spec}"
  - name: verify-quality
    type: krab
    command: "analyze risk {spec}"
  - name: check-ambiguity
    type: krab
    command: "analyze ambiguity {spec}"
    on_failure: continue
  - name: run-all-tests
    type: shell
    command: "uv run pytest --cov=src/ --cov-report=term-missing"
  - name: lint-check
    type: shell
    command: "uv run ruff check src/ tests/"
  - name: confirm
    type: prompt
    prompt: "Todos os checks passaram. Prosseguir com deploy?"
```

#### Review com Multiplos Agentes

```yaml
name: multi-review
description: "Review por dois agentes diferentes para cross-check"
default_agent: claude
steps:
  - name: check-spec
    type: gate
    condition: "file_exists:{spec}"
  - name: review-claude
    type: agent
    agent: claude
    prompt: "Review the implementation against the spec. Focus on correctness."
  - name: review-codex
    type: agent
    agent: codex
    prompt: "Review the implementation against the spec. Focus on edge cases."
    on_failure: continue
```

#### Pipeline de Documentacao

```yaml
name: doc-update
description: "Atualizar documentacao apos mudancas"
default_agent: claude
steps:
  - name: check-memory
    type: gate
    condition: "file_exists:{root}/.sdd/memory.json"
  - name: sync-agents
    type: krab
    command: "agent sync all"
  - name: generate-commands
    type: krab
    command: "workflow commands"
    on_failure: continue
  - name: update-docs
    type: agent
    agent: "{agent}"
    prompt: >
      Review all agent instruction files (CLAUDE.md, AGENTS.md, .github/copilot-instructions.md)
      and update them to reflect the current state of the project based on .sdd/memory.json.
```
