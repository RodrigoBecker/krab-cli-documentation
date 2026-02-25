---
sidebar_position: 2
title: Arquitetura
---

# Arquitetura

Este documento detalha a arquitetura interna do Krab CLI: estrutura de diretorios, dependencias entre modulos, fluxo de entrada, estrategias de lazy loading, camadas de cache e memory, e os patterns usados no template engine, workflow engine e agent generator.

---

## Stack Tecnologica

| Componente | Tecnologia | Versao | Funcao |
|-----------|------------|--------|--------|
| Linguagem | Python | >= 3.11 | Type hints modernas, StrEnum, `from __future__ import annotations` |
| CLI Framework | Typer | >= 0.12.0 | Parsing de argumentos, subcomandos, help automatico, completion |
| Terminal UI | Rich | >= 13.7.0 | Tabelas, paineis, syntax highlighting, cores |
| Fuzzy Matching | RapidFuzz | >= 3.6.0 | Matching de strings rapido em C++ |
| Token Counting | tiktoken | >= 0.7.0 | Contagem precisa de tokens (cl100k_base, o200k_base) |
| YAML | PyYAML | >= 6.0.1 | Serializacao de workflows e configuracoes |
| CLI Base | Click | >= 8.1.0 | Dependencia do Typer |
| Build System | Hatchling | — | Build backend para pyproject.toml |
| Testes | pytest | — | Framework de testes (20 arquivos, 364 testes) |
| Linter/Formatter | Ruff | — | Check + format (target Python 3.11) |

---

## Arvore de Diretorios

```
src/krab_cli/
├── __init__.py              # Versao do pacote (__version__ = "0.1.0")
├── cli.py                   # Entry point — todos os comandos Typer (2123 linhas)
│
├── core/                    # Algoritmos puros — sem I/O, sem Rich
│   ├── __init__.py
│   ├── ambiguity.py         # Detector de ambiguidade (dicionario + regex)
│   ├── bm25.py              # BM25 search index com ranking
│   ├── budget.py            # 0/1 Knapsack para budget de tokens
│   ├── chunking.py          # Comparacao de estrategias de split
│   ├── delta.py             # Delta encoding entre versoes de specs
│   ├── depgraph.py          # Grafo de dependencias entre specs
│   ├── entropy.py           # Shannon Entropy, Markov Chain, Perplexity
│   ├── fuzzy.py             # Fuzzy matching com RapidFuzz
│   ├── huffman.py           # Aliases inspirados em Huffman
│   ├── minhash.py           # MinHash + LSH para duplicatas em escala
│   ├── optimizer.py         # Pipeline unificado de otimizacao
│   ├── readability.py       # Flesch-Kincaid, Coleman-Liau, Gunning Fog, ARI
│   ├── risk.py              # Hallucination Risk Score (6 fatores)
│   ├── semantic.py          # RAKE, TextRank, Semantic Compression
│   ├── similarity.py        # Jaccard, Cosine, N-gram, TF-IDF, Quality Score
│   ├── substrings.py        # Suffix Array + LCP, N-gram Phrase Counter
│   └── tokens.py            # Contagem de tokens via tiktoken
│
├── converters/              # Conversao entre formatos
│   ├── __init__.py
│   ├── converter.py         # API de conversao (md2json, json2md, md2yaml, yaml2md, auto)
│   ├── md_builder.py        # Construtor de Markdown a partir de estrutura
│   └── md_parser.py         # Parser de Markdown para estrutura hierarquica
│
├── models/                  # Data models
│   ├── __init__.py
│   └── spec.py              # Modelo de spec (dataclass)
│
├── templates/               # Template engine — geracao de specs
│   ├── __init__.py          # ABC SpecTemplate, registry, build_context
│   ├── architecture.py      # Template spec.architecture
│   ├── plan.py              # Template spec.plan
│   ├── refining.py          # Template spec.refining (Tree-of-Thought)
│   ├── skill.py             # Template spec.skill
│   └── task.py              # Template spec.task
│
├── memory/                  # Persistencia de contexto do projeto
│   └── __init__.py          # MemoryStore, ProjectMemory, ProjectSkill (.sdd/)
│
├── agents/                  # Geracao de instruction files para agentes
│   └── __init__.py          # AgentGenerator ABC, registry, Claude/Copilot/Codex generators
│
├── workflows/               # Workflow engine — pipelines multi-step
│   ├── __init__.py          # WorkflowStep, Workflow, WorkflowRunner, StepResult, WorkflowResult
│   ├── builtins.py          # 6 workflows built-in (factories + registry)
│   ├── commands.py          # Gerador de slash commands para Claude Code + Copilot
│   └── executor.py          # Agent Executor (Claude, Codex, Copilot CLIs)
│
└── utils/                   # Utilitarios compartilhados
    ├── __init__.py
    ├── cache.py             # Cache de resultados em .sdd/cache/ (sha256 keys)
    └── display.py           # Rich console helpers (lazy loaded)
```

