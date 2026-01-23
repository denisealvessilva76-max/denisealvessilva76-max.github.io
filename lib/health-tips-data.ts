/**
 * Dados de artigos e vídeos sobre ergonomia e prevenção de lesões na construção civil
 */

export type HealthTipCategory = "ergonomia" | "prevencao" | "seguranca" | "saude-mental";
export type HealthTipType = "article" | "video";

export interface HealthTip {
  id: string;
  type: HealthTipType;
  category: HealthTipCategory;
  title: string;
  description: string;
  thumbnail?: string;
  duration?: string; // Para vídeos: "5 min"
  readTime?: string; // Para artigos: "3 min de leitura"
  content?: string; // Conteúdo do artigo em markdown
  videoUrl?: string; // URL do vídeo (YouTube ou local)
  videoId?: string; // ID do YouTube para embed
  author?: string;
  date?: string;
  tags?: string[];
}

export const HEALTH_TIPS: HealthTip[] = [
  // ARTIGOS - ERGONOMIA
  {
    id: "ergonomia-1",
    type: "article",
    category: "ergonomia",
    title: "Postura Correta ao Carregar Peso",
    description: "Aprenda a técnica correta para carregar sacos de cimento e materiais pesados sem prejudicar sua coluna.",
    readTime: "3 min de leitura",
    thumbnail: "📦",
    author: "SESMT Obra 345",
    date: "2026-01-20",
    tags: ["coluna", "peso", "técnica"],
    content: `# Postura Correta ao Carregar Peso

## Por que é importante?

Carregar peso de forma incorreta é a principal causa de lesões na coluna entre trabalhadores da construção civil. Mais de 60% dos afastamentos por CID M (doenças musculoesqueléticas) estão relacionados ao levantamento inadequado de cargas.

## Técnica Correta em 5 Passos

### 1. Posicione-se próximo à carga
- Fique com os pés afastados na largura dos ombros
- Mantenha um pé ligeiramente à frente do outro para equilíbrio
- Aproxime-se o máximo possível do objeto

### 2. Dobre os joelhos, não a coluna
- **NUNCA** curve as costas para pegar o peso
- Agache dobrando os joelhos
- Mantenha a coluna reta e ereta

### 3. Segure firme e próximo ao corpo
- Use as duas mãos
- Mantenha a carga próxima ao corpo (quanto mais longe, maior o esforço)
- Segure pela base do objeto, não pelas laterais

### 4. Levante usando as pernas
- Use a força das pernas, não das costas
- Levante-se lentamente, mantendo a coluna reta
- Não faça movimentos bruscos

### 5. Transporte com segurança
- Mantenha a carga próxima ao corpo
- Não torça o tronco enquanto carrega
- Para mudar de direção, gire o corpo todo, não apenas o tronco

## ⚠️ Sinais de Alerta

Procure o SESMT imediatamente se sentir:
- Dor aguda nas costas durante ou após carregar peso
- Formigamento nas pernas
- Dificuldade para se movimentar
- Dor que irradia para as pernas

## 💡 Dica Extra

Se o peso for muito grande, **peça ajuda**! Não há problema em pedir auxílio. É melhor levar mais tempo do que se machucar.

---

**Lembre-se:** Sua saúde é mais importante que qualquer prazo. Trabalhe com segurança!
`,
  },
  {
    id: "ergonomia-2",
    type: "article",
    category: "ergonomia",
    title: "Alongamentos para Prevenir Dores",
    description: "Rotina de 5 minutos de alongamentos que você pode fazer antes, durante e depois do trabalho.",
    readTime: "4 min de leitura",
    thumbnail: "🤸",
    author: "Fisioterapeuta - SESMT",
    date: "2026-01-18",
    tags: ["alongamento", "prevenção", "rotina"],
    content: `# Alongamentos para Prevenir Dores

## Por que alongar?

Alongamentos regulares reduzem em até 40% o risco de lesões musculares e melhoram sua disposição durante o trabalho. Apenas 5 minutos por dia fazem toda a diferença!

## Rotina Matinal (Antes do Trabalho)

### 1. Pescoço (30 segundos cada lado)
- Incline a cabeça para o lado direito
- Segure por 15 segundos
- Repita do lado esquerdo
- Faça movimentos lentos e suaves

### 2. Ombros (1 minuto)
- Faça 10 rotações para trás
- Faça 10 rotações para frente
- Levante os ombros até as orelhas e solte

### 3. Braços e Punhos (1 minuto)
- Estenda um braço à frente
- Puxe os dedos para trás com a outra mão
- Segure por 15 segundos cada braço
- Faça círculos com os punhos (10 vezes cada direção)

## Pausa Ativa (Durante o Trabalho)

### 4. Coluna (1 minuto)
- Fique em pé, pés afastados
- Incline o tronco para frente suavemente
- Deixe os braços pendurados
- Sinta o alongamento nas costas

### 5. Pernas (1 minuto cada)
- Apoie-se em uma parede
- Dobre uma perna para trás
- Segure o pé com a mão
- Mantenha por 20 segundos
- Troque de perna

### 6. Panturrilha (30 segundos cada)
- Apoie as mãos na parede
- Estenda uma perna para trás
- Mantenha o calcanhar no chão
- Sinta o alongamento na panturrilha

## Rotina Pós-Trabalho

### 7. Relaxamento Total (2 minutos)
- Deite-se de costas (se possível)
- Estenda braços e pernas
- Respire profundamente
- Relaxe todos os músculos

## 📅 Quando Fazer?

- **Manhã:** Antes de começar o trabalho (5 min)
- **Meio do dia:** Na pausa do almoço (5 min)
- **Tarde:** Pausa ativa (3 min)
- **Noite:** Ao chegar em casa (5 min)

## ⚠️ Atenção

- Nunca force o alongamento até sentir dor
- Movimentos devem ser suaves e controlados
- Se sentir dor aguda, pare imediatamente
- Respire normalmente durante os alongamentos

---

**Dica:** Configure lembretes no app para não esquecer de alongar!
`,
  },
  {
    id: "prevencao-1",
    type: "article",
    category: "prevencao",
    title: "Prevenção de Lesões por Esforço Repetitivo (LER)",
    description: "Como evitar lesões causadas por movimentos repetitivos no dia a dia da obra.",
    readTime: "5 min de leitura",
    thumbnail: "🔄",
    author: "Dr. Carlos Mendes - Medicina do Trabalho",
    date: "2026-01-15",
    tags: ["LER", "DORT", "prevenção"],
    content: `# Prevenção de Lesões por Esforço Repetitivo (LER)

## O que é LER/DORT?

LER (Lesão por Esforço Repetitivo) e DORT (Distúrbios Osteomusculares Relacionados ao Trabalho) são lesões causadas por movimentos repetitivos, posturas inadequadas e sobrecarga muscular.

## Principais Causas na Construção Civil

### 1. Movimentos Repetitivos
- Martelar continuamente
- Apertar parafusos
- Carregar materiais repetidamente
- Usar ferramentas vibratórias

### 2. Posturas Inadequadas
- Trabalhar com braços acima da cabeça
- Manter pescoço inclinado por muito tempo
- Agachar-se repetidamente
- Torcer o tronco constantemente

### 3. Sobrecarga
- Carregar peso excessivo
- Trabalhar sem pausas
- Usar força excessiva nas ferramentas

## Como Prevenir?

### ✅ Faça Pausas Regulares
- A cada 50 minutos, pare por 10 minutos
- Alongue-se durante as pausas
- Mude de posição frequentemente

### ✅ Varie as Tarefas
- Alterne entre atividades diferentes
- Não faça o mesmo movimento por horas seguidas
- Reveze com colegas quando possível

### ✅ Use Ferramentas Adequadas
- Ferramentas com cabo ergonômico
- Equipamentos bem conservados
- Luvas que não forcem as mãos

### ✅ Mantenha Boa Postura
- Ajuste a altura do trabalho quando possível
- Use apoios e suportes
- Evite torcer o corpo

### ✅ Fortaleça a Musculatura
- Faça exercícios de fortalecimento
- Mantenha-se ativo fora do trabalho
- Pratique alongamentos diários

## 🚨 Sinais de Alerta

Procure o SESMT se sentir:
- Dor persistente em articulações
- Formigamento nas mãos ou braços
- Perda de força nas mãos
- Dificuldade para segurar objetos
- Dor que piora durante o trabalho

## Tratamento Precoce

Quanto mais cedo identificar o problema, melhor!
- Não ignore os sintomas
- Relate ao SESMT imediatamente
- Siga as orientações médicas
- Faça fisioterapia se recomendado

## 💡 Lembre-se

LER/DORT tem cura quando tratada no início. Não espere a dor piorar!

---

**Contato SESMT:** (21) 99822-5493
`,
  },
  {
    id: "seguranca-1",
    type: "article",
    category: "seguranca",
    title: "Hidratação no Canteiro de Obras",
    description: "A importância de beber água regularmente e como evitar desidratação em dias quentes.",
    readTime: "3 min de leitura",
    thumbnail: "💧",
    author: "Nutricionista - SESMT",
    date: "2026-01-12",
    tags: ["hidratação", "calor", "saúde"],
    content: `# Hidratação no Canteiro de Obras

## Por que a hidratação é crucial?

Trabalhar na construção civil exige esforço físico intenso, especialmente em dias quentes. A desidratação pode causar:
- Tontura e fadiga
- Câimbras musculares
- Queda de pressão
- Insolação (casos graves)

## Quanto Beber?

### Meta Diária: 2 a 3 litros de água

**Em dias normais:**
- 1 copo (250ml) a cada 2 horas
- Total: 8 copos por dia

**Em dias quentes (acima de 30°C):**
- 1 copo a cada hora
- Total: 10-12 copos por dia

## 🕐 Horários Recomendados

- **7h:** 1 copo ao acordar
- **9h:** 1 copo (pausa)
- **11h:** 1 copo (antes do almoço)
- **13h:** 1 copo (após almoço)
- **15h:** 1 copo (pausa da tarde)
- **17h:** 1 copo (fim do expediente)
- **19h:** 1 copo (jantar)
- **21h:** 1 copo (antes de dormir)

## ⚠️ Sinais de Desidratação

Fique atento a estes sintomas:
- Sede intensa
- Boca seca
- Urina escura (amarelo forte)
- Dor de cabeça
- Tontura
- Fadiga extrema
- Câimbras

## 💡 Dicas Práticas

### 1. Tenha sempre uma garrafa
- Mantenha garrafa de água por perto
- Reabasteça nos bebedouros
- Use o app para registrar consumo

### 2. Beba antes de sentir sede
- Sede já é sinal de desidratação
- Crie o hábito de beber regularmente
- Configure lembretes no celular

### 3. Evite bebidas inadequadas
- ❌ Refrigerantes (muito açúcar)
- ❌ Bebidas energéticas (cafeína demais)
- ✅ Água pura
- ✅ Água de coco (natural)
- ✅ Sucos naturais (sem açúcar)

### 4. Alimentação ajuda
- Frutas com água: melancia, laranja, melão
- Verduras: pepino, alface, tomate
- Evite comidas muito salgadas

## 🌡️ Cuidados em Dias Quentes

- Use protetor solar
- Vista roupas leves e claras
- Trabalhe na sombra quando possível
- Faça pausas em locais frescos
- Molhe o rosto e pescoço

## 🚨 Emergência

Se você ou um colega apresentar:
- Confusão mental
- Pele muito quente e seca
- Batimentos acelerados
- Desmaio

**Ação imediata:**
1. Chame ajuda
2. Leve para local fresco
3. Ofereça água (se consciente)
4. Contate o SESMT

---

**Use o app para rastrear sua hidratação diária!**
`,
  },
  {
    id: "saude-mental-1",
    type: "article",
    category: "saude-mental",
    title: "Gerenciando o Estresse no Trabalho",
    description: "Técnicas simples para reduzir o estresse e melhorar seu bem-estar mental no dia a dia.",
    readTime: "4 min de leitura",
    thumbnail: "🧘",
    author: "Psicóloga Brenda Fernandes",
    date: "2026-01-10",
    tags: ["estresse", "bem-estar", "saúde mental"],
    content: `# Gerenciando o Estresse no Trabalho

## O Estresse na Construção Civil

O trabalho na construção é fisicamente e mentalmente exigente:
- Prazos apertados
- Trabalho sob pressão
- Ambiente ruidoso
- Distância da família
- Preocupações financeiras

## Sinais de Estresse

### Físicos
- Dor de cabeça frequente
- Tensão muscular
- Problemas para dormir
- Fadiga constante
- Problemas digestivos

### Emocionais
- Irritabilidade
- Ansiedade
- Dificuldade de concentração
- Sensação de sobrecarga
- Tristeza persistente

## Técnicas de Gerenciamento

### 1. Respiração 4-7-8 (1 minuto)
- Inspire pelo nariz (4 segundos)
- Segure a respiração (7 segundos)
- Expire pela boca (8 segundos)
- Repita 4 vezes

**Quando usar:** Antes de situações estressantes, durante pausas

### 2. Pausas Conscientes (5 minutos)
- Pare o que está fazendo
- Observe ao seu redor
- Preste atenção aos sons, cheiros, sensações
- Respire profundamente

**Quando usar:** A cada 2 horas de trabalho

### 3. Movimento Físico (10 minutos)
- Caminhe um pouco
- Alongue-se
- Faça exercícios leves
- Libera endorfina (hormônio do bem-estar)

**Quando usar:** Pausa do almoço, fim do expediente

### 4. Conversa com Colegas
- Compartilhe suas preocupações
- Ouça os outros
- Crie laços de apoio
- Não guarde tudo para si

**Quando usar:** Sempre que sentir necessidade

### 5. Organização e Prioridades
- Faça uma lista de tarefas
- Foque em uma coisa por vez
- Não tente fazer tudo ao mesmo tempo
- Peça ajuda quando necessário

## Cuidados Diários

### Sono de Qualidade
- Durma 7-8 horas por noite
- Mantenha horários regulares
- Evite celular antes de dormir
- Crie ambiente escuro e silencioso

### Alimentação Balanceada
- Coma em horários regulares
- Evite excesso de café
- Reduza açúcar e gordura
- Aumente frutas e verduras

### Atividade Física
- Exercite-se regularmente
- Pode ser caminhada simples
- 30 minutos, 3x por semana
- Melhora humor e disposição

### Momentos de Lazer
- Reserve tempo para família
- Faça atividades que gosta
- Descanse nos finais de semana
- Desconecte-se do trabalho

## Quando Buscar Ajuda Profissional?

Procure psicólogo ou SESMT se:
- Sintomas persistem por mais de 2 semanas
- Interferem no trabalho ou vida pessoal
- Sente vontade de desistir de tudo
- Tem pensamentos negativos constantes
- Usa álcool ou drogas para lidar com estresse

## 📞 Contatos de Apoio

**Psicóloga da Obra:**
Brenda Fernandes - (94) 98123-4567

**Assistente Social:**
Luciana Nascimento - (94) 98765-4321

**CVV - Centro de Valorização da Vida:**
Ligue 188 (24h, gratuito e sigiloso)

**CAPS Canaã dos Carajás:**
Rua das Flores, 123 - Centro

---

**Lembre-se:** Cuidar da saúde mental é tão importante quanto cuidar do corpo. Não tenha vergonha de pedir ajuda!
`,
  },
];

