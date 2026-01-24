import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckIn, PressureReading } from "@/lib/types";

export type PeriodType = "30" | "90";

export interface EvolutionStats {
  period: PeriodType;
  checkIns: {
    total: number;
    good: number;
    mild: number;
    severe: number;
    consistency: number; // dias consecutivos
    comparisonPrevious: number; // % de melhora
    dailyData: { date: string; status: "bem" | "dor-leve" | "dor-forte" }[];
  };
  hydration: {
    totalMl: number;
    averageDaily: number;
    goalAchieved: number; // dias que atingiu meta
    comparisonPrevious: number;
    dailyData: { date: string; ml: number }[];
  };
  bloodPressure: {
    readings: number;
    averageSystolic: number;
    averageDiastolic: number;
    normalCount: number;
    preHypertensionCount: number;
    hypertensionCount: number;
    trend: "improving" | "stable" | "worsening";
    dailyData: { date: string; systolic: number; diastolic: number }[];
  };
  challenges: {
    completed: number;
    inProgress: number;
    totalPoints: number;
    comparisonPrevious: number;
  };
  overall: {
    healthScore: number; // 0-100
    improvement: number; // % comparado com período anterior
    topAchievement: string;
  };
}

export function useEvolutionStats(period: PeriodType = "30") {
  const [stats, setStats] = useState<EvolutionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const days = period === "30" ? 30 : 90;
      const previousDays = days; // período anterior para comparação
      
      const now = Date.now();
      const periodStart = now - days * 24 * 60 * 60 * 1000;
      const previousStart = periodStart - previousDays * 24 * 60 * 60 * 1000;

      // Carregar check-ins
      const checkInsData = await AsyncStorage.getItem("health_check_ins");
      const allCheckIns: CheckIn[] = checkInsData ? JSON.parse(checkInsData) : [];
      
      const currentCheckIns = allCheckIns.filter(c => c.timestamp >= periodStart);
      const previousCheckIns = allCheckIns.filter(
        c => c.timestamp >= previousStart && c.timestamp < periodStart
      );

      // Carregar hidratação
      const hydrationData = await AsyncStorage.getItem("hydration_data");
      const allHydration = hydrationData ? JSON.parse(hydrationData) : {};
      
      // Carregar pressão arterial
      const bpData = await AsyncStorage.getItem("blood_pressure_history");
      const allBP: PressureReading[] = bpData ? JSON.parse(bpData) : [];
      
      const currentBP = allBP.filter(bp => bp.timestamp >= periodStart);
      const previousBP = allBP.filter(
        bp => bp.timestamp >= previousStart && bp.timestamp < periodStart
      );

      // Carregar desafios
      const challengesData = await AsyncStorage.getItem("challenge_progress");
      const allChallenges = challengesData ? JSON.parse(challengesData) : {};

      // Calcular estatísticas de check-ins
      const checkInStats = calculateCheckInStats(
        currentCheckIns,
        previousCheckIns,
        days
      );

      // Calcular estatísticas de hidratação
      const hydrationStats = calculateHydrationStats(
        allHydration,
        periodStart,
        previousStart,
        days
      );

      // Calcular estatísticas de pressão arterial
      const bpStats = calculateBloodPressureStats(currentBP, previousBP, days);

      // Calcular estatísticas de desafios
      const challengeStats = calculateChallengeStats(allChallenges);

      // Calcular pontuação geral de saúde
      const healthScore = calculateHealthScore({
        checkIns: checkInStats,
        hydration: hydrationStats,
        bloodPressure: bpStats,
        challenges: challengeStats,
      });

      // Determinar maior conquista
      const topAchievement = determineTopAchievement({
        checkIns: checkInStats,
        hydration: hydrationStats,
        bloodPressure: bpStats,
        challenges: challengeStats,
      });

      const evolutionStats: EvolutionStats = {
        period,
        checkIns: checkInStats,
        hydration: hydrationStats,
        bloodPressure: bpStats,
        challenges: challengeStats,
        overall: {
          healthScore,
          improvement: calculateOverallImprovement({
            checkIns: checkInStats,
            hydration: hydrationStats,
            bloodPressure: bpStats,
            challenges: challengeStats,
          }),
          topAchievement,
        },
      };

      setStats(evolutionStats);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { stats, isLoading, reload: loadStats };
}

// Funções auxiliares

