import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Dimensions, ScrollView, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingSlide {
  id: number;
  emoji: string;
  title: string;
  description: string;
  color: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 1,
    emoji: "👋",
    title: "Bem-vindo ao Canteiro Saudável!",
    description: "Seu aplicativo de saúde e bem-estar no trabalho. Vamos conhecer as funcionalidades principais.",
    color: "#0a7ea4",
  },
  {
    id: 2,
    emoji: "📋",
    title: "Check-in Diário",
    description: "Registre como você está se sentindo todos os dias. Monitore sua saúde e bem-estar ao longo do tempo.",
    color: "#22C55E",
  },
  {
    id: 3,
    emoji: "💧",
    title: "Hidratação Inteligente",
    description: "Receba lembretes para beber água regularmente. Acompanhe sua meta diária de hidratação.",
    color: "#3B82F6",
  },
  {
    id: 4,
    emoji: "🧘",
    title: "Ergonomia e Alongamentos",
    description: "Aprenda posturas corretas e faça pausas ativas. Previna dores e lesões com exercícios guiados.",
    color: "#F59E0B",
  },
  {
    id: 5,
    emoji: "🏆",
    title: "Gamificação e Recompensas",
    description: "Ganhe pontos, desbloqueie medalhas e suba no ranking. Resgate prêmios com seus pontos acumulados!",
    color: "#8B5CF6",
  },
];

export function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const handleSkip = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await completeOnboarding();
  };

  const handleNext = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentIndex < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem("onboarding_completed", "true");
      // Usar router.replace em todas as plataformas para manter o contexto de autenticação
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error saving onboarding state:", error);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="bg-background">
      {/* Skip Button */}
      {currentIndex < SLIDES.length - 1 && (
        <View className="absolute top-12 right-6 z-10">
          <TouchableOpacity
            onPress={handleSkip}
            className="px-4 py-2 rounded-full bg-surface/80"
            activeOpacity={0.7}
          >
            <Text className="text-muted font-medium">Pular</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.id}
            style={{ width: SCREEN_WIDTH }}
            className="flex-1 items-center justify-center px-8"
          >
            {/* Emoji Icon */}
            <View
              className="w-32 h-32 rounded-full items-center justify-center mb-8"
              style={{ backgroundColor: `${slide.color}20` }}
            >
              <Text className="text-7xl">{slide.emoji}</Text>
            </View>

            {/* Title */}
            <Text className="text-3xl font-bold text-foreground text-center mb-4">
              {slide.title}
            </Text>

            {/* Description */}
            <Text className="text-base text-muted text-center leading-relaxed max-w-sm">
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View className="pb-8 px-6">
        {/* Dots Indicator */}
        <View className="flex-row justify-center items-center mb-6">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              className="mx-1 rounded-full transition-all"
              style={{
                width: currentIndex === index ? 24 : 8,
                height: 8,
                backgroundColor: currentIndex === index ? SLIDES[currentIndex].color : "#E5E7EB",
              }}
            />
          ))}
        </View>

        {/* Next/Start Button */}
        <TouchableOpacity
          onPress={handleNext}
          className="rounded-xl py-4 items-center"
          style={{ backgroundColor: SLIDES[currentIndex].color }}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold">
            {currentIndex === SLIDES.length - 1 ? "Começar" : "Próximo"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
