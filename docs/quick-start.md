---
sidebar_position: 3
title: Quick Start
---

# Quick Start

Este tutorial guia voce do zero ao primeiro workflow SDD completo. Ao final, voce tera:

- Um projeto com memoria persistente configurada
- Uma spec gerada e analisada
- Uma spec otimizada para economia de tokens
- Instrucoes sincronizadas para agentes de IA
- Um workflow executado com delegacao a um agente

:::info Pre-requisito
Certifique-se de que o Krab CLI esta instalado e funcionando. Teste com `krab --version`. Se ainda nao instalou, veja o guia de [Instalacao](./instalacao).
:::

---

## Passo 1: Inicializar a Memoria do Projeto

A memoria do projeto e armazenada em `.sdd/` e serve como contexto persistente para tudo que o Krab CLI gera — specs, instrucoes de agentes, slash commands.

```bash
krab memory init -n "ecommerce-api" -d "API REST para e-commerce com pagamentos e carrinho"
```

**Saida esperada:**

```
╭─ Krab CLI ───────────────────────────────────╮
│  Projeto inicializado: .sdd/                  │
╰──────────────────────────────────────────────╯
✓ Nome: ecommerce-api
ℹ Use `krab memory set` para configurar stack, convenções, etc.
```

Isso cria a seguinte estrutura:

```
.sdd/
├── memory.json    # Contexto do projeto (vazio por enquanto)
├── skills.json    # Skills tecnicas (vazio)
└── history.json   # Historico de geracao (vazio)
```

:::tip Quando inicializar?
Inicialize a memoria uma vez por projeto, idealmente no inicio. O comando e idempotente — rodar novamente nao sobrescreve dados existentes.
:::

---

## Passo 2: Configurar Tech Stack, Convencoes e Termos de Dominio

Agora vamos preencher a memoria com informacoes do projeto. O Krab CLI usa esses dados para gerar specs mais precisas e instrucoes de agentes contextualizadas.

### Tech Stack

Use dot notation para definir cada componente do stack:

```bash
krab memory set tech_stack.backend "Python/FastAPI"
krab memory set tech_stack.database "PostgreSQL 15"
krab memory set tech_stack.cache "Redis"
krab memory set tech_stack.frontend "React 18 / TypeScript"
krab memory set tech_stack.infra "Docker + AWS ECS"
```

**Saida de cada comando:**

```
✓ Configurado: tech_stack.backend = Python/FastAPI
```

### Estilo Arquitetural

```bash
krab memory set architecture_style "hexagonal (ports & adapters)"
```

### Convencoes

```bash
krab memory set conventions.commits "conventional commits (feat:, fix:, docs:)"
krab memory set conventions.branches "gitflow (main, develop, feature/*, hotfix/*)"
krab memory set conventions.naming "snake_case para Python, camelCase para TypeScript"
krab memory set conventions.tests "pytest com fixtures, minimo 80% cobertura"
```

### Termos de Dominio (Ubiquitous Language)

Definir termos de dominio e crucial para reduzir ambiguidade nas specs. Quando o agente de IA le uma spec com termos definidos, ele sabe exatamente o que cada conceito significa:

```bash
krab memory set domain_terms.tenant "Organizacao cliente no sistema multi-tenant"
krab memory set domain_terms.SKU "Stock Keeping Unit - identificador unico do produto"
krab memory set domain_terms.cart "Carrinho de compras temporario do usuario (expira em 24h)"
krab memory set domain_terms.checkout "Processo de finalizacao: carrinho -> pagamento -> pedido"
```

### Constraints

Constraints sao regras que nunca devem ser violadas:

```bash
krab memory set constraints "Todas as respostas da API devem ter paginacao (max 100 itens)"
krab memory set constraints "Sem queries N+1 — usar eager loading ou batch queries"
krab memory set constraints "Todos os endpoints requerem autenticacao JWT exceto /health"
```

### Verificando a Memoria

Visualize tudo que foi configurado:

```bash
krab memory show
```

**Saida esperada:**