### Descricao dos Modulos

#### `cli.py` — Entry Point

Arquivo central com **todos** os comandos Typer. Define 10 sub-apps (`optimize_app`, `convert_app`, `analyze_app`, `search_app`, `diff_app`, `spec_app`, `memory_app`, `agent_app`, `cache_app`, `workflow_app`) e registra cada uma no `app` principal.

Cada funcao de comando importa suas dependencias **dentro do corpo da funcao** (lazy loading — veja secao abaixo).

#### `core/` — Algoritmos Puros

Todos os modulos em `core/` sao **funcoes puras** ou classes com logica de negocio sem side effects de I/O. Nenhum modulo em `core/` importa Rich, Typer, ou acessa o filesystem diretamente (exceto imports da stdlib). Isso garante:

- Testabilidade unitaria total
- Importacao rapida (sem overhead de Rich)
- Reusabilidade em outros contextos

#### `converters/` — Conversao de Formatos

Pipeline de conversao bidirecional entre Markdown, JSON e YAML:

```
Markdown ←→ Estrutura Hierarquica ←→ JSON/YAML
         md_parser                converter
         md_builder              converter
```

#### `templates/` — Template Engine

Sistema de templates para geracao de specs. Cada tipo de template e uma classe que estende `SpecTemplate` (ABC) e se registra automaticamente via decorator `@register_template`.

#### `memory/` — Persistencia

Gerencia o diretorio `.sdd/` com tres arquivos JSON:
- `memory.json` — contexto do projeto (nome, stack, convencoes, constraints)
- `skills.json` — skills do projeto (linguagens, frameworks, tools)
- `history.json` — historico de geracao de specs

#### `agents/` — Geracao de Instruction Files

Gera arquivos de instrucao otimizados para cada agente:
- `ClaudeCodeGenerator` → `CLAUDE.md`
- `CopilotGenerator` → `.github/copilot-instructions.md` + `.github/instructions/*.instructions.md`
- `CodexGenerator` → `AGENTS.md` + `.agents/skills/krab-workflow/SKILL.md`

#### `workflows/` — Workflow Engine

Motor de execucao de pipelines multi-step com 5 tipos de step (krab, shell, agent, gate, prompt).

#### `utils/` — Utilitarios

- `cache.py`: cache de resultados de analise em `.sdd/cache/` com invalidacao automatica por content hash
- `display.py`: helpers para Rich console (tabelas, paineis, metricas) com lazy loading

---

## Diagrama de Dependencias entre Modulos

```
                              cli.py
                                │
            ┌───────────┬───────┼───────┬───────────┬───────────┐
            ▼           ▼       ▼       ▼           ▼           ▼
        core/*      converters/  templates/   memory/     agents/    workflows/
            │                       │           │           │            │
            │                       ├───────────┘           │            │
            │                       │ (usa memory           │            │
            │                       │  para contexto)       │            │
            │                                               │            │
            │                                               ├────────────┤
            │                                               │ (agents usa│
            │                                               │  memory)   │
            │                                                            │
            │                                                            │
            │           ┌────────────────────────────────────────────────┤
            │           │ workflows/ usa:                                │
            │           │  - core/* (via krab commands)                  │
            │           │  - memory/ (para prompt building)              │
            │           │  - agents/ (indiretamente via agent sync)      │
            │           │  - builtins.py (workflow definitions)          │
            │           │  - executor.py (agent CLI execution)           │
            │           │  - commands.py (slash command generation)      │
            └───────────┘                                               │
         core/* e independente:                                         │
         - Nao importa Rich                                             │
         - Nao importa Typer                                            │
         - core/risk.py importa                                         │
           core/{ambiguity,entropy,                                     │
           readability,similarity}                                      │
                                                                        │
                                                                        │
         utils/display.py ◄──── cli.py (import em cada comando)         │
         utils/cache.py ◄────── cli.py (import em cada comando)         │
```

