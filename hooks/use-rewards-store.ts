import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RewardType = 'certificate' | 'break' | 'voucher' | 'highlight' | 'badge' | 'title';

export interface Reward {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  type: RewardType;
  category: 'professional' | 'personal' | 'exclusive';
  available: boolean;
  requiresApproval: boolean;
  expiresIn?: number; // dias
}

export interface UserReward {
  id: string;
  rewardId: string;
  purchasedAt: string;
  expiresAt?: string;
  status: 'pending' | 'approved' | 'rejected' | 'used' | 'expired';
  approvedBy?: string;
  approvedAt?: string;
}

const AVAILABLE_REWARDS: Reward[] = [
  {
    id: 'cert-health',
    name: 'Certificado de Saúde',
    description: 'Certificado digital comprovando participação no programa',
    icon: '📜',
    cost: 500,
    type: 'certificate',
    category: 'professional',
    available: true,
    requiresApproval: false,
  },
  {
    id: 'cert-wellness',
    name: 'Certificado de Bem-Estar',
    description: 'Certificado de conclusão do programa de bem-estar',
    icon: '🎓',
    cost: 750,
    type: 'certificate',
    category: 'professional',
    available: true,
    requiresApproval: false,
  },
  {
    id: 'break-1h',
    name: 'Folga de 1 Hora',
    description: 'Uma hora de folga remunerada',
    icon: '⏰',
    cost: 1000,
    type: 'break',
    category: 'personal',
    available: true,
    requiresApproval: true,
    expiresIn: 30,
  },
  {
    id: 'break-half',
    name: 'Meia Folga',
    description: 'Meia hora de folga remunerada',
    icon: '⏱️',
    cost: 600,
    type: 'break',
    category: 'personal',
    available: true,
    requiresApproval: true,
    expiresIn: 30,
  },
  {
    id: 'voucher-lunch',
    name: 'Vale-Lanche',
    description: 'Vale de R$ 50 para lanchonete parceira',
    icon: '🍔',
    cost: 800,
    type: 'voucher',
    category: 'personal',
    available: true,
    requiresApproval: false,
    expiresIn: 60,
  },
  {
    id: 'voucher-coffee',
    name: 'Vale-Café',
    description: 'Vale de R$ 30 para café da manhã',
    icon: '☕',
    cost: 500,
    type: 'voucher',
    category: 'personal',
    available: true,
    requiresApproval: false,
    expiresIn: 60,
  },
  {
    id: 'highlight-week',
    name: 'Destaque da Semana',
    description: 'Seu nome em destaque no mural da empresa',
    icon: '⭐',
    cost: 300,
    type: 'highlight',
    category: 'exclusive',
    available: true,
    requiresApproval: false,
    expiresIn: 7,
  },
  {
    id: 'highlight-month',
    name: 'Destaque do Mês',
    description: 'Seu nome em destaque no mural por um mês',
    icon: '🌟',
    cost: 800,
    type: 'highlight',
    category: 'exclusive',
    available: true,
    requiresApproval: false,
    expiresIn: 30,
  },
  {
    id: 'badge-custom',
    name: 'Insígnia Personalizada',
    description: 'Crie sua própria insígnia com nome customizado',
    icon: '🏅',
    cost: 1200,
    type: 'badge',
    category: 'exclusive',
    available: true,
    requiresApproval: true,
  },
  {
    id: 'title-champion',
    name: 'Título: Campeão de Saúde',
    description: 'Título exclusivo para seu perfil',
    icon: '👑',
    cost: 2000,
    type: 'title',
    category: 'exclusive',
    available: true,
    requiresApproval: false,
  },
];

