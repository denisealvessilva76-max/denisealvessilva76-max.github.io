import { ScrollView, Text, View, TouchableOpacity, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHealthData } from "@/hooks/use-health-data";
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
  const { addCheckIn, getTodayCheckIn, getLastSevenDaysCheckIns, isLoading } = useHealthData();
  const [todayCheckIn, setTodayCheckIn] = useState(getTodayCheckIn());
  const [lastSevenDays, setLastSevenDays] = useState(getLastSevenDaysCheckIns());

  useEffect(() => {
    setTodayCheckIn(getTodayCheckIn());
    setLastSevenDays(getLastSevenDaysCheckIns());
  }, []);

  const handleCheckIn = async (status: CheckInStatus) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await addCheckIn(status);
    if (result) {
      setTodayCheckIn(result);
    }
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
              }}
            >
              <Text className="text-center font-semibold text-primary">
                Fazer Pausa Ativa
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