```
╭─ Project Memory ─── ecommerce-api ──────────╮

┌──────────────────────┬─────────────────────────────────────────────┐
│ Campo                │ Valor                                       │
├──────────────────────┼─────────────────────────────────────────────┤
│ project_name         │ ecommerce-api                               │
│ description          │ API REST para e-commerce com pagamentos e   │
│                      │ carrinho                                    │
│ architecture_style   │ hexagonal (ports & adapters)                │
│ tech_stack.backend   │ Python/FastAPI                              │
│ tech_stack.database  │ PostgreSQL 15                               │
│ tech_stack.cache     │ Redis                                       │
│ tech_stack.frontend  │ React 18 / TypeScript                       │
│ tech_stack.infra     │ Docker + AWS ECS                            │
│ conventions.commits  │ conventional commits (feat:, fix:, docs:)   │
│ conventions.branches │ gitflow                                     │
│ conventions.naming   │ snake_case para Python, camelCase para TS   │
│ conventions.tests    │ pytest com fixtures, minimo 80% cobertura   │
│ domain_terms.tenant  │ Organizacao cliente no sistema multi-tenant │
│ domain_terms.SKU     │ Stock Keeping Unit - identificador unico    │
│ domain_terms.cart    │ Carrinho temporario do usuario (expira 24h) │
│ domain_terms.checkout│ Processo: carrinho -> pagamento -> pedido   │
│ constraints          │ Paginacao max 100, Sem N+1, JWT obrigatorio │
└──────────────────────┴─────────────────────────────────────────────┘
```

---

## Passo 3: Adicionar Skills (Linguagens, Frameworks)

Skills representam as capacidades tecnicas do projeto. O Krab CLI injeta essa informacao nas specs e instrucoes de agentes:

```bash
# Linguagens
krab memory add-skill Python -c language -v "3.11" -d "Backend principal" -t "async,typing"
krab memory add-skill TypeScript -c language -v "5.3" -d "Frontend"

# Frameworks
krab memory add-skill FastAPI -c framework -v "0.104" -d "API REST async" -t "web,api,async"
krab memory add-skill React -c framework -v "18" -d "UI components" -t "frontend,spa"
krab memory add-skill SQLAlchemy -c framework -v "2.0" -d "ORM async" -t "database,orm"

# Ferramentas
krab memory add-skill Docker -c infra -d "Containerizacao" -t "deploy,ci"
krab memory add-skill pytest -c tool -d "Testing framework" -t "test,qa"

# Padroes
krab memory add-skill "Repository Pattern" -c pattern -d "Acesso a dados desacoplado"
krab memory add-skill "CQRS" -c pattern -d "Command Query Responsibility Segregation"
```

**Saida de cada comando:**

```
✓ Skill adicionada: language/Python
✓ Skill adicionada: framework/FastAPI
```

Verifique todas as skills registradas:

```bash
krab memory skills
```

**Saida esperada:**

```
╭─ Project Skills ─── 9 skills ───────────────╮

┌────────────┬────────────────────┬────────┬──────────────────────────┬──────────────────┐
│ Categoria  │ Nome               │ Versao │ Descricao                │ Tags             │
├────────────┼────────────────────┼────────┼──────────────────────────┼──────────────────┤
│ framework  │ FastAPI            │ 0.104  │ API REST async           │ web, api, async  │
│ framework  │ React              │ 18     │ UI components            │ frontend, spa    │
│ framework  │ SQLAlchemy         │ 2.0    │ ORM async                │ database, orm    │
│ infra      │ Docker             │        │ Containerizacao          │ deploy, ci       │
│ language   │ Python             │ 3.11   │ Backend principal        │ async, typing    │
│ language   │ TypeScript         │ 5.3    │ Frontend                 │                  │
│ pattern    │ CQRS               │        │ Command Query Resp. Seg. │                  │
│ pattern    │ Repository Pattern │        │ Acesso a dados desac.    │                  │
│ tool       │ pytest             │        │ Testing framework        │ test, qa         │
└────────────┴────────────────────┴────────┴──────────────────────────┴──────────────────┘
```

---

## Passo 4: Gerar uma Spec a Partir de Template

