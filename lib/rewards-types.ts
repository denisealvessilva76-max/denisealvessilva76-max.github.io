export type RewardCategory = "vale-compras" | "brindes" | "beneficios" | "reconhecimento";

export type RewardStatus = "disponivel" | "esgotado" | "em-breve";

export type RedemptionStatus = "pendente" | "aprovado" | "entregue" | "cancelado";

export interface Reward {
  id: string;
  title: string;
  description: string;
  category: RewardCategory;
  pointsCost: number;
  icon: string; // emoji
  status: RewardStatus;
  stock: number; // quantidade disponível (-1 = ilimitado)
  imageUrl?: string;
  termsAndConditions?: string;
}

export interface Redemption {
  id: string;
  userId: string;
  userName: string;
  rewardId: string;
  rewardTitle: string;
  pointsCost: number;
  status: RedemptionStatus;
  requestedAt: string; // ISO date
  approvedAt?: string; // ISO date
  deliveredAt?: string; // ISO date
  notes?: string; // observações do admin
}

export interface UserRewardsStats {
  totalRedemptions: number;
  pendingRedemptions: number;
  totalPointsSpent: number;
  availablePoints: number;
}
