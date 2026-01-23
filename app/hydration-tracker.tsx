import { ScrollView, Text, View, Pressable, Alert, TextInput, Modal } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useHydration } from "@/hooks/use-hydration";
import { useEffect, useState } from "react";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

type WorkType = "leve" | "moderado" | "pesado";

interface UserProfile {
  weight: number; // kg
  height: number; // cm
  workType: WorkType;
  dailyGoalCalculated: number; // ml
}

export default function HydrationTrackerScreen() {
  const router = useRouter();
  const colors = useColors();
  const { logWaterIntake, getTodayHydration, getDailyProgress, setDailyGoal, reminderSettings, hydrationData } =
    useHydration();
  const [todayData, setTodayData] = useState(getTodayHydration());
  const [progress, setProgress] = useState(getDailyProgress());
  const [isLogging, setIsLogging] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Form state
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [workType, setWorkType] = useState<WorkType>("moderado");

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Atualizar quando hydrationData mudar
  useEffect(() => {
    setTodayData(getTodayHydration());
    setProgress(getDailyProgress());
  }, [hydrationData]);

  const loadUserProfile = async () => {
    try {
      const profileData = await AsyncStorage.getItem("user_hydration_profile");
      if (profileData) {
        const profile = JSON.parse(profileData);
        setUserProfile(profile);
        // Atualizar meta se necessário
        if (profile.dailyGoalCalculated !== reminderSettings.dailyGoal) {
          await setDailyGoal(profile.dailyGoalCalculated);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  };

  const calculateHydrationGoal = (weight: number, height: number, workType: WorkType): number => {
    // Fórmula base: 35ml por kg de peso corporal
    let baseGoal = weight * 35;

    // Ajuste por tipo de trabalho
    const workMultiplier = {
      leve: 1.0,      // Trabalho de escritório, pouco esforço
      moderado: 1.3,  // Trabalho moderado, algum esforço físico
      pesado: 1.6,    // Trabalho pesado, muito esforço físico (canteiro de obras)
    };

    baseGoal *= workMultiplier[workType];

    // Ajuste por altura (pessoas mais altas tendem a precisar de mais água)
    if (height > 180) {
      baseGoal *= 1.1;
    } else if (height < 160) {
      baseGoal *= 0.95;
    }

    // Arredondar para múltiplo de 250ml (1 copo)
    return Math.round(baseGoal / 250) * 250;
  };

  const handleSaveProfile = async () => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (!weightNum || weightNum < 40 || weightNum > 200) {
      Alert.alert("Erro", "Por favor, insira um peso válido (40-200 kg)");
      return;
    }

    if (!heightNum || heightNum < 140 || heightNum > 220) {
      Alert.alert("Erro", "Por favor, insira uma altura válida (140-220 cm)");
      return;
    }

    const calculatedGoal = calculateHydrationGoal(weightNum, heightNum, workType);

    const profile: UserProfile = {
      weight: weightNum,
      height: heightNum,
      workType,
      dailyGoalCalculated: calculatedGoal,
    };

    try {
      await AsyncStorage.setItem("user_hydration_profile", JSON.stringify(profile));
      await setDailyGoal(calculatedGoal);
      setUserProfile(profile);
      setShowProfileModal(false);
      Alert.alert(
        "Sucesso!",
        `Sua meta diária foi calculada: ${calculatedGoal}ml (${calculatedGoal / 250} copos)`
      );
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar o perfil");
    }
  };

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

  const getWorkTypeLabel = (type: WorkType) => {
    const labels = {
      leve: "Trabalho Leve",
      moderado: "Trabalho Moderado",
      pesado: "Trabalho Pesado (Canteiro)",
    };
    return labels[type];
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">💧 Hidratação</Text>
            <Text className="text-base text-muted">Acompanhe seu consumo de água diário</Text>
          </View>

          {/* Perfil de Hidratação */}
          {!userProfile ? (
            <Pressable
              onPress={() => setShowProfileModal(true)}
              style={{
                backgroundColor: colors.warning + "20",
                borderColor: colors.warning,
                borderWidth: 1,
                padding: 16,
                borderRadius: 12,
              }}
            >
              <Text className="text-center font-semibold text-foreground mb-2">
                ⚠️ Configure seu Perfil de Hidratação
              </Text>
              <Text className="text-center text-sm text-muted">
                Calcule sua meta ideal baseada em peso, altura e tipo de trabalho
              </Text>
            </Pressable>
          ) : (
            <View className="bg-surface rounded-2xl p-4 gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-semibold text-foreground">Seu Perfil</Text>
                <Pressable onPress={() => setShowProfileModal(true)}>
                  <Text className="text-primary font-semibold">Editar</Text>
                </Pressable>
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-xs text-muted">Peso</Text>
                  <Text className="text-sm font-semibold text-foreground">{userProfile.weight} kg</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">Altura</Text>
                  <Text className="text-sm font-semibold text-foreground">{userProfile.height} cm</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">Trabalho</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {getWorkTypeLabel(userProfile.workType).split(" ")[1]}
                  </Text>
                </View>
              </View>
            </View>
          )}

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

      {/* Modal de Perfil */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 16 }}>
          <View style={{ backgroundColor: colors.background, borderRadius: 16, padding: 24, gap: 20 }}>
            <Text className="text-2xl font-bold text-foreground text-center">
              Calcular Meta de Hidratação
            </Text>

            <View className="gap-4">
              {/* Peso */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Peso (kg)</Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="Ex: 75"
                  placeholderTextColor={colors.muted}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 12,
                    color: colors.foreground,
                    fontSize: 16,
                  }}
                />
              </View>

              {/* Altura */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Altura (cm)</Text>
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="Ex: 175"
                  placeholderTextColor={colors.muted}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 12,
                    color: colors.foreground,
                    fontSize: 16,
                  }}
                />
              </View>

              {/* Tipo de Trabalho */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Tipo de Trabalho</Text>
                <View className="gap-2">
                  {(["leve", "moderado", "pesado"] as WorkType[]).map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setWorkType(type)}
                      style={{
                        backgroundColor: workType === type ? colors.primary + "20" : colors.surface,
                        borderColor: workType === type ? colors.primary : colors.border,
                        borderWidth: 2,
                        padding: 12,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: workType === type ? colors.primary : colors.foreground,
                          fontWeight: workType === type ? "600" : "400",
                        }}
                      >
                        {getWorkTypeLabel(type)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Botões */}
            <View className="gap-3">
              <Pressable
                onPress={handleSaveProfile}
                style={{
                  backgroundColor: colors.primary,
                  padding: 14,
                  borderRadius: 8,
                }}
              >
                <Text className="text-center text-background font-semibold text-base">
                  Calcular e Salvar
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowProfileModal(false)}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  padding: 14,
                  borderRadius: 8,
                }}
              >
                <Text className="text-center text-foreground font-semibold text-base">Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