Agora vamos gerar uma spec de tarefa (feature). O Krab CLI injeta automaticamente o contexto do projeto (tech stack, convencoes, termos de dominio) no template:

```bash
krab spec new task -n "Carrinho de Compras" -d "CRUD de carrinho com calculo de totais e validacao de estoque"
```

**Saida esperada:**

```
╭─ Spec Generator ─── type=task ──────────────╮
✓ Spec gerada: spec.task.carrinho-de-compras.md
ℹ Template: spec.task | 2847 chars
```

O arquivo gerado `spec.task.carrinho-de-compras.md` contem:

- **Titulo e descricao** da tarefa
- **Contexto do projeto** (injetado da memoria)
- **Cenarios Gherkin** (Given/When/Then) como esqueleto para preencher
- **Criterios de aceitacao** mensuraveis
- **Restricoes tecnicas** do projeto
- **Termos de dominio** relevantes

:::tip Editando a spec gerada
O template gera um esqueleto com placeholders. Voce deve editar o arquivo e preencher os cenarios Gherkin com os requisitos reais da feature. Quanto mais precisa a spec, melhor o resultado do agente de IA.

Exemplo de cenario Gherkin preenchido:

```gherkin
Scenario: Adicionar item ao carrinho
  Given um usuario autenticado com JWT valido
  And um produto com SKU "PROD-001" com 10 unidades em estoque
  When o usuario envia POST /api/cart/items com SKU "PROD-001" e quantidade 2
  Then o carrinho contem 1 item
  And o total do carrinho e calculado como preco_unitario * 2
  And a resposta retorna status 201 com o carrinho atualizado
```
:::

Voce pode listar todos os templates disponiveis:

```bash
krab spec list
```

**Saida esperada:**

```
┌────────────────────┬────────────────────────────────────┬──────────────────────────────────────────┐
│ Type               │ Command                            │ Description                              │
├────────────────────┼────────────────────────────────────┼──────────────────────────────────────────┤
│ spec.task          │ krab spec new task -n "nome"       │ Spec de tarefa/feature com Gherkin       │
│ spec.architecture  │ krab spec new architecture -n "..."│ Spec de arquitetura com C4, ADRs         │
│ spec.plan          │ krab spec new plan -n "nome"       │ Plano de implementacao com fases         │
│ spec.skill         │ krab spec new skill -n "nome"      │ Definicao de skills tecnicas             │
│ spec.refining      │ krab spec new refining -n "nome"   │ Refinamento Tree-of-Thought              │
└────────────────────┴────────────────────────────────────┴──────────────────────────────────────────┘
```

---

## Passo 5: Analisar a Spec (Risco, Ambiguidade, Legibilidade)

Antes de enviar a spec para um agente, analise a qualidade dela. O Krab CLI oferece multiplas dimensoes de analise:

### Risco de Alucinacao

O score de risco combina ambiguidade, legibilidade, entropia e utilizacao de contexto em uma nota unica de 0 a 100:

```bash
krab analyze risk spec.task.carrinho-de-compras.md
```

**Saida esperada:**

```
╭─ Hallucination Risk Assessment ─── spec.task.carrinho-de-compras.md ─╮

┌────────────────────────┬──────────────┐
│ Risk Overview          │              │
├────────────────────────┼──────────────┤
│ Overall Risk Score     │ 35/100       │
│ Risk Level             │ MEDIUM       │
│ Safe for Agents        │ Yes          │
│ Spec Word Count        │ 487          │
└────────────────────────┴──────────────┘

┌──────────────────────┬───────┬────────┬──────────┬───────────────────────────────┐
│ Factor               │ Score │ Weight │ Severity │ Detail                        │
├──────────────────────┼───────┼────────┼──────────┼───────────────────────────────┤
│ Ambiguity            │  0.25 │   0.30 │ LOW      │ 3 vague terms detected        │
│ Readability          │  0.40 │   0.20 │ MEDIUM   │ FK Grade: 10.2               │
│ Entropy              │  0.30 │   0.20 │ LOW      │ Good information density      │
│ Context Utilization  │  0.45 │   0.30 │ MEDIUM   │ 48% of context window used    │
└──────────────────────┴───────┴────────┴──────────┴───────────────────────────────┘

⚠ Consider reducing ambiguous terms for better agent performance
ℹ Run `krab analyze ambiguity` for detailed term-by-term analysis
```

