import { ScrollView, Text, View, TouchableOpacity, Pressable, RefreshControl } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
// useFocusEffect removido para evitar loops
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useHealthData } from "@/hooks/use-health-data";
import { useGamification } from "@/hooks/use-gamification";
import { usePersonalDashboard } from "@/hooks/use-personal-dashboard";
import { CheckInStatus } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const CHECK_IN_OPTIONS: Array<{ status: CheckInStatus; emoji: string; label: string; color: string }> = [
  { status: "bem", emoji: "😊", label: "Tudo bem", color: "bg-success" },
  { status: "dor-leve", emoji: "😐", label: "Com dor leve", color: "bg-warning" },
  { status: "dor-forte", emoji: "😞", label: "Com dor forte", color: "bg-error" },
];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { addCheckIn, getTodayCheckIn, isLoading, checkIns } = useHealthData();
  const { stats: gamificationStats } = useGamification(checkIns);
  const { stats: dashboardStats, loading: dashboardLoading, refresh } = usePersonalDashboard();
  const [todayCheckIn, setTodayCheckIn] = useState(getTodayCheckIn());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setTodayCheckIn(getTodayCheckIn());
  }, [checkIns]);

  // Refresh manual apenas - useFocusEffect removido para evitar loops

  const handleCheckIn = async (status: CheckInStatus) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Se reportar dor, abrir formulário detalhado
    if (status === "dor-leve" || status === "dor-forte") {
      router.push({
        pathname: "/complaint-form",
        params: { severity: status === "dor-leve" ? "leve" : "forte" }
      });
      return;
    }
    
    const result = await addCheckIn(status);
    if (result) {
      setTodayCheckIn(result);
      refresh(); // Atualizar dashboard
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getCheckInEmoji = (status: CheckInStatus) => {
    const option = CHECK_IN_OPTIONS.find((o) => o.status === status);
    return option?.emoji || "❓";
  };

  const getCheckInLabel = (status: CheckInStatus) => {
    const option = CHECK_IN_OPTIONS.find((o) => o.status === status);
    return option?.label || "Desconhecido";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving": return "📈";
      case "worsening": return "📉";
      case "stable": return "➡️";
      default: return "—";
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case "improving": return "Melhorando";
      case "worsening": return "Piorando";
      case "stable": return "Estável";
      default: return "Sem dados";
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving": return colors.success;
      case "worsening": return colors.error;
      case "stable": return colors.warning;
      default: return colors.muted;
    }
  };

  // Removido loading screen que causava loop - mostrar conteúdo direto

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <View className="gap-6">
          {/* Saudação */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">{getGreeting()}</Text>
            <Text className="text-base text-muted">Como você está se sentindo hoje?</Text>
          </View>

          {/* Check-in Rápido */}
          {!todayCheckIn ? (
            <Card className="gap-4">
              <Text className="text-lg font-semibold text-foreground">Check-in Rápido</Text>
              <View className="gap-3">
                {CHECK_IN_OPTIONS.map((option) => (
                  <Pressable
                    key={option.status}
                    onPress={() => handleCheckIn(option.status)}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View className={`flex-row items-center gap-3 p-4 rounded-xl ${option.color}/10 border border-${option.color}`}>
                      <Text className="text-3xl">{option.emoji}</Text>
                      <Text className="flex-1 text-base font-semibold text-foreground">
                        {option.label}
                      </Text>
                      <Text className="text-2xl">→</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : (
            <Card className="gap-3 bg-success/10 border border-success">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Text className="text-3xl">{getCheckInEmoji(todayCheckIn.status)}</Text>
                  <View>
                    <Text className="text-sm text-muted">Check-in de hoje</Text>
                    <Text className="text-lg font-semibold text-foreground">
                      {getCheckInLabel(todayCheckIn.status)}
                    </Text>
                  </View>
                </View>
                <Text className="text-2xl">✓</Text>
              </View>
            </Card>
          )}

          {/* Gamificação - Ranking, Conquistas e Recompensas */}
          <View className="gap-3">
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/ranking");
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="flex-1"
              >
                <Card className="bg-warning/10 border border-warning items-center gap-2">
                  <Text className="text-3xl">🏆</Text>
                  <Text className="text-sm font-semibold text-foreground">Ranking</Text>
                  <Text className="text-xs text-muted text-center">Veja sua posição</Text>
                </Card>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/conquistas");
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="flex-1"
              >
                <Card className="bg-primary/10 border border-primary items-center gap-2">
                  <Text className="text-3xl">🎖️</Text>
                  <Text className="text-sm font-semibold text-foreground">Conquistas</Text>
                  <Text className="text-xs text-muted text-center">Desbloqueie medalhas</Text>
                </Card>
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/recompensas");
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Card className="bg-success/10 border border-success flex-row items-center justify-between px-4 py-3">
                <View className="flex-row items-center gap-3">
                  <Text className="text-3xl">🎁</Text>
                  <View>
                    <Text className="text-sm font-semibold text-foreground">Recompensas</Text>
                    <Text className="text-xs text-muted">Resgate prêmios com seus pontos</Text>
                  </View>
                </View>
                <Text className="text-2xl">→</Text>
              </Card>
            </Pressable>
          </View>

          {/* Dashboard Pessoal - Resumo Semanal */}
          <Card className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">📊 Resumo da Semana</Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-sm font-bold text-primary">{gamificationStats.totalPoints}</Text>
                <Text className="text-xs text-muted">pts</Text>
              </View>
            </View>
            
            <View className="flex-row gap-3">
              {/* Check-ins */}
              <View className="flex-1 bg-primary/10 rounded-xl p-3 border border-primary">
                <Text className="text-xs text-muted mb-1">Check-ins</Text>
                <Text className="text-2xl font-bold text-foreground">{dashboardStats.checkIns.thisWeek}</Text>
                <View className="flex-row items-center gap-1 mt-1">
                  <Text className="text-xs text-muted">Sequência:</Text>
                  <Text className="text-xs font-semibold text-primary">{dashboardStats.checkIns.streak} dias 🔥</Text>
                </View>
              </View>

              {/* Hidratação */}
              <View className="flex-1 bg-blue-500/10 rounded-xl p-3 border border-blue-500">
                <Text className="text-xs text-muted mb-1">Hidratação</Text>
                <Text className="text-2xl font-bold text-foreground">{dashboardStats.hydration.thisWeek}</Text>
                <Text className="text-xs text-muted mt-1">
                  Média: {dashboardStats.hydration.averagePerDay}/dia
                </Text>
              </View>

              {/* Desafios */}
              <View className="flex-1 bg-orange-500/10 rounded-xl p-3 border border-orange-500">
                <Text className="text-xs text-muted mb-1">Desafios</Text>
                <Text className="text-2xl font-bold text-foreground">{dashboardStats.challenges.completed}</Text>
                <Text className="text-xs text-muted mt-1">
                  {dashboardStats.challenges.completionRate}% completos
                </Text>
              </View>
            </View>
          </Card>

          {/* Evolução de Sintomas */}
          <Card className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">📈 Evolução de Sintomas</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-xl">{getTrendIcon(dashboardStats.symptoms.trend)}</Text>
                <Text
                  className="text-sm font-semibold"
                  style={{ color: getTrendColor(dashboardStats.symptoms.trend) }}
                >
                  {getTrendLabel(dashboardStats.symptoms.trend)}
                </Text>
              </View>
            </View>

            {/* Gráfico Simples (últimos 7 dias) */}
            <View className="flex-row items-end justify-between gap-2 h-24">
              {dashboardStats.symptoms.lastSevenDays.map((day, index) => {
                const maxLevel = 10;
                const height = (day.level / maxLevel) * 100;
                const barColor = day.level === 0 ? colors.success : day.level <= 3 ? colors.warning : colors.error;

                return (
                  <View key={index} className="flex-1 items-center gap-1">
                    <View className="flex-1 w-full justify-end">
                      <View
                        style={{
                          height: `${height}%`,
                          backgroundColor: barColor,
                          borderRadius: 4,
                        }}
                      />
                    </View>
                    <Text className="text-xs text-muted">
                      {new Date(day.date).getDate()}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text className="text-xs text-center text-muted">Últimos 7 dias</Text>
          </Card>

          {/* Próximas Ações Sugeridas */}
          {dashboardStats.suggestedActions.length > 0 && (
            <Card className="gap-4">
              <Text className="text-lg font-semibold text-foreground">✨ Próximas Ações</Text>
              <View className="gap-3">
                {dashboardStats.suggestedActions.slice(0, 3).map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(action.action as any);
                    }}
                    className="flex-row items-center gap-3 p-3 rounded-xl bg-surface border border-border active:opacity-70"
                    style={{
                      opacity: action.completed ? 0.6 : 1,
                      backgroundColor: action.completed ? colors.success + "10" : colors.surface,
                    }}
                  >
                    <Text className="text-2xl">{action.icon}</Text>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm font-semibold text-foreground">{action.title}</Text>
                        {action.completed && (
                          <Text className="text-lg">✅</Text>
                        )}
                      </View>
                      <Text className="text-xs text-muted mt-1">{action.description}</Text>
                    </View>
                    {action.priority === "high" && !action.completed && (
                      <View className="bg-error/20 px-2 py-1 rounded">
                        <Text className="text-xs font-semibold text-error">URGENTE</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}

          {/* Ações Rápidas */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Ações Rápidas</Text>
            <TouchableOpacity
              className="bg-primary rounded-xl p-4 active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/saude");
              }}
            >
              <Text className="text-center font-semibold text-white">
                + Registrar Pressão Arterial
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-purple-500/20 rounded-xl p-4 active:opacity-80 border border-purple-500"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/videos-alongamento" as any);
              }}
            >
              <Text className="text-center font-semibold text-purple-500">
                🧘 Vídeos de Alongamento
              </Text>
            </TouchableOpacity>

          </View>

          {/* Dica do Dia */}
          <Card className="bg-primary/10 border border-primary gap-2">
            <Text className="text-sm font-semibold text-primary">💡 Dica do Dia</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Faça uma pausa a cada 2 horas para alongar os ombros e costas. Isso reduz o risco de doenças musculoesqueléticas.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
