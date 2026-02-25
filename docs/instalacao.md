---
sidebar_position: 2
title: Instalacao
---

# Instalacao

Este guia cobre todas as formas de instalar o Krab CLI, verificar a instalacao e configurar shell completion.

---

## Pre-requisitos

### Python 3.11+

O Krab CLI requer **Python 3.11 ou superior**. Verifique sua versao:

```bash
python --version
# Python 3.11.x ou superior
```

Se voce usa `python3` em vez de `python`:

```bash
python3 --version
```

:::warning Python 3.10 ou inferior
O Krab CLI usa features de Python 3.11+ como `type union` com `X | Y` syntax, `tomllib` e melhorias em `dataclasses`. Versoes anteriores **nao sao suportadas** e resultarao em `SyntaxError` no import.
:::

### pip ou pipx

Voce precisa de pelo menos um gerenciador de pacotes Python:

- **pipx** (recomendado) — Instala CLIs Python em ambientes isolados
- **pip** — Gerenciador padrao do Python
- **uv** — Gerenciador moderno e rapido (para desenvolvimento)

Para instalar o pipx caso nao tenha:

```bash
# No Ubuntu/Debian
sudo apt install pipx
pipx ensurepath

# No macOS com Homebrew
brew install pipx
pipx ensurepath

# Via pip (qualquer OS)
pip install --user pipx
pipx ensurepath
```

---

## Metodos de Instalacao

### Via pipx (Recomendado)

