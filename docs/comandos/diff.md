---
sidebar_position: 5
title: diff — Delta
---

# diff — Comparacao de Versoes de Specs

O grupo de comandos `krab diff` compara duas versoes de uma spec e produz um relatorio estruturado de mudancas. Utiliza **delta encoding** para identificar adicoes, remocoes e modificacoes, alem de calcular a economia de tokens ao enviar apenas o delta em vez da spec completa.

```bash
krab diff --help
```

---

## krab diff versions

Compara duas versoes de uma spec e gera um relatorio completo de delta encoding, incluindo analise linha a linha, deteccao de secoes afetadas e calculo de economia de tokens.

### Sintaxe

```bash
krab diff versions <old_file> <new_file>
```

### Parametros

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `old_file` | `Path` | Sim | Caminho para a versao antiga da spec |
| `new_file` | `Path` | Sim | Caminho para a versao nova da spec |

### Como Funciona

O comando utiliza `difflib.SequenceMatcher` do Python para identificar as operacoes minimas necessarias para transformar o texto antigo no novo. Cada operacao e classificada como:

| Tipo | Descricao | Cor na Saida |
|------|-----------|--------------|
| **ADDED** | Linhas presentes apenas na versao nova | Verde |
| **REMOVED** | Linhas presentes apenas na versao antiga | Vermelho |
| **MODIFIED** | Linhas alteradas (replace) — inclui score de similaridade | Amarelo |

Para mudancas do tipo `MODIFIED`, o Krab calcula a **similaridade** entre o conteudo antigo e novo usando `SequenceMatcher.ratio()`, que retorna um valor entre 0.0 (completamente diferente) e 1.0 (identico).

### Calculo de Token Savings

Alem do delta estrutural, o comando calcula quanto voce economiza ao enviar apenas o diff em vez da spec completa ao agente:

- **full_spec_tokens**: Tokens da spec nova completa
- **delta_tokens**: Tokens do delta compacto (unified diff com 1 linha de contexto)
- **savings_tokens**: Diferenca
- **savings_pct**: Percentual de economia
- **recommendation**: Se o delta e suficientemente menor para justificar o envio parcial

A regra e: se `delta_tokens < 50% * full_spec_tokens`, o Krab recomenda enviar o delta.

### Exemplo Completo

```bash
krab diff versions spec.task.auth-v1.md spec.task.auth-v2.md
```

**Saida:**

```
╭──────────────────────────────────────────────────────╮
│  Spec Delta Analysis                                 │
│  spec.task.auth-v1.md -> spec.task.auth-v2.md        │
╰──────────────────────────────────────────────────────╯

 Delta Summary
┌──────────────────┬────────┐
│ Lines Before     │ 142    │
│ Lines After      │ 168    │
│ Lines Added      │ 34     │
│ Lines Removed    │ 8      │
│ Lines Modified   │ 12     │
│ Change Ratio     │ 0.3214 │
└──────────────────┴────────┘

 Token Savings
┌───────────────────┬─────────────────────────────────────────────┐
│ full_spec_tokens  │ 1,247                                       │
│ delta_tokens      │ 312                                         │
│ savings_tokens    │ 935                                         │
│ savings_pct       │ 74.98%                                      │
│ recommendation    │ Use delta — significant savings              │
└───────────────────┴─────────────────────────────────────────────┘

 Changes
┌──────────┬─────────────────────────────────┬─────────┬────────────────────────────────────────────────────┐
│ Type     │ Section                         │ Lines   │ Detail                                             │
├──────────┼─────────────────────────────────┼─────────┼────────────────────────────────────────────────────┤
│ MODIFIED │ Cenarios BDD (Gherkin)          │ 45-52   │ Scenario: Refresh token expirado                   │
│ ADDED    │ Cenarios BDD (Gherkin)          │ 53-68   │ Scenario: Login com MFA habilitado                 │
│ ADDED    │ Cenarios BDD (Gherkin)          │ 69-82   │ Scenario Outline: Rate limiting por IP              │
│ MODIFIED │ Notas Tecnicas                  │ 98-103  │ JWT agora usa RS256 em vez de HS256                │
│ REMOVED  │ Casos de Borda                  │ 110-115 │ Scenario: Timeout na API legada                    │
│ ADDED    │ Dependencias                    │ 130-138 │ spec.architecture.mfa-flow.md                      │
└──────────┴─────────────────────────────────┴─────────┴────────────────────────────────────────────────────┘
```

### Interpretacao dos Campos

- **Change Ratio**: Fracao de linhas alteradas em relacao ao total. `0.32` significa 32% do documento mudou — uma mudanca significativa
- **Lines**: Intervalo de linhas na versao nova (para `ADDED` e `MODIFIED`) ou na versao antiga (para `REMOVED`)
- **Detail**: Preview dos primeiros 50 caracteres do conteudo novo (ou antigo, para remocoes)

---

## krab diff sections