**Dependencias notaveis dentro de `core/`:**

```
core/risk.py ──────► core/ambiguity.py
                 ├──► core/entropy.py
                 ├──► core/readability.py
                 └──► core/similarity.py

core/optimizer.py ──► core/huffman.py
                  ├──► core/fuzzy.py
                  └──► core/similarity.py
```

O `core/risk.py` e o unico modulo core que importa outros modulos core (4 dependencias). Todos os outros modulos core sao independentes entre si.

---

## Fluxo do Entry Point

```
Terminal: krab analyze risk spec.task.auth.md
    │
    ▼
cli.py → app = typer.Typer()
    │
    ├── analyze_app = typer.Typer()
    │       │
    │       └── @analyze_app.command("risk")
    │           def analyze_risk(file, context_window, ...):
    │               │
    │               ├── _check_file(file)  # Valida existencia
    │               │
    │               ├── from krab_cli.core.risk import assess_hallucination_risk  # LAZY
    │               ├── from krab_cli.utils.display import print_header, ...       # LAZY
    │               │
    │               ├── report = assess_hallucination_risk(text, context_window)
    │               │       │
    │               │       ├── detect_ambiguity(text)
    │               │       ├── context_quality_score(text, context_window)
    │               │       ├── full_entropy_analysis(text)
    │               │       └── full_readability_analysis(text)
    │               │
    │               └── print_metrics_table("Risk Overview", {...})
    │                   print(table)  # Rich Table
    │
    └── app() → Typer dispatches to correct command
```

**Chave do fluxo:**

1. O usuario digita um comando no terminal
2. Typer parseia argumentos e despacha para a funcao correta
3. A funcao importa **lazy** as dependencias pesadas
4. Chama os algoritmos em `core/` (funcoes puras)
5. Formata a saida com helpers de `utils/display.py` (Rich)

---

## Estrategia de Lazy Loading

O Krab CLI usa **lazy imports** estrategicos para manter o tempo de startup rapido. A logica:

### Rich — Lazy Loading no Display

O modulo `utils/display.py` usa um padrao singleton com lazy initialization:

```python
# utils/display.py
_console: Console | None = None

def get_console() -> Console:
    global _console
    if _console is None:
        from rich.console import Console as _RichConsole  # Lazy! ~90ms economizados
        from rich.theme import Theme
        _console = _RichConsole(theme=Theme(_KRAB_THEME_DICT))
    return _console
```

Rich so e importado quando o primeiro output formatado e necessario. O custo de import do Rich (~90ms) e pago apenas uma vez e apenas quando necessario.

### Modulos de Analise — Lazy Loading por Comando

Cada funcao de comando em `cli.py` importa suas dependencias de `core/` dentro do corpo da funcao:

```python
@analyze_app.command("entropy")
def analyze_entropy(file, ...):
    # Imports DENTRO da funcao, nao no topo do arquivo
    from krab_cli.core.entropy import full_entropy_analysis  # So carrega se este comando executar
    from krab_cli.utils.display import print_header, print_metrics_table
    ...
```

**Beneficio**: ao executar `krab optimize run`, os modulos de `entropy.py`, `readability.py`, `bm25.py`, etc. **nunca sao importados**. Apenas `huffman.py`, `fuzzy.py` e `similarity.py` sao carregados.

### Template Imports — Registration on Import

Templates usam um pattern diferente — sao importados explicitamente para triggerar o decorator `@register_template`:

