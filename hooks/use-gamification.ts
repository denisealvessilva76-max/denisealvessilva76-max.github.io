import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckIn } from "@/lib/types";
import {
  Medal,
  Achievement,
  GamificationStats,
  MEDALS,
  calculateUnlockedMedals,
  calculatePoints,
  getNextMedal,
  getProgressToNextMedal,
} from "@/lib/gamification";
import { useMedalNotifications } from "./use-medal-notifications";

const GAMIFICATION_STORAGE_KEY = "gamification_data";

// Sistema de pontos por atividade (REBALANCEADO para premiar consistência)
export const POINTS_SYSTEM = {
  // Ações diárias básicas (reduzido para não facilitar)
  CHECK_IN_DAILY: 5,           // Antes: 10 | Agora: 5
  HYDRATION_GLASS: 2,          // Antes: 5  | Agora: 2
  READ_HEALTH_TIP: 3,          // Antes: 5  | Agora: 3
  
  // Ações de esforço (mantido ou aumentado)
  CHALLENGE_COMPLETE: 25,      // Antes: 20 | Agora: 25
  BREATHING_EXERCISE: 15,      // Mantido
  WATCH_VIDEO: 10,             // Mantido
  
  // Bônus de consistência (MUITO aumentado)
  STREAK_7_DAYS: 200,          // Antes: 100  | Agora: 200
  STREAK_30_DAYS: 1000,        // Antes: 500  | Agora: 1000
  PERFECT_WEEK_BONUS: 150,     // Antes: 50   | Agora: 150
  PERFECT_MONTH_BONUS: 800,    // NOVO: Bônus mensal
  
  // Bônus de consistência semanal (NOVO)
  WEEKLY_CONSISTENCY_BONUS: 50, // Se fez check-in 5+ dias na semana
};

export interface ExtendedGamificationStats extends GamificationStats {
  hydrationPoints: number;
  challengePoints: number;
  breathingPoints: number;
  videoPoints: number;
  healthTipPoints: number;
  bonusPoints: number;
  consistencyPoints: number; // NOVO: Pontos de consistência
  rank: number;
  title: string;
}

