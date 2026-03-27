import { useState, useCallback, useMemo } from 'react';

export type LevelTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Level {
  tier: LevelTier;
  name: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
  benefits: string[];
  color: string;
  badge: string;
}

const LEVELS: Level[] = [
  {
    tier: 'bronze',
    name: 'Bronze',
    icon: '🥉',
    minPoints: 0,
    maxPoints: 499,
    benefits: [
      'Acesso ao app',
      'Participação em desafios',
      'Visualizar gráficos básicos',
    ],
    color: '#CD7F32',
    badge: '🥉',
  },
  {
    tier: 'silver',
    name: 'Prata',
    icon: '🥈',
    minPoints: 500,
    maxPoints: 1499,
    benefits: [
      'Tudo do Bronze +',
      'Acesso a relatórios detalhados',
      'Descontos em recompensas (5%)',
      'Destaque no ranking',
    ],
    color: '#C0C0C0',
    badge: '🥈',
  },
  {
    tier: 'gold',
    name: 'Ouro',
    icon: '🥇',
    minPoints: 1500,
    maxPoints: 2999,
    benefits: [
      'Tudo da Prata +',
      'Acesso a recompensas exclusivas',
      'Descontos em recompensas (10%)',
      'Prioridade em aprovações',
      'Medalha no perfil',
    ],
    color: '#FFD700',
    badge: '🥇',
  },
  {
    tier: 'platinum',
    name: 'Platina',
    icon: '💎',
    minPoints: 3000,
    maxPoints: 4999,
    benefits: [
      'Tudo do Ouro +',
      'Recompensas VIP',
      'Descontos em recompensas (15%)',
      'Aprovação automática de recompensas',
      'Acesso a eventos exclusivos',
      'Mentor do programa',
    ],
    color: '#E5E4E2',
    badge: '💎',
  },
  {
    tier: 'diamond',
    name: 'Diamante',
    icon: '💠',
    minPoints: 5000,
    maxPoints: Infinity,
    benefits: [
      'Tudo da Platina +',
      'Acesso VIP total',
      'Recompensas customizadas',
      'Descontos em recompensas (20%)',
      'Reconhecimento especial',
      'Participação em decisões do programa',
    ],
    color: '#B9F2FF',
    badge: '💠',
  },
];

export function useLevelSystem() {
  // Obter nível baseado em pontos
  const getLevelByPoints = useCallback((points: number): Level => {
    const level = LEVELS.find((l) => points >= l.minPoints && points <= l.maxPoints);
    return level || LEVELS[0];
  }, []);

  // Obter progresso para próximo nível
  const getProgressToNextLevel = useCallback((points: number) => {
    const currentLevel = getLevelByPoints(points);
    const currentLevelIndex = LEVELS.findIndex((l) => l.tier === currentLevel.tier);

    if (currentLevelIndex === LEVELS.length - 1) {
      // Já está no nível máximo
      return {
        current: currentLevel.tier,
        next: null,
        currentPoints: points,
        nextLevelMinPoints: Infinity,
        pointsNeeded: 0,
        progress: 100,
      };
    }

    const nextLevel = LEVELS[currentLevelIndex + 1];
    const pointsInCurrentLevel = points - currentLevel.minPoints;
    const pointsNeededForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
    const pointsNeeded = nextLevel.minPoints - points;

    return {
      current: currentLevel.tier,
      next: nextLevel.tier,
      currentPoints: points,
      nextLevelMinPoints: nextLevel.minPoints,
      pointsNeeded: Math.max(0, pointsNeeded),
      progress: Math.min(100, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100),
    };
  }, [getLevelByPoints]);

  // Obter benefícios do nível
  const getLevelBenefits = useCallback((tier: LevelTier): string[] => {
    const level = LEVELS.find((l) => l.tier === tier);
    return level?.benefits || [];
  }, []);

  // Obter desconto do nível
  const getLevelDiscount = useCallback((tier: LevelTier): number => {
    switch (tier) {
      case 'bronze':
        return 0;
      case 'silver':
        return 0.05;
      case 'gold':
        return 0.1;
      case 'platinum':
        return 0.15;
      case 'diamond':
        return 0.2;
      default:
        return 0;
    }
  }, []);

  // Calcular preço com desconto
  const calculateDiscountedPrice = useCallback(
    (originalPrice: number, tier: LevelTier): number => {
      const discount = getLevelDiscount(tier);
      return Math.round(originalPrice * (1 - discount));
    },
    [getLevelDiscount]
  );

  // Obter todos os níveis
  const getAllLevels = useCallback(() => {
    return LEVELS;
  }, []);

  // Obter nível específico
  const getLevelDetails = useCallback((tier: LevelTier): Level | undefined => {
    return LEVELS.find((l) => l.tier === tier);
  }, []);

  // Verificar se desbloqueou novo nível
  const checkLevelUp = useCallback(
    (previousPoints: number, currentPoints: number): LevelTier | null => {
      const previousLevel = getLevelByPoints(previousPoints);
      const currentLevel = getLevelByPoints(currentPoints);

      if (previousLevel.tier !== currentLevel.tier) {
        return currentLevel.tier;
      }

      return null;
    },
    [getLevelByPoints]
  );

  return {
    getLevelByPoints,
    getProgressToNextLevel,
    getLevelBenefits,
    getLevelDiscount,
    calculateDiscountedPrice,
    getAllLevels,
    getLevelDetails,
    checkLevelUp,
    LEVELS,
  };
}

// Componente para exibir progresso de nível
export interface LevelProgressProps {
  points: number;
  showNextLevel?: boolean;
}

export function useLevelProgress({ points, showNextLevel = true }: LevelProgressProps) {
  const { getLevelByPoints, getProgressToNextLevel } = useLevelSystem();

  const currentLevel = useMemo(() => getLevelByPoints(points), [points, getLevelByPoints]);
  const progress = useMemo(
    () => getProgressToNextLevel(points),
    [points, getProgressToNextLevel]
  );

  return {
    currentLevel,
    progress,
    isMaxLevel: progress.next === null,
  };
}