export function useRewardsStore() {
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<UserReward[]>([]);

  // Carregar recompensas do usuário
  const loadUserRewards = useCallback(async (userId: string) => {
    try {
      const stored = await AsyncStorage.getItem(`rewards_${userId}`);
      if (stored) {
        setUserRewards(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar recompensas:', error);
    }
  }, []);

  // Comprar recompensa
  const purchaseReward = useCallback(
    async (userId: string, rewardId: string, userPoints: number) => {
      const reward = AVAILABLE_REWARDS.find((r) => r.id === rewardId);

      if (!reward) {
        throw new Error('Recompensa não encontrada');
      }

      if (userPoints < reward.cost) {
        throw new Error('Pontos insuficientes');
      }

      const newReward: UserReward = {
        id: `${rewardId}_${Date.now()}`,
        rewardId,
        purchasedAt: new Date().toISOString(),
        expiresAt: reward.expiresIn
          ? new Date(Date.now() + reward.expiresIn * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
        status: reward.requiresApproval ? 'pending' : 'approved',
      };

      const updated = [...userRewards, newReward];
      setUserRewards(updated);
      setPurchaseHistory([...purchaseHistory, newReward]);

      // Salvar no AsyncStorage
      await AsyncStorage.setItem(`rewards_${userId}`, JSON.stringify(updated));

      return newReward;
    },
    [userRewards, purchaseHistory]
  );

  // Usar recompensa
  const useReward = useCallback(
    async (userId: string, userRewardId: string) => {
      const updated = userRewards.map((r) =>
        r.id === userRewardId ? { ...r, status: 'used' as const } : r
      );

      setUserRewards(updated);
      await AsyncStorage.setItem(`rewards_${userId}`, JSON.stringify(updated));
    },
    [userRewards]
  );

  // Aprovar recompensa (admin)
  const approveReward = useCallback(
    async (userId: string, userRewardId: string, adminId: string) => {
      const updated = userRewards.map((r) =>
        r.id === userRewardId
          ? {
              ...r,
              status: 'approved' as const,
              approvedBy: adminId,
              approvedAt: new Date().toISOString(),
            }
          : r
      );

      setUserRewards(updated);
      await AsyncStorage.setItem(`rewards_${userId}`, JSON.stringify(updated));
    },
    [userRewards]
  );

  // Rejeitar recompensa (admin)
  const rejectReward = useCallback(
    async (userId: string, userRewardId: string, adminId: string) => {
      const updated = userRewards.map((r) =>
        r.id === userRewardId
          ? {
              ...r,
              status: 'rejected' as const,
              approvedBy: adminId,
              approvedAt: new Date().toISOString(),
            }
          : r
      );

      setUserRewards(updated);
      await AsyncStorage.setItem(`rewards_${userId}`, JSON.stringify(updated));
    },
    [userRewards]
  );

  // Obter recompensas pendentes de aprovação
  const getPendingRewards = useCallback(() => {
    return userRewards.filter((r) => r.status === 'pending');
  }, [userRewards]);

  // Obter recompensas ativas
  const getActiveRewards = useCallback(() => {
    return userRewards.filter((r) => r.status === 'approved' && !r.expiresAt);
  }, [userRewards]);

  // Obter recompensas expiradas
  const getExpiredRewards = useCallback(() => {
    const now = new Date();
    return userRewards.filter((r) => {
      if (!r.expiresAt) return false;
      return new Date(r.expiresAt) < now;
    });
  }, [userRewards]);

  // Obter detalhes da recompensa
  const getRewardDetails = useCallback((rewardId: string): Reward | undefined => {
    return AVAILABLE_REWARDS.find((r) => r.id === rewardId);
  }, []);

  // Obter todas as recompensas disponíveis
  const getAvailableRewards = useCallback(() => {
    return AVAILABLE_REWARDS.filter((r) => r.available);
  }, []);

  // Filtrar recompensas por categoria
  const getRewardsByCategory = useCallback((category: 'professional' | 'personal' | 'exclusive') => {
    return AVAILABLE_REWARDS.filter((r) => r.category === category && r.available);
  }, []);

  return {
    userRewards,
    purchaseHistory,
    loadUserRewards,
    purchaseReward,
    useReward,
    approveReward,
    rejectReward,
    getPendingRewards,
    getActiveRewards,
    getExpiredRewards,
    getRewardDetails,
    getAvailableRewards,
    getRewardsByCategory,
    AVAILABLE_REWARDS,
  };
}