export function useGamification(checkIns: CheckIn[]) {
  const { sendMedalNotification } = useMedalNotifications();
  const [stats, setStats] = useState<ExtendedGamificationStats>({
    totalCheckIns: 0,
    weeklyCheckIns: 0,
    currentStreak: 0,
    longestStreak: 0,
    unlockedMedals: [],
    achievements: [],
    totalPoints: 0,
    hydrationPoints: 0,
    challengePoints: 0,
    breathingPoints: 0,
    videoPoints: 0,
    healthTipPoints: 0,
    bonusPoints: 0,
    consistencyPoints: 0,
    rank: 0,
    title: "Iniciante",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [previousMedalCount, setPreviousMedalCount] = useState(0);

  // Carregar dados de gamificação ao iniciar
  useEffect(() => {
    loadGamificationData();
  }, []);

  // Recalcular stats quando check-ins mudam
  useEffect(() => {
    if (!isLoading && checkIns.length > 0) {
      calculateStats();
    }
  }, [checkIns.length, isLoading]);

  const loadGamificationData = async () => {
    try {
      const stored = await AsyncStorage.getItem(GAMIFICATION_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setStats((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Erro ao carregar dados de gamificação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGamificationData = async (newStats: ExtendedGamificationStats) => {
    try {
      await AsyncStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(newStats));
    } catch (error) {
      console.error("Erro ao salvar dados de gamificação:", error);
    }
  };

  const calculateStats = async () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    const weeklyCheckIns = checkIns.filter((c) => {
      const checkInDate = new Date(c.date);
      return checkInDate >= weekStart && checkInDate <= now;
    }).length;

    const totalCheckIns = checkIns.length;

    // Calcular streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedCheckIns = [...checkIns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (let i = 0; i < sortedCheckIns.length; i++) {
      const currentDate = new Date(sortedCheckIns[i].date);
      const previousDate = i > 0 ? new Date(sortedCheckIns[i - 1].date) : null;

      if (previousDate) {
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }

      const today = new Date();
      if (currentDate.toDateString() === today.toDateString()) {
        currentStreak = tempStreak;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calcular medalhas desbloqueadas
    const unlockedMedals = calculateUnlockedMedals(weeklyCheckIns);

    // Detectar novas medalhas
    const newMedals = unlockedMedals.filter(
      (medal) => !stats.unlockedMedals.some((m) => m.id === medal.id)
    );

    for (const medal of newMedals) {
      await sendMedalNotification(medal);
    }

    // Calcular pontos de check-in
    const checkInPoints = totalCheckIns * POINTS_SYSTEM.CHECK_IN_DAILY;

    // Calcular bônus de streak
    let bonusPoints = stats.bonusPoints;
    if (currentStreak === 7) bonusPoints += POINTS_SYSTEM.STREAK_7_DAYS;
    if (currentStreak === 30) bonusPoints += POINTS_SYSTEM.STREAK_30_DAYS;
    if (weeklyCheckIns === 7) bonusPoints += POINTS_SYSTEM.PERFECT_WEEK_BONUS;

    // Calcular pontos totais
    const totalPoints = 
      checkInPoints +
      stats.hydrationPoints +
      stats.challengePoints +
      stats.breathingPoints +
      stats.videoPoints +
      stats.healthTipPoints +
      bonusPoints;

    // Calcular título baseado em pontos
    const title = calculateTitle(totalPoints);

    const newStats: ExtendedGamificationStats = {
      totalCheckIns,
      weeklyCheckIns,
      currentStreak,
      longestStreak,
      unlockedMedals,
      achievements: stats.achievements,
      totalPoints,
      hydrationPoints: stats.hydrationPoints,
      challengePoints: stats.challengePoints,
      breathingPoints: stats.breathingPoints,
      videoPoints: stats.videoPoints,
      healthTipPoints: stats.healthTipPoints,
      bonusPoints,
      consistencyPoints: bonusPoints, // Pontos de consistência = bônus
      rank: stats.rank,
      title,
    };

    setStats(newStats);
    setPreviousMedalCount(unlockedMedals.length);
    await saveGamificationData(newStats);
  };

  const calculateTitle = (points: number): string => {
    if (points >= 5000) return "Mestre da Saúde";
    if (points >= 2000) return "Guardião Avançado";
    if (points >= 1000) return "Guardião Intermediário";
    if (points >= 500) return "Guardião Iniciante";
    if (points >= 100) return "Aprendiz";
    return "Iniciante";
  };

  const addHydrationPoints = async (glasses: number) => {
    const points = glasses * POINTS_SYSTEM.HYDRATION_GLASS;
    const newStats = {
      ...stats,
      hydrationPoints: stats.hydrationPoints + points,
      totalPoints: stats.totalPoints + points,
    };
    setStats(newStats);
    await saveGamificationData(newStats);
    return points;
  };

  const addChallengePoints = async () => {
    const points = POINTS_SYSTEM.CHALLENGE_COMPLETE;
    const newStats = {
      ...stats,
      challengePoints: stats.challengePoints + points,
      totalPoints: stats.totalPoints + points,
    };
    setStats(newStats);
    await saveGamificationData(newStats);
    return points;
  };

  const addBreathingPoints = async () => {
    const points = POINTS_SYSTEM.BREATHING_EXERCISE;
    const newStats = {
      ...stats,
      breathingPoints: stats.breathingPoints + points,
      totalPoints: stats.totalPoints + points,
    };
    setStats(newStats);
    await saveGamificationData(newStats);
    return points;
  };

  const addVideoPoints = async () => {
    const points = POINTS_SYSTEM.WATCH_VIDEO;
    const newStats = {
      ...stats,
      videoPoints: stats.videoPoints + points,
      totalPoints: stats.totalPoints + points,
    };
    setStats(newStats);
    await saveGamificationData(newStats);
    return points;
  };

  const addHealthTipPoints = async () => {
    const points = POINTS_SYSTEM.READ_HEALTH_TIP;
    const newStats = {
      ...stats,
      healthTipPoints: stats.healthTipPoints + points,
      totalPoints: stats.totalPoints + points,
    };
    setStats(newStats);
    await saveGamificationData(newStats);
    return points;
  };

  const getNextMedalInfo = () => {
    const nextMedal = getNextMedal(stats.weeklyCheckIns);
    const progress = getProgressToNextMedal(stats.weeklyCheckIns);

    return {
      medal: nextMedal,
      progress,
      checkInsNeeded: nextMedal ? nextMedal.requirement - stats.weeklyCheckIns : 0,
    };
  };

  const resetWeeklyStats = async () => {
    const newStats = {
      ...stats,
      weeklyCheckIns: 0,
      unlockedMedals: [],
    };
    setStats(newStats);
    setPreviousMedalCount(0);
    await saveGamificationData(newStats);
  };

  return {
    stats,
    isLoading,
    getNextMedalInfo,
    resetWeeklyStats,
    sendMedalNotification,
    addHydrationPoints,
    addChallengePoints,
    addBreathingPoints,
    addVideoPoints,
    addHealthTipPoints,
  };
}