```python
@spec_app.command("new")
def spec_new(...):
    import krab_cli.templates.architecture  # Trigger @register_template
    import krab_cli.templates.plan
    import krab_cli.templates.refining
    import krab_cli.templates.skill
    import krab_cli.templates.task
    from krab_cli.templates import get_template
    ...
```

---

## Camada de Cache

**Localizacao**: `.sdd/cache/`

O cache armazena resultados de analises para evitar recomputacao de arquivos inalterados.

### Mecanismo

```
Input: texto da spec + nome do comando + parametros
           │
           ▼
content_hash = sha256(texto)
cache_key = sha256(content_hash + ":" + command + ":" + sorted_params)[:24]
           │
           ▼
.sdd/cache/{cache_key}.json
```

**Formato do arquivo cacheado:**

```json
{
  "_content_hash": "abc123...",
  "_command": "analyze_tokens",
  "_params": {"encoding": "cl100k_base"},
  "result": {
    "summary": {"tokens": 1234, ...},
    "cost": {"total_cost_usd": 0.0037, ...}
  }
}
```

### Invalidacao

A invalidacao e **automatica por content hash**. Se o conteudo da spec muda, o hash muda, e o cache miss forca recomputacao. Nao ha TTL — o cache e valido indefinidamente enquanto o conteudo nao mudar.

### Atomicidade

Writes usam **atomic write** (write to temp file + rename) para evitar corrupcao:

```python
fd, tmp_path = tempfile.mkstemp(dir=cache_dir, suffix=".tmp")
# Write to temp...
Path(tmp_path).replace(cache_file)  # Atomic rename
```

### Comandos de Cache

```bash
krab cache stats    # Mostra contagem de entradas e tamanho em disco
krab cache clear    # Remove todos os arquivos cacheados
```

### Opt-out

Todos os comandos de analise aceitam `--no-cache` para forcar recomputacao:

```bash
krab analyze tokens spec.md --no-cache
```

---

## Camada de Memory

**Localizacao**: `.sdd/`

A memory layer armazena o **contexto persistente do projeto** — informacoes que templates, agent generators e workflows usam para produzir output contextualizado.

### Estrutura de Arquivos

```
.sdd/
├── memory.json     # Contexto do projeto (ProjectMemory)
├── skills.json     # Skills registradas (list[ProjectSkill])
├── history.json    # Historico de geracao de specs
├── cache/          # Cache de analises (veja secao acima)
│   ├── a1b2c3....json
│   └── d4e5f6....json
└── workflows/      # Workflows customizados (YAML)
    ├── deploy-prep.yaml
    └── hotfix.yaml
```

### ProjectMemory (memory.json)

```json
{
  "project_name": "meu-app",
  "description": "API de autenticacao",
  "tech_stack": {
    "backend": "Python 3.11",
    "framework": "FastAPI",
    "db": "PostgreSQL"
  },
  "architecture_style": "hexagonal",
  "conventions": {
    "naming": "snake_case",
    "test": "pytest + fixtures"
  },
  "domain_terms": {
    "tenant": "Organizacao cliente no sistema multi-tenant"
  },
  "team_context": {},
  "integrations": ["Stripe", "SendGrid"],
  "constraints": ["sem dependencias nao-auditadas", "coverage >= 80%"],
  "decisions": [],
  "created_at": "2025-01-15T10:30:00+00:00",
  "updated_at": "2025-02-20T14:22:00+00:00"
}
```

### Fluxo de Dados

```
krab memory init ──► Cria .sdd/memory.json
krab memory set  ──► Atualiza campos (dot notation: tech_stack.backend)
        │
        ▼
templates/ ◄── MemoryStore.load_memory() ──► project context em specs geradas
agents/    ◄── MemoryStore.load_memory() ──► instruction files contextualizados
workflows/ ◄── MemoryStore.load_memory() ──► prompts de agent enriquecidos
```

---

## Template Engine

### Pattern: Registry com ABC

