import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useColors } from "@/hooks/use-colors";
import { Redemption, RedemptionStatus } from "@/lib/rewards-types";

const REDEMPTIONS_STORAGE_KEY = "user_redemptions";

export default function AdminResgatesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<RedemptionStatus | "todos">("todos");

  useEffect(() => {
    loadRedemptions();
  }, []);

  const loadRedemptions = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(REDEMPTIONS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setRedemptions(data);
      }
    } catch (error) {
      console.error("Erro ao carregar resgates:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRedemptions();
  };

  const updateRedemptionStatus = async (
    redemptionId: string,
    newStatus: RedemptionStatus,
    notes?: string
  ) => {
    try {
      const updatedRedemptions = redemptions.map((r) => {
        if (r.id === redemptionId) {
          const updated = { ...r, status: newStatus, notes };
          if (newStatus === "aprovado") {
            updated.approvedAt = new Date().toISOString();
          } else if (newStatus === "entregue") {
            updated.deliveredAt = new Date().toISOString();
          }
          return updated;
        }
        return r;
      });

      setRedemptions(updatedRedemptions);
      await AsyncStorage.setItem(REDEMPTIONS_STORAGE_KEY, JSON.stringify(updatedRedemptions));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", "Status atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      Alert.alert("Erro", "Não foi possível atualizar o status");
    }
  };

  const handleApprove = (redemption: Redemption) => {
    Alert.alert(
      "Aprovar Resgate",
      `Aprovar resgate de "${redemption.rewardTitle}" para ${redemption.userName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprovar",
          onPress: () => updateRedemptionStatus(redemption.id, "aprovado", "Aprovado pelo SESMT"),
        },
      ]
    );
  };

  const handleDeliver = (redemption: Redemption) => {
    Alert.alert(
      "Marcar como Entregue",
      `Confirmar entrega de "${redemption.rewardTitle}" para ${redemption.userName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => updateRedemptionStatus(redemption.id, "entregue", "Prêmio entregue"),
        },
      ]
    );
  };

  const handleCancel = (redemption: Redemption) => {
    Alert.prompt(
      "Cancelar Resgate",
      `Motivo do cancelamento de "${redemption.rewardTitle}":`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: (reason?: string) =>
            updateRedemptionStatus(redemption.id, "cancelado", reason || "Cancelado pelo admin"),
        },
      ],
      "plain-text"
    );
  };

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

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredRedemptions =
    filter === "todos" ? redemptions : redemptions.filter((r) => r.status === filter);

  const stats = {
    total: redemptions.length,
    pendente: redemptions.filter((r) => r.status === "pendente").length,
    aprovado: redemptions.filter((r) => r.status === "aprovado").length,
    entregue: redemptions.filter((r) => r.status === "entregue").length,
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
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
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
              <Text className="text-3xl font-bold text-foreground">🎁 Gestão de Resgates</Text>
              <Text className="text-base text-muted">Aprovar e gerenciar recompensas</Text>
            </View>
          </View>

          {/* Estatísticas */}
          <View className="flex-row gap-3">
            <Card className="flex-1 items-center gap-1">
              <Text className="text-2xl font-bold text-foreground">{stats.total}</Text>
              <Text className="text-xs text-muted text-center">Total</Text>
            </Card>
            <Card className="flex-1 items-center gap-1">
              <Text className="text-2xl font-bold text-warning">{stats.pendente}</Text>
              <Text className="text-xs text-muted text-center">Pendentes</Text>
            </Card>
            <Card className="flex-1 items-center gap-1">
              <Text className="text-2xl font-bold text-primary">{stats.aprovado}</Text>
              <Text className="text-xs text-muted text-center">Aprovados</Text>
            </Card>
            <Card className="flex-1 items-center gap-1">
              <Text className="text-2xl font-bold text-success">{stats.entregue}</Text>
              <Text className="text-xs text-muted text-center">Entregues</Text>
            </Card>
          </View>

          {/* Filtros */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(["todos", "pendente", "aprovado", "entregue", "cancelado"] as const).map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilter(status);
                }}
                className={`px-4 py-2 rounded-full ${
                  filter === status ? "bg-primary" : "bg-surface"
                }`}
                style={{
                  borderWidth: filter === status ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  className={`font-semibold ${
                    filter === status ? "text-background" : "text-foreground"
                  }`}
                >
                  {status === "todos" ? "Todos" : getStatusLabel(status as RedemptionStatus)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Lista de Resgates */}
          {filteredRedemptions.length > 0 ? (
            <View className="gap-3">
              {filteredRedemptions
                .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
                .map((redemption) => (
                  <Card key={redemption.id} className="gap-3">
                    <View className="gap-3">
                      {/* Informações do Resgate */}
                      <View className="gap-2">
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1">
                            <Text className="text-base font-bold text-foreground">
                              {redemption.rewardTitle}
                            </Text>
                            <Text className="text-sm text-muted">
                              Solicitado por: {redemption.userName}
                            </Text>
                          </View>
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
                        </View>

                        <View className="flex-row items-center gap-4">
                          <View className="flex-row items-center gap-1">
                            <Text className="text-sm font-semibold text-primary">
                              {redemption.pointsCost}
                            </Text>
                            <Text className="text-xs text-muted">pontos</Text>
                          </View>
                          <Text className="text-xs text-muted">
                            {formatDate(redemption.requestedAt)}
                          </Text>
                        </View>

                        {redemption.notes && (
                          <View className="bg-surface rounded-lg p-2">
                            <Text className="text-xs text-muted">📝 {redemption.notes}</Text>
                          </View>
                        )}
                      </View>

                      {/* Ações */}
                      {redemption.status === "pendente" && (
                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            onPress={() => handleApprove(redemption)}
                            className="flex-1 bg-success rounded-lg py-2 active:opacity-80"
                          >
                            <Text className="text-center text-background font-semibold">
                              ✅ Aprovar
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleCancel(redemption)}
                            className="flex-1 bg-error rounded-lg py-2 active:opacity-80"
                          >
                            <Text className="text-center text-background font-semibold">
                              ❌ Cancelar
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {redemption.status === "aprovado" && (
                        <TouchableOpacity
                          onPress={() => handleDeliver(redemption)}
                          className="bg-primary rounded-lg py-2 active:opacity-80"
                        >
                          <Text className="text-center text-background font-semibold">
                            📦 Marcar como Entregue
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Card>
                ))}
            </View>
          ) : (
            <Card className="items-center py-12 gap-3">
              <Text className="text-6xl">🔍</Text>
              <Text className="text-lg font-semibold text-foreground">Nenhum resgate encontrado</Text>
              <Text className="text-sm text-muted text-center px-4">
                {filter === "todos"
                  ? "Ainda não há resgates solicitados"
                  : `Nenhum resgate com status "${getStatusLabel(filter as RedemptionStatus)}"`}
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
