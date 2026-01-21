import { ScrollView, Text, View, TouchableOpacity, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useHealthData } from "@/hooks/use-health-data";
import { useGamification } from "@/hooks/use-gamification";
import { MEDALS, getMedalTypeLabel, getProgressToNextMedal } from "@/lib/gamification";
import * as Haptics from "expo-haptics";

export default function AchievementsScreen() {
  const router = useRouter();
  const { checkIns } = useHealthData();
  const { stats, getNextMedalInfo } = useGamification(checkIns);
  const nextMedalInfo = getNextMedalInfo();

  const getWeeklyCheckIns = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    return checkIns.filter((c) => {
      const checkInDate = new Date(c.date);
      return checkInDate >= weekStart && checkInDate <= now;
    }).length;
  };

  const weeklyCheckIns = getWeeklyCheckIns();

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Cabeçalho */}
          <View className="gap-2">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary font-semibold">← Voltar</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground">Conquistas</Text>
            <Text className="text-base text-muted">Suas medalhas e progresso</Text>
          </View>

          {/* Estatísticas Gerais */}
          <Card className="gap-4">
            <Text className="text-lg font-semibold text-foreground">📊 Estatísticas</Text>
            <View className="grid grid-cols-2 gap-3">
              <View className="bg-primary/10 rounded-lg p-3 border border-primary">
                <Text className="text-2xl font-bold text-primary">{stats.totalCheckIns}</Text>
                <Text className="text-xs text-muted">Total de Check-ins</Text>
              </View>
              <View className="bg-success/10 rounded-lg p-3 border border-success">
                <Text className="text-2xl font-bold text-success">{stats.currentStreak}</Text>
                <Text className="text-xs text-muted">Sequência Atual</Text>
              </View>
              <View className="bg-warning/10 rounded-lg p-3 border border-warning">
                <Text className="text-2xl font-bold text-warning">{stats.longestStreak}</Text>
                <Text className="text-xs text-muted">Melhor Sequência</Text>
              </View>
              <View className="bg-primary/10 rounded-lg p-3 border border-primary">
                <Text className="text-2xl font-bold text-primary">{stats.totalPoints}</Text>
                <Text className="text-xs text-muted">Pontos Totais</Text>
              </View>
            </View>
          </Card>

          {/* Progresso da Semana */}
          <Card className="gap-4">
            <Text className="text-lg font-semibold text-foreground">📈 Progresso da Semana</Text>
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground font-semibold">
                  {weeklyCheckIns} / 7 check-ins
                </Text>
                <Text className="text-sm text-muted">{Math.round((weeklyCheckIns / 7) * 100)}%</Text>
              </View>
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${(weeklyCheckIns / 7) * 100}%` }}
                />
              </View>
            </View>

            {/* Próxima Medalha */}
            {nextMedalInfo.medal && (
              <View className="gap-2 pt-3 border-t border-border">
                <Text className="text-sm text-muted">Próxima Medalha:</Text>
                <View className="flex-row items-center gap-3">
                  <Text className="text-4xl">{nextMedalInfo.medal.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {nextMedalInfo.medal.name}
                    </Text>
                    <Text className="text-xs text-muted">
                      Faltam {nextMedalInfo.checkInsNeeded} check-ins
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Card>

          {/* Medalhas Desbloqueadas */}
          <Card className="gap-4">
            <Text className="text-lg font-semibold text-foreground">🏆 Medalhas Desbloqueadas</Text>
            {stats.unlockedMedals.length > 0 ? (
              <View className="gap-2">
                {stats.unlockedMedals.map((medal) => (
                  <Pressable
                    key={medal.id}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View className="flex-row items-center gap-3 p-3 bg-success/10 rounded-lg border border-success">
                      <Text className="text-4xl">{medal.emoji}</Text>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {medal.name}
                        </Text>
                        <Text className="text-xs text-muted">{medal.description}</Text>
                        <Text className="text-xs text-success font-semibold mt-1">
                          ✓ Desbloqueada
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text className="text-center text-muted py-4">
                Nenhuma medalha desbloqueada ainda. Comece a fazer check-ins!
              </Text>
            )}
          </Card>

          {/* Todas as Medalhas */}
          <Card className="gap-4">
            <Text className="text-lg font-semibold text-foreground">📋 Todas as Medalhas</Text>
            <View className="gap-2">
              {MEDALS.map((medal) => {
                const isUnlocked = stats.unlockedMedals.some((m) => m.id === medal.id);
                return (
                  <View
                    key={medal.id}
                    className={`flex-row items-center gap-3 p-3 rounded-lg border ${
                      isUnlocked
                        ? "bg-success/10 border-success"
                        : "bg-surface border-border opacity-50"
                    }`}
                  >
                    <Text className={`text-4xl ${isUnlocked ? "" : "opacity-50"}`}>
                      {medal.emoji}
                    </Text>
                    <View className="flex-1">
                      <Text className={`text-base font-semibold ${isUnlocked ? "text-foreground" : "text-muted"}`}>
                        {medal.name}
                      </Text>
                      <Text className="text-xs text-muted">{medal.description}</Text>
                      <Text className="text-xs text-muted mt-1">
                        {medal.requirement} check-ins necessários
                      </Text>
                    </View>
                    {isUnlocked && <Text className="text-success font-bold">✓</Text>}
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Dica */}
          <Card className="bg-primary/10 border border-primary gap-2">
            <Text className="text-sm font-semibold text-primary">💡 Dica</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Faça check-in todos os dias para desbloquear medalhas e ganhar pontos. Quanto mais
              consistente, mais recompensas você ganha!
            </Text>
          </Card>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
