import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useChallenges } from "@/hooks/use-challenges";
import * as Haptics from "expo-haptics";
import { AVAILABLE_CHALLENGES, DIFFICULTY_COLORS, RANK_ICONS, getDaysRemaining } from "@/lib/challenges-data";
import { useEffect, useState } from "react";
import { Alert, TextInput } from "react-native";
import type { ChallengeProgress } from "@/lib/challenges-data";

export default function DesafioDetalheScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams();
  const { getChallengeProgress, getChallengeRanking, activeChallenges, updateChallengeProgress } = useChallenges();

  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const challenge = AVAILABLE_CHALLENGES.find((c) => c.id === id);
  const activeChallenge = activeChallenges.find((c) => c.id === id);

  useEffect(() => {
    loadProgress();
  }, [id]);

  const loadProgress = async () => {
    if (typeof id === "string") {
      const p = await getChallengeProgress(id);
      setProgress(p);
    }
  };

  if (!challenge) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-6xl">❌</Text>
          <Text className="text-xl font-bold text-foreground text-center">
            Desafio não encontrado
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.7 : 1,
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
              },
            ]}
          >
            <Text className="text-white font-semibold">Voltar</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const ranking = getChallengeRanking(challenge.id);
  const daysRemaining = activeChallenge?.endDate ? getDaysRemaining(activeChallenge.endDate) : challenge.duration;

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Cabeçalho */}
          <View className="gap-3">
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text className="text-primary text-base">← Voltar</Text>
            </Pressable>

            <View className="flex-row items-center gap-3">
              <Text className="text-6xl">{challenge.icon}</Text>
              <View className="flex-1">
                <View
                  style={{
                    backgroundColor: DIFFICULTY_COLORS[challenge.difficulty] + "20",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      color: DIFFICULTY_COLORS[challenge.difficulty],
                      fontSize: 12,
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    {challenge.difficulty === "easy" && "FÁCIL"}
                    {challenge.difficulty === "medium" && "MÉDIO"}
                    {challenge.difficulty === "hard" && "DIFÍCIL"}
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-3xl font-bold text-foreground">{challenge.title}</Text>
            <Text className="text-base text-muted leading-relaxed">{challenge.description}</Text>
          </View>

          {/* Informações do Desafio */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">🎯 Meta</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {challenge.goal} {challenge.unit}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">⏱️ Duração</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {challenge.duration} dias
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">💎 Pontos</Text>
                <Text className="text-sm font-semibold text-primary">
                  +{challenge.points} pontos
                </Text>
              </View>
              {challenge.badge && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted">🏅 Medalha</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {challenge.badge}
                  </Text>
                </View>
              )}
              {activeChallenge && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted">📅 Dias Restantes</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {daysRemaining} dias
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Progresso Pessoal */}
          {progress && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text className="text-lg font-semibold text-foreground mb-3">
                📊 Seu Progresso
              </Text>

              {/* Barra de Progresso */}
              <View className="gap-2">
                <View
                  style={{
                    height: 12,
                    backgroundColor: colors.background,
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${progress.progress}%`,
                      backgroundColor: colors.primary,
                      borderRadius: 6,
                    }}
                  />
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted">
                    {progress.currentValue} / {progress.goalValue} {challenge.unit}
                  </Text>
                  <Text className="text-sm font-semibold text-primary">
                    {Math.round(progress.progress)}%
                  </Text>
                </View>
              </View>

              {progress.completed && (
                <View
                  style={{
                    backgroundColor: colors.primary + "10",
                    borderColor: colors.primary,
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 12,
                  }}
                >
                  <Text className="text-center font-semibold text-primary">
                    🎉 Desafio Completado!
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Ranking da Equipe */}
          {ranking.length > 0 && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text className="text-lg font-semibold text-foreground mb-3">
                🏆 Ranking da Equipe
              </Text>

              <View className="gap-2">
                {ranking.slice(0, 10).map((entry) => (
                  <View
                    key={entry.userId}
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Text className="text-2xl">
                      {RANK_ICONS[entry.rank as keyof typeof RANK_ICONS] || `${entry.rank}º`}
                    </Text>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">
                        {entry.userName}
                      </Text>
                      <Text className="text-xs text-muted">
                        {entry.currentValue} {challenge.unit}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: colors.primary + "20",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text className="text-xs font-semibold text-primary">
                        {Math.round(entry.progress)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {ranking.length > 10 && (
                <Text className="text-xs text-muted text-center mt-3">
                  +{ranking.length - 10} participantes
                </Text>
              )}
            </View>
          )}

          {/* Registrar Progresso */}
          {activeChallenge && !progress?.completed && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text className="text-lg font-semibold text-foreground mb-3">
                ✅ Registrar Progresso de Hoje
              </Text>

              <View className="gap-3">
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 16,
                      color: colors.foreground,
                    }}
                    placeholder={`Ex: ${challenge.type === 'steps' ? '6000' : challenge.type === 'hydration' ? '8' : '1'}`}
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={inputValue}
                    onChangeText={setInputValue}
                  />
                  <Text className="text-sm text-muted">{challenge.unit}</Text>
                </View>

                <Pressable
                  onPress={async () => {
                    if (!inputValue || isNaN(Number(inputValue))) {
                      Alert.alert("Atenção", "Digite um valor válido");
                      return;
                    }

                    setIsRegistering(true);
                    try {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const success = await updateChallengeProgress(
                        challenge.id,
                        Number(inputValue),
                        true
                      );

                      if (success) {
                        await loadProgress();
                        setInputValue("");
                        Alert.alert(
                          "Sucesso! 🎉",
                          "Progresso registrado com sucesso!"
                        );
                      } else {
                        Alert.alert("Erro", "Não foi possível registrar o progresso");
                      }
                    } catch (error) {
                      Alert.alert("Erro", "Ocorreu um erro ao registrar");
                    } finally {
                      setIsRegistering(false);
                    }
                  }}
                  disabled={isRegistering}
                  style={({ pressed }) => [{
                    backgroundColor: colors.primary,
                    paddingVertical: 14,
                    borderRadius: 8,
                    opacity: pressed || isRegistering ? 0.7 : 1,
                  }]}
                >
                  <Text className="text-white font-semibold text-center text-base">
                    {isRegistering ? "Registrando..." : "Registrar Progresso"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Dicas */}
          <View
            style={{
              backgroundColor: colors.primary + "10",
              borderColor: colors.primary,
              borderWidth: 1,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text className="text-base text-foreground font-semibold mb-2">
              💡 Dicas para Completar
            </Text>
            <Text className="text-sm text-muted leading-relaxed">
              {challenge.type === "steps" && "• Use um app de contagem de passos\n• Caminhe durante as pausas\n• Suba escadas em vez de usar elevador"}
              {challenge.type === "hydration" && "• Configure lembretes de água\n• Tenha sempre uma garrafa por perto\n• Beba água antes de sentir sede"}
              {challenge.type === "checkin" && "• Faça check-in logo pela manhã\n• Configure lembretes diários\n• Seja honesto sobre como se sente"}
              {challenge.type === "dds" && "• Assista os vídeos com atenção\n• Faça anotações importantes\n• Compartilhe com a equipe"}
            </Text>
          </View>

          {/* Espaçamento final */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
