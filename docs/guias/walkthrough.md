---
sidebar_position: 2
title: Walkthrough End-to-End
---

# Walkthrough End-to-End

Este guia demonstra o uso completo do Krab CLI — desde a inicializacao de um projeto ate a implementacao de uma feature usando slash commands com agentes de IA.

Vamos construir uma feature de **autenticacao JWT** em um projeto Python/FastAPI, passando por todas as etapas do ciclo SDD.

---

## Passo 1: Inicializar o Projeto

O `krab init` e o ponto de partida. Ele configura o projeto com um wizard interativo de 5 etapas.

```bash
krab init
```

```
╭──────────────────────────────────────╮
│  Krab SDD Project Setup              │
│  Interactive wizard                  │
╰──────────────────────────────────────╯

Step 1/5 — Selecione o agente de IA

┌───┬─────────┬──────────────────────────────────────────────────────────┐
│ # │ Agent   │ Descricao                                                │
├───┼─────────┼──────────────────────────────────────────────────────────┤
│ 1 │ claude  │ Claude Code (Anthropic) — CLAUDE.md + .claude/commands/  │
│ 2 │ copilot │ GitHub Copilot — .github/copilot-instructions.md         │
│ 3 │ codex   │ OpenAI Codex — AGENTS.md + .agents/skills/               │
└───┴─────────┴──────────────────────────────────────────────────────────┘

Escolha o agente (1-3 ou nome) [Enter=claude]: 1
✓ Agente selecionado: claude

Step 2/5 — Configuracao do projeto

Nome do projeto [Enter=meu-app]: meu-app
Descricao do projeto [Enter=pular]: API REST com autenticacao JWT
Estilo de arquitetura [Enter=pular]: hexagonal

Informe a tech stack (Enter para pular/encerrar):
  Componente [Enter=pular]: backend
  Tecnologia para backend: Python 3.11 + FastAPI
  Componente [Enter=pular]: database
  Tecnologia para database: PostgreSQL
  Componente [Enter=pular]: (Enter)

Convencoes do projeto (Enter para pular/encerrar):
  Convencao [Enter=pular]: testing
  Regra para testing: pytest + fixtures
  Convencao [Enter=pular]: naming
  Regra para naming: snake_case
  Convencao [Enter=pular]: (Enter)

✓ Memoria do projeto inicializada: .sdd/

Step 3/5 — Gerando specs globais
✓ Specs globais geradas: constitution, guardrails, runbook

Step 4/5 — Criando workflow padrao
✓ Workflow padrao criado: .sdd/workflows/sdd-lifecycle.yaml

Step 5/5 — Gerando arquivos do agente
✓ [claude] CLAUDE.md
✓ Gerados 20 slash commands para claude

╭──────────────────────────────────────────────────────────╮
│  Projeto 'meu-app' inicializado com sucesso!             │
│                                                          │
│  Agente: claude                                          │
│  Workflow: sdd-lifecycle                                 │
│  Specs globais: constitution, guardrails, runbook        │
│                                                          │
│  Proximos passos:                                        │
│  1. Revise as specs globais em .sdd/specs/               │
│  2. Use krab spec new task -n 'feature' para criar specs │
│  3. Use krab workflow run sdd-lifecycle -s 'feature'     │
╰──────────────────────────────────────────────────────────╯
```

:::tip Todas as perguntas sao pulaveis
Pressione **Enter** em qualquer pergunta para aceitar o valor padrao e seguir para a proxima etapa. Isso permite configurar um projeto rapidamente.
:::

### Estrutura gerada

```
meu-app/
├── .sdd/
│   ├── memory.json              # Memoria do projeto
│   ├── skills.json              # Skills do time
│   ├── history.json             # Historico de acoes
│   ├── specs/
│   │   ├── spec.constitution.md # Identidade e principios
│   │   ├── spec.guardrails.md   # Quality gates
│   │   └── spec.runbook.md      # Procedimentos operacionais
│   └── workflows/
│       └── sdd-lifecycle.yaml   # Workflow padrao
├── .claude/
│   └── commands/
│       ├── krab.md              # Router: /project:krab
│       ├── krab-spec-new.md     # /project:krab-spec-new
│       ├── krab-spec-refine.md  # /project:krab-spec-refine
│       ├── krab-spec-clarify.md # /project:krab-spec-clarify
│       ├── krab-spec-import.md  # /project:krab-spec-import
│       ├── krab-spec-archive.md # /project:krab-spec-archive
│       ├── krab-spec-delete.md  # /project:krab-spec-delete
│       ├── krab-implement.md    # /project:krab-implement
│       ├── krab-review.md       # /project:krab-review
│       └── ...                  # + outros slash commands
└── CLAUDE.md                    # Instrucoes para Claude Code
```

---

## Passo 2: Revisar Specs Globais

Antes de criar features, revise as specs globais geradas. Elas influenciam todo o ciclo de refinamento.

### Constitution

```bash
# Abra e edite a constitution com informacoes reais do projeto
cat .sdd/specs/spec.constitution.md
```

