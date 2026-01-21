import { ScrollView, Text, View, TouchableOpacity, Pressable } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { EXERCISES } from "@/lib/types";
import * as Haptics from "expo-haptics";

type TabType = "alongamento" | "postura" | "respiracao";

export default function ErgonomiaScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("alongamento");
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const filteredExercises = EXERCISES.filter((e) => e.category === activeTab);

  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    setSelectedExercise(null);
  };

  const handleSelectExercise = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedExercise(selectedExercise === id ? null : id);
  };

  const handleFazerAgora = (exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/exercise-detail?id=${exerciseId}`);
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Cabeçalho */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Ergonomia</Text>
            <Text className="text-base text-muted">Aprenda posturas corretas e alongamentos</Text>
          </View>

          {/* Abas */}
          <View className="flex-row gap-2">
            {(["alongamento", "postura", "respiracao"] as TabType[]).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => handleTabChange(tab)}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View
                  className={`flex-1 py-3 px-4 rounded-lg border ${
                    activeTab === tab
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                >
                  <Text
                    className={`text-center text-sm font-semibold ${
                      activeTab === tab ? "text-white" : "text-foreground"
                    }`}
                  >
                    {tab === "alongamento"
                      ? "Alongamentos"
                      : tab === "postura"
                        ? "Posturas"
                        : "Respiração"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Lista de Exercícios */}
          <View className="gap-3">
            {filteredExercises.map((exercise) => (
              <Card
                key={exercise.id}
                className={`gap-3 ${
                  selectedExercise === exercise.id ? "bg-primary/10 border-primary" : ""
                }`}
              >
                <Pressable
                  onPress={() => handleSelectExercise(exercise.id)}
                  style={({ pressed }) => [
                    {
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View className="gap-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="flex-1 text-lg font-semibold text-foreground">
                        {exercise.title}
                      </Text>
                      <Text className="text-2xl">
                        {selectedExercise === exercise.id ? "▼" : "▶"}
                      </Text>
                    </View>
                    <Text className="text-sm text-muted">{exercise.description}</Text>
                    <Text className="text-xs text-muted">
                      ⏱️ {exercise.duration} segundos
                    </Text>
                  </View>
                </Pressable>

                {/* Detalhes do Exercício */}
                {selectedExercise === exercise.id && (
                  <View className="gap-3 pt-3 border-t border-border">
                    <View className="gap-2">
                      <Text className="text-sm font-semibold text-foreground">Instruções:</Text>
                      {exercise.instructions.map((instruction, index) => (
                        <View key={index} className="flex-row gap-2">
                          <Text className="text-primary font-bold">{index + 1}.</Text>
                          <Text className="flex-1 text-sm text-foreground leading-relaxed">
                            {instruction}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      className="bg-primary rounded-lg py-3 active:opacity-80"
                      onPress={() => handleFazerAgora(exercise.id)}
                    >
                      <Text className="text-center font-semibold text-white">
                        Fazer Agora
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            ))}
          </View>

          {/* Dica de Segurança */}
          <Card className="bg-warning/10 border border-warning gap-2">
            <Text className="text-sm font-semibold text-warning">⚠️ Importante</Text>
            <Text className="text-sm text-foreground leading-relaxed">
              Se sentir dor aguda durante qualquer exercício, pare imediatamente e procure o SESMT.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
