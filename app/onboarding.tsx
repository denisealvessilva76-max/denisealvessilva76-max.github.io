import { View, Text, TouchableOpacity, Dimensions, Image } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useOnboarding } from "@/hooks/use-onboarding";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

const onboardingData = [
  {
    id: 1,
    title: "Cuide da Sua Saúde",
    description:
      "Faça check-ins diários, monitore sua pressão arterial e reporte sintomas. O SESMT será notificado automaticamente quando necessário.",
    emoji: "🏥",
    color: "#0a7ea4",
  },
  {
    id: 2,
    title: "Ergonomia e Exercícios",
    description:
      "Aprenda posturas corretas, faça alongamentos guiados e pratique respiração consciente. Previna lesões e melhore seu bem-estar no trabalho.",
    emoji: "🧘",
    color: "#4CAF50",
  },
  {
    id: 3,
    title: "Ganhe Recompensas",
    description:
      "Acumule pontos completando atividades, suba no ranking e resgate prêmios incríveis. Quanto mais você cuida da sua saúde, mais você ganha!",
    emoji: "🏆",
    color: "#FF8C00",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const [currentPage, setCurrentPage] = useState(0);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleFinish();
  };

  const handleFinish = async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  };

  const currentData = onboardingData[currentPage];

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View className="flex-1 justify-between p-6">
        {/* Skip Button */}
        {currentPage < onboardingData.length - 1 && (
          <View className="items-end">
            <TouchableOpacity onPress={handleSkip} className="py-2 px-4 active:opacity-70">
              <Text className="text-muted font-medium">Pular</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        <View className="flex-1 justify-center items-center gap-8">
          {/* Emoji Icon */}
          <View
            className="w-32 h-32 rounded-full items-center justify-center"
            style={{ backgroundColor: currentData.color + "20" }}
          >
            <Text className="text-7xl">{currentData.emoji}</Text>
          </View>

          {/* Title */}
          <Text className="text-3xl font-bold text-foreground text-center px-4">
            {currentData.title}
          </Text>

          {/* Description */}
          <Text className="text-base text-muted text-center px-6 leading-relaxed">
            {currentData.description}
          </Text>
        </View>

        {/* Bottom Navigation */}
        <View className="gap-6">
          {/* Page Indicators */}
          <View className="flex-row justify-center gap-2">
            {onboardingData.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full ${
                  index === currentPage ? "w-8 bg-primary" : "w-2 bg-border"
                }`}
              />
            ))}
          </View>

          {/* Next/Finish Button */}
          <TouchableOpacity
            onPress={handleNext}
            className="rounded-lg py-4 active:opacity-80"
            style={{ backgroundColor: currentData.color }}
          >
            <Text className="text-center font-bold text-white text-lg">
              {currentPage < onboardingData.length - 1 ? "Próximo" : "Começar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
