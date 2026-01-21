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

const GAMIFICATION_STORAGE_KEY = "gamification_data";

export function useGamification(checkIns: CheckIn[]) {
  const [stats, setStats] = useState<GamificationStats>({
    totalCheckIns: 0,
    weeklyCheckIns: 0,
    currentStreak: 0,
    longestStreak: 0,
    unlockedMedals: [],
    achievements: [],
    totalPoints: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados de gamificação ao iniciar
  useEffect(() => {
    loadGamificationData();
  }, []);

  // Recalcular stats quando check-ins mudam
  useEffect(() => {
    if (!isLoading) {
      calculateStats();
    }
  }, [checkIns, isLoading]);

  const loadGamificationData = async () => {
    try {
      const stored = await AsyncStorage.getItem(GAMIFICATION_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setStats((prev) => ({ ...prev, achievements: data.achievements || [] }));
      }
    } catch (error) {
      console.error("Erro ao carregar dados de gamificação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGamificationData = async (newStats: GamificationStats) => {
    try {
      await AsyncStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(newStats));
    } catch (error) {
      console.error("Erro ao salvar dados de gamificação:", error);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Início da semana (domingo)

    // Contar check-ins da semana
    const weeklyCheckIns = checkIns.filter((c) => {
      const checkInDate = new Date(c.date);
      return checkInDate >= weekStart && checkInDate <= now;
    }).length;

    // Contar total de check-ins
    const totalCheckIns = checkIns.length;

    // Calcular streak (dias consecutivos)
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

      // Verificar se é hoje
      const today = new Date();
      if (currentDate.toDateString() === today.toDateString()) {
        currentStreak = tempStreak;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calcular medalhas desbloqueadas
    const unlockedMedals = calculateUnlockedMedals(weeklyCheckIns);

    // Calcular pontos
    const previousUnlockedCount = stats.unlockedMedals.length;
    const newMedalsUnlocked = Math.max(0, unlockedMedals.length - previousUnlockedCount);
    const isPerfectWeek = weeklyCheckIns === 7;
    const totalPoints = calculatePoints(weeklyCheckIns, newMedalsUnlocked, isPerfectWeek);

    const newStats: GamificationStats = {
      totalCheckIns,
      weeklyCheckIns,
      currentStreak,
      longestStreak,
      unlockedMedals,
      achievements: stats.achievements,
      totalPoints: stats.totalPoints + totalPoints,
    };

    setStats(newStats);
    saveGamificationData(newStats);
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
    await saveGamificationData(newStats);
  };

  return {
    stats,
    isLoading,
    getNextMedalInfo,
    resetWeeklyStats,
  };
}
