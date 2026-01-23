import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

// Dados mockados de ranking (em produção viriam do servidor)
const MOCK_RANKING = [
  { id: "1", name: "João Silva", points: 2450, title: "Guardião Avançado", avatar: "👷", position: 1 },
  { id: "2", name: "Maria Santos", points: 2100, title: "Guardião Avançado", avatar: "👷‍♀️", position: 2 },
  { id: "3", name: "Pedro Oliveira", points: 1850, title: "Guardião Intermediário", avatar: "👷", position: 3 },
  { id: "4", name: "Ana Costa", points: 1600, title: "Guardião Intermediário", avatar: "👷‍♀️", position: 4 },
  { id: "5", name: "Carlos Souza", points: 1400, title: "Guardião Intermediário", avatar: "👷", position: 5 },
  { id: "6", name: "Juliana Lima", points: 1200, title: "Guardião Iniciante", avatar: "👷‍♀️", position: 6 },
  { id: "7", name: "Roberto Alves", points: 950, title: "Guardião Iniciante", avatar: "👷", position: 7 },
  { id: "8", name: "Fernanda Rocha", points: 800, title: "Aprendiz", avatar: "👷‍♀️", position: 8 },
  { id: "9", name: "Lucas Martins", points: 650, title: "Aprendiz", avatar: "👷", position: 9 },
  { id: "10", name: "Patricia Dias", points: 500, title: "Aprendiz", avatar: "👷‍♀️", position: 10 },
];

export default function RankingScreen() {
  const colors = useColors();
  const [period, setPeriod] = useState<"semanal" | "mensal">("semanal");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simular carregamento
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getMedalEmoji = (position: number) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return `${position}º`;
  };

  const getMedalColor = (position: number) => {
    if (position === 1) return "#FFD700"; // Ouro
    if (position === 2) return "#C0C0C0"; // Prata
    if (position === 3) return "#CD7F32"; // Bronze
    return colors.muted;
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">🏆 Ranking</Text>
            <Text className="text-base text-muted">
              Veja quem está liderando em saúde e bem-estar!
            </Text>
          </View>

          {/* Filtro de Período */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setPeriod("semanal")}
              className={`flex-1 py-3 rounded-lg ${
                period === "semanal" ? "bg-primary" : "bg-surface border border-border"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  period === "semanal" ? "text-background" : "text-foreground"
                }`}
              >
                Semanal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPeriod("mensal")}
              className={`flex-1 py-3 rounded-lg ${
                period === "mensal" ? "bg-primary" : "bg-surface border border-border"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  period === "mensal" ? "text-background" : "text-foreground"
                }`}
              >
                Mensal
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pódio (Top 3) */}
          <Card className="gap-4">
            <Text className="text-lg font-bold text-foreground">🎖️ Pódio</Text>
            <View className="flex-row justify-around items-end">
              {/* 2º Lugar */}
              <View className="items-center gap-2 flex-1">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: getMedalColor(2) }}
                >
                  <Text className="text-3xl">{MOCK_RANKING[1].avatar}</Text>
                </View>
                <Text className="text-2xl">🥈</Text>
                <Text className="text-sm font-semibold text-foreground text-center">
                  {MOCK_RANKING[1].name.split(" ")[0]}
                </Text>
                <Text className="text-xs text-muted">{MOCK_RANKING[1].points} pts</Text>
              </View>

              {/* 1º Lugar */}
              <View className="items-center gap-2 flex-1 -mt-4">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{ backgroundColor: getMedalColor(1) }}
                >
                  <Text className="text-4xl">{MOCK_RANKING[0].avatar}</Text>
                </View>
                <Text className="text-3xl">🥇</Text>
                <Text className="text-base font-bold text-foreground text-center">
                  {MOCK_RANKING[0].name.split(" ")[0]}
                </Text>
                <Text className="text-sm text-muted">{MOCK_RANKING[0].points} pts</Text>
              </View>

              {/* 3º Lugar */}
              <View className="items-center gap-2 flex-1">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: getMedalColor(3) }}
                >
                  <Text className="text-3xl">{MOCK_RANKING[2].avatar}</Text>
                </View>
                <Text className="text-2xl">🥉</Text>
                <Text className="text-sm font-semibold text-foreground text-center">
                  {MOCK_RANKING[2].name.split(" ")[0]}
                </Text>
                <Text className="text-xs text-muted">{MOCK_RANKING[2].points} pts</Text>
              </View>
            </View>
          </Card>

          {/* Lista Completa */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">📊 Classificação Completa</Text>
            {MOCK_RANKING.map((user, index) => (
              <Card
                key={user.id}
                className={`flex-row items-center gap-4 ${
                  index < 3 ? "border-2" : ""
                }`}
                style={index < 3 ? { borderColor: getMedalColor(user.position) } : {}}
              >
                {/* Posição */}
                <View className="w-12 items-center">
                  <Text className="text-2xl font-bold" style={{ color: getMedalColor(user.position) }}>
                    {getMedalEmoji(user.position)}
                  </Text>
                </View>

                {/* Avatar */}
                <View className="w-12 h-12 rounded-full bg-surface items-center justify-center">
                  <Text className="text-2xl">{user.avatar}</Text>
                </View>

                {/* Informações */}
                <View className="flex-1 gap-1">
                  <Text className="text-base font-semibold text-foreground">{user.name}</Text>
                  <Text className="text-xs text-muted">{user.title}</Text>
                </View>

                {/* Pontos */}
                <View className="items-end">
                  <Text className="text-lg font-bold text-primary">{user.points}</Text>
                  <Text className="text-xs text-muted">pontos</Text>
                </View>
              </Card>
            ))}
          </View>

          {/* Sua Posição */}
          <Card className="bg-primary/10 border border-primary gap-2">
            <Text className="text-sm font-semibold text-primary">📍 Sua Posição</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-foreground">
                Você está em <Text className="font-bold">15º lugar</Text>
              </Text>
              <Text className="text-lg font-bold text-primary">350 pts</Text>
            </View>
            <Text className="text-sm text-muted">
              Faltam apenas 150 pontos para alcançar o 10º lugar!
            </Text>
          </Card>

          {/* Dica */}
          <Card className="bg-success/10 border border-success gap-2">
            <Text className="text-sm font-semibold text-success">💡 Dica</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Faça check-in diário, mantenha-se hidratado e complete desafios para subir no ranking!
            </Text>
          </Card>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
