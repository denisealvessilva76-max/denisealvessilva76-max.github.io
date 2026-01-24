import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AVAILABLE_CHALLENGES = [
  {
    id: "challenge-hydration-7d",
    title: "Hidratação Consistente",
    description: "Beba pelo menos 2 litros de água por dia durante 7 dias",
    duration: "7 dias",
    points: 300,
    icon: "💧",
    difficulty: "Fácil",
    color: "bg-blue-500",
    type: "hydration",
  },
  {
    id: "challenge-steps-15d",
    title: "Caminhada Saudável",
    description: "Caminhe 6.000 passos por dia durante 15 dias consecutivos",
    duration: "15 dias",
    points: 500,
    icon: "🚶",
    difficulty: "Médio",
    color: "bg-green-500",
    type: "steps",
  },
  {
    id: "challenge-weight-30d",
    title: "Desafio de Peso Saudável",
    description: "Perca peso de forma saudável em 30 dias com acompanhamento e cálculo de IMC",
    duration: "30 dias",
    points: 1000,
    icon: "⚖️",
    difficulty: "Difícil",
    color: "bg-red-500",
    type: "weight",
  },
  {
    id: "challenge-breathing-14d",
    title: "Respiração Consciente",
    description: "Pratique exercícios de respiração guiada por 14 dias",
    duration: "14 dias",
    points: 400,
    icon: "🌬️",
    difficulty: "Fácil",
    color: "bg-purple-500",
    type: "breathing",
  },
  {
    id: "challenge-stretching-21d",
    title: "Alongamento Diário",
    description: "Faça 10 minutos de alongamento todos os dias por 21 dias",
    duration: "21 dias",
    points: 600,
    icon: "🧘",
    difficulty: "Médio",
    color: "bg-orange-500",
    type: "stretching",
  },
  {
    id: "challenge-checkin-30d",
    title: "Check-in Diário",
    description: "Faça check-in de bem-estar todos os dias por 30 dias",
    duration: "30 dias",
    points: 800,
    icon: "✅",
    difficulty: "Médio",
    color: "bg-teal-500",
    type: "checkin",
  },
  {
    id: "challenge-hydration-30d",
    title: "Mestre da Hidratação",
    description: "Mantenha-se hidratado por 30 dias seguidos (2L/dia)",
    duration: "30 dias",
    points: 1000,
    icon: "💦",
    difficulty: "Difícil",
    color: "bg-cyan-500",
    type: "hydration",
  },
];

interface ChallengeStatus {
  id: string;
  status: "available" | "active" | "completed";
  progress: number;
}

export default function DesafiosScreen() {
  const router = useRouter();
  const [challengeStatuses, setChallengeStatuses] = useState<ChallengeStatus[]>([]);

  useEffect(() => {
    loadChallengeStatuses();
  }, []);

  const loadChallengeStatuses = async () => {
    const statuses: ChallengeStatus[] = [];
    
    for (const challenge of AVAILABLE_CHALLENGES) {
      const savedProgress = await AsyncStorage.getItem(`challenge_progress_${challenge.id}`);
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        statuses.push({
          id: challenge.id,
          status: parsed.status,
          progress: (parsed.currentValue / parsed.days?.length || 0) * 100
        });
      } else {
        statuses.push({
          id: challenge.id,
          status: "available",
          progress: 0
        });
      }
    }
    
    setChallengeStatuses(statuses);
  };

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

  const getStatusBadge = (challengeId: string) => {
    const status = challengeStatuses.find(s => s.id === challengeId);
    if (!status) return null;
    
    if (status.status === "completed") {
      return (
        <View className="bg-success/20 px-2 py-1 rounded">
          <Text className="text-xs font-semibold text-success">✓ Completado</Text>
        </View>
      );
    }
    if (status.status === "active") {
      return (
        <View className="bg-primary/20 px-2 py-1 rounded">
          <Text className="text-xs font-semibold text-primary">Em Andamento</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Cabeçalho */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">🎯 Desafios de Saúde</Text>
            <Text className="text-base text-muted">
              Escolha um desafio e melhore seus hábitos de saúde
            </Text>
          </View>

          {/* Informação */}
          <Card className="bg-primary/10 border border-primary gap-2">
            <Text className="text-sm font-semibold text-primary">🎯 Como Funciona</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Escolha um desafio, siga o guia personalizado e registre seu progresso diariamente. 
              Tire fotos como comprovação e ganhe pontos ao completar!
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
                      <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-bold text-foreground flex-1">{challenge.title}</Text>
                        {getStatusBadge(challenge.id)}
                      </View>
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

          {/* Dica sobre Desafio de Peso */}
          <Card className="bg-warning/10 border border-warning gap-2">
            <Text className="text-sm font-semibold text-warning">⚖️ Desafio de Peso</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              No desafio de peso, você pode calcular seu IMC, tirar fotos das pesagens na sala de saúde ocupacional, 
              fotografar suas refeições e acompanhar sua evolução. Se precisar, a equipe pode agendar um nutricionista!
            </Text>
          </Card>

          {/* Dica */}
          <Card className="bg-success/10 border border-success gap-2">
            <Text className="text-sm font-semibold text-success">💡 Dica</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Comece com desafios fáceis para criar o hábito. Cada desafio tem um guia personalizado 
              para ajudar você a encaixar na sua rotina!
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
              ← Voltar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