function calculateCheckInStats(
  current: CheckIn[],
  previous: CheckIn[],
  days: number
) {
  const good = current.filter(c => c.status === "bem").length;
  const mild = current.filter(c => c.status === "dor-leve").length;
  const severe = current.filter(c => c.status === "dor-forte").length;

  // Calcular consistência (dias consecutivos)
  const consistency = calculateConsistency(current);

  // Comparação com período anterior
  const previousGood = previous.filter(c => c.status === "bem").length;
  const comparisonPrevious =
    previousGood > 0 ? ((good - previousGood) / previousGood) * 100 : 0;

  // Dados diários para gráfico
  const dailyData = generateDailyCheckInData(current, days);

  return {
    total: current.length,
    good,
    mild,
    severe,
    consistency,
    comparisonPrevious: Math.round(comparisonPrevious),
    dailyData,
  };
}

function calculateHydrationStats(
  hydrationData: any,
  periodStart: number,
  previousStart: number,
  days: number
) {
  let totalMl = 0;
  let goalAchieved = 0;
  let previousTotalMl = 0;
  const dailyData: { date: string; ml: number }[] = [];

  // Iterar sobre os dias do período atual
  for (let i = 0; i < days; i++) {
    const date = new Date(periodStart + i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split("T")[0];
    const dayData = hydrationData[dateKey];

    if (dayData) {
      const ml = dayData.consumed || 0;
      totalMl += ml;
      if (ml >= (dayData.goal || 2000)) {
        goalAchieved++;
      }
      dailyData.push({ date: dateKey, ml });
    } else {
      dailyData.push({ date: dateKey, ml: 0 });
    }
  }

  // Calcular período anterior
  for (let i = 0; i < days; i++) {
    const date = new Date(previousStart + i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split("T")[0];
    const dayData = hydrationData[dateKey];
    if (dayData) {
      previousTotalMl += dayData.consumed || 0;
    }
  }

  const averageDaily = Math.round(totalMl / days);
  const previousAverageDaily = Math.round(previousTotalMl / days);
  const comparisonPrevious =
    previousAverageDaily > 0
      ? ((averageDaily - previousAverageDaily) / previousAverageDaily) * 100
      : 0;

  return {
    totalMl,
    averageDaily,
    goalAchieved,
    comparisonPrevious: Math.round(comparisonPrevious),
    dailyData,
  };
}

function calculateBloodPressureStats(
  current: PressureReading[],
  previous: PressureReading[],
  days: number
) {
  if (current.length === 0) {
    return {
      readings: 0,
      averageSystolic: 0,
      averageDiastolic: 0,
      normalCount: 0,
      preHypertensionCount: 0,
      hypertensionCount: 0,
      trend: "stable" as const,
      dailyData: [],
    };
  }

  const avgSystolic = Math.round(
    current.reduce((sum, bp) => sum + bp.systolic, 0) / current.length
  );
  const avgDiastolic = Math.round(
    current.reduce((sum, bp) => sum + bp.diastolic, 0) / current.length
  );

  let normalCount = 0;
  let preHypertensionCount = 0;
  let hypertensionCount = 0;

  current.forEach(bp => {
    if (bp.systolic < 120 && bp.diastolic < 80) {
      normalCount++;
    } else if (bp.systolic < 140 && bp.diastolic < 90) {
      preHypertensionCount++;
    } else {
      hypertensionCount++;
    }
  });

  // Determinar tendência
  let trend: "improving" | "stable" | "worsening" = "stable";
  if (previous.length > 0) {
    const previousAvgSystolic =
      previous.reduce((sum, bp) => sum + bp.systolic, 0) / previous.length;
    if (avgSystolic < previousAvgSystolic - 5) {
      trend = "improving";
    } else if (avgSystolic > previousAvgSystolic + 5) {
      trend = "worsening";
    }
  }

  // Dados diários (agregar por dia)
  const dailyMap = new Map<string, { systolic: number[]; diastolic: number[] }>();
  current.forEach(bp => {
    const date = new Date(bp.timestamp).toISOString().split("T")[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { systolic: [], diastolic: [] });
    }
    dailyMap.get(date)!.systolic.push(bp.systolic);
    dailyMap.get(date)!.diastolic.push(bp.diastolic);
  });

  const dailyData = Array.from(dailyMap.entries())
    .map(([date, values]) => ({
      date,
      systolic: Math.round(
        values.systolic.reduce((a, b) => a + b, 0) / values.systolic.length
      ),
      diastolic: Math.round(
        values.diastolic.reduce((a, b) => a + b, 0) / values.diastolic.length
      ),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    readings: current.length,
    averageSystolic: avgSystolic,
    averageDiastolic: avgDiastolic,
    normalCount,
    preHypertensionCount,
    hypertensionCount,
    trend,
    dailyData,
  };
}

function calculateChallengeStats(challenges: any) {
  let completed = 0;
  let inProgress = 0;
  let totalPoints = 0;

  Object.values(challenges).forEach((challenge: any) => {
    if (challenge.completed) {
      completed++;
      totalPoints += challenge.points || 0;
    } else if (challenge.progress > 0) {
      inProgress++;
    }
  });

  return {
    completed,
    inProgress,
    totalPoints,
    comparisonPrevious: 0, // TODO: implementar comparação
  };
}

function calculateConsistency(checkIns: CheckIn[]): number {
  if (checkIns.length === 0) return 0;

  const sortedCheckIns = checkIns.sort((a, b) => a.timestamp - b.timestamp);
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedCheckIns.length; i++) {
    const prevDate = new Date(sortedCheckIns[i - 1].timestamp);
    const currDate = new Date(sortedCheckIns[i].timestamp);
    
    prevDate.setHours(0, 0, 0, 0);
    currDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (dayDiff > 1) {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

function generateDailyCheckInData(
  checkIns: CheckIn[],
  days: number
): { date: string; status: "bem" | "dor-leve" | "dor-forte" }[] {
  const dailyMap = new Map<string, "bem" | "dor-leve" | "dor-forte">();
  
  checkIns.forEach(checkIn => {
    const date = new Date(checkIn.timestamp).toISOString().split("T")[0];
    // Pegar o pior status do dia
    const existing = dailyMap.get(date);
    if (!existing || checkIn.status === "dor-forte" || 
        (checkIn.status === "dor-leve" && existing === "bem")) {
      dailyMap.set(date, checkIn.status);
    }
  });

  const result: { date: string; status: "bem" | "dor-leve" | "dor-forte" }[] = [];
  const now = Date.now();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split("T")[0];
    result.push({
      date: dateKey,
      status: dailyMap.get(dateKey) || "bem",
    });
  }

  return result;
}

function calculateHealthScore(data: any): number {
  let score = 0;

  // Check-ins (30 pontos)
  const checkInRate = data.checkIns.total / (data.checkIns.total + 7); // assumindo 7 dias sem check-in
  score += checkInRate * 30;

  // Hidratação (25 pontos)
  const hydrationRate = data.hydration.goalAchieved / 30; // assumindo 30 dias
  score += hydrationRate * 25;

  // Pressão arterial (25 pontos)
  if (data.bloodPressure.readings > 0) {
    const normalRate = data.bloodPressure.normalCount / data.bloodPressure.readings;
    score += normalRate * 25;
  }

  // Desafios (20 pontos)
  const challengeRate = data.challenges.completed / (data.challenges.completed + data.challenges.inProgress + 1);
  score += challengeRate * 20;

  return Math.min(100, Math.round(score));
}

function calculateOverallImprovement(data: any): number {
  const improvements = [
    data.checkIns.comparisonPrevious,
    data.hydration.comparisonPrevious,
    data.challenges.comparisonPrevious,
  ].filter(v => v !== 0);

  if (improvements.length === 0) return 0;

  return Math.round(
    improvements.reduce((sum, v) => sum + v, 0) / improvements.length
  );
}

function determineTopAchievement(data: any): string {
  const achievements = [];

  if (data.checkIns.consistency >= 7) {
    achievements.push({
      score: data.checkIns.consistency,
      text: `${data.checkIns.consistency} dias consecutivos de check-in`,
    });
  }

  if (data.hydration.goalAchieved >= 20) {
    achievements.push({
      score: data.hydration.goalAchieved,
      text: `Meta de hidratação atingida ${data.hydration.goalAchieved} dias`,
    });
  }

  if (data.bloodPressure.trend === "improving") {
    achievements.push({
      score: 100,
      text: "Pressão arterial em melhora",
    });
  }

  if (data.challenges.completed >= 3) {
    achievements.push({
      score: data.challenges.completed * 10,
      text: `${data.challenges.completed} desafios completados`,
    });
  }

  if (achievements.length === 0) {
    return "Continue se cuidando!";
  }

  achievements.sort((a, b) => b.score - a.score);
  return achievements[0].text;
}
