import { useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type VideoCategory = 'stretching' | 'breathing' | 'ergonomics' | 'nutrition' | 'safety' | 'mental-health';

export interface Video {
  id: string;
  title: string;
  description: string;
  category: VideoCategory;
  duration: number; // em segundos
  youtubeId: string;
  thumbnail: string;
  instructor?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pointsReward: number;
  views: number;
  rating: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WatchedVideo {
  videoId: string;
  watchedAt: string;
  duration: number; // quanto tempo assistiu em segundos
  pointsEarned: number;
  completed: boolean; // assistiu até o final
}

const VIDEO_LIBRARY: Video[] = [
  // Alongamento
  {
    id: 'stretch-001',
    title: 'Alongamento Completo para Construção Civil',
    description: 'Série de alongamentos essenciais para trabalhadores da construção civil, focando em áreas de tensão comum.',
    category: 'stretching',
    duration: 480, // 8 minutos
    youtubeId: 'dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    instructor: 'Fisioterapeuta Carlos',
    difficulty: 'easy',
    pointsReward: 50,
    views: 1250,
    rating: 4.8,
    tags: ['alongamento', 'flexibilidade', 'prevenção'],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: 'stretch-002',
    title: 'Alongamento de Ombros e Costas',
    description: 'Exercícios específicos para aliviar tensão em ombros e costas, muito comum em trabalhos de construção.',
    category: 'stretching',
    duration: 360,
    youtubeId: 'jNQXAC9IVRw',
    thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
    instructor: 'Fisioterapeuta Ana',
    difficulty: 'easy',
    pointsReward: 40,
    views: 890,
    rating: 4.7,
    tags: ['ombros', 'costas', 'alongamento'],
    createdAt: '2024-01-16',
    updatedAt: '2024-01-16',
  },
  {
    id: 'stretch-003',
    title: 'Alongamento Dinâmico Pré-Trabalho',
    description: 'Alongamentos dinâmicos para fazer antes do trabalho e preparar o corpo para o dia.',
    category: 'stretching',
    duration: 420,
    youtubeId: '9bZkp7q19f0',
    thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
    instructor: 'Educador Físico João',
    difficulty: 'medium',
    pointsReward: 60,
    views: 2100,
    rating: 4.9,
    tags: ['aquecimento', 'dinâmico', 'pré-trabalho'],
    createdAt: '2024-01-17',
    updatedAt: '2024-01-17',
  },

  // Respiração
  {
    id: 'breath-001',
    title: 'Técnicas de Respiração para Estresse',
    description: 'Aprenda técnicas de respiração simples para reduzir estresse e ansiedade durante o trabalho.',
    category: 'breathing',
    duration: 300,
    youtubeId: 'ZXsQAXx_ao0',
    thumbnail: 'https://img.youtube.com/vi/ZXsQAXx_ao0/maxresdefault.jpg',
    instructor: 'Psicólogo Clínico Rafael',
    difficulty: 'easy',
    pointsReward: 50,
    views: 3450,
    rating: 4.9,
    tags: ['respiração', 'estresse', 'bem-estar'],
    createdAt: '2024-01-18',
    updatedAt: '2024-01-18',
  },
  {
    id: 'breath-002',
    title: 'Respiração Diafragmática Profunda',
    description: 'Técnica de respiração profunda para melhorar oxigenação e reduzir pressão arterial.',
    category: 'breathing',
    duration: 360,
    youtubeId: 'kJQP7kiw9Fk',
    thumbnail: 'https://img.youtube.com/vi/kJQP7kiw9Fk/maxresdefault.jpg',
    instructor: 'Instrutor de Yoga Marina',
    difficulty: 'medium',
    pointsReward: 60,
    views: 2800,
    rating: 4.8,
    tags: ['respiração', 'oxigenação', 'relaxamento'],
    createdAt: '2024-01-19',
    updatedAt: '2024-01-19',
  },
  {
    id: 'breath-003',
    title: 'Meditação Guiada 10 Minutos',
    description: 'Meditação guiada com foco em respiração para acalmar a mente e reduzir ansiedade.',
    category: 'breathing',
    duration: 600,
    youtubeId: 'inpok4MKVLM',
    thumbnail: 'https://img.youtube.com/vi/inpok4MKVLM/maxresdefault.jpg',
    instructor: 'Instrutor de Meditação Lucas',
    difficulty: 'easy',
    pointsReward: 70,
    views: 4200,
    rating: 4.9,
    tags: ['meditação', 'respiração', 'mindfulness'],
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20',
  },

  // Ergonomia
  {
    id: 'ergo-001',
    title: 'Ergonomia Correta na Construção Civil',
    description: 'Aprenda as melhores práticas de ergonomia para evitar lesões na construção civil.',
    category: 'ergonomics',
    duration: 540,
    youtubeId: 'aqz-KE-bpKQ',
    thumbnail: 'https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
    instructor: 'Engenheiro de Segurança Paulo',
    difficulty: 'medium',
    pointsReward: 80,
    views: 1950,
    rating: 4.8,
    tags: ['ergonomia', 'segurança', 'prevenção'],
    createdAt: '2024-01-21',
    updatedAt: '2024-01-21',
  },
  {
    id: 'ergo-002',
    title: 'Postura Correta ao Levantar Peso',
    description: 'Técnicas corretas para levantar e carregar peso sem prejudicar a coluna vertebral.',
    category: 'ergonomics',
    duration: 420,
    youtubeId: '2Z6ouBYlJ0s',
    thumbnail: 'https://img.youtube.com/vi/2Z6ouBYlJ0s/maxresdefault.jpg',
    instructor: 'Fisioterapeuta Ocupacional Beatriz',
    difficulty: 'easy',
    pointsReward: 70,
    views: 2300,
    rating: 4.9,
    tags: ['postura', 'levantamento', 'coluna'],
    createdAt: '2024-01-22',
    updatedAt: '2024-01-22',
  },
  {
    id: 'ergo-003',
    title: 'Prevenção de LER (Lesão por Esforço Repetitivo)',
    description: 'Como prevenir lesões por esforço repetitivo com exercícios e pausas adequadas.',
    category: 'ergonomics',
    duration: 480,
    youtubeId: 'tYzMGQUlEfE',
    thumbnail: 'https://img.youtube.com/vi/tYzMGQUlEfE/maxresdefault.jpg',
    instructor: 'Médico Ocupacional Roberto',
    difficulty: 'medium',
    pointsReward: 75,
    views: 1680,
    rating: 4.7,
    tags: ['LER', 'prevenção', 'saúde ocupacional'],
    createdAt: '2024-01-23',
    updatedAt: '2024-01-23',
  },

  // Nutrição
  {
    id: 'nutri-001',
    title: 'Alimentação Saudável para Trabalhadores',
    description: 'Guia de alimentação saudável adaptado para trabalhadores de construção civil.',
    category: 'nutrition',
    duration: 600,
    youtubeId: 'V1eYniJ0Rnk',
    thumbnail: 'https://img.youtube.com/vi/V1eYniJ0Rnk/maxresdefault.jpg',
    instructor: 'Nutricionista Fernanda',
    difficulty: 'easy',
    pointsReward: 80,
    views: 3100,
    rating: 4.8,
    tags: ['nutrição', 'alimentação', 'saúde'],
    createdAt: '2024-01-24',
    updatedAt: '2024-01-24',
  },
  {
    id: 'nutri-002',
    title: 'Hidratação Correta no Trabalho',
    description: 'Importância e técnicas corretas de hidratação durante o trabalho, especialmente em dias quentes.',
    category: 'nutrition',
    duration: 360,
    youtubeId: 'RH1afqAH582',
    thumbnail: 'https://img.youtube.com/vi/RH1afqAH582/maxresdefault.jpg',
    instructor: 'Nutricionista Clínico Diego',
    difficulty: 'easy',
    pointsReward: 60,
    views: 2450,
    rating: 4.9,
    tags: ['hidratação', 'água', 'saúde'],
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25',
  },
  {
    id: 'nutri-003',
    title: 'Lanches Saudáveis e Práticos',
    description: 'Ideias de lanches saudáveis e fáceis de preparar para levar ao trabalho.',
    category: 'nutrition',
    duration: 420,
    youtubeId: 'jofNR_WkoCE',
    thumbnail: 'https://img.youtube.com/vi/jofNR_WkoCE/maxresdefault.jpg',
    instructor: 'Chef Nutricionista Gabriela',
    difficulty: 'easy',
    pointsReward: 50,
    views: 1920,
    rating: 4.8,
    tags: ['lanches', 'nutrição', 'praticidade'],
    createdAt: '2024-01-26',
    updatedAt: '2024-01-26',
  },

  // Segurança
  {
    id: 'safety-001',
    title: 'Segurança na Construção Civil',
    description: 'Normas e práticas essenciais de segurança no trabalho em construção civil.',
    category: 'safety',
    duration: 720,
    youtubeId: 'Ks-_Mh1QhMc',
    thumbnail: 'https://img.youtube.com/vi/Ks-_Mh1QhMc/maxresdefault.jpg',
    instructor: 'Engenheiro de Segurança Marcelo',
    difficulty: 'medium',
    pointsReward: 100,
    views: 2800,
    rating: 4.9,
    tags: ['segurança', 'construção', 'normas'],
    createdAt: '2024-01-27',
    updatedAt: '2024-01-27',
  },
  {
    id: 'safety-002',
    title: 'Uso Correto de EPI (Equipamento de Proteção Individual)',
    description: 'Como usar corretamente os equipamentos de proteção individual para máxima segurança.',
    category: 'safety',
    duration: 480,
    youtubeId: 'AyOqGaL4-4A',
    thumbnail: 'https://img.youtube.com/vi/AyOqGaL4-4A/maxresdefault.jpg',
    instructor: 'Técnico de Segurança Cristina',
    difficulty: 'easy',
    pointsReward: 70,
    views: 2100,
    rating: 4.8,
    tags: ['EPI', 'proteção', 'segurança'],
    createdAt: '2024-01-28',
    updatedAt: '2024-01-28',
  },

  // Saúde Mental
  {
    id: 'mental-001',
    title: 'Saúde Mental no Trabalho',
    description: 'Estratégias para manter a saúde mental equilibrada durante o trabalho.',
    category: 'mental-health',
    duration: 540,
    youtubeId: 'TuHjIa85FQ4',
    thumbnail: 'https://img.youtube.com/vi/TuHjIa85FQ4/maxresdefault.jpg',
    instructor: 'Psicólogo Ocupacional Thiago',
    difficulty: 'medium',
    pointsReward: 80,
    views: 2650,
    rating: 4.9,
    tags: ['saúde mental', 'bem-estar', 'trabalho'],
    createdAt: '2024-01-29',
    updatedAt: '2024-01-29',
  },
  {
    id: 'mental-002',
    title: 'Gerenciamento de Estresse e Ansiedade',
    description: 'Técnicas práticas para gerenciar estresse e ansiedade no dia a dia.',
    category: 'mental-health',
    duration: 420,
    youtubeId: 'O-HBBj1tfrI',
    thumbnail: 'https://img.youtube.com/vi/O-HBBj1tfrI/maxresdefault.jpg',
    instructor: 'Terapeuta Cognitivo-Comportamental Juliana',
    difficulty: 'medium',
    pointsReward: 75,
    views: 3200,
    rating: 4.8,
    tags: ['estresse', 'ansiedade', 'saúde mental'],
    createdAt: '2024-01-30',
    updatedAt: '2024-01-30',
  },
];

export function useVideoLibrary() {
  const [watchedVideos, setWatchedVideos] = useState<WatchedVideo[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<string[]>([]);

  // Carregar vídeos assistidos do usuário
  const loadWatchedVideos = useCallback(async (userId: string) => {
    try {
      const stored = await AsyncStorage.getItem(`watched_videos_${userId}`);
      if (stored) {
        setWatchedVideos(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar vídeos assistidos:', error);
    }
  }, []);

  // Carregar vídeos favoritos
  const loadFavoriteVideos = useCallback(async (userId: string) => {
    try {
      const stored = await AsyncStorage.getItem(`favorite_videos_${userId}`);
      if (stored) {
        setFavoriteVideos(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar vídeos favoritos:', error);
    }
  }, []);

  // Marcar vídeo como assistido
  const markVideoAsWatched = useCallback(
    async (userId: string, videoId: string, watchedDuration: number) => {
      const video = VIDEO_LIBRARY.find((v) => v.id === videoId);
      if (!video) return;

      const isCompleted = watchedDuration >= video.duration * 0.8; // 80% do vídeo
      const pointsEarned = isCompleted ? video.pointsReward : Math.round(video.pointsReward * 0.5);

      const newWatchedVideo: WatchedVideo = {
        videoId,
        watchedAt: new Date().toISOString(),
        duration: watchedDuration,
        pointsEarned,
        completed: isCompleted,
      };

      const updated = [...watchedVideos, newWatchedVideo];
      setWatchedVideos(updated);

      // Salvar no AsyncStorage
      await AsyncStorage.setItem(`watched_videos_${userId}`, JSON.stringify(updated));

      return newWatchedVideo;
    },
    [watchedVideos]
  );

  // Adicionar/remover dos favoritos
  const toggleFavorite = useCallback(
    async (userId: string, videoId: string) => {
      const isFavorite = favoriteVideos.includes(videoId);
      const updated = isFavorite
        ? favoriteVideos.filter((id) => id !== videoId)
        : [...favoriteVideos, videoId];

      setFavoriteVideos(updated);
      await AsyncStorage.setItem(`favorite_videos_${userId}`, JSON.stringify(updated));
    },
    [favoriteVideos]
  );

  // Obter todos os vídeos
  const getAllVideos = useCallback(() => {
    return VIDEO_LIBRARY;
  }, []);

  // Filtrar vídeos por categoria
  const getVideosByCategory = useCallback((category: VideoCategory) => {
    return VIDEO_LIBRARY.filter((v) => v.category === category);
  }, []);

  // Buscar vídeos
  const searchVideos = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return VIDEO_LIBRARY.filter(
      (v) =>
        v.title.toLowerCase().includes(lowerQuery) ||
        v.description.toLowerCase().includes(lowerQuery) ||
        v.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }, []);

  // Obter vídeos recomendados
  const getRecommendedVideos = useCallback(() => {
    // Retorna os vídeos mais bem avaliados
    return [...VIDEO_LIBRARY].sort((a, b) => b.rating - a.rating).slice(0, 6);
  }, []);

  // Obter vídeos por dificuldade
  const getVideosByDifficulty = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
    return VIDEO_LIBRARY.filter((v) => v.difficulty === difficulty);
  }, []);

  // Calcular pontos totais ganhos
  const getTotalPointsEarned = useCallback(() => {
    return watchedVideos.reduce((total, video) => total + video.pointsEarned, 0);
  }, [watchedVideos]);

  // Obter vídeos assistidos
  const getWatchedVideosCount = useCallback(() => {
    return watchedVideos.filter((v) => v.completed).length;
  }, [watchedVideos]);

  // Obter detalhes do vídeo
  const getVideoDetails = useCallback((videoId: string): Video | undefined => {
    return VIDEO_LIBRARY.find((v) => v.id === videoId);
  }, []);

  // Verificar se vídeo foi assistido
  const isVideoWatched = useCallback(
    (videoId: string) => {
      return watchedVideos.some((v) => v.videoId === videoId && v.completed);
    },
    [watchedVideos]
  );

  // Obter progresso do usuário
  const getUserProgress = useCallback(() => {
    const totalVideos = VIDEO_LIBRARY.length;
    const watchedCount = getWatchedVideosCount();
    const totalPoints = getTotalPointsEarned();
    const completionPercentage = (watchedCount / totalVideos) * 100;

    return {
      totalVideos,
      watchedCount,
      totalPoints,
      completionPercentage,
      favoriteCount: favoriteVideos.length,
    };
  }, [getWatchedVideosCount, getTotalPointsEarned, favoriteVideos.length]);

  return {
    watchedVideos,
    favoriteVideos,
    loadWatchedVideos,
    loadFavoriteVideos,
    markVideoAsWatched,
    toggleFavorite,
    getAllVideos,
    getVideosByCategory,
    searchVideos,
    getRecommendedVideos,
    getVideosByDifficulty,
    getTotalPointsEarned,
    getWatchedVideosCount,
    getVideoDetails,
    isVideoWatched,
    getUserProgress,
    VIDEO_LIBRARY,
  };
}
