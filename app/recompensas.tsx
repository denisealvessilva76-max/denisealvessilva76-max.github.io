import { View, Text, ScrollView, TouchableOpacity, Alert, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useColors } from "@/hooks/use-colors";
import { useHealthData } from "@/hooks/use-health-data";
import { useGamification } from "@/hooks/use-gamification";
import { useRewards } from "@/hooks/use-rewards";
import { Reward, RewardCategory } from "@/lib/rewards-types";

const CATEGORIES = [
  { id: "todos" as const, label: "Todos", emoji: "🎁" },
  { id: "vale-compras" as RewardCategory, label: "Vale-Compras", emoji: "🛒" },
  { id: "brindes" as RewardCategory, label: "Brindes", emoji: "🎁" },
  { id: "beneficios" as RewardCategory, label: "Benefícios", emoji: "🏖️" },
  { id: "reconhecimento" as RewardCategory, label: "Reconhecimento", emoji: "⭐" },
];

export default function RecompensasScreen() {
  const router = useRouter();
  const colors = useColors();
  const { checkIns } = useHealthData();
  const { stats: gamificationStats } = useGamification(checkIns);
  const { rewards, stats, canRedeem, redeemReward, isLoading } = useRewards(gamificationStats.totalPoints);
  
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory | "todos">("todos");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const filteredRewards = selectedCategory === "todos" 
    ? rewards 
    : rewards.filter((r) => r.category === selectedCategory);

  const handleCategoryPress = (category: RewardCategory | "todos") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const handleRedeemPress = async (reward: Reward) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const check = canRedeem(reward);
    if (!check.canRedeem) {
      Alert.alert("Não é possível resgatar", check.reason || "Verifique os requisitos");
      return;
    }

    Alert.alert(
      "Confirmar Resgate",
      `Deseja resgatar "${reward.title}" por ${reward.pointsCost} pontos?\n\nSeus pontos atuais: ${gamificationStats.totalPoints}\nPontos após resgate: ${gamificationStats.totalPoints - reward.pointsCost}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setIsRedeeming(true);
            const result = await redeemReward(reward);
            setIsRedeeming(false);

            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Sucesso! 🎉", result.message, [
                { text: "Ver Meus Resgates", onPress: () => router.push("/meus-resgates") },
                { text: "OK" },
              ]);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Erro", result.message);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (reward: Reward) => {
    if (reward.status === "esgotado") {
      return { label: "ESGOTADO", color: colors.error };
    }
    if (reward.status === "em-breve") {
      return { label: "EM BREVE", color: colors.warning };
    }
    if (reward.stock > 0 && reward.stock <= 3) {
      return { label: `${reward.stock} RESTANTES`, color: colors.warning };
    }
    return null;
  };

  const getCategoryColor = (category: RewardCategory) => {
    const colorMap = {
      "vale-compras": colors.primary,
      "brindes": "#EC4899", // Pink
      "beneficios": "#10B981", // Green
      "reconhecimento": "#F59E0B", // Amber
    };
    return colorMap[category];
  };

  if (isLoading) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-foreground">Carregando recompensas...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">🎁 Recompensas</Text>
            <Text className="text-base text-muted">
              Resgate prêmios com seus pontos acumulados!
            </Text>
          </View>

          {/* Saldo de Pontos */}
          <Card className="bg-primary/10 border border-primary gap-3">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-muted">Seus Pontos Disponíveis</Text>
                <Text className="text-3xl font-bold text-primary">{gamificationStats.totalPoints}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/meus-resgates");
                }}
                className="bg-primary px-4 py-2 rounded-lg active:opacity-80"
              >
                <Text className="text-background font-semibold">Meus Resgates</Text>
              </TouchableOpacity>
            </View>
            {stats.pendingRedemptions > 0 && (
              <Text className="text-sm text-warning">
                ⏳ {stats.pendingRedemptions} resgate(s) pendente(s) de aprovação
              </Text>
            )}
          </Card>

          {/* Filtros de Categoria */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleCategoryPress(cat.id)}
                className={`px-4 py-2 rounded-full flex-row items-center ${
                  selectedCategory === cat.id ? "bg-primary" : "bg-surface"
                }`}
                style={{
                  borderWidth: selectedCategory === cat.id ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <Text className="mr-2">{cat.emoji}</Text>
                <Text
                  className={`font-semibold ${
                    selectedCategory === cat.id ? "text-background" : "text-foreground"
                  }`}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Lista de Recompensas */}
          <View className="gap-3">
            {filteredRewards.map((reward) => {
              const check = canRedeem(reward);
              const statusBadge = getStatusBadge(reward);

              return (
                <Card key={reward.id} className="gap-3">
                  <View className="flex-row items-start gap-4">
                    {/* Ícone */}
                    <View
                      className="w-16 h-16 rounded-full items-center justify-center"
                      style={{ backgroundColor: getCategoryColor(reward.category) + "20" }}
                    >
                      <Text className="text-3xl">{reward.icon}</Text>
                    </View>

                    {/* Informações */}
                    <View className="flex-1 gap-2">
                      <View className="flex-row items-start justify-between">
                        <Text className="text-base font-bold text-foreground flex-1">
                          {reward.title}
                        </Text>
                        {statusBadge && (
                          <View
                            className="px-2 py-1 rounded"
                            style={{ backgroundColor: statusBadge.color + "20" }}
                          >
                            <Text
                              className="text-xs font-semibold"
                              style={{ color: statusBadge.color }}
                            >
                              {statusBadge.label}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text className="text-sm text-muted">{reward.description}</Text>

                      {/* Custo em Pontos */}
                      <View className="flex-row items-center justify-between mt-1">
                        <View className="flex-row items-center gap-1">
                          <Text className="text-lg font-bold text-primary">
                            {reward.pointsCost}
                          </Text>
                          <Text className="text-xs text-muted">pontos</Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleRedeemPress(reward)}
                          disabled={!check.canRedeem || isRedeeming}
                          className={`px-4 py-2 rounded-lg ${
                            check.canRedeem ? "bg-primary" : "bg-surface"
                          }`}
                          style={{
                            opacity: check.canRedeem && !isRedeeming ? 1 : 0.5,
                          }}
                        >
                          <Text
                            className={`font-semibold ${
                              check.canRedeem ? "text-background" : "text-muted"
                            }`}
                          >
                            {check.canRedeem ? "Resgatar" : "Indisponível"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {!check.canRedeem && check.reason && (
                        <Text className="text-xs text-warning">💡 {check.reason}</Text>
                      )}
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>

          {filteredRewards.length === 0 && (
            <Card className="items-center py-8 gap-2">
              <Text className="text-4xl">🔍</Text>
              <Text className="text-base text-muted">Nenhuma recompensa encontrada</Text>
            </Card>
          )}

          {/* Dica */}
          <Card className="bg-success/10 border border-success gap-2">
            <Text className="text-sm font-semibold text-success">💡 Dica</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Acumule pontos fazendo check-ins, mantendo-se hidratado e completando desafios para
              resgatar recompensas incríveis!
            </Text>
          </Card>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
