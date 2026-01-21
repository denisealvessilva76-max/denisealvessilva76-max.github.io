/**
 * Sistema de Gamificação - Medalhas e Conquistas
 */

export type MedalType = "bronze" | "silver" | "gold" | "platinum";

export interface Medal {
  id: string;
  name: string;
  description: string;
  type: MedalType;
  emoji: string;
  requirement: number; // Número de check-ins necessários
  unlockedAt?: number; // Timestamp quando foi desbloqueada
}

export interface Achievement {
  id: string;
  medalId: string;
  unlockedAt: number;
  weekNumber: number;
  year: number;
}

export interface GamificationStats {
  totalCheckIns: number;
  weeklyCheckIns: number;
  currentStreak: number;
  longestStreak: number;
  unlockedMedals: Medal[];
  achievements: Achievement[];
  totalPoints: number;
}

// Definição das medalhas
export const MEDALS: Medal[] = [
  {
    id: "starter",
    name: "Iniciante",
    description: "Faça seu primeiro check-in",
    type: "bronze",
    emoji: "🥉",
    requirement: 1,
  },
  {
    id: "consistent",
    name: "Consistente",
    description: "Faça 3 check-ins na semana",
    type: "bronze",
    emoji: "🥉",
    requirement: 3,
  },
  {
    id: "dedicated",
    name: "Dedicado",
    description: "Faça 5 check-ins na semana",
    type: "silver",
    emoji: "🥈",
    requirement: 5,
  },
  {
    id: "perfect_week",
    name: "Semana Perfeita",
    description: "Faça 7 check-ins na semana (todos os dias)",
    type: "gold",
    emoji: "🥇",
    requirement: 7,
  },
  {
    id: "health_champion",
    name: "Campeão da Saúde",
    description: "Mantenha 4 semanas perfeitas",
    type: "platinum",
    emoji: "👑",
    requirement: 28,
  },
];

/**
 * Calcular medalhas desbloqueadas baseado no número de check-ins semanais
 */
export function calculateUnlockedMedals(weeklyCheckIns: number): Medal[] {
  return MEDALS.filter((medal) => weeklyCheckIns >= medal.requirement);
}

/**
 * Calcular pontos baseado em check-ins
 * - 1 ponto por check-in
 * - 5 pontos bônus por medalha desbloqueada
 * - 10 pontos bônus por semana perfeita
 */
export function calculatePoints(
  weeklyCheckIns: number,
  newMedalsUnlocked: number,
  isPerfectWeek: boolean
): number {
  let points = weeklyCheckIns; // 1 ponto por check-in
  points += newMedalsUnlocked * 5; // 5 pontos por medalha
  if (isPerfectWeek) points += 10; // 10 pontos bônus por semana perfeita
  return points;
}

/**
 * Obter a próxima medalha a desbloquear
 */
export function getNextMedal(weeklyCheckIns: number): Medal | null {
  const nextMedal = MEDALS.find((medal) => weeklyCheckIns < medal.requirement);
  return nextMedal || null;
}

/**
 * Calcular progresso para a próxima medalha (0-100%)
 */
export function getProgressToNextMedal(weeklyCheckIns: number): number {
  const nextMedal = getNextMedal(weeklyCheckIns);
  if (!nextMedal) return 100; // Todas as medalhas desbloqueadas

  const previousMedal = MEDALS.filter((m) => m.requirement <= weeklyCheckIns).pop();
  const previousRequirement = previousMedal?.requirement || 0;

  const progress = weeklyCheckIns - previousRequirement;
  const needed = nextMedal.requirement - previousRequirement;

  return Math.round((progress / needed) * 100);
}

/**
 * Obter cor baseada no tipo de medalha
 */
export function getMedalColor(type: MedalType): string {
  switch (type) {
    case "bronze":
      return "#CD7F32"; // Bronze
    case "silver":
      return "#C0C0C0"; // Silver
    case "gold":
      return "#FFD700"; // Gold
    case "platinum":
      return "#E5E4E2"; // Platinum
    default:
      return "#999999";
  }
}

/**
 * Obter descrição do tipo de medalha
 */
export function getMedalTypeLabel(type: MedalType): string {
  switch (type) {
    case "bronze":
      return "Bronze";
    case "silver":
      return "Prata";
    case "gold":
      return "Ouro";
    case "platinum":
      return "Platina";
    default:
      return "Desconhecido";
  }
}