:::warning Scores de risco
| Score | Nivel | Significado |
|-------|-------|-------------|
| 0-25 | LOW | Spec segura para agentes |
| 26-50 | MEDIUM | Aceitavel, mas pode melhorar |
| 51-75 | HIGH | Risco significativo — refine antes de usar |
| 76-100 | CRITICAL | Nao envie para agentes sem antes corrigir |
:::

### Deteccao de Ambiguidade

Encontre termos vagos que aumentam o risco de alucinacao:

```bash
krab analyze ambiguity spec.task.carrinho-de-compras.md
```

**Saida esperada:**

```
╭─ Ambiguity Analysis ─── spec.task.carrinho-de-compras.md ─╮

┌─────────────────────┬──────────────┐
│ Precision Metrics   │              │
├─────────────────────┼──────────────┤
│ Precision Score     │ 92.3%        │
│ Grade               │ A            │
│ Total Words         │ 487          │
│ Ambiguous Terms     │ 3            │
│ HIGH Severity       │ 0            │
│ MEDIUM Severity     │ 1            │
│ LOW Severity        │ 2            │
└─────────────────────┴──────────────┘

┌───┬──────────────┬──────┬──────────┬───────────────────────────────────────┐
│ # │ Term         │ Line │ Severity │ Suggestion                            │
├───┼──────────────┼──────┼──────────┼───────────────────────────────────────┤
│ 1 │ appropriate  │   23 │ MEDIUM   │ Specify exact criteria or conditions   │
│ 2 │ etc          │   45 │ LOW      │ List all items explicitly              │
│ 3 │ usually      │   51 │ LOW      │ Specify exact condition or frequency   │
└───┴──────────────┴──────┴──────────┴───────────────────────────────────────┘
```

### Legibilidade

Analise se o texto e muito complexo para o agente processar eficientemente:

```bash
krab analyze readability spec.task.carrinho-de-compras.md
```

**Saida esperada:**

```
╭─ Readability Analysis ─── spec.task.carrinho-de-compras.md ─╮

┌──────────────────────┬──────────────┐
│ Readability Scores   │              │
├──────────────────────┼──────────────┤
│ Flesch-Kincaid Grade │ 10.2         │
│ Flesch Reading Ease  │ 52.1         │
│ Coleman-Liau Index   │ 11.8         │
│ Gunning Fog Index    │ 12.4         │
│ ARI Score            │ 10.9         │
│ Avg Words/Sentence   │ 15.3         │
│ Complex Word %       │ 18.7%        │
│ Overall Grade        │ B            │
└──────────────────────┴──────────────┘

ℹ Recommendation: Good readability for technical specs. Consider
  simplifying sentences above 20 words.
```

### Analise de Entropia

Verifique se a spec tem conteudo informacional suficiente ou e muito redundante:

```bash
krab analyze entropy spec.task.carrinho-de-compras.md
```

### Contagem de Tokens

Saiba exatamente quantos tokens a spec consome:

```bash
krab analyze tokens spec.task.carrinho-de-compras.md
```

**Saida esperada:**

```
┌──────────────────────┬──────────────┐
│ Token Summary        │              │
├──────────────────────┼──────────────┤
│ Characters           │ 2847         │
│ Words                │ 487          │
│ Lines                │ 89           │
│ Tokens               │ 842          │
│ Chars/Token          │ 3.4          │
│ Encoding             │ cl100k_base  │
└──────────────────────┴──────────────┘

┌──────────────────────┬──────────────┐
│ Estimated Cost       │              │
├──────────────────────┼──────────────┤
│ GPT-4 (input)        │ $0.0084      │
│ Claude 3.5 (input)   │ $0.0025      │
│ Total Cost (USD)     │ $0.0084      │
└──────────────────────┴──────────────┘
```

:::tip Rodando todas as analises de uma vez
O workflow `verify` executa todas as analises em sequencia:

```bash
krab workflow run verify --spec spec.task.carrinho-de-compras.md
```

