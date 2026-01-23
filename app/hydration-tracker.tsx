import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useHydration } from "@/hooks/use-hydration";
import { useEffect, useState } from "react";
import { useColors } from "@/hooks/use-colors";

export default function HydrationTrackerScreen() {
  const router = useRouter();
  const colors = useColors();
  const { logWaterIntake, getTodayHydration, getDailyProgress, reminderSettings, hydrationData } =
    useHydration();
  const [todayData, setTodayData] = useState(getTodayHydration());
  const [progress, setProgress] = useState(getDailyProgress());
  const [isLogging, setIsLogging] = useState(false);

  // Atualizar quando hydrationData mudar
  useEffect(() => {
    setTodayData(getTodayHydration());
    setProgress(getDailyProgress());
  }, [hydrationData]);

  const handleLogWater = async (glasses: number) => {
    setIsLogging(true);
    try {
      const success = await logWaterIntake(glasses);
      if (success) {
        // Forçar atualização imediata
        setTimeout(() => {
          setTodayData(getTodayHydration());
          setProgress(getDailyProgress());
        }, 100);
        Alert.alert("Sucesso", `${glasses} copo(s) de água registrado(s)!`);
      } else {
        Alert.alert("Erro", "Não foi possível registrar o consumo de água.");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível registrar o consumo de água.");
    } finally {
      setIsLogging(false);
    }
  };

  const waterIntake = todayData?.waterIntake || 0;
  const glassesConsumed = todayData?.glassesConsumed || 0;
  const waterRemaining = Math.max(0, reminderSettings.dailyGoal - waterIntake);
  const glassesRemaining = Math.ceil(waterRemaining / 250);

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">💧 Hidratação</Text>
            <Text className="text-base text-muted">Acompanhe seu consumo de água diário</Text>
          </View>

          {/* Progresso Diário */}
          <View className="gap-4 bg-surface rounded-2xl p-6">
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-foreground">Meta Diária</Text>
                <Text className="text-lg font-bold text-primary">
                  {waterIntake}ml / {reminderSettings.dailyGoal}ml
                </Text>
              </View>

              {/* Barra de Progresso */}
              <View
                style={{
                  backgroundColor: colors.border,
                  borderRadius: 8,
                  height: 24,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    backgroundColor:
                      progress >= 100 ? colors.success : colors.primary,
                    width: `${Math.min(100, progress)}%`,
                    height: "100%",
                    borderRadius: 8,
                  }}
                />
              </View>

              <Text className="text-sm text-muted text-center">
                {progress >= 100
                  ? "🎉 Meta atingida!"
                  : `Faltam ${glassesRemaining} copo(s) para atingir a meta`}
              </Text>
            </View>

            {/* Estatísticas */}
            <View className="flex-row gap-4">
              <View className="flex-1 bg-background rounded-lg p-3 items-center">
                <Text className="text-2xl font-bold text-primary">{glassesConsumed}</Text>
                <Text className="text-xs text-muted mt-1">Copos Consumidos</Text>
              </View>
              <View className="flex-1 bg-background rounded-lg p-3 items-center">
                <Text className="text-2xl font-bold text-success">{waterIntake}ml</Text>
                <Text className="text-xs text-muted mt-1">Total Ingerido</Text>
              </View>
              <View className="flex-1 bg-background rounded-lg p-3 items-center">
                <Text className="text-2xl font-bold text-warning">{waterRemaining}ml</Text>
                <Text className="text-xs text-muted mt-1">Faltam</Text>
              </View>
            </View>
          </View>

          {/* Ações Rápidas */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Registrar Consumo</Text>
            <View className="gap-2">
              {[
                { glasses: 1, label: "1 Copo (250ml)", emoji: "🥤" },
                { glasses: 2, label: "2 Copos (500ml)", emoji: "🥤🥤" },
                { glasses: 4, label: "1 Garrafa (1L)", emoji: "🍶" },
              ].map((item) => (
                <Pressable
                  key={item.glasses}
                  onPress={() => handleLogWater(item.glasses)}
                  disabled={isLogging}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.primary,
                      opacity: pressed || isLogging ? 0.7 : 1,
                      padding: 14,
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    },
                  ]}
                >
                  <Text className="text-2xl">{item.emoji}</Text>
                  <Text className="text-background font-semibold text-base">{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Dicas */}
          <View
            style={{ backgroundColor: colors.surface, borderLeftColor: colors.success, borderLeftWidth: 4 }}
            className="p-4 rounded-lg gap-3"
          >
            <Text className="text-lg font-semibold text-foreground">💡 Dicas de Hidratação</Text>
            <View className="gap-2">
              <Text className="text-sm text-muted leading-relaxed">
                • Beba água regularmente ao longo do dia, não apenas quando tiver sede
              </Text>
              <Text className="text-sm text-muted leading-relaxed">
                • Em dias quentes ou durante trabalho físico, aumente o consumo de água
              </Text>
              <Text className="text-sm text-muted leading-relaxed">
                • Leve uma garrafa de água reutilizável para facilitar o consumo
              </Text>
              <Text className="text-sm text-muted leading-relaxed">
                • Urina clara é sinal de boa hidratação
              </Text>
            </View>
          </View>

          {/* Botão de Voltar */}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                opacity: pressed ? 0.7 : 1,
                padding: 14,
                borderRadius: 8,
              },
            ]}
          >
            <Text className="text-center text-foreground font-semibold text-base">Voltar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
