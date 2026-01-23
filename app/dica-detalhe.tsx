import { ScrollView, Text, View, Pressable, Linking, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { ALL_HEALTH_TIPS, CATEGORIES } from "@/lib/health-tips-data";
import Markdown from "react-native-markdown-display";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import * as WebBrowser from "expo-web-browser";

export default function DicaDetalheScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams();
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const tip = ALL_HEALTH_TIPS.find((t) => t.id === id);

  if (!tip) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-6xl">❌</Text>
          <Text className="text-xl font-bold text-foreground text-center">
            Dica não encontrada
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

  const category = CATEGORIES.find((c) => c.id === tip.category);

  const handleOpenVideo = async () => {
    if (tip.videoUrl) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        // Usar WebBrowser para abrir YouTube (mais confiável que Linking)
        await WebBrowser.openBrowserAsync(tip.videoUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
          controlsColor: colors.primary,
          toolbarColor: colors.background,
        });
      } catch (error) {
        console.error("Erro ao abrir vídeo:", error);
        Alert.alert("Erro", "Não foi possível abrir o vídeo. Verifique sua conexão.");
      }
    }
  };

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

            {/* Badge de Categoria */}
            <View className="flex-row items-center gap-2">
              <View
                style={{
                  backgroundColor: category?.color + "20",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: category?.color,
                    fontSize: 12,
                    fontWeight: "700",
                    textTransform: "uppercase",
                  }}
                >
                  {category?.icon} {category?.label}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.surface,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text className="text-xs font-bold text-foreground">
                  {tip.type === "article" ? "📄 ARTIGO" : "🎥 VÍDEO"}
                </Text>
              </View>
            </View>

            {/* Título */}
            <Text className="text-3xl font-bold text-foreground">{tip.title}</Text>

            {/* Metadados */}
            <View className="flex-row flex-wrap gap-3">
              {tip.duration && (
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm text-muted">⏱️ {tip.duration}</Text>
                </View>
              )}
              {tip.readTime && (
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm text-muted">📖 {tip.readTime}</Text>
                </View>
              )}
              {tip.author && (
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm text-muted">👤 {tip.author}</Text>
                </View>
              )}
              {tip.date && (
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm text-muted">
                    📅 {new Date(tip.date).toLocaleDateString("pt-BR")}
                  </Text>
                </View>
              )}
            </View>

            {/* Descrição */}
            <Text className="text-base text-muted leading-relaxed">{tip.description}</Text>

            {/* Tags */}
            {tip.tags && tip.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {tip.tags.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      backgroundColor: colors.surface,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                    }}
                  >
                    <Text className="text-xs text-muted">#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Conteúdo do Artigo */}
          {tip.type === "article" && tip.content && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Markdown
                style={{
                  body: {
                    color: colors.foreground,
                    fontSize: 16,
                    lineHeight: 24,
                  },
                  heading1: {
                    color: colors.foreground,
                    fontSize: 24,
                    fontWeight: "bold",
                    marginTop: 16,
                    marginBottom: 8,
                  },
                  heading2: {
                    color: colors.foreground,
                    fontSize: 20,
                    fontWeight: "bold",
                    marginTop: 12,
                    marginBottom: 6,
                  },
                  heading3: {
                    color: colors.foreground,
                    fontSize: 18,
                    fontWeight: "600",
                    marginTop: 10,
                    marginBottom: 4,
                  },
                  paragraph: {
                    color: colors.foreground,
                    marginTop: 4,
                    marginBottom: 8,
                    lineHeight: 24,
                  },
                  strong: {
                    fontWeight: "bold",
                    color: colors.foreground,
                  },
                  em: {
                    fontStyle: "italic",
                  },
                  bullet_list: {
                    marginTop: 4,
                    marginBottom: 8,
                  },
                  ordered_list: {
                    marginTop: 4,
                    marginBottom: 8,
                  },
                  list_item: {
                    color: colors.foreground,
                    marginBottom: 4,
                  },
                  blockquote: {
                    backgroundColor: colors.background,
                    borderLeftColor: colors.primary,
                    borderLeftWidth: 4,
                    paddingLeft: 12,
                    paddingVertical: 8,
                    marginVertical: 8,
                  },
                  hr: {
                    backgroundColor: colors.border,
                    height: 1,
                    marginVertical: 16,
                  },
                }}
              >
                {tip.content}
              </Markdown>
            </View>
          )}

          {/* Player de Vídeo */}
          {tip.type === "video" && tip.videoUrl && (
            <View className="gap-4">
              {/* Thumbnail do YouTube */}
              {tip.videoId && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      aspectRatio: 16 / 9,
                      backgroundColor: colors.background,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text className="text-6xl mb-4">🎥</Text>
                    <Text className="text-lg font-semibold text-foreground text-center px-4">
                      Vídeo do YouTube
                    </Text>
                    <Text className="text-sm text-muted text-center px-4 mt-2">
                      Clique no botão abaixo para assistir
                    </Text>
                  </View>
                </View>
              )}

              {/* Botão para Abrir Vídeo */}
              <Pressable
                onPress={handleOpenVideo}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 16,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  },
                ]}
              >
                <Text className="text-xl">▶️</Text>
                <Text className="text-white font-bold text-lg">Assistir no YouTube</Text>
              </Pressable>

              {/* Informações Adicionais */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <Text className="text-sm text-muted leading-relaxed">
                  💡 <Text className="font-semibold">Dica:</Text> Para melhor experiência, assista
                  em tela cheia e ative as legendas se disponível.
                </Text>
              </View>
            </View>
          )}

          {/* Botão de Ação */}
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
              💪 Gostou desta dica?
            </Text>
            <Text className="text-sm text-muted leading-relaxed">
              Compartilhe com seus colegas de trabalho e ajude a criar um ambiente mais seguro e
              saudável para todos!
            </Text>
          </View>

          {/* Espaçamento final */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
