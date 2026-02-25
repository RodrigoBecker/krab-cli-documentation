---
slug: /
sidebar_position: 1
title: Introducao
---

# Krab CLI

```
██╗  ██╗██████╗  █████╗ ██████╗      ██████╗██╗     ██╗
██║ ██╔╝██╔══██╗██╔══██╗██╔══██╗    ██╔════╝██║     ██║
█████╔╝ ██████╔╝███████║██████╔╝    ██║     ██║     ██║
██╔═██╗ ██╔══██╗██╔══██║██╔══██╗    ██║     ██║     ██║
██║  ██╗██║  ██║██║  ██║██████╔╝    ╚██████╗███████╗██║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝      ╚═════╝╚══════╝╚═╝
```

**Toolkit CLI para Spec-Driven Development (SDD)** — otimize, analise, converta e gere especificacoes para agentes de IA com foco em economia de tokens e qualidade de contexto.

---

## O que e o Krab CLI?

O Krab CLI e uma ferramenta de linha de comando projetada para desenvolvedores que trabalham com agentes de IA como Claude Code, GitHub Copilot e OpenAI Codex. Ele resolve um problema fundamental: **como garantir que as especificacoes enviadas aos agentes sejam precisas, concisas e otimizadas para a janela de contexto**.

Em vez de copiar e colar specs manualmente, o Krab CLI oferece:

- **Analise profunda** da qualidade de specs com 25 algoritmos especializados
- **Otimizacao automatica** para reduzir o consumo de tokens sem perda de informacao
- **Geracao de specs** a partir de templates padronizados (task, architecture, plan, skill, refining)
- **Integracao nativa** com agentes de IA via slash commands e arquivos de instrucao
- **Workflows completos** que encadeiam criacao, analise, otimizacao e delegacao para agentes

O objetivo final e simples: **enviar o maximo de informacao relevante no minimo de tokens possivel**, reduzindo o risco de alucinacao e aumentando a qualidade do codigo gerado.

---

## O que e Spec-Driven Development (SDD)?

**Spec-Driven Development** e uma metodologia onde a especificacao (spec) e a fonte unica da verdade — nao o codigo, nao o ticket, nao a conversa no Slack.

### A spec e o contrato

Em SDD, toda feature, toda mudanca arquitetural e toda decisao tecnica comeca com uma spec escrita em Markdown estruturado. A spec define:

| Aspecto | O que a spec contém |
|---------|---------------------|
| **O que construir** | Cenarios Gherkin (Given/When/Then) como criterios de aceitacao |
| **Como validar** | Criterios de aceitacao mensuraveis e verificaveis |
| **Restricoes** | Constraints arquiteturais, de performance, de seguranca |
| **Dominio** | Termos de dominio com definicoes precisas (Ubiquitous Language) |
| **Dependencias** | Referencias cruzadas entre specs e modulos |

