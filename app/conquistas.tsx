import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useColors } from "@/hooks/use-colors";
import { useGamification } from "@/hooks/use-gamification";
import { useHealthData } from "@/hooks/use-health-data";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "hydration" | "checkin" | "challenges" | "breathing" | "videos" | "special";
  requirement: number;
  currentProgress: number;
  unlocked: boolean;
  points: number;
}

export default function ConquistasScreen() {
  const colors = useColors();
  const { checkIns } = useHealthData();
  const { stats } = useGamification(checkIns);

  // Conquistas do sistema
  const achievements: Achievement[] = [
    // Hidratação
    {
      id: "hydration_10",
      title: "Hidratação Iniciante",
      description: "Registre 10 copos de água",
      icon: "💧",
      category: "hydration",
      requirement: 10,
      currentProgress: 5,
      unlocked: false,
      points: 50,
    },
    {
      id: "hydration_50",
      title: "Hidratação Intermediária",
      description: "Registre 50 copos de água",
      icon: "💦",
      category: "hydration",
      requirement: 50,
      currentProgress: 5,
      unlocked: false,
      points: 100,
    },
    {
      id: "hydration_100",
      title: "Mestre da Hidratação",
      description: "Registre 100 copos de água",
      icon: "🌊",
      category: "hydration",
      requirement: 100,
      currentProgress: 5,
      unlocked: false,
      points: 200,
    },

    // Check-in
    {
      id: "checkin_7",
      title: "Primeira Semana",
      description: "Faça check-in por 7 dias consecutivos",
      icon: "📅",
      category: "checkin",
      requirement: 7,
      currentProgress: stats.currentStreak,
      unlocked: stats.currentStreak >= 7,
      points: 100,
    },
    {
      id: "checkin_30",
      title: "Mês Completo",
      description: "Faça check-in por 30 dias consecutivos",
      icon: "📆",
      category: "checkin",
      requirement: 30,
      currentProgress: stats.currentStreak,
      unlocked: stats.currentStreak >= 30,
      points: 500,
    },
    {
      id: "checkin_100",
      title: "Guardião Dedicado",
      description: "Faça 100 check-ins no total",
      icon: "🛡️",
      category: "checkin",
      requirement: 100,
      currentProgress: stats.totalCheckIns,
      unlocked: stats.totalCheckIns >= 100,
      points: 1000,
    },

    // Desafios
    {
      id: "challenge_5",
      title: "Desafiador Iniciante",
      description: "Complete 5 desafios",
      icon: "🎯",
      category: "challenges",
      requirement: 5,
      currentProgress: 2,
      unlocked: false,
      points: 100,
    },
    {
      id: "challenge_20",
      title: "Desafiador Experiente",
      description: "Complete 20 desafios",
      icon: "🏅",
      category: "challenges",
      requirement: 20,
      currentProgress: 2,
      unlocked: false,
      points: 300,
    },

    // Respiração
    {
      id: "breathing_10",
      title: "Respiração Consciente",
      description: "Complete 10 sessões de respiração guiada",
      icon: "🧘",
      category: "breathing",
      requirement: 10,
      currentProgress: 3,
      unlocked: false,
      points: 150,
    },
    {
      id: "breathing_50",
      title: "Mestre do Relaxamento",
      description: "Complete 50 sessões de respiração guiada",
      icon: "🧘‍♂️",
      category: "breathing",
      requirement: 50,
      currentProgress: 3,
      unlocked: false,
      points: 500,
    },

    // Vídeos
    {
      id: "videos_10",
      title: "Alongamento Ativo",
      description: "Assista 10 vídeos de alongamento",
      icon: "🤸",
      category: "videos",
      requirement: 10,
      currentProgress: 4,
      unlocked: false,
      points: 100,
    },
    {
      id: "videos_30",
      title: "Especialista em Alongamento",
      description: "Assista 30 vídeos de alongamento",
      icon: "🤸‍♂️",
      category: "videos",
      requirement: 30,
      currentProgress: 4,
      unlocked: false,
      points: 300,
    },

    // Especiais
    {
      id: "perfect_week",
      title: "Semana Perfeita",
      description: "Complete todas as atividades por 7 dias seguidos",
      icon: "⭐",
      category: "special",
      requirement: 7,
      currentProgress: 0,
      unlocked: false,
      points: 500,
    },
    {
      id: "health_guardian",
      title: "Guardião da Saúde",
      description: "Alcance 5000 pontos totais",
      icon: "👑",
      category: "special",
      requirement: 5000,
      currentProgress: stats.totalPoints,
      unlocked: stats.totalPoints >= 5000,
      points: 1000,
    },
  ];

  const getCategoryName = (category: Achievement["category"]) => {
    const names = {
      hydration: "Hidratação",
      checkin: "Check-in",
      challenges: "Desafios",
      breathing: "Respiração",
      videos: "Vídeos",
      special: "Especiais",
    };
    return names[category];
  };

  const getCategoryColor = (category: Achievement["category"]) => {
    const colorMap = {
      hydration: colors.primary,
      checkin: colors.success,
      challenges: colors.warning,
      breathing: "#9333EA", // Purple
      videos: "#EC4899", // Pink
      special: "#F59E0B", // Amber
    };
    return colorMap[category];
  };

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<Achievement["category"], Achievement[]>);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">🏆 Conquistas</Text>
            <Text className="text-base text-muted">
              Desbloqueie todas as conquistas e prove que você é um Guardião da Saúde!
            </Text>
          </View>

          {/* Progresso Geral */}
          <Card className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-foreground">Progresso Geral</Text>
              <Text className="text-2xl font-bold text-primary">{completionPercentage}%</Text>
            </View>
            <View className="h-3 bg-surface rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </View>
            <Text className="text-sm text-muted">
              {unlockedCount} de {totalCount} conquistas desbloqueadas
            </Text>
          </Card>

          {/* Conquistas por Categoria */}
          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
            <View key={category} className="gap-3">
              <Text className="text-lg font-bold text-foreground">
                {getCategoryName(category as Achievement["category"])}
              </Text>
              {categoryAchievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  className={`gap-3 ${
                    achievement.unlocked
                      ? "bg-success/10 border border-success"
                      : "opacity-70"
                  }`}
                >
                  <View className="flex-row items-start gap-4">
                    {/* Ícone */}
                    <View
                      className="w-16 h-16 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: achievement.unlocked
                          ? getCategoryColor(achievement.category)
                          : colors.surface,
                      }}
                    >
                      <Text className="text-3xl">{achievement.icon}</Text>
                    </View>

                    {/* Informações */}
                    <View className="flex-1 gap-2">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-base font-bold text-foreground">
                          {achievement.title}
                        </Text>
                        {achievement.unlocked && <Text className="text-lg">✓</Text>}
                      </View>
                      <Text className="text-sm text-muted">{achievement.description}</Text>

                      {/* Progresso */}
                      {!achievement.unlocked && (
                        <View className="gap-1">
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-muted">
                              {achievement.currentProgress} / {achievement.requirement}
                            </Text>
                            <Text className="text-xs text-muted">
                              {Math.round(
                                (achievement.currentProgress / achievement.requirement) * 100
                              )}
                              %
                            </Text>
                          </View>
                          <View className="h-2 bg-surface rounded-full overflow-hidden">
                            <View
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(
                                  (achievement.currentProgress / achievement.requirement) * 100,
                                  100
                                )}%`,
                                backgroundColor: getCategoryColor(achievement.category),
                              }}
                            />
                          </View>
                        </View>
                      )}

                      {/* Pontos */}
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs font-semibold text-primary">
                          +{achievement.points} pontos
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ))}

          {/* Dica */}
          <Card className="bg-primary/10 border border-primary gap-2">
            <Text className="text-sm font-semibold text-primary">💡 Dica</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Complete atividades diariamente para desbloquear novas conquistas e ganhar mais
              pontos!
            </Text>
          </Card>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
