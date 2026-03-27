import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PointsLog {
  id: string;
  type: 'check-in' | 'hydration' | 'pressure' | 'challenge' | 'achievement';
  points: number;
  timestamp: number;
  details?: string;
}

export interface PointsAbuseDetection {
  suspicious: boolean;
  reason?: string;
  blocked: boolean;
}

export interface PointsStats {
  totalPoints: number;
  dailyPoints: number;
  monthlyPoints: number;
  level: 'Bronze' | 'Prata' | 'Ouro';
  logs: PointsLog[];
}

const POINTS_CONFIG = {
  CHECK_IN: 10,
  HYDRATION_BASE: 5,
  HYDRATION_DECREMENT: 1,
  HYDRATION_MAX_DAILY: 8,
  HYDRATION_COOLDOWN: 30 * 60 * 1000, // 30 minutos
  PRESSURE_BASE: 10,
  PRESSURE_DECREMENT: 2,
  PRESSURE_MAX_DAILY: 3,
  PRESSURE_COOLDOWN: 4 * 60 * 60 * 1000, // 4 horas
  CHALLENGE_MAX_DAILY: 5,
  MONTHLY_LIMIT: 4000,
};

export function usePointsSystem() {
  const [stats, setStats] = useState<PointsStats>({
    totalPoints: 0,
    dailyPoints: 0,
    monthlyPoints: 0,
    level: 'Bronze',
    logs: [],
  });

  // Carregar estatísticas
  const loadStats = useCallback(async (userId: string) => {
    try {
      const data = await AsyncStorage.getItem(`points:${userId}`);
      if (data) {
        setStats(JSON.parse(data));
      }
    } catch (error) {
      console.error('Erro ao carregar pontos:', error);
    }
  }, []);

  // Salvar estatísticas
  const saveStats = useCallback(async (userId: string, newStats: PointsStats) => {
    try {
      await AsyncStorage.setItem(`points:${userId}`, JSON.stringify(newStats));
      setStats(newStats);
    } catch (error) {
      console.error('Erro ao salvar pontos:', error);
    }
  }, []);

  // Detectar abuso
  const detectAbuse = useCallback(
    (type: string, userId: string): PointsAbuseDetection => {
      const now = Date.now();
      const today = new Date(now).toDateString();
      const thisMonth = new Date(now).toISOString().slice(0, 7);

      // Filtrar logs de hoje
      const todayLogs = stats.logs.filter((log) => {
        const logDate = new Date(log.timestamp).toDateString();
        return logDate === today && log.type === type;
      });

      // Filtrar logs deste mês
      const monthLogs = stats.logs.filter((log) => {
        const logMonth = new Date(log.timestamp).toISOString().slice(0, 7);
        return logMonth === thisMonth;
      });

      let detection: PointsAbuseDetection = { suspicious: false, blocked: false };

      switch (type) {
        case 'check-in':
          if (todayLogs.length >= 1) {
            detection = {
              suspicious: true,
              reason: 'Apenas 1 check-in permitido por dia',
              blocked: true,
            };
          }
          break;

        case 'hydration':
          if (todayLogs.length >= POINTS_CONFIG.HYDRATION_MAX_DAILY) {
            detection = {
              suspicious: true,
              reason: `Máximo de ${POINTS_CONFIG.HYDRATION_MAX_DAILY} copos por dia atingido`,
              blocked: true,
            };
          }
          // Verificar cooldown
          if (todayLogs.length > 0) {
            const lastLog = todayLogs[todayLogs.length - 1];
            const timeSinceLastLog = now - lastLog.timestamp;
            if (timeSinceLastLog < POINTS_CONFIG.HYDRATION_COOLDOWN) {
              detection = {
                suspicious: true,
                reason: `Aguarde ${Math.ceil((POINTS_CONFIG.HYDRATION_COOLDOWN - timeSinceLastLog) / 60000)} minutos`,
                blocked: true,
              };
            }
          }
          break;

        case 'pressure':
          if (todayLogs.length >= POINTS_CONFIG.PRESSURE_MAX_DAILY) {
            detection = {
              suspicious: true,
              reason: `Máximo de ${POINTS_CONFIG.PRESSURE_MAX_DAILY} medições por dia atingido`,
              blocked: true,
            };
          }
          // Verificar cooldown
          if (todayLogs.length > 0) {
            const lastLog = todayLogs[todayLogs.length - 1];
            const timeSinceLastLog = now - lastLog.timestamp;
            if (timeSinceLastLog < POINTS_CONFIG.PRESSURE_COOLDOWN) {
              detection = {
                suspicious: true,
                reason: `Aguarde ${Math.ceil((POINTS_CONFIG.PRESSURE_COOLDOWN - timeSinceLastLog) / 3600000)} horas`,
                blocked: true,
              };
            }
          }
          break;

        case 'challenge':
          if (todayLogs.length >= POINTS_CONFIG.CHALLENGE_MAX_DAILY) {
            detection = {
              suspicious: true,
              reason: `Máximo de ${POINTS_CONFIG.CHALLENGE_MAX_DAILY} desafios por dia atingido`,
              blocked: true,
            };
          }
          break;
      }

      // Verificar limite mensal
      const totalMonthlyPoints = monthLogs.reduce((sum, log) => sum + log.points, 0);
      if (totalMonthlyPoints >= POINTS_CONFIG.MONTHLY_LIMIT) {
        detection = {
          suspicious: true,
          reason: 'Limite mensal de pontos atingido',
          blocked: true,
        };
      }

      return detection;
    },
    [stats.logs]
  );

  // Calcular pontos com decremento
  const calculatePoints = useCallback((type: string, count: number): number => {
    switch (type) {
      case 'check-in':
        return POINTS_CONFIG.CHECK_IN;

      case 'hydration':
        // Pontos decrescentes: 5, 3, 0, 0...
        if (count === 1) return 5;
        if (count === 2) return 3;
        return 0;

      case 'pressure':
        // Pontos decrescentes: 10, 5, 2, 0, 0...
        if (count === 1) return 10;
        if (count === 2) return 5;
        if (count === 3) return 2;
        return 0;

      default:
        return 0;
    }
  }, []);

  // Adicionar pontos
  const addPoints = useCallback(
    async (userId: string, type: string, details?: string): Promise<{ success: boolean; points: number; message?: string }> => {
      const abuse = detectAbuse(type, userId);

      if (abuse.blocked) {
        return {
          success: false,
          points: 0,
          message: abuse.reason,
        };
      }

      const now = Date.now();
      const today = new Date(now).toDateString();
      const todayLogs = stats.logs.filter((log) => {
        const logDate = new Date(log.timestamp).toDateString();
        return logDate === today && log.type === type;
      });

      const points = calculatePoints(type, todayLogs.length + 1);

      const newLog: PointsLog = {
        id: `${Date.now()}-${Math.random()}`,
        type: type as any,
        points,
        timestamp: now,
        details,
      };

      const newStats: PointsStats = {
        ...stats,
        totalPoints: stats.totalPoints + points,
        dailyPoints: stats.dailyPoints + points,
        monthlyPoints: stats.monthlyPoints + points,
        logs: [...stats.logs, newLog],
      };

      // Atualizar nível
      if (newStats.totalPoints >= 10000) {
        newStats.level = 'Ouro';
      } else if (newStats.totalPoints >= 5000) {
        newStats.level = 'Prata';
      } else {
        newStats.level = 'Bronze';
      }

      await saveStats(userId, newStats);

      return {
        success: true,
        points,
        message: `+${points} pontos!`,
      };
    },
    [stats, detectAbuse, calculatePoints, saveStats]
  );

  // Resetar pontos diários
  const resetDailyPoints = useCallback(async (userId: string) => {
    const newStats = { ...stats, dailyPoints: 0 };
    await saveStats(userId, newStats);
  }, [stats, saveStats]);

  // Obter histórico de auditoria
  const getAuditLog = useCallback(() => {
    return stats.logs.sort((a, b) => b.timestamp - a.timestamp);
  }, [stats.logs]);

  // Obter relatório de pontos
  const getPointsReport = useCallback(() => {
    const today = new Date().toDateString();
    const thisMonth = new Date().toISOString().slice(0, 7);

    const todayLogs = stats.logs.filter((log) => {
      const logDate = new Date(log.timestamp).toDateString();
      return logDate === today;
    });

    const monthLogs = stats.logs.filter((log) => {
      const logMonth = new Date(log.timestamp).toISOString().slice(0, 7);
      return logMonth === thisMonth;
    });

    return {
      totalPoints: stats.totalPoints,
      dailyPoints: todayLogs.reduce((sum, log) => sum + log.points, 0),
      monthlyPoints: monthLogs.reduce((sum, log) => sum + log.points, 0),
      level: stats.level,
      monthlyLimit: POINTS_CONFIG.MONTHLY_LIMIT,
      monthlyRemaining: POINTS_CONFIG.MONTHLY_LIMIT - monthLogs.reduce((sum, log) => sum + log.points, 0),
      breakdown: {
        checkIns: todayLogs.filter((l) => l.type === 'check-in').length,
        hydration: todayLogs.filter((l) => l.type === 'hydration').length,
        pressure: todayLogs.filter((l) => l.type === 'pressure').length,
        challenges: todayLogs.filter((l) => l.type === 'challenge').length,
      },
    };
  }, [stats]);

  return {
    stats,
    loadStats,
    saveStats,
    addPoints,
    resetDailyPoints,
    getAuditLog,
    getPointsReport,
    detectAbuse,
  };
}