Isso roda: risk, ambiguity, readability, entropy e gera um plano de refinamento — tudo com um unico comando.
:::

---

## Passo 6: Otimizar a Spec

A otimizacao reduz o consumo de tokens sem perder informacao. O Krab CLI usa compressao Huffman-inspired para termos frequentes e deduplicacao fuzzy para secoes repetidas:

```bash
krab optimize run spec.task.carrinho-de-compras.md -o spec.task.carrinho-de-compras.optimized.md
```

**Saida esperada:**

```
╭─ Krab Optimizer ─── Processing: spec.task.carrinho-de-compras.md ─╮

┌──────────────────────┬──────────────┐
│ Compression Metrics  │              │
├──────────────────────┼──────────────┤
│ Original Tokens      │ 842          │
│ Optimized Tokens     │ 698          │
│ Tokens Saved         │ 144          │
│ Compression Ratio    │ 17.1%        │
│ Aliases Created      │ 8            │
└──────────────────────┴──────────────┘

┌──────────────────────┬──────────┬──────────┐
│ Context Quality      │ Before   │ After    │
├──────────────────────┼──────────┼──────────┤
│ Information Density  │ 0.612    │ 0.739    │
│ Redundancy Ratio     │ 0.188    │ 0.041    │
│ Density Grade        │ B        │ A        │
└──────────────────────┴──────────┴──────────┘

┌──────────────────┬───────────────────────────────────┐
│ Alias            │ Expansion                         │
├──────────────────┼───────────────────────────────────┤
│ $CC              │ carrinho de compras               │
│ $USR             │ usuario autenticado               │
│ $PROD            │ produto                           │
│ $EST             │ estoque                           │
│ $API             │ endpoint da API                   │
│ $VAL             │ validacao                         │
│ $REQ             │ requisicao                        │
│ $RESP            │ resposta                          │
└──────────────────┴───────────────────────────────────┘

✓ Optimized spec saved to: spec.task.carrinho-de-compras.optimized.md
```

Voce pode ajustar os parametros de otimizacao:

```bash
# Ajustar frequencia minima para gerar aliases (default: 3)
krab optimize run spec.md --min-freq 2

# Aumentar o numero maximo de aliases (default: 50)
krab optimize run spec.md --max-aliases 100

# Ajustar limiar de similaridade para deduplicacao (default: 90%)
krab optimize run spec.md --threshold 85

# Pular compressao (manter apenas deduplicacao)
krab optimize run spec.md --no-compress

# Pular deduplicacao (manter apenas compressao)
krab optimize run spec.md --no-dedup

# Definir janela de contexto alvo
krab optimize run spec.md --context-window 16384
```

:::info Por que otimizar?
Cada token economizado e espaco ganho na janela de contexto do agente. Em uma spec de 2000 tokens, uma compressao de 17% economiza 340 tokens — espaco suficiente para incluir mais contexto, mais cenarios Gherkin, ou mais restricoes. Em projetos com muitas specs, o ganho acumulado e significativo.
:::

---

## Passo 7: Sincronizar Arquivos de Instrucao dos Agentes

O comando `agent sync` gera automaticamente:

1. **Arquivos de instrucao** formatados para cada agente (CLAUDE.md, copilot-instructions.md, AGENTS.md)
2. **Slash commands nativos** para cada agente (`.claude/commands/`, `.github/prompts/`, etc.)

```bash
krab agent sync
```

**Saida esperada:**

