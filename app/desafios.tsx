import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import * as Haptics from "expo-haptics";

const AVAILABLE_CHALLENGES = [
  {
    id: "hidratacao-7dias",
    title: "Desafio de Hidratação",
    description: "Beba 8 copos de água por dia durante 7 dias consecutivos",
    duration: "7 dias",
    points: 100,
    icon: "💧",
    difficulty: "Fácil",
    color: "bg-blue-500",
  },
  {
    id: "alongamento-14dias",
    title: "Alongamento Diário",
    description: "Faça 10 minutos de alongamento todos os dias por 2 semanas",
    duration: "14 dias",
    points: 200,
    icon: "🧘",
    difficulty: "Médio",
    color: "bg-purple-500",
  },
  {
    id: "respiracao-30dias",
    title: "Respiração Consciente",
    description: "Pratique exercícios de respiração guiada diariamente por 1 mês",
    duration: "30 dias",
    points: 500,
    icon: "🌬️",
    difficulty: "Médio",
    color: "bg-green-500",
  },
  {
    id: "checkin-30dias",
    title: "Check-in Consistente",
    description: "Faça check-in diário sem falhas por 30 dias",
    duration: "30 dias",
    points: 300,
    icon: "📋",
    difficulty: "Fácil",
    color: "bg-orange-500",
  },
  {
    id: "postura-21dias",
    title: "Postura Correta",
    description: "Mantenha postura ergonômica e faça pausas a cada 2 horas por 21 dias",
    duration: "21 dias",
    points: 250,
    icon: "🪑",
    difficulty: "Médio",
    color: "bg-yellow-500",
  },
  {
    id: "sono-14dias",
    title: "Sono de Qualidade",
    description: "Durma pelo menos 7 horas por noite durante 14 dias",
    duration: "14 dias",
    points: 150,
    icon: "😴",
    difficulty: "Fácil",
    color: "bg-indigo-500",
  },
];

export default function DesafiosScreen() {
  const router = useRouter();

  const handleStartChallenge = (challengeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/desafio-detalhe",
      params: { id: challengeId }
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil":
        return "text-success";
      case "Médio":
        return "text-warning";
      case "Difícil":
        return "text-error";
      default:
        return "text-muted";
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Cabeçalho */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Desafios de Saúde</Text>
            <Text className="text-base text-muted">
              Escolha um desafio e melhore seus hábitos de saúde
            </Text>
          </View>

          {/* Informação */}
          <Card className="bg-primary/10 border border-primary gap-2">
            <Text className="text-sm font-semibold text-primary">🎯 Como Funciona</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Complete desafios para ganhar pontos e subir no ranking. Quanto mais difícil o desafio, mais pontos você ganha!
            </Text>
          </Card>

          {/* Lista de Desafios */}
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">Desafios Disponíveis</Text>
            {AVAILABLE_CHALLENGES.map((challenge) => (
              <TouchableOpacity
                key={challenge.id}
                onPress={() => handleStartChallenge(challenge.id)}
                className="active:opacity-70"
              >
                <Card className="gap-4">
                  <View className="flex-row items-start gap-4">
                    <View className={`w-16 h-16 rounded-full ${challenge.color}/20 items-center justify-center`}>
                      <Text className="text-3xl">{challenge.icon}</Text>
                    </View>
                    <View className="flex-1 gap-2">
                      <Text className="text-lg font-bold text-foreground">{challenge.title}</Text>
                      <Text className="text-sm text-muted leading-relaxed">
                        {challenge.description}
                      </Text>
                      <View className="flex-row items-center gap-4 mt-2">
                        <View className="flex-row items-center gap-1">
                          <Text className="text-xs text-muted">⏱️</Text>
                          <Text className="text-xs text-muted">{challenge.duration}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Text className="text-xs text-muted">⭐</Text>
                          <Text className="text-xs font-semibold text-primary">
                            {challenge.points} pts
                          </Text>
                        </View>
                        <View className={`px-2 py-1 rounded ${
                          challenge.difficulty === "Fácil" ? "bg-success/20" :
                          challenge.difficulty === "Médio" ? "bg-warning/20" :
                          "bg-error/20"
                        }`}>
                          <Text className={`text-xs font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
                            {challenge.difficulty}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dica */}
          <Card className="bg-success/10 border border-success gap-2">
            <Text className="text-sm font-semibold text-success">💡 Dica</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Comece com desafios fáceis para criar o hábito. Depois, avance para desafios mais longos e complexos!
            </Text>
          </Card>

          {/* Botão Voltar */}
          <TouchableOpacity
            className="bg-surface border border-border rounded-lg py-4 active:opacity-80"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text className="text-center font-semibold text-foreground">
              Voltar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
