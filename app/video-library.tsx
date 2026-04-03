import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useVideoLibrary, VideoCategory, Video } from '@/hooks/use-video-library';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import * as WebBrowser from 'expo-web-browser';

const CATEGORIES: { id: VideoCategory; name: string; icon: string }[] = [
  { id: 'stretching', name: 'Alongamento', icon: '🤸' },
  { id: 'breathing', name: 'Respiração', icon: '🫁' },
  { id: 'ergonomics', name: 'Ergonomia', icon: '🪑' },
  { id: 'nutrition', name: 'Nutrição', icon: '🥗' },
  { id: 'safety', name: 'Segurança', icon: '🛡️' },
  { id: 'mental-health', name: 'Saúde Mental', icon: '🧠' },
];

export default function VideoLibraryScreen() {
  const colors = useColors();
  const {
    getAllVideos,
    getVideosByCategory,
    searchVideos,
    getVideosByDifficulty,
    markVideoAsWatched,
    toggleFavorite,
    isVideoWatched,
    favoriteVideos,
    getUserProgress,
    getVideoDetails,
  } = useVideoLibrary();

  const [activeCategory, setActiveCategory] = useState<VideoCategory>('stretching');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Obter vídeos filtrados
  const filteredVideos = useMemo(() => {
    let videos = searchQuery ? searchVideos(searchQuery) : getVideosByCategory(activeCategory);

    if (selectedDifficulty) {
      videos = videos.filter((v) => v.difficulty === selectedDifficulty);
    }

    return videos;
  }, [activeCategory, searchQuery, selectedDifficulty, getVideosByCategory, searchVideos]);

  // Obter progresso
  const progress = useMemo(() => getUserProgress(), [getUserProgress]);

  // Abrir vídeo no YouTube
  const openVideo = useCallback(async (youtubeId: string) => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    try {
      await WebBrowser.openBrowserAsync(youtubeUrl);
    } catch (error) {
      console.error('Erro ao abrir vídeo:', error);
    }
  }, []);

  // Renderizar card de vídeo
  const renderVideoCard = useCallback(
    ({ item }: { item: Video }) => {
      const isFavorite = favoriteVideos.includes(item.id);
      const watched = isVideoWatched(item.id);

      return (
        <Pressable
          onPress={() => openVideo(item.youtubeId)}
          className="bg-surface rounded-lg overflow-hidden mb-3 border border-border"
        >
          {/* Thumbnail */}
          <View className="relative">
            <Image
              source={{ uri: item.thumbnail }}
              className="w-full h-40"
              resizeMode="cover"
            />

            {/* Overlay com duração */}
            <View className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded">
              <Text className="text-white text-xs font-semibold">
                {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
              </Text>
            </View>

            {/* Badge de assistido */}
            {watched && (
              <View className="absolute top-2 left-2 bg-success px-2 py-1 rounded">
                <Text className="text-white text-xs font-semibold">✓ Assistido</Text>
              </View>
            )}

            {/* Botão de favorito */}
            <Pressable
              onPress={() => toggleFavorite('user-id', item.id)}
              className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-2"
            >
              <Text className="text-lg">{isFavorite ? '❤️' : '🤍'}</Text>
            </Pressable>
          </View>

          {/* Conteúdo */}
          <View className="p-3">
            {/* Título */}
            <Text className="text-sm font-bold text-foreground mb-1" numberOfLines={2}>
              {item.title}
            </Text>

            {/* Instrutor */}
            {item.instructor && (
              <Text className="text-xs text-muted mb-2">{item.instructor}</Text>
            )}

            {/* Descrição */}
            <Text className="text-xs text-muted mb-3" numberOfLines={2}>
              {item.description}
            </Text>

            {/* Footer com rating, pontos e dificuldade */}
            <View className="flex-row justify-between items-center">
              {/* Rating e Views */}
              <View className="flex-row items-center gap-2">
                <Text className="text-xs">⭐ {item.rating.toFixed(1)}</Text>
                <Text className="text-xs text-muted">({item.views} views)</Text>
              </View>

              {/* Pontos */}
              <View className="flex-row items-center gap-1 bg-primary bg-opacity-10 px-2 py-1 rounded">
                <Text className="text-xs">⭐</Text>
                <Text className="text-xs font-semibold text-primary">{item.pointsReward}pts</Text>
              </View>

              {/* Dificuldade */}
              <View
                className={cn(
                  'px-2 py-1 rounded',
                  item.difficulty === 'easy'
                    ? 'bg-success bg-opacity-10'
                    : item.difficulty === 'medium'
                      ? 'bg-warning bg-opacity-10'
                      : 'bg-error bg-opacity-10'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-semibold',
                    item.difficulty === 'easy'
                      ? 'text-success'
                      : item.difficulty === 'medium'
                        ? 'text-warning'
                        : 'text-error'
                  )}
                >
                  {item.difficulty === 'easy'
                    ? 'Fácil'
                    : item.difficulty === 'medium'
                      ? 'Médio'
                      : 'Difícil'}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [favoriteVideos, isVideoWatched, openVideo, toggleFavorite]
  );

  return (
    <ScreenContainer className="bg-background">
      {/* Header com progresso */}
      <View className="bg-primary bg-opacity-10 rounded-lg p-4 mb-4">
        <Text className="text-sm font-semibold text-foreground mb-2">Seu Progresso</Text>
        <View className="flex-row justify-between mb-2">
          <Text className="text-xs text-muted">
            {progress.watchedCount} de {progress.totalVideos} vídeos assistidos
          </Text>
          <Text className="text-xs font-bold text-primary">{progress.completionPercentage.toFixed(0)}%</Text>
        </View>
        <View className="w-full h-2 bg-border rounded-full overflow-hidden">
          <View
            className="h-full bg-primary"
            style={{ width: `${progress.completionPercentage}%` }}
          />
        </View>
        <View className="flex-row justify-between mt-3">
          <View>
            <Text className="text-xs text-muted">Pontos Ganhos</Text>
            <Text className="text-lg font-bold text-primary">⭐ {progress.totalPoints}</Text>
          </View>
          <View>
            <Text className="text-xs text-muted">Favoritos</Text>
            <Text className="text-lg font-bold text-primary">❤️ {progress.favoriteCount}</Text>
          </View>
        </View>
      </View>

      {/* Busca */}
      <View className="flex-row items-center bg-surface rounded-lg px-3 py-2 mb-4 border border-border">
        <Text className="text-lg mr-2">🔍</Text>
        <TextInput
          placeholder="Buscar vídeos..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="flex-1 text-foreground"
        />
      </View>

      {/* Filtro de dificuldade */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row gap-2">
          {['easy', 'medium', 'hard'].map((difficulty) => (
            <Pressable
              key={difficulty}
              onPress={() =>
                setSelectedDifficulty(
                  selectedDifficulty === difficulty ? null : (difficulty as any)
                )
              }
              className={cn(
                'px-3 py-2 rounded-full border',
                selectedDifficulty === difficulty
                  ? 'bg-primary border-primary'
                  : 'bg-surface border-border'
              )}
            >
              <Text
                className={cn(
                  'text-xs font-semibold',
                  selectedDifficulty === difficulty ? 'text-white' : 'text-foreground'
                )}
              >
                {difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Médio' : 'Difícil'}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Abas de categorias */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4 -mx-4 px-4"
        contentContainerStyle={{ gap: 8 }}
      >
        {CATEGORIES.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => {
              setActiveCategory(category.id);
              setSearchQuery('');
              setSelectedDifficulty(null);
            }}
            className={cn(
              'flex-row items-center gap-2 px-4 py-2 rounded-full border',
              activeCategory === category.id
                ? 'bg-primary border-primary'
                : 'bg-surface border-border'
            )}
          >
            <Text className="text-lg">{category.icon}</Text>
            <Text
              className={cn(
                'text-sm font-semibold',
                activeCategory === category.id ? 'text-white' : 'text-foreground'
              )}
            >
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Lista de vídeos */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredVideos.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg font-semibold text-foreground mb-2">Nenhum vídeo encontrado</Text>
          <Text className="text-sm text-muted">Tente ajustar seus filtros ou busca</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVideos}
          renderItem={renderVideoCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </ScreenContainer>
  );
}
