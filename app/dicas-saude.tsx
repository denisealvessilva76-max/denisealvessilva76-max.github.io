import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { ALL_HEALTH_TIPS, CATEGORIES, type HealthTipCategory } from "@/lib/health-tips-data";

export default function DicasSaudeScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<HealthTipCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTips = ALL_HEALTH_TIPS.filter((tip) => {
    const matchesCategory = selectedCategory === "all" || tip.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleTipPress = (tipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/dica-detalhe",
      params: { id: tipId },
    } as any);
  };

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
            <Text className="text-3xl font-bold text-foreground">📚 Dicas de Saúde</Text>
            <Text className="text-base text-muted">
              Artigos e vídeos sobre ergonomia e prevenção de lesões
            </Text>
          </View>

          {/* Busca */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text className="text-xl">🔍</Text>
            <TextInput
              placeholder="Buscar dicas..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                color: colors.foreground,
                fontSize: 16,
              }}
            />
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
                {CATEGORIES.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(category.id as HealthTipCategory);
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

          {/* Contador de Resultados */}
          <Text className="text-sm text-muted">
            {filteredTips.length} {filteredTips.length === 1 ? "dica encontrada" : "dicas encontradas"}
          </Text>

          {/* Lista de Dicas */}
          <View className="gap-4">
            {filteredTips.map((tip) => (
              <Pressable
                key={tip.id}
                onPress={() => handleTipPress(tip.id)}
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
                  {/* Cabeçalho do Card */}
                  <View className="flex-row items-start gap-3">
                    <Text className="text-4xl">{tip.thumbnail}</Text>
                    <View className="flex-1 gap-1">
                      <View className="flex-row items-center gap-2">
                        <View
                          style={{
                            backgroundColor:
                              CATEGORIES.find((c) => c.id === tip.category)?.color + "20",
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: CATEGORIES.find((c) => c.id === tip.category)?.color,
                              fontSize: 10,
                              fontWeight: "700",
                              textTransform: "uppercase",
                            }}
                          >
                            {tip.type === "article" ? "ARTIGO" : "VÍDEO"}
                          </Text>
                        </View>
                        {tip.duration && (
                          <Text className="text-xs text-muted">⏱️ {tip.duration}</Text>
                        )}
                        {tip.readTime && (
                          <Text className="text-xs text-muted">📖 {tip.readTime}</Text>
                        )}
                      </View>
                      <Text className="text-base font-bold text-foreground">{tip.title}</Text>
                      <Text className="text-sm text-muted" numberOfLines={2}>
                        {tip.description}
                      </Text>
                    </View>
                  </View>

                  {/* Tags */}
                  {tip.tags && tip.tags.length > 0 && (
                    <View className="flex-row flex-wrap gap-2">
                      {tip.tags.slice(0, 3).map((tag) => (
                        <View
                          key={tag}
                          style={{
                            backgroundColor: colors.background,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                          }}
                        >
                          <Text className="text-xs text-muted">#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Autor e Data */}
                  {(tip.author || tip.date) && (
                    <View className="flex-row items-center gap-2 pt-2 border-t border-border">
                      {tip.author && (
                        <Text className="text-xs text-muted">👤 {tip.author}</Text>
                      )}
                      {tip.date && (
                        <Text className="text-xs text-muted">
                          📅 {new Date(tip.date).toLocaleDateString("pt-BR")}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </View>

          {/* Mensagem se não houver resultados */}
          {filteredTips.length === 0 && (
            <View className="items-center justify-center py-12 gap-3">
              <Text className="text-6xl">🔍</Text>
              <Text className="text-lg font-semibold text-foreground text-center">
                Nenhuma dica encontrada
              </Text>
              <Text className="text-sm text-muted text-center">
                Tente ajustar os filtros ou buscar por outros termos
              </Text>
            </View>
          )}

          {/* Espaçamento final */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