```
╭─ Agent Sync ─── target=all ─────────────────╮

✓ [claude] CLAUDE.md
✓ [copilot] .github/copilot-instructions.md
✓ [copilot] .github/instructions/krab-specs.instructions.md
✓ [codex] AGENTS.md
✓ [codex] .agents/skills/krab-workflow/SKILL.md
ℹ Generated 5 instruction files for 3 agents

✓ [claude/cmd] .claude/commands/krab.md
✓ [claude/cmd] .claude/commands/krab-spec-create.md
✓ [claude/cmd] .claude/commands/krab-implement.md
✓ [claude/cmd] .claude/commands/krab-review.md
✓ [claude/cmd] .claude/commands/krab-full-cycle.md
✓ [claude/cmd] .claude/commands/krab-verify.md
✓ [claude/cmd] .claude/commands/krab-agent-init.md
✓ [copilot/cmd] .github/agents/krab.agent.md
✓ [copilot/cmd] .github/prompts/krab-spec-create.prompt.md
✓ [copilot/cmd] .github/prompts/krab-implement.prompt.md
✓ [copilot/cmd] .github/prompts/krab-review.prompt.md
✓ [copilot/cmd] .github/prompts/krab-full-cycle.prompt.md
✓ [copilot/cmd] .github/prompts/krab-verify.prompt.md
✓ [copilot/cmd] .github/prompts/krab-agent-init.prompt.md
ℹ Generated 14 slash command files
```

Se quiser sincronizar apenas para um agente especifico:

```bash
# Apenas Claude Code
krab agent sync claude

# Apenas Copilot
krab agent sync copilot

# Apenas Codex
krab agent sync codex

# Instrucoes sem slash commands
krab agent sync --no-commands
```

Para verificar o status dos arquivos gerados:

```bash
krab agent status
```

**Saida esperada:**

```
┌────────────────────┬──────────────────────────────────────────────────┬──────────┐
│ Agent              │ File                                             │ Status   │
├────────────────────┼──────────────────────────────────────────────────┼──────────┤
│ Claude Code        │ CLAUDE.md                                        │ + exists │
│ Copilot            │ .github/copilot-instructions.md                  │ + exists │
│ Copilot (specs)    │ .github/instructions/krab-specs.instructions.md  │ + exists │
│ Codex              │ AGENTS.md                                        │ + exists │
│ Codex (skill)      │ .agents/skills/krab-workflow/SKILL.md            │ + exists │
│ Krab Memory        │ .sdd/memory.json                                 │ + exists │
└────────────────────┴──────────────────────────────────────────────────┴──────────┘
```

:::tip Preview antes de escrever
Se quiser ver o conteudo que seria gerado sem escrever arquivos:

```bash
krab agent preview claude
```

Ou para ver apenas o diff contra arquivos existentes:

```bash
krab agent diff claude
```
:::

---

## Passo 8: Executar um Workflow

Agora vamos juntar tudo em um workflow automatizado. Workflows encadeiam multiplos passos em um pipeline sequencial.

### Dry-run Primeiro

Sempre faca um dry-run antes de executar um workflow pela primeira vez. Isso mostra exatamente o que vai acontecer sem executar nada:

```bash
krab workflow run implement --spec spec.task.carrinho-de-compras.md --dry-run
```

**Saida esperada:**

```
╭─ Workflow: implement ─── DRY RUN  spec=spec.task.carrinho-de-compras.md  agent=claude ─╮

  SKIP  check-spec-exists: Would check: file_exists:spec.task.carrinho-de-compras.md
  SKIP  risk-check: Would run: krab analyze risk spec.task.carrinho-de-compras.md
  SKIP  sync-agents: Would run: krab agent sync all
  SKIP  delegate-to-agent: Would delegate to claude: Implement the feature...
  SKIP  run-tests: Would run: uv run pytest

✓ Workflow 'implement' completed: 0 passed, 5 skipped
```

### Execucao Real

Quando estiver satisfeito com o dry-run, execute de verdade:

```bash
krab workflow run implement --spec spec.task.carrinho-de-compras.md --agent claude
```

**Saida esperada (execucao real):**

```
╭─ Workflow: implement ─── LIVE  spec=spec.task.carrinho-de-compras.md  agent=claude ─╮

  OK  check-spec-exists: done
  OK  risk-check: done
  OK  sync-agents: done
  OK  delegate-to-agent: Agent claude executed successfully
  OK  run-tests: 12 passed, 0 failed

✓ Workflow 'implement' completed: 5 passed, 0 skipped
```

:::warning Pre-requisito para execucao com agente
Para que o step `delegate-to-agent` funcione, a CLI do agente precisa estar instalada:

```bash
# Verificar quais CLIs estao disponiveis
krab workflow agents-check
```