A constitution define a identidade do projeto — principios, limites e padroes. Atualize os placeholders com informacoes reais.

### GuardRails

```bash
cat .sdd/specs/spec.guardrails.md
```

Os guardrails definem quality gates que sao verificados em cada etapa. Ajuste os thresholds conforme a maturidade do projeto.

### Runbook

```bash
cat .sdd/specs/spec.runbook.md
```

O runbook documenta procedimentos operacionais. Preencha com os comandos e processos reais do projeto.

---

## Passo 3: Criar uma Spec de Feature

Agora vamos criar a spec da feature de autenticacao JWT.

### Via CLI

```bash
krab spec new task -n "JWT Authentication" -d "Autenticacao JWT com login, refresh token e logout"
```

```
╭──────────────────────────────────╮
│  Spec Generator  type=task       │
╰──────────────────────────────────╯
✓ Spec gerada: spec.task.jwt-authentication.md
ℹ Template: spec.task | 4,231 chars
```

### Via Slash Command (Claude Code)

```
> /project:krab-spec-new task jwt-authentication
```

O Claude Code executa `krab spec new task -n "jwt-authentication"`, le a spec gerada e oferece para enriquece-la com conteudo real.

---

## Passo 4: Enriquecer a Spec

A spec gerada contem placeholders. Vamos enriquece-la com conteudo real.

### Via Clarify (Q&A interativo)

```bash
krab spec clarify spec.task.jwt-authentication.md
```

```
╭──────────────────────────────────────────╮
│  Spec Clarify                            │
│  spec.task.jwt-authentication.md         │
╰──────────────────────────────────────────╯
ℹ Perguntas geradas: 15

  [completeness/high] Quais endpoints devem ser criados para autenticacao?
  > POST /auth/login, POST /auth/refresh, POST /auth/logout, GET /auth/me

  [precision/critical] Qual o tempo de expiracao do access token?
  > 15 minutos

  [precision/high] Qual o tempo de expiracao do refresh token?
  > 7 dias

  [context/medium] Qual biblioteca JWT sera usada?
  > python-jose com algoritmo RS256

  [testability/high] Quais cenarios de erro devem ser cobertos?
  > Token expirado, token invalido, refresh token revogado, usuario bloqueado

✓ Sessao salva: spec.clarify.jwt-authentication.md
ℹ 12 de 15 perguntas respondidas
```

### Via Slash Command (Claude Code)

```
> /project:krab-spec-clarify spec.task.jwt-authentication.md
```

No modo agente (`--agent`), o clarify gera todas as perguntas e o agente responde automaticamente com base no contexto do projeto.

---

## Passo 5: Refinar a Spec

Apos o enriquecimento, analise a spec com Tree-of-Thought para identificar gaps.

```bash
krab spec refine spec.task.jwt-authentication.md
```

```
╭────────────────────────────────────────────────────╮
│  Spec Refiner (Tree-of-Thought)                    │
│  spec.task.jwt-authentication.md                   │
╰────────────────────────────────────────────────────╯
ℹ Tipo detectado: spec.task
ℹ Perguntas geradas: 18
ℹ Iteracoes estimadas: 3
⚠ Gaps criticos: 1
  • Testabilidade/Cobertura de cenarios edge case
✓ Refinamento salvo: spec.refining.jwt-authentication.md
```

---

## Passo 6: Analisar Qualidade

Antes de implementar, valide a qualidade da spec com multiplas analises.

```bash
# Risco de alucinacao
krab analyze risk spec.task.jwt-authentication.md

# Termos ambiguos
krab analyze ambiguity spec.task.jwt-authentication.md

# Ou rode todas as verificacoes de uma vez
krab workflow run verify --spec spec.task.jwt-authentication.md
```

### Via Slash Command

```
> /project:krab-verify spec.task.jwt-authentication.md
```

---

## Passo 7: Implementar com Agente

Com a spec validada, delegue a implementacao ao agente.

### Via Workflow Completo

```bash
krab workflow run implement --spec spec.task.jwt-authentication.md --agent claude
```

```
╭─ Workflow: implement — LIVE ─────────────────────────────────────────────╮

  OK    check-spec-exists: Gate passed
  OK    risk-check: Score 0.23 (low risk)
  OK    sync-agents: done
  OK    delegate-to-agent: Implementation complete
  OK    run-tests: 14 tests passed

  Workflow 'implement' concluido: 5 aprovados, 0 ignorados
```

### Via Slash Command (Claude Code)

```
> /project:krab-implement spec.task.jwt-authentication.md
```

O Claude Code:
1. Verifica se a spec existe (gate)
2. Roda `krab analyze risk` no terminal
3. Sincroniza arquivos de instrucao
4. Implementa a feature seguindo os cenarios Gherkin da spec
5. Roda os testes automaticamente

---

## Passo 8: Revisar Implementacao

Apos a implementacao, use o workflow de review.

```bash
krab workflow run review --spec spec.task.jwt-authentication.md --agent claude
```

### Via Slash Command

```
> /project:krab-review spec.task.jwt-authentication.md
```

