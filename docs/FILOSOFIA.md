# Filosofia do Arrow — 12 Semanas para um Ano

> Documento de referência sobre a metodologia central do sistema Arrow.
> Todo desenvolvimento funcional deve partir desta base filosófica.

---

## A Premissa Central

O sistema Arrow é construído sobre os princípios do livro **"The 12 Week Year"** de Brian Moran e Michael Lennington.

A ideia central é radical e simples:

> **Um ano tem 12 meses. Mas você executa como se tivesse tempo infinito.**
> **E se você tratasse 12 semanas como se fossem um ano inteiro?**

O planejamento anual tradicional falha porque cria uma ilusão de tempo abundante. Quando o ano começa, dezembro parece distante. A procrastinação se instala. A urgência só aparece nos últimos meses — e aí é tarde demais para ajustar.

O modelo de 12 semanas resolve isso comprimindo o horizonte de tempo. Cada ciclo de 12 semanas é tratado como um "ano". Com isso:

- A urgência é constante, não sazonal
- Os erros são detectados e corrigidos 4 vezes por ano, não 1
- O planejamento é mais preciso porque o horizonte é mais curto
- O foco aumenta porque não há "próximo ano" para adiar

---

## Os 4 Pilares do Sistema

### 1. Visão

**O que é:** Um objetivo claro, inspirador e específico para o ciclo de 12 semanas.

**Como funciona no Arrow:**
- O usuário define sua **Visão de 12 Semanas** antes de criar qualquer meta
- A visão é o "norte" que orienta todas as metas e tarefas do ciclo
- Deve ser ambiciosa o suficiente para motivar, mas concreta o suficiente para guiar ações
- Exemplo ruim: "Ser mais produtivo"
- Exemplo bom: "Lançar o produto beta e ter 50 usuários pagantes ao final do ciclo"

**Regra:** Sem visão definida, o sistema não permite criar um novo ciclo.

---

### 2. Planejamento de Execução

**O que é:** Identificar as tarefas essenciais — e apenas as essenciais — que levam da visão ao resultado.

**Como funciona no Arrow:**
- As **Metas** são os grandes marcos do ciclo (ex: "Criar landing page", "Fechar 3 contratos")
- As **Tarefas** são as ações concretas, atribuídas a semanas específicas
- O planejamento é feito de trás para frente: resultado desejado → marcos → ações semanais
- O Arrow exibe sempre a **semana atual dentro do ciclo** (ex: "Semana 4 de 12")

**Regra:** Cada tarefa deve ser atribuída a uma semana específica. Tarefas sem semana = intenções, não planos.

---

### 3. Controle de Processo

**O que é:** Revisão semanal do progresso. Não é uma reunião de análise — é uma verificação objetiva de execução.

**Como funciona no Arrow:**
- Todo início de semana, o usuário faz o **Check-in Semanal**
- O check-in pergunta: "Quais tarefas da semana passada foram concluídas?"
- O sistema calcula automaticamente o **Score de Execução** da semana
- Se o score cair abaixo de 85%, o sistema sinaliza e sugere ajuste de carga
- O histórico de check-ins é visível no dashboard do ciclo

**Regra:** O check-in semanal é a única forma de o sistema registrar progresso real. Tarefas "quase prontas" não contam.

---

### 4. Medição de Progresso

**O que é:** Separar o que você *fez* (execução) do que você *alcançou* (resultado). Focar primeiro na execução.

**Como funciona no Arrow:**
- O Arrow mede **dois indicadores distintos**:
  - **Score de Execução:** % de tarefas semanais concluídas (meta: ≥ 85%)
  - **Progresso de Resultado:** % de avanço nas metas do ciclo
- O sistema exibe os dois separadamente no dashboard
- A premissa: se o score de execução for consistentemente ≥ 85%, os resultados virão naturalmente
- Semanas com score < 85% são marcadas em vermelho no histórico

**Regra:** O usuário nunca é cobrado pelos resultados diretamente — apenas pela execução. Os resultados são consequência.

---

## Os 3 Blocos de Tempo

Brian Moran define três tipos de blocos que devem estruturar a semana:

| Bloco | Duração | Propósito | Exemplos |
|---|---|---|---|
| **Estratégico** | 2-4h | Trabalho profundo nas atividades de maior impacto | Escrever, desenvolver, criar, planejar |
| **Buffer** | 30-60min | Tarefas operacionais e reativas | Emails, mensagens, reuniões rápidas |
| **Escape** | Mínimo 3h/semana | Desconexão total | Lazer, família, exercício, sono |

