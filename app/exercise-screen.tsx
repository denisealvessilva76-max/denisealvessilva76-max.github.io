import { ScrollView, Text, View, Pressable, Alert, Image, Dimensions, ImageSourcePropType } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useEffect, useState } from "react";
import { useColors } from "@/hooks/use-colors";
import { getExerciseById } from "@/lib/exercise-types";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";

export default function ExerciseScreen() {
  const router = useRouter();
  const colors = useColors();
  const { exerciseId } = useLocalSearchParams();
  const exercise = getExerciseById(exerciseId as string);

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentPhase = exercise?.phases[currentPhaseIndex];

  // Inicializar tempo
  useEffect(() => {
    if (currentPhase) {
      setTimeRemaining(currentPhase.duration);
    }
  }, [currentPhaseIndex, currentPhase]);

  // Timer
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;

        // Avisar sobre troca de lado
        if (
          currentPhase?.sideNotificationTime &&
          newTime === currentPhase.sideNotificationTime
        ) {
          handleSideNotification();
        }

        // Fim da fase
        if (newTime <= 0) {
          handlePhaseComplete();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, currentPhase]);

  const handleSideNotification = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ Trocar de Lado!",
          body: `Prepare-se para trocar para o ${currentPhase?.name.includes("Direito") ? "lado esquerdo" : "lado direito"} em alguns segundos`,
          sound: "default",
          badge: 1,
        },
        trigger: {
          type: "time-interval" as any,
          seconds: 1,
          repeats: false,
        },
      });
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
    }
  };

  const handlePhaseComplete = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (currentPhaseIndex < exercise!.phases.length - 1) {
        // Próxima fase
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "✅ Fase Completa!",
            body: `Próxima: ${exercise!.phases[currentPhaseIndex + 1].name}`,
            sound: "default",
            badge: 1,
          },
          trigger: {
            type: "time-interval" as any,
            seconds: 1,
            repeats: false,
          },
        });

        setTimeout(() => {
          setCurrentPhaseIndex((prev) => prev + 1);
          setIsRunning(false);
        }, 2000);
      } else {
        // Exercício completo
        setIsCompleted(true);
        setIsRunning(false);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🎉 Exercício Completo!",
            body: "Parabéns! Você completou o exercício com sucesso.",
            sound: "default",
            badge: 1,
          },
          trigger: {
            type: "time-interval" as any,
            seconds: 1,
            repeats: false,
          },
        });
      }
    } catch (error) {
      console.error("Erro ao completar fase:", error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = currentPhase
    ? ((currentPhase.duration - timeRemaining) / currentPhase.duration) * 100
    : 0;

  if (!exercise) {
    return (
      <ScreenContainer className="p-4 justify-center items-center">
        <Text className="text-foreground text-lg">Exercício não encontrado</Text>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 20, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}
        >
          <Text className="text-background font-semibold">Voltar</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  if (isCompleted) {
    return (
      <ScreenContainer className="p-4 justify-center items-center gap-6">
        <View className="items-center gap-4">
          <Text className="text-6xl">🎉</Text>
          <Text className="text-3xl font-bold text-foreground text-center">
            Parabéns!
          </Text>
          <Text className="text-lg text-muted text-center">
            Você completou o exercício "{exercise.name}" com sucesso!
          </Text>
        </View>

        <View className="gap-3 w-full">
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.7 : 1,
                padding: 14,
                borderRadius: 8,
              },
            ]}
          >
            <Text className="text-center text-background font-semibold text-base">
              Voltar
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setCurrentPhaseIndex(0);
              setIsCompleted(false);
              setIsRunning(false);
            }}
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
            <Text className="text-center text-foreground font-semibold text-base">
              Repetir Exercício
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">
              {exercise.emoji} {exercise.name}
            </Text>
            <Text className="text-base text-muted">
              Fase {currentPhaseIndex + 1} de {exercise.phases.length}
            </Text>
          </View>

          {/* Imagem do Exercício */}
          {currentPhase && (
            <View className="bg-surface rounded-2xl p-4 items-center">
              <Image
                source={currentPhase.image as ImageSourcePropType}
                style={{
                  width: Dimensions.get("window").width - 80,
                  height: Dimensions.get("window").width - 80,
                  borderRadius: 12,
                }}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Informações da Fase */}
          {currentPhase && (
            <View className="gap-3">
              <Text className="text-xl font-semibold text-foreground">
                {currentPhase.name}
              </Text>
              <Text className="text-base text-muted leading-relaxed">
                {currentPhase.description}
              </Text>

              {/* Instruções */}
              <View className="gap-2">
                <Text className="text-lg font-semibold text-foreground">
                  Instruções:
                </Text>
                {currentPhase.instructions.map((instruction, index) => (
                  <View key={index} className="flex-row gap-3">
                    <Text className="text-primary font-bold">{index + 1}.</Text>
                    <Text className="flex-1 text-muted leading-relaxed">
                      {instruction}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Timer e Progresso */}
          <View className="gap-4 bg-surface rounded-2xl p-6">
            <View className="items-center gap-2">
              <Text className="text-5xl font-bold text-primary">
                {formatTime(timeRemaining)}
              </Text>
              <Text className="text-sm text-muted">Tempo Restante</Text>
            </View>

            {/* Barra de Progresso */}
            <View
              style={{
                backgroundColor: colors.border,
                borderRadius: 8,
                height: 12,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  backgroundColor: colors.primary,
                  width: `${progress}%`,
                  height: "100%",
                  borderRadius: 8,
                }}
              />
            </View>
          </View>

          {/* Avisos de Troca de Lado */}
          {currentPhase?.hasSides && timeRemaining > 0 && (
            <View
              style={{
                backgroundColor: colors.warning,
                borderRadius: 12,
                padding: 12,
              }}
            >
              <Text className="text-center font-semibold text-background">
                ⏰ Prepare-se para trocar de lado em {timeRemaining} segundos
              </Text>
            </View>
          )}

          {/* Botões de Controle */}
          <View className="gap-3">
            <Pressable
              onPress={() => setIsRunning(!isRunning)}
              style={({ pressed }) => [
                {
                  backgroundColor: isRunning ? colors.error : colors.success,
                  opacity: pressed ? 0.7 : 1,
                  padding: 14,
                  borderRadius: 8,
                },
              ]}
            >
              <Text className="text-center text-background font-semibold text-base">
                {isRunning ? "⏸️ Pausar" : "▶️ Iniciar"}
              </Text>
            </Pressable>

            {currentPhaseIndex > 0 && (
              <Pressable
                onPress={() => {
                  setCurrentPhaseIndex((prev) => prev - 1);
                  setIsRunning(false);
                }}
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
                <Text className="text-center text-foreground font-semibold text-base">
                  ⬅️ Fase Anterior
                </Text>
              </Pressable>
            )}

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
              <Text className="text-center text-foreground font-semibold text-base">
                ❌ Sair
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
