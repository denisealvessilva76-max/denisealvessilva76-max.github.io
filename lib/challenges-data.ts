/**
 * Sistema de Desafios de Saúde
 * Desafios gamificados para engajar trabalhadores em hábitos saudáveis
 */

export type ChallengeType = "steps" | "hydration" | "checkin" | "dds" | "custom";
export type ChallengeStatus = "available" | "active" | "completed" | "expired";
export type ChallengeDifficulty = "easy" | "medium" | "hard";

export interface Challenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  icon: string;
  difficulty: ChallengeDifficulty;
  duration: number; // dias
  goal: number; // meta numérica
  unit: string; // "passos", "ml", "check-ins", etc
  points: number; // pontos ao completar
  badge?: string; // medalha especial ao completar
  startDate?: string;
  endDate?: string;
  status: ChallengeStatus;
}

export interface ChallengeProgress {
  challengeId: string;
  userId: string;
  userName: string;
  progress: number; // 0-100
  currentValue: number;
  goalValue: number;
  startDate: string;
  lastUpdate: string;
  completed: boolean;
  completedDate?: string;
}

export interface ChallengeRanking {
  userId: string;
  userName: string;
  avatar?: string;
  progress: number;
  currentValue: number;
  rank: number;
  points: number;
}

// Desafios pré-definidos
export const AVAILABLE_CHALLENGES: Challenge[] = [
  {
    id: "challenge-steps-15d",
    type: "steps",
    title: "Caminhada Saudável",
    description: "Caminhe 6.000 passos por dia durante 15 dias consecutivos",
    icon: "🚶",
    difficulty: "medium",
    duration: 15,
    goal: 6000,
    unit: "passos/dia",
    points: 500,
    badge: "Campeão de Passos",
    status: "available",
  },
  {
    id: "challenge-hydration-7d",
    type: "hydration",
    title: "Hidratação Consistente",
    description: "Beba pelo menos 2 litros de água por dia durante 7 dias",
    icon: "💧",
    difficulty: "easy",
    duration: 7,
    goal: 2000,
    unit: "ml/dia",
    points: 300,
    badge: "Hidratado",
    status: "available",
  },
  {
    id: "challenge-hydration-30d",
    type: "hydration",
    title: "Mestre da Hidratação",
    description: "Mantenha-se hidratado por 30 dias seguidos (2L/dia)",
    icon: "💦",
    difficulty: "hard",
    duration: 30,
    goal: 2000,
    unit: "ml/dia",
    points: 1000,
    badge: "Mestre da Hidratação",
    status: "available",
  },
  {
    id: "challenge-checkin-30d",
    type: "checkin",
    title: "Check-in Diário",
    description: "Faça check-in de bem-estar todos os dias por 30 dias",
    icon: "✅",
    difficulty: "medium",
    duration: 30,
    goal: 30,
    unit: "check-ins",
    points: 800,
    badge: "Cuidador da Saúde",
    status: "available",
  },
  {
    id: "challenge-emotional-8w",
    type: "checkin",
    title: "Saúde Emocional",
    description: "Faça 2 check-ins emocionais por semana durante 8 semanas",
    icon: "🧘",
    difficulty: "easy",
    duration: 56, // 8 semanas
    goal: 16, // 2 por semana x 8
    unit: "check-ins",
    points: 600,
    badge: "Zen da Semana",
    status: "available",
  },
  {
    id: "challenge-dds-4w",
    type: "dds",
    title: "Participação Ativa em DDS",
    description: "Assista e complete o quiz de 4 vídeos de DDS em 4 semanas",
    icon: "🎥",
    difficulty: "easy",
    duration: 28, // 4 semanas
    goal: 4,
    unit: "vídeos",
    points: 400,
    badge: "Mestre do DDS",
    status: "available",
  },
  {
    id: "challenge-combo-30d",
    type: "custom",
    title: "Combo Saúde Total",
    description: "Complete 3 desafios diferentes no mesmo mês",
    icon: "🏆",
    difficulty: "hard",
    duration: 30,
    goal: 3,
    unit: "desafios",
    points: 1500,
    badge: "Saúde Total",
    status: "available",
  },
];

// Função para calcular progresso do desafio
export function calculateChallengeProgress(
  challenge: Challenge,
  userProgress: ChallengeProgress
): number {
  if (userProgress.completed) return 100;
  
  const percentage = (userProgress.currentValue / challenge.goal) * 100;
  return Math.min(100, Math.max(0, percentage));
}

// Função para verificar se desafio foi completado
export function isChallengeCompleted(
  challenge: Challenge,
  userProgress: ChallengeProgress
): boolean {
  return userProgress.currentValue >= challenge.goal;
}

// Função para calcular dias restantes
export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Função para gerar ranking
export function generateRanking(
  progressList: ChallengeProgress[]
): ChallengeRanking[] {
  // Ordenar por progresso (maior primeiro)
  const sorted = [...progressList].sort((a, b) => {
    if (b.completed !== a.completed) {
      return b.completed ? 1 : -1;
    }
    return b.progress - a.progress;
  });

  // Gerar ranking
  return sorted.map((progress, index) => ({
    userId: progress.userId,
    userName: progress.userName,
    progress: progress.progress,
    currentValue: progress.currentValue,
    rank: index + 1,
    points: progress.completed ? 100 : Math.floor(progress.progress),
  }));
}

// Cores por dificuldade
export const DIFFICULTY_COLORS = {
  easy: "#22C55E",
  medium: "#F59E0B",
  hard: "#EF4444",
};

// Ícones de ranking
export const RANK_ICONS = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};
