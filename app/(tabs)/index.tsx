import { ScrollView, Text, View, TouchableOpacity, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MedalCard } from "@/components/ui/medal-card";
import { useHealthData } from "@/hooks/use-health-data";
import { useGamification } from "@/hooks/use-gamification";
import { CheckInStatus } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";
import { getProgressToNextMedal } from "@/lib/gamification";
import * as Haptics from "expo-haptics";

const CHECK_IN_OPTIONS: Array<{ status: CheckInStatus; emoji: string; label: string; color: string }> = [
  { status: "bem", emoji: "😊", label: "Tudo bem", color: "bg-success" },
  { status: "dor-leve", emoji: "😐", label: "Com dor leve", color: "bg-warning" },
  { status: "dor-forte", emoji: "😞", label: "Com dor forte", color: "bg-error" },
];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { addCheckIn, getTodayCheckIn, getLastSevenDaysCheckIns, isLoading, checkIns } = useHealthData();
  const { stats, getNextMedalInfo } = useGamification(checkIns);
  const [todayCheckIn, setTodayCheckIn] = useState(getTodayCheckIn());
  const [lastSevenDays, setLastSevenDays] = useState(getLastSevenDaysCheckIns());

  useEffect(() => {
    setTodayCheckIn(getTodayCheckIn());
    setLastSevenDays(getLastSevenDaysCheckIns());
  }, [checkIns]);

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
    }
  };

  const nextMedalInfo = getNextMedalInfo();

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

  if (isLoading) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-foreground">Carregando...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
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

          {/* Histórico dos últimos 7 dias */}
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Últimos 7 dias</Text>
            <View className="flex-row justify-between gap-2">
              {Array.from({ length: 7 }).map((_, index) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - index));
                const dateStr = date.toISOString().split("T")[0];
                const checkIn = lastSevenDays.find((c) => c.date === dateStr);

                return (
                  <View
                    key={index}
                    className="flex-1 items-center gap-1 p-2 rounded-lg bg-surface border border-border"
                  >
                    <Text className="text-xs text-muted">{date.getDate()}</Text>
                    <Text className="text-xl">
                      {checkIn ? getCheckInEmoji(checkIn.status) : "—"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>

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
              className="bg-primary/20 rounded-xl p-4 active:opacity-80 border border-primary"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/ergonomia");
              }}
            >
              <Text className="text-center font-semibold text-primary">
                Fazer Pausa Ativa
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-blue-500/20 rounded-xl p-4 active:opacity-80 border border-blue-500"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/hydration-tracker");
              }}
            >
              <Text className="text-center font-semibold text-blue-500">
                💧 Registrar Hidratação
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-purple-500/20 rounded-xl p-4 active:opacity-80 border border-purple-500"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/dicas-saude");
              }}
            >
              <Text className="text-center font-semibold text-purple-500">
                📚 Dicas de Saúde
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-orange-500/20 rounded-xl p-4 active:opacity-80 border border-orange-500"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/desafios-saude");
              }}
            >
              <Text className="text-center font-semibold text-orange-500">
                🎯 Desafios de Saúde
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-green-500/20 rounded-xl p-4 active:opacity-80 border border-green-500"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/orientacoes-nutricionais");
              }}
            >
              <Text className="text-center font-semibold text-green-500">
                🍎 Orientações Nutricionais
              </Text>
            </TouchableOpacity>
          </View>

          {/* Medalhas e Gamificação */}
          <Card className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">🏆 Suas Medalhas</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/achievements");
                }}
              >
                <Text className="text-primary font-semibold">Ver Tudo →</Text>
              </TouchableOpacity>
            </View>

            {stats.unlockedMedals.length > 0 ? (
              <View className="flex-row gap-2">
                {stats.unlockedMedals.slice(0, 3).map((medal) => (
                  <View key={medal.id} className="flex-1">
                    <MedalCard medal={medal} isUnlocked={true} />
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-center text-muted py-4">
                Comece a fazer check-ins para desbloquear medalhas!
              </Text>
            )}

            {/* Próxima Medalha */}
            {nextMedalInfo.medal && (
              <View className="gap-2 pt-3 border-t border-border">
                <Text className="text-sm text-muted">Próxima Medalha:</Text>
                <View className="flex-row items-center gap-3">
                  <Text className="text-3xl">{nextMedalInfo.medal?.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {nextMedalInfo.medal?.name}
                    </Text>
                    <Text className="text-xs text-muted">
                      Faltam {nextMedalInfo.checkInsNeeded} check-ins
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Card>

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
