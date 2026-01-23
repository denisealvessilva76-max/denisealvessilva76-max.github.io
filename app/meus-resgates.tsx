import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useColors } from "@/hooks/use-colors";
import { useHealthData } from "@/hooks/use-health-data";
import { useGamification } from "@/hooks/use-gamification";
import { useRewards } from "@/hooks/use-rewards";
import { Redemption, RedemptionStatus } from "@/lib/rewards-types";

export default function MeusResgatesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { checkIns } = useHealthData();
  const { stats: gamificationStats } = useGamification(checkIns);
  const { redemptions, stats, isLoading } = useRewards(gamificationStats.totalPoints);

  const getStatusColor = (status: RedemptionStatus) => {
    switch (status) {
      case "pendente":
        return colors.warning;
      case "aprovado":
        return colors.primary;
      case "entregue":
        return colors.success;
      case "cancelado":
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const getStatusLabel = (status: RedemptionStatus) => {
    switch (status) {
      case "pendente":
        return "Pendente";
      case "aprovado":
        return "Aprovado";
      case "entregue":
        return "Entregue";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: RedemptionStatus) => {
    switch (status) {
      case "pendente":
        return "⏳";
      case "aprovado":
        return "✅";
      case "entregue":
        return "🎉";
      case "cancelado":
        return "❌";
      default:
        return "📦";
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-foreground">Carregando resgates...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
            >
              <Text className="text-2xl">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-3xl font-bold text-foreground">📦 Meus Resgates</Text>
              <Text className="text-base text-muted">Acompanhe seus prêmios resgatados</Text>
            </View>
          </View>

          {/* Estatísticas */}
          <View className="flex-row gap-3">
            <Card className="flex-1 items-center gap-1">
              <Text className="text-2xl font-bold text-foreground">{stats.totalRedemptions}</Text>
              <Text className="text-xs text-muted text-center">Total de Resgates</Text>
            </Card>
            <Card className="flex-1 items-center gap-1">
              <Text className="text-2xl font-bold text-warning">{stats.pendingRedemptions}</Text>
              <Text className="text-xs text-muted text-center">Pendentes</Text>
            </Card>
            <Card className="flex-1 items-center gap-1">
              <Text className="text-2xl font-bold text-primary">{stats.totalPointsSpent}</Text>
              <Text className="text-xs text-muted text-center">Pontos Gastos</Text>
            </Card>
          </View>

          {/* Lista de Resgates */}
          {redemptions.length > 0 ? (
            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">Histórico</Text>
              {redemptions
                .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
                .map((redemption) => (
                  <Card key={redemption.id} className="gap-3">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 gap-2">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-2xl">{getStatusIcon(redemption.status)}</Text>
                          <Text className="text-base font-bold text-foreground flex-1">
                            {redemption.rewardTitle}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-2">
                          <View
                            className="px-2 py-1 rounded"
                            style={{ backgroundColor: getStatusColor(redemption.status) + "20" }}
                          >
                            <Text
                              className="text-xs font-semibold"
                              style={{ color: getStatusColor(redemption.status) }}
                            >
                              {getStatusLabel(redemption.status).toUpperCase()}
                            </Text>
                          </View>
                          <Text className="text-xs text-muted">
                            {formatDate(redemption.requestedAt)}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-1">
                          <Text className="text-sm font-semibold text-primary">
                            -{redemption.pointsCost}
                          </Text>
                          <Text className="text-xs text-muted">pontos</Text>
                        </View>

                        {redemption.notes && (
                          <View className="bg-surface rounded-lg p-2 mt-1">
                            <Text className="text-xs text-muted">📝 {redemption.notes}</Text>
                          </View>
                        )}

                        {redemption.status === "aprovado" && (
                          <Text className="text-xs text-success">
                            ✅ Aprovado! Retire seu prêmio no SESMT
                          </Text>
                        )}

                        {redemption.status === "entregue" && redemption.deliveredAt && (
                          <Text className="text-xs text-success">
                            🎉 Entregue em {formatDate(redemption.deliveredAt)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </Card>
                ))}
            </View>
          ) : (
            <Card className="items-center py-12 gap-3">
              <Text className="text-6xl">🎁</Text>
              <Text className="text-lg font-semibold text-foreground">Nenhum resgate ainda</Text>
              <Text className="text-sm text-muted text-center px-4">
                Acumule pontos e resgate prêmios incríveis!
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="bg-primary px-6 py-3 rounded-lg mt-2 active:opacity-80"
              >
                <Text className="text-background font-semibold">Ver Recompensas</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* Dica */}
          {redemptions.length > 0 && (
            <Card className="bg-primary/10 border border-primary gap-2">
              <Text className="text-sm font-semibold text-primary">💡 Dica</Text>
              <Text className="text-sm text-foreground leading-relaxed">
                Resgates pendentes serão analisados pelo SESMT em até 3 dias úteis. Você será
                notificado quando seu prêmio estiver pronto para retirada!
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