O agente compara a implementacao com a spec, verificando se todos os cenarios Gherkin foram cobertos e se as convencoes do projeto foram respeitadas.

---

## Passo 9: Ciclo Completo (sdd-lifecycle)

Para novos projetos, o `sdd-lifecycle` executa todas as etapas acima em uma unica execucao de 14 steps em 5 fases:

```bash
krab workflow run sdd-lifecycle --spec user-registration --agent claude
```

### Via Slash Command

```
> /project:krab sdd-lifecycle user-registration
```

O workflow executa automaticamente: criacao da spec → enriquecimento → clarify → refine → analise de risco → analise de ambiguidade → otimizacao → sync de agentes → implementacao → testes → revisao → re-analise.

---

## Passo 10: Gerenciar Specs

### Importar specs de outro repositorio

```bash
# Registrar um repositorio de specs
krab spec registry add team-specs https://github.com/org/sdd-templates --path .sdd/specs

# Importar specs
krab spec import team-specs --all
```

### Via Slash Command

```
> /project:krab-spec-import https://github.com/org/sdd-templates
```

### Arquivar specs obsoletas

```bash
# Mover para .sdd/archived/
krab spec archive spec.task.old-feature.md --force
```

### Via Slash Command

```
> /project:krab-spec-archive spec.task.old-feature.md
```

### Excluir specs permanentemente

```bash
krab spec delete spec.task.deprecated.md --force
```

### Via Slash Command

```
> /project:krab-spec-delete spec.task.deprecated.md
```

---

## Referencia de Slash Commands

Todos os slash commands disponiveis apos `krab init`:

### Claude Code (`/project:...`)

| Comando | Descricao |
|---------|-----------|
| `/project:krab <workflow> <spec>` | Router — executa qualquer workflow |
| `/project:krab-spec-new <type> <name>` | Cria nova spec a partir de template |
| `/project:krab-spec-refine <spec>` | Refina spec com Tree-of-Thought |
| `/project:krab-spec-clarify <spec>` | Q&A interativo para enriquecer spec |
| `/project:krab-spec-import <source>` | Importa specs de repositorio Git |
| `/project:krab-spec-archive <spec>` | Arquiva spec em .sdd/archived/ |
| `/project:krab-spec-delete <spec>` | Exclui spec permanentemente |
| `/project:krab-analyze-risk <spec>` | Analisa risco de alucinacao |
| `/project:krab-analyze-ambiguity <spec>` | Detecta termos vagos |
| `/project:krab-optimize <spec>` | Otimiza tokens da spec |
| `/project:krab-memory-show` | Mostra memoria do projeto |
| `/project:krab-memory-set <key> <value>` | Configura campo da memoria |
| `/project:krab-agent-sync <target>` | Sincroniza arquivos de instrucao |
| `/project:krab-workflow-run <name> <spec>` | Executa workflow pipeline |
| `/project:krab-implement <spec>` | Workflow: implementar feature |
| `/project:krab-review <spec>` | Workflow: revisar implementacao |
| `/project:krab-verify <spec>` | Workflow: verificar qualidade |
| `/project:krab-full-cycle <spec>` | Workflow: ciclo completo |
| `/project:krab-spec-create <spec>` | Workflow: criar + enriquecer spec |

### Copilot (`@krab` ou `/krab-...`)

| Comando | Descricao |
|---------|-----------|
| `@krab <instrucao>` | Agente krab — entende contexto e executa workflows |
| `/krab-spec-new` | Prompt: criar spec |
| `/krab-spec-refine` | Prompt: refinar spec |
| `/krab-spec-clarify` | Prompt: clarify Q&A |
| `/krab-spec-import` | Prompt: importar specs |
| `/krab-spec-archive` | Prompt: arquivar spec |
| `/krab-spec-delete` | Prompt: excluir spec |
| `/krab-implement` | Prompt: implementar feature |
| `/krab-review` | Prompt: revisar implementacao |

---

## Fluxo Resumido

```
krab init
  │
  ├── Seleciona agente (claude/copilot/codex)
  ├── Configura projeto (nome, stack, convencoes)
  ├── Gera specs globais (constitution, guardrails, runbook)
  ├── Cria workflow sdd-lifecycle
  └── Gera slash commands + instrucoes do agente
       │
       ▼
krab spec new task -n "feature"
  │
  ▼
krab spec clarify spec.task.feature.md    ← Q&A interativo
  │
  ▼
krab spec refine spec.task.feature.md     ← Tree-of-Thought
  │
  ▼
krab analyze risk spec.task.feature.md    ← Validacao
  │
  ▼
krab workflow run implement --spec spec.task.feature.md
  │
  ├── Gate: spec existe?
  ├── Analise de risco
  ├── Sync agentes
  ├── Agente implementa feature
  └── Testes automaticos
       │
       ▼
krab workflow run review --spec spec.task.feature.md
  │
  └── Agente revisa implementacao contra a spec
       │
       ▼
krab spec archive spec.task.feature.md    ← Quando a feature estiver completa
```
