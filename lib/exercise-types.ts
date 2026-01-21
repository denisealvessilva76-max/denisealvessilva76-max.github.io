/**
 * Tipos para exercícios com imagens e avisos de troca de lado
 */

export interface ExercisePhase {
  id: string;
  name: string;
  duration: number; // em segundos
  description: string;
  image: string; // path da imagem
  instructions: string[];
  hasSides?: boolean; // true se tem lado direito/esquerdo
  sideNotificationTime?: number; // segundos para avisar sobre troca de lado
}

export interface Exercise {
  id: string;
  name: string;
  emoji: string;
  category: "alongamento" | "postura" | "respiracao";
  totalDuration: number; // em segundos
  description: string;
  benefits: string[];
  phases: ExercisePhase[];
  difficulty: "facil" | "medio" | "dificil";
}

export const EXERCISES: Exercise[] = [
  {
    id: "neck-stretch",
    name: "Alongamento de Pescoço",
    emoji: "🧠",
    category: "alongamento",
    totalDuration: 60, // 30 segundos cada lado
    description: "Alivie a tensão no pescoço com este alongamento simples",
    benefits: ["Reduz tensão", "Melhora flexibilidade", "Alivia dor de cabeça"],
    difficulty: "facil",
    phases: [
      {
        id: "neck-right",
        name: "Lado Direito",
        duration: 30,
        description: "Incline a cabeça para o lado direito",
        image: require("@/assets/images/exercise-neck-stretch.png"),
        instructions: [
          "Sente-se ou fique em pé com a coluna reta",
          "Incline lentamente a cabeça para o lado direito",
          "Sinta o alongamento no lado esquerdo do pescoço",
          "Mantenha a posição sem forçar",
        ],
        hasSides: true,
        sideNotificationTime: 25, // Avisar 5 segundos antes de trocar
      },
      {
        id: "neck-left",
        name: "Lado Esquerdo",
        duration: 30,
        description: "Incline a cabeça para o lado esquerdo",
        image: require("@/assets/images/exercise-neck-stretch.png"),
        instructions: [
          "Sente-se ou fique em pé com a coluna reta",
          "Incline lentamente a cabeça para o lado esquerdo",
          "Sinta o alongamento no lado direito do pescoço",
          "Mantenha a posição sem forçar",
        ],
        hasSides: true,
      },
    ],
  },
  {
    id: "shoulder-rotation",
    name: "Rotação de Ombros",
    emoji: "💪",
    category: "alongamento",
    totalDuration: 60, // 30 segundos cada direção
    description: "Melhore a mobilidade dos ombros com rotações",
    benefits: ["Melhora mobilidade", "Reduz tensão", "Previne lesões"],
    difficulty: "facil",
    phases: [
      {
        id: "shoulder-forward",
        name: "Rotação para Frente",
        duration: 30,
        description: "Rotacione os ombros para frente",
        image: require("@/assets/images/exercise-shoulder-rotation.png"),
        instructions: [
          "Fique em pé com os braços ao lado do corpo",
          "Levante os ombros em direção às orelhas",
          "Rotacione para frente em movimentos circulares",
          "Faça movimentos lentos e controlados",
        ],
        hasSides: false,
        sideNotificationTime: 25,
      },
      {
        id: "shoulder-backward",
        name: "Rotação para Trás",
        duration: 30,
        description: "Rotacione os ombros para trás",
        image: require("@/assets/images/exercise-shoulder-rotation.png"),
        instructions: [
          "Fique em pé com os braços ao lado do corpo",
          "Levante os ombros em direção às orelhas",
          "Rotacione para trás em movimentos circulares",
          "Faça movimentos lentos e controlados",
        ],
        hasSides: false,
      },
    ],
  },
  {
    id: "back-stretch",
    name: "Alongamento de Costas",
    emoji: "🔙",
    category: "alongamento",
    totalDuration: 45,
    description: "Alongue as costas e alivie a tensão",
    benefits: ["Alivia dor nas costas", "Melhora postura", "Aumenta flexibilidade"],
    difficulty: "facil",
    phases: [
      {
        id: "back-stretch-full",
        name: "Alongamento Completo",
        duration: 45,
        description: "Dobre-se para frente lentamente",
        image: require("@/assets/images/exercise-back-stretch.png"),
        instructions: [
          "Fique em pé com os pés afastados na largura dos ombros",
          "Dobre-se lentamente para frente",
          "Deixe os braços pendurados naturalmente",
          "Respire profundamente e mantenha a posição",
        ],
        hasSides: false,
      },
    ],
  },
  {
    id: "posture-lifting",
    name: "Postura Correta para Carregar",
    emoji: "📦",
    category: "postura",
    totalDuration: 60,
    description: "Aprenda a forma correta de carregar objetos pesados",
    benefits: ["Previne lesões nas costas", "Protege a coluna", "Melhora eficiência"],
    difficulty: "medio",
    phases: [
      {
        id: "posture-demo",
        name: "Demonstração",
        duration: 60,
        description: "Como carregar objetos pesados corretamente",
        image: require("@/assets/images/exercise-posture-correct.png"),
        instructions: [
          "Fique em pé com os pés afastados na largura dos ombros",
          "Dobre os joelhos, não a cintura",
          "Mantenha a coluna reta",
          "Levante o objeto usando as pernas",
          "Mantenha o objeto próximo ao corpo",
        ],
        hasSides: false,
      },
    ],
  },
  {
    id: "breathing",
    name: "Respiração Profunda",
    emoji: "🌬️",
    category: "respiracao",
    totalDuration: 120, // 2 minutos
    description: "Técnica de respiração para reduzir estresse",
    benefits: ["Reduz estresse", "Melhora foco", "Relaxa músculos"],
    difficulty: "facil",
    phases: [
      {
        id: "breathing-guided",
        name: "Respiração Guiada",
        duration: 120,
        description: "Siga o padrão de respiração",
        image: require("@/assets/images/exercise-breathing.png"),
        instructions: [
          "Sente-se confortavelmente com a coluna reta",
          "Inspire profundamente pelo nariz contando até 4",
          "Segure a respiração contando até 4",
          "Expire lentamente pela boca contando até 4",
          "Repita este padrão 10 vezes",
        ],
        hasSides: false,
      },
    ],
  },
];

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((ex) => ex.id === id);
}

export function getExercisesByCategory(
  category: "alongamento" | "postura" | "respiracao"
): Exercise[] {
  return EXERCISES.filter((ex) => ex.category === category);
}
