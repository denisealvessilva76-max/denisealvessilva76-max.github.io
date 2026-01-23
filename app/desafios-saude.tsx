import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import { useChallenges } from "@/hooks/use-challenges";
import * as Haptics from "expo-haptics";
import { DIFFICULTY_COLORS } from "@/lib/challenges-data";

export default function DesafiosSaudeScreen() {
  const router = useRouter();
  const colors = useColors();
  const {
    activeChallenges,
    getAvailableChallenges,
    startChallenge,
    getChallengeProgress,
    isLoading,
  } = useChallenges();

  const [selectedTab, setSelectedTab] = useState<"available" | "active">("active");

  const availableChallenges = getAvailableChallenges();

  const handleStartChallenge = async (challengeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      "Iniciar Desafio",
      "Você tem certeza que deseja iniciar este desafio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Iniciar",
          onPress: async () => {
            const success = await startChallenge(challengeId);
            if (success) {
              Alert.alert("Sucesso!", "Desafio iniciado! Boa sorte! 💪");
            } else {
              Alert.alert("Erro", "Não foi possível iniciar o desafio.");
            }
          },
        },
      ]
    );
  };

  const handleViewChallenge = (challengeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/desafio-detalhe",
      params: { id: challengeId },
    } as any);
  };

  if (isLoading) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-foreground">Carregando desafios...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Cabeçalho */}
          <View className="gap-2">
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text className="text-primary text-base">← Voltar</Text>
            </Pressable>
            <Text className="text-3xl font-bold text-foreground">🎯 Desafios de Saúde</Text>
            <Text className="text-base text-muted">
              Participe de desafios e ganhe pontos e medalhas!
            </Text>
          </View>

          {/* Tabs */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedTab("active");
              }}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.7 : 1,
                  flex: 1,
                  backgroundColor: selectedTab === "active" ? colors.primary : colors.surface,
                  borderColor: selectedTab === "active" ? colors.primary : colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                },
              ]}
            >
              <Text
                style={{
                  color: selectedTab === "active" ? "#ffffff" : colors.foreground,
                  fontWeight: "600",
                }}
              >
                Ativos ({activeChallenges.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedTab("available");
              }}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.7 : 1,
                  flex: 1,
                  backgroundColor: selectedTab === "available" ? colors.primary : colors.surface,
                  borderColor: selectedTab === "available" ? colors.primary : colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                },
              ]}
            >
              <Text
                style={{
                  color: selectedTab === "available" ? "#ffffff" : colors.foreground,
                  fontWeight: "600",
                }}
              >
                Disponíveis ({availableChallenges.length})
              </Text>
            </Pressable>
          </View>

          {/* Lista de Desafios Ativos */}
          {selectedTab === "active" && (
            <View className="gap-4">
              {activeChallenges.length > 0 ? (
                activeChallenges.map((challenge) => (
                  <Pressable
                    key={challenge.id}
                    onPress={() => handleViewChallenge(challenge.id)}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.7 : 1,
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 16,
                      },
                    ]}
                  >
                    <View className="gap-3">
                      <View className="flex-row items-start gap-3">
                        <Text className="text-4xl">{challenge.icon}</Text>
                        <View className="flex-1 gap-1">
                          <View className="flex-row items-center gap-2">
                            <View
                              style={{
                                backgroundColor: DIFFICULTY_COLORS[challenge.difficulty] + "20",
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 4,
                              }}
                            >
                              <Text
                                style={{
                                  color: DIFFICULTY_COLORS[challenge.difficulty],
                                  fontSize: 10,
                                  fontWeight: "700",
                                  textTransform: "uppercase",
                                }}
                              >
                                {challenge.difficulty === "easy" && "FÁCIL"}
                                {challenge.difficulty === "medium" && "MÉDIO"}
                                {challenge.difficulty === "hard" && "DIFÍCIL"}
                              </Text>
                            </View>
                            <Text className="text-xs text-muted">
                              ⏱️ {challenge.duration} dias
                            </Text>
                          </View>
                          <Text className="text-base font-bold text-foreground">
                            {challenge.title}
                          </Text>
                          <Text className="text-sm text-muted" numberOfLines={2}>
                            {challenge.description}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between pt-2 border-t border-border">
                        <Text className="text-xs text-muted">
                          🎯 Meta: {challenge.goal} {challenge.unit}
                        </Text>
                        <Text className="text-xs font-semibold text-primary">
                          +{challenge.points} pontos
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              ) : (
                <View className="items-center justify-center py-12 gap-3">
                  <Text className="text-6xl">🎯</Text>
                  <Text className="text-lg font-semibold text-foreground text-center">
                    Nenhum desafio ativo
                  </Text>
                  <Text className="text-sm text-muted text-center">
                    Inicie um desafio para começar a ganhar pontos!
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Lista de Desafios Disponíveis */}
          {selectedTab === "available" && (
            <View className="gap-4">
              {availableChallenges.length > 0 ? (
                availableChallenges.map((challenge) => (
                  <View
                    key={challenge.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <View className="gap-3">
                      <View className="flex-row items-start gap-3">
                        <Text className="text-4xl">{challenge.icon}</Text>
                        <View className="flex-1 gap-1">
                          <View className="flex-row items-center gap-2">
                            <View
                              style={{
                                backgroundColor: DIFFICULTY_COLORS[challenge.difficulty] + "20",
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 4,
                              }}
                            >
                              <Text
                                style={{
                                  color: DIFFICULTY_COLORS[challenge.difficulty],
                                  fontSize: 10,
                                  fontWeight: "700",
                                  textTransform: "uppercase",
                                }}
                              >
                                {challenge.difficulty === "easy" && "FÁCIL"}
                                {challenge.difficulty === "medium" && "MÉDIO"}
                                {challenge.difficulty === "hard" && "DIFÍCIL"}
                              </Text>
                            </View>
                            <Text className="text-xs text-muted">
                              ⏱️ {challenge.duration} dias
                            </Text>
                          </View>
                          <Text className="text-base font-bold text-foreground">
                            {challenge.title}
                          </Text>
                          <Text className="text-sm text-muted">
                            {challenge.description}
                          </Text>
                        </View>
                      </View>

                      <View className="gap-2 pt-2 border-t border-border">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs text-muted">
                            🎯 Meta: {challenge.goal} {challenge.unit}
                          </Text>
                          <Text className="text-xs font-semibold text-primary">
                            +{challenge.points} pontos
                          </Text>
                        </View>

                        {challenge.badge && (
                          <Text className="text-xs text-muted">
                            🏅 Medalha: {challenge.badge}
                          </Text>
                        )}

                        <Pressable
                          onPress={() => handleStartChallenge(challenge.id)}
                          style={({ pressed }) => [
                            {
                              opacity: pressed ? 0.7 : 1,
                              backgroundColor: colors.primary,
                              paddingVertical: 10,
                              borderRadius: 8,
                              alignItems: "center",
                              marginTop: 4,
                            },
                          ]}
                        >
                          <Text className="text-white font-semibold">Iniciar Desafio</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center justify-center py-12 gap-3">
                  <Text className="text-6xl">🎉</Text>
                  <Text className="text-lg font-semibold text-foreground text-center">
                    Você iniciou todos os desafios!
                  </Text>
                  <Text className="text-sm text-muted text-center">
                    Complete os desafios ativos para liberar novos
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Espaçamento final */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
