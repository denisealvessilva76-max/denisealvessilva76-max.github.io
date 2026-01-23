import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Reward, Redemption, RewardCategory, RedemptionStatus, UserRewardsStats } from "@/lib/rewards-types";

const REWARDS_STORAGE_KEY = "user_rewards";
const REDEMPTIONS_STORAGE_KEY = "user_redemptions";
const CUSTOM_REWARDS_STORAGE_KEY = "custom_rewards_catalog";

// Catálogo de recompensas disponíveis
const REWARDS_CATALOG: Reward[] = [
  // Vale-Compras
  {
    id: "vc-50",
    title: "Vale-Compras R$ 50",
    description: "Vale-compras de R$ 50 para usar em supermercados parceiros",
    category: "vale-compras",
    pointsCost: 500,
    icon: "🛒",
    status: "disponivel",
    stock: 10,
  },
  {
    id: "vc-100",
    title: "Vale-Compras R$ 100",
    description: "Vale-compras de R$ 100 para usar em supermercados parceiros",
    category: "vale-compras",
    pointsCost: 1000,
    icon: "🛒",
    status: "disponivel",
    stock: 5,
  },
  {
    id: "vc-200",
    title: "Vale-Compras R$ 200",
    description: "Vale-compras de R$ 200 para usar em supermercados parceiros",
    category: "vale-compras",
    pointsCost: 2000,
    icon: "🛒",
    status: "disponivel",
    stock: 3,
  },

  // Brindes
  {
    id: "brinde-garrafa",
    title: "Garrafa Térmica Premium",
    description: "Garrafa térmica de 1L com logo da obra, mantém bebidas geladas por 24h",
    category: "brindes",
    pointsCost: 300,
    icon: "🧊",
    status: "disponivel",
    stock: 20,
  },
  {
    id: "brinde-mochila",
    title: "Mochila Resistente",
    description: "Mochila de alta qualidade com compartimentos, ideal para o dia a dia",
    category: "brindes",
    pointsCost: 600,
    icon: "🎒",
    status: "disponivel",
    stock: 15,
  },
  {
    id: "brinde-kit-epi",
    title: "Kit EPIs Premium",
    description: "Kit completo de EPIs de alta qualidade (luvas, óculos, máscara)",
    category: "brindes",
    pointsCost: 800,
    icon: "🦺",
    status: "disponivel",
    stock: 10,
  },

  // Benefícios
  {
    id: "folga-meio-dia",
    title: "Meio Dia de Folga",
    description: "Saia mais cedo em um dia de sua escolha (com aprovação do supervisor)",
    category: "beneficios",
    pointsCost: 1500,
    icon: "🏖️",
    status: "disponivel",
    stock: -1, // ilimitado
  },
  {
    id: "folga-dia-inteiro",
    title: "Dia de Folga Extra",
    description: "Um dia de folga adicional para descansar (com aprovação do supervisor)",
    category: "beneficios",
    pointsCost: 3000,
    icon: "🌴",
    status: "disponivel",
    stock: -1, // ilimitado
  },
  {
    id: "almoco-especial",
    title: "Almoço Especial",
    description: "Almoço especial no refeitório com menu diferenciado para você e 3 amigos",
    category: "beneficios",
    pointsCost: 400,
    icon: "🍽️",
    status: "disponivel",
    stock: -1, // ilimitado
  },

  // Reconhecimento
  {
    id: "certificado-guardiao",
    title: "Certificado Guardião da Saúde",
    description: "Certificado oficial reconhecendo seu compromisso com a saúde e segurança",
    category: "reconhecimento",
    pointsCost: 250,
    icon: "📜",
    status: "disponivel",
    stock: -1, // ilimitado
  },
  {
    id: "destaque-mes",
    title: "Destaque do Mês",
    description: "Seu nome e foto no mural de destaques da obra por 1 mês",
    category: "reconhecimento",
    pointsCost: 1200,
    icon: "⭐",
    status: "disponivel",
    stock: 1, // apenas 1 por mês
  },
];

