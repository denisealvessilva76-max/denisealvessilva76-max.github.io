import { View, Text, TouchableOpacity, ScrollView, FlatList } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type VideoCategory = "costas" | "ombros" | "pernas" | "pescoço" | "todos";

type StretchVideo = {
  id: string;
  title: string;
  duration: string; // "2 min"
  category: VideoCategory[];
  description: string;
  thumbnail: string; // emoji
  videoUrl: string;
  difficulty: "fácil" | "médio" | "avançado";
};

const STRETCH_VIDEOS: StretchVideo[] = [
  {
    id: "1",
    title: "Ginástica Laboral - Construção Civil",
    duration: "6 min",
    category: ["costas", "ombros", "pernas", "todos"],
    description: "Ginástica laboral completa para trabalhadores da construção civil.",
    thumbnail: "🧘",
    videoUrl: "https://www.youtube.com/watch?v=zeXxFzl5Vio",
    difficulty: "fácil",
  },
  {
    id: "2",
    title: "Ginástica Laboral no Canteiro de Obras",
    duration: "5 min",
    category: ["todos"],
    description: "Exercícios práticos para fazer durante o expediente no canteiro.",
    thumbnail: "💪",
    difficulty: "fácil",
    videoUrl: "https://www.youtube.com/watch?v=OQr1SBcdUCQ",
  },
  {
    id: "3",
    title: "Exercícios para Quem Carrega Peso",
    duration: "4 min",
    category: ["costas", "pernas", "ombros", "todos"],
    description: "Alongamentos específicos para quem faz esforço físico e carrega peso.",
    thumbnail: "🦵",
    difficulty: "médio",
    videoUrl: "https://www.youtube.com/watch?v=PVur2cjoegc",
  },
  {
    id: "4",
    title: "Alongamento de Pescoço e Ombros",
    duration: "3 min",
    category: ["pescoço", "ombros", "todos"],
    description: "Alívio rápido para tensão no pescoço, ombros e trapézio.",
    thumbnail: "🥆",
    difficulty: "fácil",
    videoUrl: "https://www.youtube.com/watch?v=zeXxFzl5Vio&t=120s",
  },
  {
    id: "5",
    title: "Alongamento de Costas - Completo",
    duration: "5 min",
    category: ["costas", "todos"],
    description: "Rotina completa de alongamento para região lombar e coluna.",
    thumbnail: "🧘‍♂️",
    difficulty: "médio",
    videoUrl: "https://www.youtube.com/watch?v=zeXxFzl5Vio&t=180s",
  },
  {
    id: "6",
    title: "Alongamento de Pernas e Quadril",
    duration: "4 min",
    category: ["pernas", "todos"],
    description: "Alongamento focado em quadril, glúteos, coxas e panturrilhas.",
    thumbnail: "🦵",
    difficulty: "médio",
    videoUrl: "https://www.youtube.com/watch?v=PVur2cjoegc&t=90s",
  },
  {
    id: "7",
    title: "Ginástica Laboral - Pausa Ativa",
    duration: "3 min",
    category: ["todos"],
    description: "Exercícios rápidos para fazer nas pausas de 10h e 15h.",
    thumbnail: "⏰",
    difficulty: "fácil",
    videoUrl: "https://www.youtube.com/watch?v=OQr1SBcdUCQ&t=60s",
  },
  {
    id: "8",
    title: "Alongamento para Braços e Punhos",
    duration: "3 min",
    category: ["ombros", "todos"],
    description: "Previne LER/DORT em braços, punhos e mãos.",
    thumbnail: "👋",
    difficulty: "fácil",
    videoUrl: "https://www.youtube.com/watch?v=PVur2cjoegc&t=150s",
  },
];

const CATEGORIES = [
  { id: "todos" as VideoCategory, label: "Todos", emoji: "🌟" },
  { id: "costas" as VideoCategory, label: "Costas", emoji: "🧘" },
  { id: "ombros" as VideoCategory, label: "Ombros", emoji: "💪" },
  { id: "pernas" as VideoCategory, label: "Pernas", emoji: "🦵" },
  { id: "pescoço" as VideoCategory, label: "Pescoço", emoji: "🙆" },
];

export default function VideosAlongamentoScreen() {
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>("todos");

  const filteredVideos =
    selectedCategory === "todos"
      ? STRETCH_VIDEOS
      : STRETCH_VIDEOS.filter((v) => v.category.includes(selectedCategory));

  const handleCategoryPress = (category: VideoCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const handleVideoPress = (video: StretchVideo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/video-player" as any,
      params: {
        videoId: video.id,
        title: video.title,
        url: video.videoUrl,
      },
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "fácil":
        return "#22C55E";
      case "médio":
        return "#F59E0B";
      case "avançado":
        return "#EF4444";
      default:
        return colors.muted;
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="mr-4"
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">Vídeos de Alongamento</Text>
            <Text className="text-sm text-muted mt-1">Escolha por região do corpo</Text>
          </View>
        </View>

        {/* Filtros de Categoria */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6"
          contentContainerStyle={{ gap: 8 }}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleCategoryPress(cat.id)}
              className={`px-4 py-2 rounded-full flex-row items-center ${
                selectedCategory === cat.id ? "bg-primary" : "bg-surface"
              }`}
              style={{
                borderWidth: selectedCategory === cat.id ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <Text className="mr-2">{cat.emoji}</Text>
              <Text
                className={`font-semibold ${
                  selectedCategory === cat.id ? "text-background" : "text-foreground"
                }`}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de Vídeos */}
        <FlatList
          data={filteredVideos}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleVideoPress(item)}
              className="bg-surface rounded-xl p-4 flex-row items-center active:opacity-70"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {/* Thumbnail */}
              <View className="w-16 h-16 rounded-lg bg-primary/10 items-center justify-center mr-4">
                <Text className="text-4xl">{item.thumbnail}</Text>
              </View>

              {/* Info */}
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground mb-1">{item.title}</Text>
                <Text className="text-sm text-muted mb-2" numberOfLines={2}>
                  {item.description}
                </Text>
                <View className="flex-row items-center gap-3">
                  <View className="flex-row items-center">
                    <IconSymbol name="clock" size={14} color={colors.muted} />
                    <Text className="text-xs text-muted ml-1">{item.duration}</Text>
                  </View>
                  <View
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: getDifficultyColor(item.difficulty) + "20" }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: getDifficultyColor(item.difficulty) }}
                    >
                      {item.difficulty.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Ícone de Play */}
              <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                <IconSymbol name="play.fill" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-4xl mb-4">😔</Text>
              <Text className="text-base text-muted">Nenhum vídeo encontrado</Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}