| Agente | Instalacao |
|--------|-----------|
| Claude Code | `npm install -g @anthropic-ai/claude-code` |
| Codex | `npm install -g codex` |
| Copilot | `gh` CLI + autenticacao GitHub |
:::

### Outros Workflows Uteis

```bash
# Ciclo completo: cria spec -> refine -> analyze -> optimize -> sync -> implement -> test -> review
krab workflow run full-cycle --spec pagamentos-pix --agent claude

# Apenas verificar qualidade (sem implementacao)
krab workflow run verify --spec spec.task.carrinho-de-compras.md

# Inicializar agentes a partir da memoria
krab workflow run agent-init

# Review de implementacao contra a spec
krab workflow run review --spec spec.task.carrinho-de-compras.md --agent claude
```

### Visualizar Todos os Workflows Disponiveis

```bash
krab workflow list
```

**Saida esperada:**

```
┌───────────────┬───────┬───────────┬───────────────────────────────────────────────────────────┐
│ Name          │ Steps │ Type      │ Description                                               │
├───────────────┼───────┼───────────┼───────────────────────────────────────────────────────────┤
│ spec-create   │     4 │ built-in  │ Create a new spec from template, refine, analyze, sync    │
│ implement     │     5 │ built-in  │ Implement a feature from spec: gate, risk, sync, agent    │
│ review        │     3 │ built-in  │ Review implementation against spec: gate, ambiguity, agent│
│ full-cycle    │     8 │ built-in  │ Complete SDD lifecycle from spec creation through review   │
│ verify        │     6 │ built-in  │ Run all quality checks on a spec                          │
│ agent-init    │     3 │ built-in  │ Initialize agent instruction files from memory             │
└───────────────┴───────┴───────────┴───────────────────────────────────────────────────────────┘
```

### Ver os Passos de um Workflow Especifico

```bash
krab workflow show full-cycle
```

**Saida esperada:**

```
╭─ Workflow: full-cycle ─── Complete SDD lifecycle ─╮

┌───┬─────────────────┬────────┬───────────────────────────────────────────────┬──────────┐
│ # │ Step            │ Type   │ Command / Prompt                              │ On Fail  │
├───┼─────────────────┼────────┼───────────────────────────────────────────────┼──────────┤
│ 1 │ create-spec     │ krab   │ spec new task -n "{spec}"                    │ stop     │
│ 2 │ refine-spec     │ krab   │ spec refine spec.task.{spec}.md              │ stop     │
│ 3 │ risk-analysis   │ krab   │ analyze risk spec.task.{spec}.md             │ continue │
│ 4 │ optimize-spec   │ krab   │ optimize run spec.task.{spec}.md             │ continue │
│ 5 │ sync-agents     │ krab   │ agent sync all                               │ continue │
│ 6 │ implement       │ agent  │ Implement the feature described in the spe...│ stop     │
│ 7 │ run-tests       │ shell  │ uv run pytest                                │ continue │
│ 8 │ review          │ agent  │ Review the implementation against the spec...│ continue │
└───┴─────────────────┴────────┴───────────────────────────────────────────────┴──────────┘

Default agent: claude
```

---

## Passo 9: Usar Slash Commands no Claude Code

Apos executar `krab agent sync` (Passo 7), os slash commands ficam disponiveis nativamente no Claude Code. Voce pode usa-los diretamente na interface do agente sem precisar digitar comandos krab manualmente.

### Router Geral

O comando `/project:krab` aceita qualquer workflow por nome:

```
/project:krab implement spec.task.carrinho-de-compras.md
```

O agente recebe automaticamente:
- O contexto do projeto (tech stack, convencoes, constraints)
- Os passos do workflow em formato de instrucoes numeradas
- Os comandos `krab` que ele deve rodar no terminal
- As regras de execucao (gates, on_failure, Gherkin)

### Comandos Diretos por Workflow

Cada workflow tem seu proprio slash command para acesso direto:

