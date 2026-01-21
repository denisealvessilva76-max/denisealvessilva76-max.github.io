import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { EXERCISES } from "@/lib/types";
import * as Haptics from "expo-haptics";

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const exercise = EXERCISES.find((e) => e.id === id);
  const [timeLeft, setTimeLeft] = useState(exercise?.duration || 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsCompleted(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  if (!exercise) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-lg text-foreground">Exercício não encontrado</Text>
        <TouchableOpacity
          className="bg-primary rounded-lg p-3 mt-4"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getEmoji = () => {
    switch (exercise.category) {
      case "alongamento":
        return "🤸";
      case "postura":
        return "🧍";
      case "respiracao":
        return "🫁";
      default:
        return "💪";
    }
  };

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1 gap-6">
        {/* Cabeçalho */}
        <View className="gap-2">
          <Text className="text-4xl text-center">{getEmoji()}</Text>
          <Text className="text-2xl font-bold text-foreground text-center">
            {exercise.title}
          </Text>
          <Text className="text-sm text-muted text-center">{exercise.description}</Text>
        </View>

        {/* Instruções */}
        <Card className="gap-3">
          <Text className="text-lg font-semibold text-foreground">Instruções:</Text>
          {exercise.instructions.map((instruction, index) => (
            <View key={index} className="flex-row gap-3">
              <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
                <Text className="text-white font-bold text-sm">{index + 1}</Text>
              </View>
              <Text className="flex-1 text-foreground leading-relaxed pt-1">
                {instruction}
              </Text>
            </View>
          ))}
        </Card>

        {/* Contagem Regressiva */}
        {!isCompleted && (
          <Card className="gap-4 items-center py-8 bg-primary/10 border border-primary">
            <Text className="text-sm text-muted">Tempo restante</Text>
            <Text className="text-6xl font-bold text-primary">
              {formatTime(timeLeft)}
            </Text>
            {!isRunning && timeLeft > 0 && (
              <TouchableOpacity
                className="bg-primary rounded-full px-8 py-3 active:opacity-80"
                onPress={() => {
                  setIsRunning(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text className="text-white font-semibold">Começar</Text>
              </TouchableOpacity>
            )}
            {isRunning && (
              <TouchableOpacity
                className="bg-warning rounded-full px-8 py-3 active:opacity-80"
                onPress={() => {
                  setIsRunning(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text className="text-white font-semibold">Pausar</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* Conclusão */}
        {isCompleted && (
          <Card className="gap-4 items-center py-8 bg-success/10 border border-success">
            <Text className="text-5xl">🎉</Text>
            <Text className="text-2xl font-bold text-success">Parabéns!</Text>
            <Text className="text-center text-foreground">
              Você completou o exercício de {exercise.title}
            </Text>
            <TouchableOpacity
              className="bg-success rounded-full px-8 py-3 active:opacity-80 mt-4"
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.back();
              }}
            >
              <Text className="text-white font-semibold">Concluído</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Botão Voltar */}
        <TouchableOpacity
          className="bg-surface border border-border rounded-lg p-3"
          onPress={() => router.back()}
        >
          <Text className="text-center text-foreground font-semibold">Voltar</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