// Vídeos educativos do YouTube
export const HEALTH_TIP_VIDEOS: HealthTip[] = [
  {
    id: "video-ergonomia-1",
    type: "video",
    category: "ergonomia",
    title: "A Ergonomia na Construção Civil",
    description: "Vídeo educativo sobre ergonomia e adaptação do ambiente de trabalho para prevenir lesões.",
    duration: "10 min",
    thumbnail: "🎥",
    videoUrl: "https://www.youtube.com/watch?v=zDrjqurXisQ",
    videoId: "zDrjqurXisQ",
    author: "Professor Luciano Amor",
    date: "2020-11-26",
    tags: ["ergonomia", "adaptação", "prevenção"],
  },
  {
    id: "video-ergonomia-2",
    type: "video",
    category: "ergonomia",
    title: "DDS sobre Ergonomia na Construção",
    description: "Diálogo Diário de Segurança (DDS) focado em ergonomia e postura correta no canteiro de obras.",
    duration: "8 min",
    thumbnail: "🎥",
    videoUrl: "https://www.youtube.com/watch?v=42RHEejHf6c",
    videoId: "42RHEejHf6c",
    author: "SST Educação",
    date: "2021-07-06",
    tags: ["DDS", "ergonomia", "segurança"],
  },
  {
    id: "video-nr17",
    type: "video",
    category: "ergonomia",
    title: "NR 17 - Ergonomia no Trabalho",
    description: "Entenda a NR 17 e a importância da ergonomia para prevenir lesões e melhorar a saúde no trabalho.",
    duration: "18 min",
    thumbnail: "🎥",
    videoUrl: "https://www.youtube.com/watch?v=fOqBQQAa3d0",
    videoId: "fOqBQQAa3d0",
    author: "Segurança do Trabalho",
    date: "2020-07-21",
    tags: ["NR17", "normas", "ergonomia"],
  },
  {
    id: "video-seguranca-1",
    type: "video",
    category: "seguranca",
    title: "Protocolos de Segurança em Canteiros de Obras",
    description: "Os 5 principais protocolos de segurança para prevenir acidentes e lesões no canteiro de obras.",
    duration: "12 min",
    thumbnail: "🎥",
    videoUrl: "https://www.youtube.com/watch?v=ovuGwBcGPlg",
    videoId: "ovuGwBcGPlg",
    author: "Segurança na Obra",
    date: "2024-08-14",
    tags: ["segurança", "protocolos", "prevenção"],
  },
  {
    id: "video-nr18",
    type: "video",
    category: "seguranca",
    title: "NR18 - Básico de Segurança na Construção Civil",
    description: "Treinamento básico sobre segurança ocupacional na construção civil, incluindo uso de EPIs e procedimentos.",
    duration: "20 min",
    thumbnail: "🎥",
    videoUrl: "https://www.youtube.com/watch?v=VcsMAx4bYTo",
    videoId: "VcsMAx4bYTo",
    author: "Treinamento NR18",
    date: "2025-01-06",
    tags: ["NR18", "treinamento", "EPIs"],
  },
  {
    id: "video-prevencao-1",
    type: "video",
    category: "prevencao",
    title: "Prevenindo Lesões Ergonômicas no Canteiro",
    description: "Como prevenir lesões ergonômicas no local de trabalho seguindo diretrizes da OSHA.",
    duration: "6 min",
    thumbnail: "🎥",
    videoUrl: "https://www.youtube.com/watch?v=OpcDNem9dU4",
    videoId: "OpcDNem9dU4",
    author: "OSHA Safety",
    date: "2025-01-20",
    tags: ["prevenção", "lesões", "OSHA"],
  },
  {
    id: "video-prevencao-2",
    type: "video",
    category: "prevencao",
    title: "Ergonomia na Construção - Treinamento Completo",
    description: "Treinamento completo sobre ergonomia na construção civil com exemplos práticos e demonstrações.",
    duration: "15 min",
    thumbnail: "🎥",
    videoUrl: "https://www.youtube.com/watch?v=FirXqxIc6a8",
    videoId: "FirXqxIc6a8",
    author: "Construction Safety Training",
    date: "2016-03-01",
    tags: ["treinamento", "ergonomia", "prática"],
  },
  {
    id: "video-pedreiro",
    type: "video",
    category: "prevencao",
    title: "Riscos Inerentes à Função de Pedreiro",
    description: "Identificação e prevenção dos principais riscos enfrentados por pedreiros no canteiro de obras.",
    duration: "9 min",
    thumbnail: "🎥",
    videoUrl: "https://www.youtube.com/watch?v=5uiQvku2df8",
    videoId: "5uiQvku2df8",
    author: "Senai Paraná",
    date: "2015-03-12",
    tags: ["pedreiro", "riscos", "prevenção"],
  },
];

// Combinar artigos e vídeos
export const ALL_HEALTH_TIPS = [...HEALTH_TIPS, ...HEALTH_TIP_VIDEOS];

export const CATEGORIES = [
  { id: "ergonomia", label: "Ergonomia", icon: "🏗️", color: "#0a7ea4" },
  { id: "prevencao", label: "Prevenção", icon: "🛡️", color: "#22C55E" },
  { id: "seguranca", label: "Segurança", icon: "⚠️", color: "#F59E0B" },
  { id: "saude-mental", label: "Saúde Mental", icon: "🧠", color: "#8B5CF6" },
];
