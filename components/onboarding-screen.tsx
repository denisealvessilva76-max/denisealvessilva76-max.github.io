import { useState } from "react";
import { View, Text, Modal, Pressable, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_COMPLETED_KEY = "onboarding:completed";

interface OnboardingScreenProps {
  visible: boolean;
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    emoji: "👋",
    title: "Bem-vindo ao Canteiro Saudável!",
    description: "Seu app de saúde e bem-estar no trabalho. Vamos conhecer as principais funcionalidades?",
  },
  {
    id: 2,
    emoji: "📋",
    title: "Check-in Diário",
    description: "Registre como você está se sentindo todos os dias. Monitore sua pressão arterial e sintomas para cuidar melhor da sua saúde.",
  },
  {
    id: 3,
    emoji: "💧",
    title: "Hidratação",
    description: "Beba água regularmente durante o expediente. Receba lembretes e acompanhe sua meta diária de hidratação.",
  },
  {
    id: 4,
    emoji: "🎯",
    title: "Desafios e Recompensas",
    description: "Participe de desafios de saúde, ganhe pontos e conquiste medalhas. Melhore sua qualidade de vida de forma divertida!",
  },
];

/**
 * Tela de onboarding com 4 slides explicando as funcionalidades do app
 * 
 * Exibido automaticamente após o primeiro cadastro
 * Pode ser pulado a qualquer momento
 */
export function OnboardingScreen({ visible, onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const colors = useColors();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
      console.log("[Onboarding] Completed");
      onComplete();
    } catch (error) {
      console.error("[Onboarding] Error saving completion:", error);
      onComplete();
    }
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleSkip}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          {/* Emoji grande */}
          <Text
            style={{
              fontSize: 80,
              marginBottom: 32,
            }}
          >
            {slide.emoji}
          </Text>

          {/* Título */}
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: colors.foreground,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {slide.title}
          </Text>

          {/* Descrição */}
          <Text
            style={{
              fontSize: 16,
              color: colors.muted,
              textAlign: "center",
              lineHeight: 24,
              marginBottom: 48,
              maxWidth: 320,
            }}
          >
            {slide.description}
          </Text>

          {/* Indicadores de progresso */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginBottom: 48,
            }}
          >
            {slides.map((_, index) => (
              <View
                key={index}
                style={{
                  width: index === currentSlide ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: index === currentSlide ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>

          {/* Botões */}
          <View
            style={{
              width: "100%",
              gap: 12,
            }}
          >
            {/* Botão principal */}
            <Pressable
              onPress={handleNext}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                paddingVertical: 16,
                paddingHorizontal: 32,
                borderRadius: 12,
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {isLastSlide ? "Começar" : "Próximo"}
              </Text>
            </Pressable>

            {/* Botão pular */}
            {!isLastSlide && (
              <Pressable
                onPress={handleSkip}
                style={({ pressed }) => ({
                  paddingVertical: 16,
                  paddingHorizontal: 32,
                  alignItems: "center",
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 14,
                  }}
                >
                  Pular tutorial
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