```python
# templates/__init__.py

class SpecTemplate(ABC):
    template_type: str = ""
    description: str = ""

    @abstractmethod
    def render(self, ctx: TemplateContext) -> str: ...

    def suggested_filename(self, ctx: TemplateContext) -> str:
        return f"spec.{self.template_type}.{ctx.slug}.md"

_REGISTRY: dict[str, type[SpecTemplate]] = {}

def register_template(cls):
    _REGISTRY[cls.template_type] = cls
    return cls

def get_template(template_type: str) -> SpecTemplate:
    return _REGISTRY[template_type]()
```

### Tipos Registrados

| Template | Classe | Arquivo Gerado |
|----------|--------|----------------|
| `task` | `TaskTemplate` | `spec.task.<slug>.md` |
| `architecture` | `ArchitectureTemplate` | `spec.architecture.<slug>.md` |
| `plan` | `PlanTemplate` | `spec.plan.<slug>.md` |
| `skill` | `SkillTemplate` | `spec.skill.<slug>.md` |
| `refining` | `RefiningTemplate` | `spec.refining.<slug>.md` |

### Fluxo de Rendering

```
TemplateContext(name, description, memory, skills_block, extra)
        │
        ▼
template.render(ctx)
        │
        ├── template._header(ctx)          # YAML frontmatter
        ├── template._project_context(ctx)  # Bloco de contexto do memory
        └── <corpo especifico do template>  # Secoes, cenarios, placeholders
        │
        ▼
String Markdown completa → spec.task.<slug>.md
```

---

## Workflow Engine

### Arquitetura de Classes

```
WorkflowStep           # Um unico step no pipeline
  ├── name: str
  ├── type: StepType   # KRAB | SHELL | AGENT | GATE | PROMPT
  ├── command: str
  ├── prompt: str
  ├── agent: str
  ├── condition: str
  └── on_failure: OnFailure  # STOP | CONTINUE

Workflow               # Definicao completa do workflow
  ├── name: str
  ├── description: str
  ├── default_agent: str
  ├── steps: list[WorkflowStep]
  ├── to_yaml() / from_yaml()
  └── save() / load()

StepResult             # Resultado de um step
  ├── step_name: str
  ├── success: bool
  ├── output: str
  ├── skipped: bool
  └── error: str

WorkflowResult         # Resultado do workflow inteiro
  ├── workflow_name: str
  ├── success: bool
  ├── steps: list[StepResult]
  ├── completed_count
  ├── failed_count
  └── skipped_count

WorkflowRunner         # Executor do pipeline
  ├── root: Path
  ├── spec: str
  ├── agent: str
  ├── dry_run: bool
  ├── on_step: callback
  └── run(workflow) -> WorkflowResult
```

### Fluxo de Execucao

```
krab workflow run implement --spec spec.task.auth.md --agent claude
        │
        ▼
WorkflowRunner(spec="spec.task.auth.md", agent="claude")
        │
        ├── _build_context(workflow)
        │   → context = {"spec": "spec.task.auth.md", "agent": "claude", "root": "/path"}
        │
        └── run(workflow)
            │
            for step in workflow.steps:
            │
            ├── resolve_variables(step.command, context)
            │   "analyze risk {spec}" → "analyze risk spec.task.auth.md"
            │
            ├── handlers[step.type](step, context)
            │   │
            │   ├── GATE: _evaluate_gate(condition) → bool
            │   │         file_exists:spec.task.auth.md → True/False
            │   │
            │   ├── KRAB: shutil.which("krab") + command → subprocess
            │   │
            │   ├── SHELL: command → subprocess(shell=True)
            │   │
            │   ├── AGENT: AgentExecutor.execute()
            │   │         → build_agent_prompt(task, spec, root)
            │   │         → _exec_claude(prompt) / _exec_codex() / _exec_copilot()
            │   │         → subprocess([claude, -p, prompt])
            │   │
            │   └── PROMPT: input() → StepResult
            │
            ├── on_step(step, result)  # callback para UI
            │
            └── if !result.success && on_failure == STOP:
                    break  # Para o pipeline
```

---

## Agent Generator

### Pattern: ABC com Registry