O [pipx](https://pipx.pypa.io/) instala o Krab CLI em um ambiente virtual isolado, sem interferir em outros pacotes Python do sistema.

**A partir do diretorio do projeto (desenvolvimento local):**

```bash
pipx install -e .
```

**A partir do PyPI (quando publicado):**

```bash
pipx install krab-cli
```

Apos a instalacao, o comando `krab` fica disponivel globalmente em qualquer diretorio:

```bash
krab --version
```

:::tip Por que pipx?
O pipx cria um virtualenv isolado para cada CLI instalada. Isso significa que as dependencias do Krab CLI (Typer, Rich, RapidFuzz, tiktoken, PyYAML) nunca vao conflitar com outros pacotes do seu sistema. E a forma mais segura de instalar CLIs Python.
:::

### Via pip

Se preferir usar pip diretamente (nao recomendado para instalacao global):

**A partir do diretorio do projeto:**

```bash
pip install -e .
```

**A partir do PyPI (quando publicado):**

```bash
pip install krab-cli
```

:::warning Instalacao com pip
Usar `pip install` sem virtualenv instala as dependencias globalmente, o que pode causar conflitos com outros pacotes. Prefira pipx ou use um virtualenv dedicado.
:::

### Modo de Desenvolvimento com uv

Para contribuir com o projeto ou desenvolver features, use o [uv](https://docs.astral.sh/uv/) para gerenciar o ambiente:

```bash
# 1. Clone o repositorio
git clone <url-do-repositorio>
cd krab-cli

# 2. Sincronize as dependencias (cria .venv automaticamente)
uv sync

# 3. Execute comandos via uv run
uv run krab --version
```

O `uv sync` faz tudo automaticamente:
- Cria um virtualenv em `.venv/`
- Instala todas as dependencias do `pyproject.toml`
- Instala o pacote `krab-cli` em modo editavel

Para rodar testes e lint no modo de desenvolvimento:

```bash
# Testes (364 testes)
uv run pytest

# Lint
uv run ruff check src/ tests/

# Formatacao
uv run ruff format src/ tests/
```

:::info uv vs pip vs pipx
| Ferramenta | Caso de uso | Velocidade |
|------------|-------------|------------|
| **pipx** | Instalar CLI para uso diario | Media |
| **pip** | Instalar em virtualenv existente | Media |
| **uv** | Desenvolvimento do projeto | Muito rapida |

O `uv` e 10-100x mais rapido que o pip para resolver e instalar dependencias, o que faz diferenca durante o desenvolvimento.
:::

---

## Verificando a Instalacao

Apos a instalacao, verifique que tudo esta funcionando:

```bash
# Verifica versao (exibe ASCII art logo)
krab --version
```

Saida esperada:

```
██╗  ██╗██████╗  █████╗ ██████╗      ██████╗██╗     ██╗
██║ ██╔╝██╔══██╗██╔══██╗██╔══██╗    ██╔════╝██║     ██║
█████╔╝ ██████╔╝███████║██████╔╝    ██║     ██║     ██║
██╔═██╗ ██╔══██╗██╔══██║██╔══██╗    ██║     ██║     ██║
██║  ██╗██║  ██║██║  ██║██████╔╝    ╚██████╗███████╗██║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝      ╚═════╝╚══════╝╚═╝

v0.1.0
```

Teste um comando basico:

```bash
# Lista os templates de spec disponiveis
krab spec list
```

Teste a ajuda de qualquer grupo de comandos:

```bash
# Ajuda geral
krab --help

# Ajuda de um grupo especifico
krab analyze --help

# Ajuda de um comando especifico
krab analyze risk --help
```

---

## Alias `sdd`

O Krab CLI tambem pode ser invocado usando o alias `sdd` para compatibilidade retroativa. Se o alias estiver configurado no seu sistema:

```bash
sdd --version
sdd analyze tokens spec.md
sdd workflow run implement --spec spec.md
```

:::info Configurando o alias manualmente
Se o alias `sdd` nao estiver disponivel automaticamente, voce pode cria-lo no seu shell:

**Bash** (`~/.bashrc`):
```bash
alias sdd='krab'
```

**Zsh** (`~/.zshrc`):
```bash
alias sdd='krab'
```

**Fish** (`~/.config/fish/config.fish`):
```fish
alias sdd='krab'
```

Apos adicionar, recarregue o shell:
```bash
source ~/.bashrc   # ou ~/.zshrc
```
:::

---

## Shell Completion

O Krab CLI e construido com [Typer](https://typer.tiangolo.com/), que suporta auto-complete nativo para **Bash**, **Zsh** e **Fish**.

### Bash

```bash
# Gerar script de completion
krab --install-completion bash

# Ou manualmente (adicione ao ~/.bashrc)
eval "$(krab --show-completion bash)"
```

### Zsh

```bash
# Gerar script de completion
krab --install-completion zsh

# Ou manualmente (adicione ao ~/.zshrc)
eval "$(krab --show-completion zsh)"
```

### Fish

```bash
# Gerar script de completion
krab --install-completion fish
```

Apos instalar o completion, reinicie o terminal e teste digitando:

```bash
krab <TAB>
# Mostra: optimize  convert  analyze  search  diff  spec  memory  agent  cache  workflow

krab analyze <TAB>
# Mostra: tokens  quality  compare  freq  entropy  readability  ambiguity  substrings  risk  chunking  keywords  batch

krab workflow run <TAB>
# Mostra: spec-create  implement  review  full-cycle  verify  agent-init
```

:::tip Completion e produtividade
Com shell completion ativado, voce nao precisa decorar os 48 comandos. Basta digitar `krab ` + TAB para explorar os grupos, e `krab analyze ` + TAB para ver todas as analises disponiveis. Flags e opcoes tambem sao completadas automaticamente.
:::

---

## Troubleshooting

### Erro: `command not found: krab`

**Causa**: O executavel do krab nao esta no PATH.

**Solucoes**:

1. Se instalou com pipx:
```bash
# Verifique se o pipx bin esta no PATH
pipx ensurepath
# Reinicie o terminal
```

2. Se instalou com pip:
```bash
# Verifique onde o pip instalou
pip show krab-cli
# Adicione o diretorio de scripts ao PATH
# Linux/macOS: ~/.local/bin
# Windows: %APPDATA%\Python\Python311\Scripts
```

3. Se esta usando uv (desenvolvimento):
```bash
# Use uv run para executar dentro do virtualenv
uv run krab --version
```

### Erro: `SyntaxError` ao importar

**Causa**: Python 3.10 ou inferior.

**Solucao**:
```bash
# Verifique a versao
python --version

# Se necessario, instale Python 3.11+
# Ubuntu/Debian
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt install python3.11

# macOS
brew install python@3.11

# Via pyenv (qualquer OS)
pyenv install 3.11
pyenv global 3.11
```

### Erro: `ModuleNotFoundError: No module named 'krab_cli'`

**Causa**: O pacote nao foi instalado corretamente ou voce esta fora do virtualenv.

**Solucoes**:

1. Reinstale o pacote:
```bash
pip install -e .
# ou
pipx install -e .
```

2. Se usando uv, certifique-se de usar `uv run`:
```bash
uv run krab --version
```

3. Verifique se o virtualenv esta ativado:
```bash
# Verifique qual Python esta sendo usado
which python
# Deve apontar para o virtualenv, nao para o sistema
```

### Erro: `No module named 'tiktoken'` ou dependencia faltando

**Causa**: Dependencias nao foram instaladas completamente.

**Solucao**:
```bash
# Reinstale com todas as dependencias
pip install -e "."

# Ou com uv
uv sync
```

### Lentidao no primeiro comando

**Causa**: Normal. O primeiro comando de cada sessao tem um custo de ~400ms para carregar o Python e importar modulos. Comandos subsequentes que usam cache retornam instantaneamente.

**Dica**: Use `krab analyze batch` em vez de rodar analises individuais para evitar o custo de startup por arquivo:

```bash
# Lento: 10 invocacoes separadas (~4 segundos)
for f in specs/*.md; do krab analyze tokens "$f"; done

# Rapido: 1 invocacao batch (~0.4 segundos)
krab analyze batch ./specs/ -a tokens
```

### Problemas com permissao no Linux/macOS

**Causa**: Instalacao global sem permissao de root.

**Solucao**: Nunca use `sudo pip install`. Use pipx ou um virtualenv:

```bash
# Forma correta
pipx install -e .

# Alternativa com virtualenv
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

---

## Proximos Passos

Agora que o Krab CLI esta instalado, siga para o [Quick Start](./quick-start) para criar seu primeiro projeto SDD do zero.