export function useRewards(availablePoints: number) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [stats, setStats] = useState<UserRewardsStats>({
    totalRedemptions: 0,
    pendingRedemptions: 0,
    totalPointsSpent: 0,
    availablePoints,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRewards();
    loadRedemptions();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [redemptions, availablePoints]);

  const loadRewards = async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_REWARDS_STORAGE_KEY);
      if (stored) {
        const customRewards = JSON.parse(stored);
        setRewards(customRewards);
      } else {
        // Usar catálogo padrão se não houver customização
        setRewards(REWARDS_CATALOG);
      }
    } catch (error) {
      console.error("Erro ao carregar catálogo:", error);
      setRewards(REWARDS_CATALOG);
    }
  };

  const loadRedemptions = async () => {
    try {
      const stored = await AsyncStorage.getItem(REDEMPTIONS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setRedemptions(data);
      }
    } catch (error) {
      console.error("Erro ao carregar resgates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveRedemptions = async (newRedemptions: Redemption[]) => {
    try {
      await AsyncStorage.setItem(REDEMPTIONS_STORAGE_KEY, JSON.stringify(newRedemptions));
    } catch (error) {
      console.error("Erro ao salvar resgates:", error);
    }
  };

  const calculateStats = () => {
    const totalRedemptions = redemptions.length;
    const pendingRedemptions = redemptions.filter((r) => r.status === "pendente").length;
    const totalPointsSpent = redemptions
      .filter((r) => r.status !== "cancelado")
      .reduce((sum, r) => sum + r.pointsCost, 0);

    setStats({
      totalRedemptions,
      pendingRedemptions,
      totalPointsSpent,
      availablePoints,
    });
  };

  const canRedeem = (reward: Reward): { canRedeem: boolean; reason?: string } => {
    if (reward.status === "esgotado") {
      return { canRedeem: false, reason: "Recompensa esgotada" };
    }

    if (reward.status === "em-breve") {
      return { canRedeem: false, reason: "Em breve" };
    }

    if (reward.stock === 0) {
      return { canRedeem: false, reason: "Estoque esgotado" };
    }

    if (availablePoints < reward.pointsCost) {
      return { canRedeem: false, reason: `Faltam ${reward.pointsCost - availablePoints} pontos` };
    }

    return { canRedeem: true };
  };

  const redeemReward = async (reward: Reward): Promise<{ success: boolean; message: string }> => {
    const check = canRedeem(reward);
    if (!check.canRedeem) {
      return { success: false, message: check.reason || "Não foi possível resgatar" };
    }

    // Criar novo resgate
    const newRedemption: Redemption = {
      id: `redemption-${Date.now()}`,
      userId: "user-1", // TODO: pegar do contexto de autenticação
      userName: "Trabalhador", // TODO: pegar do perfil
      rewardId: reward.id,
      rewardTitle: reward.title,
      pointsCost: reward.pointsCost,
      status: "pendente",
      requestedAt: new Date().toISOString(),
    };

    const updatedRedemptions = [...redemptions, newRedemption];
    setRedemptions(updatedRedemptions);
    await saveRedemptions(updatedRedemptions);

    // Atualizar estoque se não for ilimitado
    if (reward.stock > 0) {
      const updatedRewards = rewards.map((r) =>
        r.id === reward.id ? { ...r, stock: r.stock - 1, status: r.stock - 1 === 0 ? "esgotado" as const : r.status } : r
      );
      setRewards(updatedRewards);
    }

    // TODO: Notificar SESMT sobre novo resgate
    // await notifyAdminNewRedemption(newRedemption);

    return {
      success: true,
      message: "Resgate solicitado com sucesso! Aguarde aprovação do SESMT.",
    };
  };

  const getRewardsByCategory = (category: RewardCategory) => {
    return rewards.filter((r) => r.category === category);
  };

  const getRedemptionsByStatus = (status: RedemptionStatus) => {
    return redemptions.filter((r) => r.status === status);
  };

  const getPendingRedemptions = () => {
    return redemptions.filter((r) => r.status === "pendente");
  };

  const getCompletedRedemptions = () => {
    return redemptions.filter((r) => r.status === "entregue");
  };

  // Funções CRUD para gestão do catálogo (admin)
  const saveRewardsCatalog = async (newCatalog: Reward[]) => {
    try {
      await AsyncStorage.setItem(CUSTOM_REWARDS_STORAGE_KEY, JSON.stringify(newCatalog));
      setRewards(newCatalog);
    } catch (error) {
      console.error("Erro ao salvar catálogo:", error);
    }
  };

  const addReward = async (reward: Omit<Reward, "id">): Promise<{ success: boolean; message: string }> => {
    try {
      const newReward: Reward = {
        ...reward,
        id: `reward-${Date.now()}`,
      };
      const updatedCatalog = [...rewards, newReward];
      await saveRewardsCatalog(updatedCatalog);
      return { success: true, message: "Prêmio adicionado com sucesso!" };
    } catch (error) {
      return { success: false, message: "Erro ao adicionar prêmio" };
    }
  };

  const updateReward = async (rewardId: string, updates: Partial<Reward>): Promise<{ success: boolean; message: string }> => {
    try {
      const updatedCatalog = rewards.map((r) =>
        r.id === rewardId ? { ...r, ...updates } : r
      );
      await saveRewardsCatalog(updatedCatalog);
      return { success: true, message: "Prêmio atualizado com sucesso!" };
    } catch (error) {
      return { success: false, message: "Erro ao atualizar prêmio" };
    }
  };

  const deleteReward = async (rewardId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const updatedCatalog = rewards.filter((r) => r.id !== rewardId);
      await saveRewardsCatalog(updatedCatalog);
      return { success: true, message: "Prêmio removido com sucesso!" };
    } catch (error) {
      return { success: false, message: "Erro ao remover prêmio" };
    }
  };

  const adjustStock = async (rewardId: string, newStock: number): Promise<{ success: boolean; message: string }> => {
    try {
      const updatedCatalog = rewards.map((r) =>
        r.id === rewardId ? { ...r, stock: newStock, status: newStock === 0 ? "esgotado" as const : "disponivel" as const } : r
      );
      await saveRewardsCatalog(updatedCatalog);
      return { success: true, message: "Estoque atualizado com sucesso!" };
    } catch (error) {
      return { success: false, message: "Erro ao atualizar estoque" };
    }
  };

  const resetCatalog = async (): Promise<{ success: boolean; message: string }> => {
    try {
      await AsyncStorage.removeItem(CUSTOM_REWARDS_STORAGE_KEY);
      setRewards(REWARDS_CATALOG);
      return { success: true, message: "Catálogo restaurado para o padrão!" };
    } catch (error) {
      return { success: false, message: "Erro ao restaurar catálogo" };
    }
  };

  return {
    rewards,
    redemptions,
    stats,
    isLoading,
    canRedeem,
    redeemReward,
    getRewardsByCategory,
    getRedemptionsByStatus,
    getPendingRedemptions,
    getCompletedRedemptions,
    // Funções CRUD para admin
    addReward,
    updateReward,
    deleteReward,
    adjustStock,
    resetCatalog,
    loadRewards,
  };
}