### O ciclo SDD

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Criar Spec │────>│  Refinar &   │────>│  Otimizar    │
│  (template) │     │  Analisar    │     │  (tokens)    │
└─────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
                                                 v
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Review     │<────│  Implementar │<────│  Sync Agent  │
│  (agente)   │     │  (agente)    │     │  (instrucoes)│
└─────────────┘     └──────────────┘     └──────────────┘
```

1. **Criar spec** — Gerar spec a partir de template (`krab spec new task`)
2. **Refinar & analisar** — Verificar risco, ambiguidade, legibilidade (`krab analyze risk`)
3. **Otimizar** — Comprimir termos repetidos, remover duplicatas (`krab optimize run`)
4. **Sync agent** — Gerar instrucoes e slash commands para o agente (`krab agent sync`)
5. **Implementar** — O agente de IA implementa seguindo a spec como contrato
6. **Review** — O agente revisa a implementacao contra a spec

### Por que SDD funciona com agentes de IA?

Agentes de IA tem uma janela de contexto limitada. Cada token conta. Uma spec vaga com termos ambiguos como "etc", "TBD" ou "various" aumenta drasticamente o risco de alucinacao. SDD resolve isso:

- **Specs estruturadas** — formato previsivel que agentes entendem consistentemente
- **Gherkin como contrato** — cenarios Given/When/Then servem como testes de aceitacao automaticos
- **Termos definidos** — domain terms eliminam ambiguidade
- **Otimizacao de tokens** — mais informacao relevante cabe na janela de contexto

---

## Features Principais

### 25 Algoritmos de Analise e Otimizacao

O Krab CLI implementa 25 algoritmos especializados em analise de texto, otimizacao e busca:

| # | Algoritmo | Modulo | Finalidade |
|---|-----------|--------|------------|
| 1 | **Huffman-inspired Aliases** | `core/huffman.py` | Compressao de termos repetidos em aliases curtos |
| 2 | **Fuzzy Matching** (RapidFuzz) | `core/fuzzy.py` | Deteccao de secoes duplicadas e near-duplicates |
| 3 | **Jaccard Similarity** | `core/similarity.py` | Comparacao baseada em conjuntos de termos |
| 4 | **Cosine Similarity (TF)** | `core/similarity.py` | Similaridade vetorial por frequencia de termos |
| 5 | **N-gram Overlap** | `core/similarity.py` | Similaridade estrutural por bigramas |
| 6 | **TF-IDF Cosine** | `core/similarity.py` | Similaridade ponderada pela importancia no corpus |
| 7 | **Context Quality Score** | `core/similarity.py` | Densidade informacional e uso da janela de contexto |
| 8 | **Shannon Entropy** | `core/entropy.py` | Conteudo informacional real — identifica redundancia |
| 9 | **Markov Chain (ordem 1-2)** | `core/entropy.py` | Previsibilidade do texto — detecta boilerplate |
| 10 | **Perplexity estimada** | `core/entropy.py` | Quao "surpreendente" o texto e para um modelo |
| 11 | **Flesch-Kincaid / Gunning Fog** | `core/readability.py` | Legibilidade — complexidade aumenta alucinacao |
| 12 | **Coleman-Liau / ARI** | `core/readability.py` | Legibilidade baseada em caracteres |
| 13 | **Ambiguity Detector** | `core/ambiguity.py` | Detecta termos vagos (etc, TBD, approximately) |
| 14 | **Suffix Array + LCP** | `core/substrings.py` | Substrings repetidos exatos de qualquer tamanho |
| 15 | **N-gram Phrase Counter** | `core/substrings.py` | Frases repetidas multi-palavra |
| 16 | **0/1 Knapsack** | `core/budget.py` | Selecao otima de secoes dentro de um budget de tokens |
| 17 | **MinHash + LSH** | `core/minhash.py` | Deteccao escalavel de near-duplicates em O(n) |
| 18 | **BM25 Ranking** | `core/bm25.py` | Busca ranqueada por relevancia (superior ao TF-IDF) |
| 19 | **Delta Encoding** | `core/delta.py` | Diff compacto entre versoes de specs |
| 20 | **Dependency Graph** | `core/depgraph.py` | Grafo de referencias cruzadas entre specs |
| 21 | **Chunking Analyzer** | `core/chunking.py` | Comparacao de estrategias de split para contexto |
| 22 | **RAKE** | `core/semantic.py` | Extracao de keywords (Rapid Automatic Keyword Extraction) |
| 23 | **TextRank** | `core/semantic.py` | Sentencas mais importantes via PageRank |
| 24 | **Semantic Compression** | `core/semantic.py` | Compressao semantica preservando conceitos-chave |
| 25 | **Hallucination Risk Score** | `core/risk.py` | Score combinado de risco de alucinacao do agente |

### 5 Tipos de Template para Geracao de Specs

| Template | Finalidade | Saida |
|----------|-----------|-------|
| **task** | Feature/tarefa com cenarios Gherkin (Given/When/Then) | `spec.task.<nome>.md` |
| **architecture** | Arquitetura com diagramas C4, ADRs e topologia | `spec.architecture.<nome>.md` |
| **plan** | Plano de implementacao com fases, Gantt e riscos | `spec.plan.<nome>.md` |
| **skill** | Definicao de skills/capacidades tecnicas do projeto | `spec.skill.<nome>.md` |
| **refining** | Refinamento Tree-of-Thought com analise multi-dimensional | `spec.refining.<nome>.md` |

Cada template injeta automaticamente o **contexto do projeto** (tech stack, convencoes, termos de dominio) a partir da memoria persistente em `.sdd/`.

### Workflow Engine com 6 Pipelines Built-in

O workflow engine encadeia operacoes de spec, analise, otimizacao e delegacao para agentes de IA reais:

| Workflow | Steps | Descricao |
|----------|-------|-----------|
| **spec-create** | 4 | Cria spec → refine → analyze risk → sync agents |
| **implement** | 5 | Gate → risk check → sync → delega ao agente → testa |
| **review** | 3 | Gate → ambiguity check → agente revisa codigo vs spec |
| **full-cycle** | 8 | Cria → refine → risk → optimize → sync → implementa → testa → review |
| **verify** | 6 | Risk + ambiguity + readability + entropy + refine |
| **agent-init** | 3 | Checa memory → sync todos → status |

Workflows suportam 5 tipos de step: `krab` (comando interno), `shell` (qualquer comando), `agent` (delega ao AI), `gate` (condicao/barreira), `prompt` (interacao com usuario). Voce tambem pode criar workflows customizados via YAML.

### Agent Executor para Claude Code, Codex e Copilot

O executor de agentes integra diretamente com as CLIs dos agentes:

| Agente | Comando executado | Pre-requisito |
|--------|-------------------|---------------|
| **Claude Code** | `claude -p "<prompt com spec + contexto>"` | `npm i -g @anthropic-ai/claude-code` |
| **Codex** | `codex exec "<prompt>"` | `npm i -g codex` |
| **Copilot** | `gh issue create --body "<prompt>" --label copilot` | `gh` CLI + auth |

O prompt enviado ao agente inclui automaticamente: conteudo da spec, nome do projeto, tech stack, constraints e instrucoes de implementacao.

### Slash Command Generator

O Krab CLI gera automaticamente arquivos de slash commands no formato nativo de cada agente. Isso transforma os workflows em comandos que voce pode chamar diretamente no agente:

- **Claude Code**: `/project:krab-implement spec.task.auth.md`
- **Copilot Agent**: `@krab implementa a feature de autenticacao`
- **Copilot Prompts**: `/krab-implement` no chat
- **Cross-agent Skills**: `.github/skills/*/SKILL.md` (carregado automaticamente)

### Project Memory System (`.sdd/`)

O sistema de memoria persistente armazena contexto do projeto em `.sdd/`:

```
.sdd/
├── memory.json    # Tech stack, convencoes, termos de dominio, constraints
├── skills.json    # Skills/capacidades tecnicas registradas
├── history.json   # Historico de geracao de specs
├── cache/         # Cache de resultados de analise (SHA-256)
└── workflows/     # Workflows customizados (YAML)
```

Esse contexto e injetado automaticamente na geracao de specs, instrucoes de agentes e slash commands.

### Cache System

Resultados de analise (`tokens`, `quality`, `entropy`, `readability`, `freq`) sao cacheados em `.sdd/cache/` usando hash SHA-256 do conteudo. Se o arquivo nao mudou, a analise retorna instantaneamente. O batch mode (`krab analyze batch`) processa multiplos arquivos em uma unica invocacao, evitando o custo de startup do Python para cada arquivo.

| Cenario | Sem cache | Com cache | Ganho |
|---------|-----------|-----------|-------|
| `analyze tokens` (100KB) | 878ms | 405ms | 54% |
| `analyze readability` (100KB) | 657ms | 386ms | 41% |
| 10 arquivos individuais vs batch | 8097ms | 435ms | 18.6x |

---

## 48 Comandos em 10 Grupos

O Krab CLI organiza seus comandos em 10 grupos logicos:

| Grupo | Comandos | Descricao |
|-------|----------|-----------|
| **`krab optimize`** | `run`, `aliases`, `dedup` | Otimizacao de specs para eficiencia de tokens |
| **`krab convert`** | `md2json`, `json2md`, `md2yaml`, `yaml2md`, `auto` | Conversao entre Markdown, JSON e YAML |
| **`krab analyze`** | `tokens`, `quality`, `compare`, `freq`, `entropy`, `readability`, `ambiguity`, `substrings`, `risk`, `chunking`, `keywords`, `batch` | Analise completa de qualidade e metricas |
| **`krab search`** | `bm25`, `duplicates`, `budget` | Busca, indexacao e otimizacao de budget |
| **`krab diff`** | `versions`, `sections` | Delta encoding entre versoes de specs |
| **`krab spec`** | `new`, `refine`, `list` | Geracao de specs via templates |
| **`krab memory`** | `init`, `show`, `set`, `skills`, `add-skill`, `remove-skill`, `history` | Memoria persistente do projeto |
| **`krab agent`** | `sync`, `preview`, `status`, `diff` | Instrucoes para agentes de IA |
| **`krab cache`** | `stats`, `clear` | Gerenciamento de cache de analise |
| **`krab workflow`** | `list`, `show`, `run`, `new`, `export`, `agents-check`, `commands` | Pipelines multi-step com agentes |

---

## Agentes Suportados

| Agente | Arquivo de Instrucao | Slash Commands | Formato |
|--------|---------------------|----------------|---------|
| **Claude Code** | `CLAUDE.md` | `.claude/commands/krab-*.md` | Conciso, progressive disclosure |
| **GitHub Copilot** | `.github/copilot-instructions.md` | `.github/prompts/krab-*.prompt.md`, `.github/agents/krab.agent.md` | Statements curtos, contextuais |
| **OpenAI Codex** | `AGENTS.md` | `.agents/skills/krab-workflow/SKILL.md` | Hierarquico, com skills |

---

## Features at a Glance

| Feature | Descricao | Exemplo |
|---------|-----------|---------|
| Compressao Huffman | Substitui termos frequentes por aliases curtos | `krab optimize run spec.md` |
| Deduplicacao Fuzzy | Remove secoes duplicadas/similares | `krab optimize dedup spec.md` |
| Contagem de Tokens | Conta tokens com tiktoken (cl100k_base, o200k_base) | `krab analyze tokens spec.md` |
| Risco de Alucinacao | Score combinado de risco (0-100) | `krab analyze risk spec.md` |
| Deteccao de Ambiguidade | Encontra termos vagos (etc, TBD, various) | `krab analyze ambiguity spec.md` |
| Entropia de Shannon | Mede conteudo informacional real | `krab analyze entropy spec.md` |
| Legibilidade | Flesch-Kincaid, Gunning Fog, Coleman-Liau, ARI | `krab analyze readability spec.md` |
| Busca BM25 | Busca ranqueada em corpus de specs | `krab search bm25 ./specs/ -q "auth"` |
| Near-Duplicates | MinHash + LSH escalavel para grandes corpus | `krab search duplicates ./specs/` |
| Budget Optimizer | Seleciona specs otimas para um budget de tokens (Knapsack) | `krab search budget ./specs/ --budget 16384` |
| Delta Encoding | Diff compacto entre versoes de specs | `krab diff versions v1.md v2.md` |
| Templates SDD | 5 templates com injecao de contexto | `krab spec new task -n "Login"` |
| Refinamento Tree-of-Thought | Analise multi-dimensional com plano de melhoria | `krab spec refine spec.task.login.md` |
| Workflows | Pipelines multi-step com delegacao a agentes | `krab workflow run implement --spec spec.md` |
| Slash Commands Nativos | Gera comandos no formato de cada agente | `krab workflow commands` |
| Memoria do Projeto | Contexto persistente em `.sdd/` | `krab memory init` |
| Analise em Batch | Processa multiplos arquivos de uma vez | `krab analyze batch ./specs/ -a risk` |
| Conversao de Formatos | Markdown, JSON, YAML bidirecional | `krab convert auto spec.md --to json` |
| Keywords RAKE/TextRank | Extracao de termos-chave | `krab analyze keywords spec.md` |
| Chunking Strategies | Compara estrategias de split para contexto | `krab analyze chunking spec.md` |

---

## Informacoes do Projeto

| | |
|---|---|
| **Versao** | 0.1.0 |
| **Python** | 3.11+ |
| **Licenca** | MIT |
| **Stack** | Typer, Rich, RapidFuzz, tiktoken, PyYAML |
| **Build** | Hatchling |
| **Testes** | pytest (364 testes) |
| **Lint** | Ruff |
| **Autor** | Becker |

---

## Proximos Passos

- [Instalacao](./instalacao) — Como instalar o Krab CLI
- [Quick Start](./quick-start) — Tutorial passo a passo do zero ao primeiro workflow
