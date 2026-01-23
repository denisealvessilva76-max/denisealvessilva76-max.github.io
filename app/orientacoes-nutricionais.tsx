import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { NUTRITION_TIPS, NUTRITION_CATEGORIES, getHydrationAlert, type NutritionCategory } from "@/lib/nutrition-data";

export default function OrientacoesNutricionaisScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<NutritionCategory | "all">("all");

  // Simular temperatura (em produção, viria de API de clima)
  const currentTemperature = 32; // °C
  const hydrationAlert = getHydrationAlert(currentTemperature);

  const filteredTips = selectedCategory === "all"
    ? NUTRITION_TIPS
    : NUTRITION_TIPS.filter((tip) => tip.category === selectedCategory);

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
            <Text className="text-3xl font-bold text-foreground">🍎 Nutrição Saudável</Text>
            <Text className="text-base text-muted">
              Dicas práticas de alimentação para o canteiro de obras
            </Text>
          </View>

          {/* Alerta de Hidratação */}
          <View
            style={{
              backgroundColor:
                hydrationAlert.level === "critical"
                  ? "#EF4444" + "20"
                  : hydrationAlert.level === "warning"
                  ? "#F59E0B" + "20"
                  : colors.primary + "10",
              borderColor:
                hydrationAlert.level === "critical"
                  ? "#EF4444"
                  : hydrationAlert.level === "warning"
                  ? "#F59E0B"
                  : colors.primary,
              borderWidth: 2,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <View className="gap-2">
              <Text className="text-lg font-bold text-foreground">
                {hydrationAlert.message}
              </Text>
              <Text className="text-sm text-muted">
                🌡️ Temperatura: {currentTemperature}°C
              </Text>
              <Text className="text-sm text-foreground leading-relaxed">
                {hydrationAlert.recommendation}
              </Text>
              <View
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 8,
                }}
              >
                <Text className="text-sm font-semibold text-foreground">
                  💧 Meta de Hidratação Hoje: {hydrationAlert.waterGoal}ml ({hydrationAlert.waterGoal / 1000}L)
                </Text>
              </View>
            </View>
          </View>

          {/* Filtros de Categoria */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Categorias</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {/* Todas */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory("all");
                  }}
                  style={({ pressed }) => [
                    {
                      opacity: pressed ? 0.7 : 1,
                      backgroundColor:
                        selectedCategory === "all" ? colors.primary : colors.surface,
                      borderColor: selectedCategory === "all" ? colors.primary : colors.border,
                      borderWidth: 1,
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selectedCategory === "all" ? "#ffffff" : colors.foreground,
                      fontWeight: "600",
                    }}
                  >
                    🌟 Todas
                  </Text>
                </Pressable>

                {/* Categorias */}
                {NUTRITION_CATEGORIES.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(category.id as NutritionCategory);
                    }}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.7 : 1,
                        backgroundColor:
                          selectedCategory === category.id ? category.color : colors.surface,
                        borderColor:
                          selectedCategory === category.id ? category.color : colors.border,
                        borderWidth: 1,
                        borderRadius: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selectedCategory === category.id ? "#ffffff" : colors.foreground,
                        fontWeight: "600",
                      }}
                    >
                      {category.icon} {category.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Lista de Dicas */}
          <View className="gap-4">
            {filteredTips.map((tip) => (
              <View
                key={tip.id}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <View className="gap-3">
                  {/* Cabeçalho */}
                  <View className="flex-row items-start gap-3">
                    <Text className="text-4xl">{tip.icon}</Text>
                    <View className="flex-1 gap-1">
                      <Text className="text-lg font-bold text-foreground">{tip.title}</Text>
                      <Text className="text-sm text-muted">{tip.description}</Text>
                    </View>
                  </View>

                  {/* Dicas */}
                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-foreground">💡 Dicas:</Text>
                    {tip.tips.map((item, index) => (
                      <View key={index} className="flex-row items-start gap-2">
                        <Text className="text-primary">•</Text>
                        <Text className="text-sm text-foreground flex-1">{item}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Benefícios */}
                  {tip.benefits && tip.benefits.length > 0 && (
                    <View
                      style={{
                        backgroundColor: colors.background,
                        borderRadius: 8,
                        padding: 12,
                      }}
                    >
                      <Text className="text-xs font-semibold text-muted mb-2">
                        ✅ Benefícios:
                      </Text>
                      {tip.benefits.map((benefit, index) => (
                        <Text key={index} className="text-xs text-muted">
                          • {benefit}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Espaçamento final */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