```python
# agents/__init__.py

class AgentGenerator(ABC):
    agent_name: str = ""

    @abstractmethod
    def generate(self, ctx: AgentContext, root: Path) -> list[tuple[Path, str]]: ...

    def write(self, ctx: AgentContext, root: Path) -> list[Path]:
        files = self.generate(ctx, root)
        for path, content in files:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
        return [path for path, _ in files]

GENERATORS = {
    "claude":  ClaudeCodeGenerator,
    "copilot": CopilotGenerator,
    "codex":   CodexGenerator,
}
```

### Geradores Registrados

| Agente | Classe | Arquivos Gerados |
|--------|--------|-----------------|
| Claude Code | `ClaudeCodeGenerator` | `CLAUDE.md` |
| Copilot | `CopilotGenerator` | `.github/copilot-instructions.md`, `.github/instructions/krab-specs.instructions.md` |
| Codex | `CodexGenerator` | `AGENTS.md`, `.agents/skills/krab-workflow/SKILL.md` |

### Fluxo de Geracao

```
krab agent sync all
        │
        ▼
collect_context(root)
        │
        ├── MemoryStore(root).load_memory()  → ProjectMemory
        ├── MemoryStore(root).load_skills()  → list[ProjectSkill]
        ├── glob("spec.*.md")                → spec_files
        ├── _detect_commands(root)           → commands dict (pyproject.toml, package.json)
        └── _build_structure_hint(root)      → directory listing
        │
        ▼
AgentContext(project_name, tech_stack, conventions, spec_files, commands, ...)
        │
        ├── ClaudeCodeGenerator.generate(ctx, root)  → [(CLAUDE.md, content)]
        ├── CopilotGenerator.generate(ctx, root)     → [(copilot-instructions.md, ...), ...]
        └── CodexGenerator.generate(ctx, root)       → [(AGENTS.md, ...), (SKILL.md, ...)]
```

---

## Estrutura de Testes

**20 arquivos de teste** com **364 testes** no total:

```
tests/
├── conftest.py              # Fixtures compartilhadas (sample texts, temp dirs)
├── test_agents.py           # Agent generators (Claude, Copilot, Codex)
├── test_cache.py            # Cache layer (get, put, clear, stats, invalidation)
├── test_cli.py              # Testes de CLI integration (Typer CliRunner)
├── test_cli_new.py          # Testes do 'krab spec new' e templates
├── test_cli_spec.py         # Testes de spec commands
├── test_commands.py         # Slash command generator (Claude + Copilot)
├── test_converters.py       # Conversao md/json/yaml
├── test_fuzzy.py            # Fuzzy matching (ratio, partial, token_sort, weighted)
├── test_huffman.py          # Huffman aliases (frequency, tree, compression)
├── test_memory.py           # Memory store (init, set, skills, history)
├── test_optimizer.py        # Optimization pipeline (dedup + compress)
├── test_similarity.py       # Jaccard, Cosine, N-gram, TF-IDF, Quality Score
├── test_templates.py        # Template registry e rendering
├── test_wave1.py            # Wave 1: entropy, readability, ambiguity, substrings
├── test_wave2.py            # Wave 2: BM25, MinHash, budget, delta, depgraph, chunking
├── test_wave3.py            # Wave 3: semantic (RAKE, TextRank), risk score
└── test_workflows.py        # Workflow engine (steps, runner, builtins, YAML serde)
```

### Executar Testes

```bash
# Todos os testes
uv run pytest

# Com output verbose
uv run pytest -v --tb=short --color=yes

# Um arquivo especifico
uv run pytest tests/test_workflows.py

# Um teste especifico
uv run pytest tests/test_wave1.py::test_shannon_entropy_basic

# Com coverage
uv run pytest --cov=src/krab_cli --cov-report=term-missing
```

### Lint e Format

```bash
# Check lint
uv run ruff check src/ tests/

# Auto-fix
uv run ruff check src/ tests/ --fix

# Format
uv run ruff format src/ tests/
```

### Configuracao (pyproject.toml)

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["src"]
addopts = "-v --tb=short --color=yes"

[tool.ruff]
target-version = "py311"
line-length = 100
src = ["src", "tests"]

[tool.ruff.lint]
select = ["E", "W", "F", "I", "N", "UP", "B", "SIM", "TCH", "RUF"]
ignore = ["E501"]
```