Exibe um diff **por secao** (heading por heading) entre duas versoes de uma spec. Ideal para ter uma visao macro de quais partes da spec mudaram, sem o detalhe de cada linha.

### Sintaxe

```bash
krab diff sections <old_file> <new_file>
```

### Parametros

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `old_file` | `Path` | Sim | Caminho para a versao antiga da spec |
| `new_file` | `Path` | Sim | Caminho para a versao nova da spec |

### Como Funciona

1. Ambos os arquivos sao divididos em secoes baseadas nos **headings Markdown** (`#`, `##`, `###`, etc.)
2. Secoes com o mesmo heading sao comparadas:
   - Se o conteudo e **identico**, a secao e ignorada (sem mudanca)
   - Se o conteudo **difere**, a secao e marcada como `modified` com preview e score de similaridade
3. Headings presentes apenas na versao nova sao marcados como `added`
4. Headings presentes apenas na versao antiga sao marcados como `removed`

Conteudo antes do primeiro heading e tratado como a secao `_preamble`.

### Exemplo Completo

```bash
krab diff sections spec.architecture.api-v1.md spec.architecture.api-v2.md
```

**Saida:**

```
╭────────────────────────────────────────────────────────────────╮
│  Section Delta                                                 │
│  spec.architecture.api-v1.md -> spec.architecture.api-v2.md    │
╰────────────────────────────────────────────────────────────────╯

 Section Changes
┌───────────────────────────────────────┬──────────┬────────────────────────────────────────────────────┐
│ Section                               │ Type     │ Detail                                             │
├───────────────────────────────────────┼──────────┼────────────────────────────────────────────────────┤
│ Diagrama de Contexto (C4 Level 1)     │ MODIFIED │ Adicionado servico de notificacao ao diagrama       │
│ Contratos de API                      │ MODIFIED │ Novo endpoint POST /api/v2/notifications            │
│ Topologia de Deploy                   │ MODIFIED │ Node 4 adicionado para notification worker          │
│ Rate Limiting e Throttling            │ ADDED    │ Nova secao com regras de rate limiting por tier      │
│ Decisoes Arquiteturais (ADRs)         │ MODIFIED │ ADR-003: Migracao para event-driven                 │
│ Integracao Legada                     │ REMOVED  │ Secao removida (sistema legado descomissionado)      │
└───────────────────────────────────────┴──────────┴────────────────────────────────────────────────────┘
```

### Quando Usar `sections` vs `versions`

| Aspecto | `diff versions` | `diff sections` |
|---------|-----------------|-----------------|
| Granularidade | Linha a linha | Secao a secao |
| Token savings | Sim, calcula economia | Nao |
| Detalhe | Alto — mostra cada mudanca | Macro — visao geral |
| Melhor para | Review detalhado, calcular economia | Visao rapida de impacto |

---

## Casos de Uso

### 1. Rastrear Evolucao de Specs

Ao longo de um projeto, specs sao refinadas iterativamente. O `krab diff` permite rastrear exatamente o que mudou entre versoes:

```bash
# Comparar versao atual com versao anterior
krab diff versions spec.task.checkout-v1.md spec.task.checkout-v2.md

# Ver quais secoes foram afetadas
krab diff sections spec.task.checkout-v1.md spec.task.checkout-v2.md
```

### 2. Revisar Mudancas Antes de Sincronizar com Agentes

Antes de enviar uma spec atualizada para um agente de IA, verifique se as mudancas sao significativas e se vale a pena enviar o delta:

```bash
# Verificar se a economia justifica enviar delta
krab diff versions spec-atual.md spec-refinada.md

# Se savings_pct > 50%, enviar apenas o delta
# Se savings_pct < 50%, enviar a spec completa
```

### 3. Code Review de Specs

Durante code review, use o diff para entender rapidamente o que um colega mudou:

```bash
# Checkout da versao anterior via git
git show HEAD~1:specs/spec.task.feature-x.md > /tmp/spec-old.md

# Comparar com versao atual
krab diff sections specs/spec.task.feature-x.md /tmp/spec-old.md
```

### 4. Validar Impacto de Refinamento

Apos rodar `krab spec refine` e aplicar as sugestoes, use o diff para verificar o impacto:

```bash
# Antes do refinamento
cp spec.task.auth.md spec.task.auth.backup.md

# (aplicar mudancas sugeridas pelo refine)

# Verificar impacto
krab diff versions spec.task.auth.backup.md spec.task.auth.md
krab diff sections spec.task.auth.backup.md spec.task.auth.md
```

---

## Integracao com Pipeline SDD

O `krab diff` e especialmente util dentro de workflows automatizados:

```bash
# Pipeline completo: refinar, comparar, otimizar
krab spec refine spec.task.feature.md -o refinamento.md

# Aplicar mudancas sugeridas, depois verificar
krab diff versions spec.task.feature.md spec.task.feature-v2.md

# Se as mudancas sao boas, otimizar para contexto
krab optimize run spec.task.feature-v2.md -o spec.task.feature-final.md
```
