# Design: Canteiro Saudável

## Visão Geral
O **Canteiro Saudável** é um aplicativo móvel para trabalhadores de construção civil, focado em reduzir absenteísmo através do monitoramento e prevenção de doenças musculoesqueléticas (CID M), controle de hipertensão e suporte à saúde mental.

**Orientação:** Portrait (9:16) | **Uso:** Uma mão | **Estilo:** iOS-first, limpo e acessível

---

## Paleta de Cores

| Cor | Uso | Valor |
| :--- | :--- | :--- |
| **Primária (Azul)** | Botões, destaque, ações | `#0a7ea4` |
| **Fundo** | Tela de fundo | `#ffffff` (light) / `#151718` (dark) |
| **Superfície** | Cards, containers | `#f5f5f5` (light) / `#1e2022` (dark) |
| **Texto Principal** | Títulos, corpo | `#11181C` (light) / `#ECEDEE` (dark) |
| **Texto Secundário** | Labels, hints | `#687076` (light) / `#9BA1A6` (dark) |
| **Sucesso** | Confirmações, check-in OK | `#22C55E` |
| **Aviso** | Alertas, pressão elevada | `#F59E0B` |
| **Erro** | Crítico, risco alto | `#EF4444` |

---

## Telas Principais

### 1. **Home (Check-in Diário)**
**Propósito:** Entrada rápida do bem-estar do trabalhador.

**Conteúdo:**
- Saudação com hora do dia ("Bom dia, João")
- Card grande de **Check-in Rápido** com 3 opções:
  - 😊 "Tudo bem" (verde)
  - 😐 "Com dor leve" (amarelo)
  - 😞 "Com dor forte" (vermelho)
- Histórico de check-ins dos últimos 7 dias (mini gráfico)
- Botão flutuante para "Registrar Pressão"
- Abas inferiores: Home | Ergonomia | Saúde | Perfil

### 2. **Ergonomia (Guia de Posturas)**
**Propósito:** Educação visual sobre posturas corretas e alongamentos.

**Conteúdo:**
- Abas: "Posturas" | "Alongamentos" | "Exercícios"
- Cards com **imagens/ilustrações** de cada postura (ex: "Como carregar saco de cimento")
- Descrição em linguagem simples
- Botão "Fazer Agora" para iniciar rotina de 5 minutos
- Notificações de pausa ativa (opcional)

### 3. **Saúde (Monitoramento)**
**Propósito:** Rastreamento de pressão arterial e sintomas.

**Conteúdo:**
- **Seção Pressão Arterial:**
  - Último registro (ex: "120/80 mmHg - Normal")
  - Botão "+ Registrar Pressão"
  - Histórico em gráfico simples (últimos 30 dias)
- **Seção Sintomas:**
  - Checklist: "Dor nas costas", "Dor no ombro", "Dor no joelho", "Ansiedade"
  - Botão "Relatar Sintoma"
- **Seção Saúde Mental:**
  - Card: "Como você está se sentindo?"
  - Dicas rápidas de respiração/meditação (1-2 min)

### 4. **Perfil (Dados Pessoais)**
**Propósito:** Gerenciamento de dados e preferências.

**Conteúdo:**
- Nome, CPF, cargo, turno
- Histórico de atestados (anônimo, apenas para o trabalhador)
- Preferências: notificações, lembretes de pausa
- Botão "Contato SESMT" (link para WhatsApp/telefone)
- Versão do app

---

## Fluxos Principais

### Fluxo 1: Check-in Diário
1. Trabalhador abre o app
2. Toca em um dos 3 emojis (bem, dor leve, dor forte)
3. Se "dor forte": app oferece opção de "Falar com SESMT"
4. Check-in é salvo localmente
5. Confirmação visual (✓)

### Fluxo 2: Registrar Pressão
1. Trabalhador toca "+ Registrar Pressão"
2. Insere valores: Sistólica / Diastólica
3. App classifica: Normal (verde) | Pré-hipertensão (amarelo) | Hipertensão (vermelho)
4. Registro é salvo
5. Se crítico: alerta para procurar médico

### Fluxo 3: Fazer Exercício de Pausa Ativa
1. Trabalhador toca "Fazer Agora" em um alongamento
2. Tela exibe:
   - Imagem/vídeo do exercício
   - Contagem regressiva (30s, 60s, etc.)
   - Instruções em texto simples
3. Ao terminar: "Parabéns! Você completou a pausa ativa"
4. Pontuação/badge (opcional)

---

## Componentes Reutilizáveis

| Componente | Uso |
| :--- | :--- |
| **Card** | Containers com sombra e borda arredondada |
| **Button** | Primário (azul), Secundário (outline) |
| **IconButton** | Ícones redondos para ações rápidas |
| **Input** | Campos de texto para pressão, sintomas |
| **Badge** | Labels para status (Normal, Aviso, Crítico) |
| **ProgressBar** | Visualização de histórico (7 dias) |
| **Modal** | Confirmações e alertas |

---

## Acessibilidade

- **Ícones + Texto:** Nunca apenas ícones; sempre acompanhar com rótulo.
- **Contraste:** Razão mínima 4.5:1 para texto.
- **Tamanho de Toque:** Botões mínimo 44×44 pt.
- **Linguagem Simples:** Evitar jargão médico; usar termos do dia a dia.
- **Suporte a Leitura de Tela:** Todos os elementos com `accessibilityLabel`.

---

## Prototipagem

**Wireframes de Alta Fidelidade:**
- Home: Check-in rápido + histórico
- Ergonomia: Cards de posturas com imagens
- Saúde: Gráfico de pressão + sintomas
- Perfil: Dados pessoais + contato SESMT

**Animações (Subtis):**
- Transição entre abas: fade (150ms)
- Confirmação de check-in: scale + haptic (100ms)
- Abertura de modal: slide-up (200ms)
