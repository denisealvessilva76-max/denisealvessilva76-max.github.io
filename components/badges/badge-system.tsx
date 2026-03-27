import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useColors } from '@/hooks/use-colors';

export type BadgeType =
  | 'streak-7'
  | 'hydration-master'
  | 'challenge-champion'
  | 'pressure-control'
  | 'check-in-warrior'
  | 'health-guardian'
  | 'level-bronze'
  | 'level-silver'
  | 'level-gold';

export interface Badge {
  id: BadgeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

const BADGES_CONFIG: Record<BadgeType, Omit<Badge, 'unlockedAt' | 'progress'>> = {
  'streak-7': {
    id: 'streak-7',
    name: '7 Dias Seguidos',
    description: 'Complete check-in por 7 dias consecutivos',
    icon: '🔥',
    color: '#FF6B6B',
  },
  'hydration-master': {
    id: 'hydration-master',
    name: 'Mestre da Hidratação',
    description: 'Beba 2L de água por 30 dias',
    icon: '💧',
    color: '#4ECDC4',
  },
  'challenge-champion': {
    id: 'challenge-champion',
    name: 'Campeão de Desafios',
    description: 'Complete 10 desafios',
    icon: '🏆',
    color: '#FFD93D',
  },
  'pressure-control': {
    id: 'pressure-control',
    name: 'Pressão Controlada',
    description: 'Mantenha pressão normal por 30 dias',
    icon: '❤️',
    color: '#6BCB77',
  },
  'check-in-warrior': {
    id: 'check-in-warrior',
    name: 'Guerreiro de Check-in',
    description: 'Faça 100 check-ins',
    icon: '⚔️',
    color: '#9D4EDD',
  },
  'health-guardian': {
    id: 'health-guardian',
    name: 'Guardião da Saúde',
    description: 'Registre todos os dados de saúde por 30 dias',
    icon: '🛡️',
    color: '#3A86FF',
  },
  'level-bronze': {
    id: 'level-bronze',
    name: 'Nível Bronze',
    description: 'Acumule 500 pontos',
    icon: '🥉',
    color: '#CD7F32',
  },
  'level-silver': {
    id: 'level-silver',
    name: 'Nível Prata',
    description: 'Acumule 1.500 pontos',
    icon: '🥈',
    color: '#C0C0C0',
  },
  'level-gold': {
    id: 'level-gold',
    name: 'Nível Ouro',
    description: 'Acumule 3.000 pontos',
    icon: '🥇',
    color: '#FFD700',
  },
};

export interface BadgeProps {
  badge: Badge;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
}

export function BadgeCard({ badge, size = 'medium', showProgress = false }: BadgeProps) {
  const colors = useColors();
  const isUnlocked = !!badge.unlockedAt;

  const sizeStyles = {
    small: { width: 80, height: 100 },
    medium: { width: 100, height: 130 },
    large: { width: 140, height: 180 },
  };

  const iconSizes = {
    small: 32,
    medium: 48,
    large: 64,
  };

  const style = sizeStyles[size];
  const iconSize = iconSizes[size];

  return (
    <View
      className={`items-center p-2 rounded-lg ${
        isUnlocked ? 'bg-surface' : 'bg-surface opacity-50'
      }`}
      style={{ width: style.width, height: style.height }}
    >
      {/* Ícone */}
      <Text style={{ fontSize: iconSize }}>{badge.icon}</Text>

      {/* Nome */}
      <Text
        className="text-xs font-semibold text-foreground text-center mt-1"
        numberOfLines={2}
      >
        {badge.name}
      </Text>

      {/* Status */}
      {isUnlocked && (
        <View className="mt-1 px-2 py-0.5 bg-success rounded-full">
          <Text className="text-xs font-bold text-white">✓ Desbloqueado</Text>
        </View>
      )}

      {/* Progresso */}
      {showProgress && badge.progress !== undefined && badge.maxProgress !== undefined && (
        <View className="w-full mt-1">
          <Text className="text-xs text-muted text-center">
            {badge.progress}/{badge.maxProgress}
          </Text>
          <View className="w-full h-1 bg-border rounded-full mt-0.5 overflow-hidden">
            <View
              className="h-full bg-primary"
              style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

export interface BadgeGridProps {
  badges: Badge[];
  showProgress?: boolean;
}

export function BadgeGrid({ badges, showProgress = false }: BadgeGridProps) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
    >
      {badges.map((badge) => (
        <View key={badge.id} className="mr-3">
          <BadgeCard badge={badge} size="medium" showProgress={showProgress} />
        </View>
      ))}
    </ScrollView>
  );
}

export interface BadgeDetailProps {
  badge: Badge;
}

export function BadgeDetail({ badge }: BadgeDetailProps) {
  const colors = useColors();
  const isUnlocked = !!badge.unlockedAt;

  return (
    <View className="bg-surface rounded-lg p-6 mb-4">
      {/* Header */}
      <View className="items-center mb-4">
        <Text style={{ fontSize: 80 }}>{badge.icon}</Text>
        <Text className="text-2xl font-bold text-foreground mt-2">{badge.name}</Text>
        {isUnlocked && (
          <Text className="text-sm text-success mt-1">
            Desbloqueado em {new Date(badge.unlockedAt!).toLocaleDateString('pt-BR')}
          </Text>
        )}
      </View>

      {/* Descrição */}
      <Text className="text-base text-muted text-center mb-4">{badge.description}</Text>

      {/* Progresso */}
      {badge.progress !== undefined && badge.maxProgress !== undefined && (
        <View className="bg-background rounded-lg p-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm font-semibold text-foreground">Progresso</Text>
            <Text className="text-sm font-semibold text-primary">
              {badge.progress}/{badge.maxProgress}
            </Text>
          </View>
          <View className="w-full h-2 bg-border rounded-full overflow-hidden">
            <View
              className="h-full bg-primary"
              style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
            />
          </View>
          <Text className="text-xs text-muted mt-2 text-center">
            {Math.round((badge.progress / badge.maxProgress) * 100)}% completo
          </Text>
        </View>
      )}

      {/* Status */}
      {!isUnlocked && (
        <View className="bg-warning bg-opacity-10 rounded-lg p-3 mt-4 border border-warning">
          <Text className="text-sm text-warning font-semibold">
            🔒 Desbloqueie esta insígnia completando o desafio!
          </Text>
        </View>
      )}
    </View>
  );
}

export interface ProfileBadgesProps {
  unlockedBadges: BadgeType[];
  badgeProgress: Record<BadgeType, { progress: number; maxProgress: number }>;
}

export function ProfileBadges({ unlockedBadges, badgeProgress }: ProfileBadgesProps) {
  const colors = useColors();

  const badges: Badge[] = Object.entries(BADGES_CONFIG).map(([id, config]) => {
    const badgeId = id as BadgeType;
    const isUnlocked = unlockedBadges.includes(badgeId);
    const progress = badgeProgress[badgeId];

    return {
      ...config,
      unlockedAt: isUnlocked ? new Date().toISOString() : undefined,
      progress: progress?.progress,
      maxProgress: progress?.maxProgress,
    };
  });

  const unlockedCount = unlockedBadges.length;
  const totalCount = Object.keys(BADGES_CONFIG).length;

  return (
    <View className="bg-surface rounded-lg p-4 mb-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-lg font-bold text-foreground">Insígnias</Text>
          <Text className="text-sm text-muted">
            {unlockedCount} de {totalCount} desbloqueadas
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-primary">{unlockedCount}</Text>
          <Text className="text-xs text-muted">Desbloqueadas</Text>
        </View>
      </View>

      {/* Barra de progresso */}
      <View className="w-full h-2 bg-border rounded-full overflow-hidden mb-4">
        <View
          className="h-full bg-success"
          style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
        />
      </View>

      {/* Grid de insígnias */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {badges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} size="small" showProgress={true} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function useBadgeSystem() {
  // Verificar e desbloquear badges
  const checkAndUnlockBadges = (userStats: {
    checkInStreak: number;
    hydrationDays: number;
    completedChallenges: number;
    pressureControlDays: number;
    totalCheckIns: number;
    totalPoints: number;
  }): BadgeType[] => {
    const unlockedBadges: BadgeType[] = [];

    if (userStats.checkInStreak >= 7) unlockedBadges.push('streak-7');
    if (userStats.hydrationDays >= 30) unlockedBadges.push('hydration-master');
    if (userStats.completedChallenges >= 10) unlockedBadges.push('challenge-champion');
    if (userStats.pressureControlDays >= 30) unlockedBadges.push('pressure-control');
    if (userStats.totalCheckIns >= 100) unlockedBadges.push('check-in-warrior');
    if (userStats.hydrationDays >= 30 && userStats.pressureControlDays >= 30)
      unlockedBadges.push('health-guardian');

    if (userStats.totalPoints >= 500) unlockedBadges.push('level-bronze');
    if (userStats.totalPoints >= 1500) unlockedBadges.push('level-silver');
    if (userStats.totalPoints >= 3000) unlockedBadges.push('level-gold');

    return unlockedBadges;
  };

  // Calcular progresso de badges
  const calculateBadgeProgress = (userStats: {
    checkInStreak: number;
    hydrationDays: number;
    completedChallenges: number;
    pressureControlDays: number;
    totalCheckIns: number;
    totalPoints: number;
  }): Record<BadgeType, { progress: number; maxProgress: number }> => {
    return {
      'streak-7': { progress: Math.min(userStats.checkInStreak, 7), maxProgress: 7 },
      'hydration-master': { progress: Math.min(userStats.hydrationDays, 30), maxProgress: 30 },
      'challenge-champion': {
        progress: Math.min(userStats.completedChallenges, 10),
        maxProgress: 10,
      },
      'pressure-control': {
        progress: Math.min(userStats.pressureControlDays, 30),
        maxProgress: 30,
      },
      'check-in-warrior': { progress: Math.min(userStats.totalCheckIns, 100), maxProgress: 100 },
      'health-guardian': {
        progress: Math.min(
          Math.min(userStats.hydrationDays, 30) + Math.min(userStats.pressureControlDays, 30),
          60
        ),
        maxProgress: 60,
      },
      'level-bronze': { progress: Math.min(userStats.totalPoints, 500), maxProgress: 500 },
      'level-silver': { progress: Math.min(userStats.totalPoints, 1500), maxProgress: 1500 },
      'level-gold': { progress: Math.min(userStats.totalPoints, 3000), maxProgress: 3000 },
    };
  };

  return {
    checkAndUnlockBadges,
    calculateBadgeProgress,
    BADGES_CONFIG,
  };
}