**No Arrow:**
- O usuário pode organizar seus blocos de tempo na visão semanal
- Tarefas de alto impacto (ligadas a metas) são automaticamente sugeridas para **blocos estratégicos**
- Notificações são suprimidas durante blocos estratégicos marcados como ativos

---

## Desequilíbrio Intencional

O sistema não tenta equilibrar todas as áreas da vida ao mesmo tempo. Isso é um mito que gera mediocridade em tudo.

A premissa do Arrow é que **em cada ciclo de 12 semanas, você escolhe intencionalmente onde colocar sua energia**.

Isso significa:
- Um ciclo pode ser focado 90% em trabalho/carreira e 10% em saúde
- O próximo ciclo pode inverter a proporção
- O equilíbrio acontece ao longo dos ciclos, não dentro de cada um

**No Arrow:** O usuário define, no início de cada ciclo, qual é a **área de foco principal**. Isso é registrado e fica visível no dashboard como lembrete de onde a energia deve ir.

---

## Foco Singular

> "Multitarefa é a arte de fazer mal várias coisas ao mesmo tempo."

O Arrow é construído sobre o princípio de **uma coisa de cada vez**:

- O dashboard sempre destaca **a tarefa mais importante do dia** (MIT — Most Important Task)
- O sistema não sobrecarrega o usuário com listas infinitas
- A visão semanal mostra no máximo 3 metas ativas por vez
- Notificações são agrupadas e entregues em horários definidos, não em tempo real

---

## Sono Como Fundamento

O livro enfatiza que nenhum sistema de produtividade funciona sobre uma base de privação de sono.

O Arrow registra, opcionalmente, a qualidade do sono no check-in diário. Não para julgamento, mas para **correlacionar padrões**: semanas com sono ruim tendem a ter scores de execução mais baixos. O sistema pode mostrar essa correlação ao longo do tempo.

---

## Estrutura de um Ciclo no Arrow

```
CICLO (12 semanas)
│
├── Visão do Ciclo
│   └── "O que eu quero ter conquistado ao final destas 12 semanas?"
│
├── Metas (3-5 por ciclo)
│   ├── Meta 1: [Título] [Prazo: Semana X]
│   ├── Meta 2: [Título] [Prazo: Semana X]
│   └── Meta 3: [Título] [Prazo: Semana X]
│
├── Plano Semanal (gerado a partir das metas)
│   ├── Semana 1: [Lista de tarefas] → Check-in → Score
│   ├── Semana 2: [Lista de tarefas] → Check-in → Score
│   └── ...
│
├── Área de Foco Principal
│   └── Ex: "Carreira", "Saúde", "Projeto pessoal"
│
└── Revisão Final (Semana 13)
    ├── Score médio do ciclo
    ├── Metas concluídas vs planejadas
    ├── Aprendizados
    └── Visão do próximo ciclo
```

---

## O Que o Arrow NÃO É

Para guiar decisões de produto, é igualmente importante saber o que o sistema **não deve ser**:

- ❌ **Não é um gerenciador de projetos** — não há dependências, gráficos de Gantt, multi-usuário
- ❌ **Não é um app de to-do list genérico** — tarefas sem vínculo a metas não têm lugar central
- ❌ **Não é um diário** — o foco é execução, não reflexão livre
- ❌ **Não é um app de hábitos** — hábitos existem como suporte, não como foco principal
- ❌ **Não tenta equilibrar tudo** — escolha e foco são valores centrais

---

## Princípios de Design do Sistema

Todo novo módulo ou funcionalidade deve passar por estes filtros antes de ser implementado:

1. **Aumenta o foco ou distrai?** — Se adicionar mais ruído à interface, não entra
2. **Serve à execução ou à análise?** — O Arrow é um sistema de ação, não de contemplação
3. **Respeita o ciclo de 12 semanas?** — Funcionalidades que incentivam planejamento de longo prazo (1 ano+) devem ser tratadas como "visão", não como plano
4. **Gera urgência saudável?** — O sistema deve sempre mostrar onde o usuário está no ciclo e o que falta
5. **É simples o suficiente para usar todo dia?** — Complexidade = abandono

---

*Arrow v2.0 — Produtividade com propósito*
*Baseado em "The 12 Week Year" — Brian Moran & Michael Lennington*
