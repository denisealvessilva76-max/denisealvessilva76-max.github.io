import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type DashboardStats = {
  checkIns: {
    thisWeek: number;
    lastWeek: number;
    streak: number;
  };
  hydration: {
    thisWeek: number;
    lastWeek: number;
    averagePerDay: number;
  };
  challenges: {
    active: number;
    completed: number;
    completionRate: number;
  };
  symptoms: {
    trend: "improving" | "stable" | "worsening" | "none";
    lastSevenDays: Array<{
      date: string;
      level: number; // 0-10
      hasSymptom: boolean;
    }>;
  };
  suggestedActions: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    action: string; // rota para navegar
    priority: "high" | "medium" | "low";
  }>;
};

const STORAGE_KEYS = {
  CHECK_INS: "health_check_ins",
  HYDRATION: "hydration_records",
  CHALLENGES: "user_challenges",
};

export function usePersonalDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    checkIns: { thisWeek: 0, lastWeek: 0, streak: 0 },
    hydration: { thisWeek: 0, lastWeek: 0, averagePerDay: 0 },
    challenges: { active: 0, completed: 0, completionRate: 0 },
    symptoms: { trend: "none", lastSevenDays: [] },
    suggestedActions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar dados do AsyncStorage
      const [checkInsData, hydrationData, challengesData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CHECK_INS),
        AsyncStorage.getItem(STORAGE_KEYS.HYDRATION),
        AsyncStorage.getItem(STORAGE_KEYS.CHALLENGES),
      ]);

      const checkIns = checkInsData ? JSON.parse(checkInsData) : [];
      const hydration = hydrationData ? JSON.parse(hydrationData) : [];
      const challenges = challengesData ? JSON.parse(challengesData) : [];

      // Calcular estatísticas
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Check-ins
      const checkInsThisWeek = checkIns.filter((c: any) => new Date(c.date) >= sevenDaysAgo).length;
      const checkInsLastWeek = checkIns.filter(
        (c: any) => new Date(c.date) >= fourteenDaysAgo && new Date(c.date) < sevenDaysAgo
      ).length;
      const streak = calculateStreak(checkIns);

      // Hidratação
      const hydrationThisWeek = hydration.filter((h: any) => new Date(h.date) >= sevenDaysAgo).length;
      const hydrationLastWeek = hydration.filter(
        (h: any) => new Date(h.date) >= fourteenDaysAgo && new Date(h.date) < sevenDaysAgo
      ).length;
      const averagePerDay = hydrationThisWeek / 7;

      // Desafios
      const activeChallenges = challenges.filter((c: any) => c.status === "active").length;
      const completedChallenges = challenges.filter((c: any) => c.status === "completed").length;
      const totalChallenges = challenges.length;
      const completionRate = totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0;

      // Sintomas (últimos 7 dias)
      const symptomsData = generateSymptomsData(checkIns, sevenDaysAgo);
      const symptomsTrend = calculateSymptomsTrend(symptomsData);

      // Ações sugeridas
      const suggestedActions = generateSuggestedActions({
        checkInsThisWeek,
        hydrationThisWeek,
        activeChallenges,
        symptomsTrend,
      });

      setStats({
        checkIns: {
          thisWeek: checkInsThisWeek,
          lastWeek: checkInsLastWeek,
          streak,
        },
        hydration: {
          thisWeek: hydrationThisWeek,
          lastWeek: hydrationLastWeek,
          averagePerDay: Math.round(averagePerDay * 10) / 10,
        },
        challenges: {
          active: activeChallenges,
          completed: completedChallenges,
          completionRate: Math.round(completionRate),
        },
        symptoms: {
          trend: symptomsTrend,
          lastSevenDays: symptomsData,
        },
        suggestedActions,
      });
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (checkIns: any[]) => {
    if (checkIns.length === 0) return 0;

    const sortedCheckIns = checkIns
      .map((c) => new Date(c.date).toISOString().split("T")[0])
      .sort()
      .reverse();

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    let currentDate = today;

    for (const checkInDate of sortedCheckIns) {
      if (checkInDate === currentDate) {
        streak++;
        const date = new Date(currentDate);
        date.setDate(date.getDate() - 1);
        currentDate = date.toISOString().split("T")[0];
      } else {
        break;
      }
    }

    return streak;
  };

  const generateSymptomsData = (checkIns: any[], startDate: Date) => {
    const data: DashboardStats["symptoms"]["lastSevenDays"] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const checkIn = checkIns.find((c: any) => c.date.startsWith(dateStr));
      const level = checkIn?.painLevel || 0;
      const hasSymptom = checkIn?.hasPain || false;

      data.push({
        date: dateStr,
        level,
        hasSymptom,
      });
    }

    return data;
  };

  const calculateSymptomsTrend = (data: DashboardStats["symptoms"]["lastSevenDays"]) => {
    const recentData = data.slice(-3); // Últimos 3 dias
    const olderData = data.slice(0, 3); // Primeiros 3 dias

    const recentAvg = recentData.reduce((sum, d) => sum + d.level, 0) / recentData.length;
    const olderAvg = olderData.reduce((sum, d) => sum + d.level, 0) / olderData.length;

    if (recentAvg === 0 && olderAvg === 0) return "none";
    if (recentAvg < olderAvg - 1) return "improving";
    if (recentAvg > olderAvg + 1) return "worsening";
    return "stable";
  };

  const generateSuggestedActions = (context: {
    checkInsThisWeek: number;
    hydrationThisWeek: number;
    activeChallenges: number;
    symptomsTrend: DashboardStats["symptoms"]["trend"];
  }): DashboardStats["suggestedActions"] => {
    const actions: DashboardStats["suggestedActions"] = [];

    // Check-in pendente
    const today = new Date().toISOString().split("T")[0];
    const hasCheckInToday = context.checkInsThisWeek > 0; // Simplificado
    if (!hasCheckInToday) {
      actions.push({
        id: "checkin",
        title: "Fazer Check-in Diário",
        description: "Você ainda não fez o check-in de hoje",
        icon: "📋",
        action: "/health-check",
        priority: "high",
      });
    }

    // Hidratação baixa
    if (context.hydrationThisWeek < 14) {
      // Menos de 2 por dia
      actions.push({
        id: "hydration",
        title: "Registrar Hidratação",
        description: "Beba água regularmente durante o expediente",
        icon: "💧",
        action: "/hydration-tracker",
        priority: "high",
      });
    }

    // Sintomas piorando
    if (context.symptomsTrend === "worsening") {
      actions.push({
        id: "symptoms",
        title: "Consultar SESMT",
        description: "Seus sintomas estão piorando. Procure orientação médica.",
        icon: "⚠️",
        action: "/complaint-form",
        priority: "high",
      });
    }

    // Sem desafios ativos
    if (context.activeChallenges === 0) {
      actions.push({
        id: "challenge",
        title: "Iniciar um Desafio",
        description: "Melhore sua saúde com desafios diários",
        icon: "🎯",
        action: "/desafios",
        priority: "medium",
      });
    }

    // Alongamento
    actions.push({
      id: "stretch",
      title: "Fazer Alongamento",
      description: "Pause 5 minutos para alongar o corpo",
      icon: "🧘",
      action: "/videos-alongamento",
      priority: "medium",
    });

    // Respiração guiada
    if (context.symptomsTrend === "worsening" || context.checkInsThisWeek < 3) {
      actions.push({
        id: "breathing",
        title: "Exercício de Respiração",
        description: "Reduza o estresse com respiração guiada",
        icon: "🌬️",
        action: "/respiracao-guiada",
        priority: "low",
      });
    }

    return actions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  return {
    stats,
    loading,
    refresh: loadDashboardData,
  };
}