```
# Implementar uma feature seguindo a spec
/project:krab-implement spec.task.carrinho-de-compras.md

# Review de codigo contra a spec
/project:krab-review spec.task.carrinho-de-compras.md

# Verificar qualidade da spec (todas as analises)
/project:krab-verify spec.task.carrinho-de-compras.md

# Ciclo completo de SDD
/project:krab-full-cycle carrinho-de-compras

# Criar uma nova spec e analisar
/project:krab-spec-create login-social

# Inicializar instrucoes de agentes
/project:krab-agent-init
```

### Exemplo Completo no Claude Code

```
> /project:krab-implement spec.task.carrinho-de-compras.md

O agente Claude Code vai:
1. Verificar que o arquivo spec.task.carrinho-de-compras.md existe (gate)
2. Rodar `krab analyze risk spec.task.carrinho-de-compras.md` no terminal
3. Rodar `krab agent sync all` no terminal
4. Ler a spec e implementar a feature seguindo os cenarios Gherkin
5. Rodar `uv run pytest` para verificar os testes
6. Reportar um resumo do que foi feito
```

### Uso no GitHub Copilot

Se voce sincronizou os arquivos para Copilot, tres superficies de integracao ficam disponiveis:

**1. Agent `@krab`** — No dropdown do chat:
```
@krab implementa a feature de carrinho de compras conforme a spec
```

**2. Prompts `/krab-*`** — Slash commands interativos:
```
/krab-implement     → pede o caminho da spec e executa
/krab-review        → pede o caminho da spec e faz code review
/krab-verify        → roda todas as checagens de qualidade
```

**3. Skills auto-loaded** — O Copilot carrega automaticamente as skills de `.github/skills/*/SKILL.md` quando o contexto e relevante.

:::tip Regenerando slash commands
Sempre que voce alterar a memoria do projeto ou adicionar workflows customizados, re-execute o sync para atualizar os slash commands:

```bash
krab agent sync
```

Ou para regenerar apenas os slash commands (sem recriar instrucoes):

```bash
krab workflow commands
```
:::

---

## Resumo dos Comandos Usados

Aqui esta a sequencia completa de comandos que executamos neste tutorial:

```bash
# 1. Inicializar memoria
krab memory init -n "ecommerce-api" -d "API REST para e-commerce"

# 2. Configurar tech stack
krab memory set tech_stack.backend "Python/FastAPI"
krab memory set tech_stack.database "PostgreSQL 15"
krab memory set architecture_style "hexagonal (ports & adapters)"
krab memory set conventions.commits "conventional commits"
krab memory set domain_terms.cart "Carrinho temporario do usuario"

# 3. Adicionar skills
krab memory add-skill Python -c language -v "3.11" -d "Backend principal"
krab memory add-skill FastAPI -c framework -v "0.104" -d "API REST async"

# 4. Gerar spec
krab spec new task -n "Carrinho de Compras" -d "CRUD de carrinho"

# 5. Analisar qualidade
krab analyze risk spec.task.carrinho-de-compras.md
krab analyze ambiguity spec.task.carrinho-de-compras.md
krab analyze readability spec.task.carrinho-de-compras.md
krab analyze tokens spec.task.carrinho-de-compras.md

# 6. Otimizar
krab optimize run spec.task.carrinho-de-compras.md -o spec.optimized.md

# 7. Sincronizar agentes + slash commands
krab agent sync

# 8. Executar workflow (dry-run primeiro, depois real)
krab workflow run implement --spec spec.task.carrinho-de-compras.md --dry-run
krab workflow run implement --spec spec.task.carrinho-de-compras.md --agent claude

# 9. No Claude Code, usar slash commands:
#    /project:krab-implement spec.task.carrinho-de-compras.md
```

---

## Proximos Passos

Agora que voce completou o Quick Start, explore estas areas:

- **Workflows customizados** — Crie seus proprios pipelines com `krab workflow new`
- **Analise em batch** — Processe todas as specs de uma vez com `krab analyze batch`
- **Busca em corpus** — Use `krab search bm25` para encontrar specs por relevancia
- **Budget optimizer** — Selecione as melhores specs para um budget de tokens com `krab search budget`
- **Delta encoding** — Compare versoes de specs com `krab diff versions`
- **Conversao de formatos** — Exporte specs como JSON/YAML com `krab convert auto`
