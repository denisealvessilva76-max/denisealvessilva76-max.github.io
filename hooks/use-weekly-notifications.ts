import { useState, useEffect } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { useEvolutionStats } from "./use-evolution-stats";

export interface WeeklyNotificationConfig {
  enabled: boolean;
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  hour: number; // 0-23
  minute: number; // 0-59
}

const DEFAULT_CONFIG: WeeklyNotificationConfig = {
  enabled: true,
  dayOfWeek: 1, // Segunda-feira
  hour: 9, // 9h da manhã
  minute: 0,
};

const STORAGE_KEY = "weekly_notification_config";
const NOTIFICATION_ID_KEY = "weekly_notification_id";

// Configurar comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useWeeklyNotifications() {
  const [config, setConfig] = useState<WeeklyNotificationConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const { stats } = useEvolutionStats("7" as any); // Últimos 7 dias

  useEffect(() => {
    loadConfig();
    requestPermissions();
  }, []);

  useEffect(() => {
    if (!isLoading && hasPermission) {
      scheduleWeeklyNotification();
    }
  }, [config, isLoading, hasPermission]);

  const requestPermissions = async () => {
    if (Platform.OS === "web") {
      setHasPermission(false);
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setHasPermission(finalStatus === "granted");

      if (finalStatus !== "granted") {
        console.log("Permissão de notificação negada");
      }
    } catch (error) {
      console.error("Erro ao solicitar permissões:", error);
      setHasPermission(false);
    }
  };

  const loadConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (newConfig: WeeklyNotificationConfig) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
    }
  };

  const generateWeeklySummary = (): { title: string; body: string } => {
    if (!stats) {
      return {
        title: "📊 Seu Resumo Semanal",
        body: "Confira seu progresso de saúde esta semana no app!",
      };
    }

    // Calcular pontuação de saúde
    const healthScore = stats.overall.healthScore;
    
    // Gerar mensagem motivacional baseada na pontuação
    let motivationalMessage = "";
    if (healthScore >= 80) {
      motivationalMessage = "Excelente trabalho! 🌟";
    } else if (healthScore >= 60) {
      motivationalMessage = "Bom progresso! Continue assim! 💪";
    } else if (healthScore >= 40) {
      motivationalMessage = "Você está no caminho certo! 🚀";
    } else {
      motivationalMessage = "Vamos melhorar juntos! 💙";
    }

    // Identificar destaque da semana
    let highlight = "";
    if (stats.checkIns.consistency >= 7) {
      highlight = `🔥 ${stats.checkIns.consistency} dias consecutivos de check-in!`;
    } else if (stats.hydration.goalAchieved >= 5) {
      highlight = `💧 Meta de hidratação atingida ${stats.hydration.goalAchieved} dias!`;
    } else if (stats.bloodPressure.trend === "improving") {
      highlight = "❤️ Sua pressão arterial está melhorando!";
    } else if (stats.challenges.completed > 0) {
      highlight = `🏆 ${stats.challenges.completed} desafio(s) completado(s)!`;
    } else {
      highlight = "Continue se cuidando! 🌱";
    }

    const title = `📊 Resumo Semanal - ${healthScore} pontos`;
    const body = `${motivationalMessage}\n${highlight}\n\nToque para ver detalhes.`;

    return { title, body };
  };

  const scheduleWeeklyNotification = async () => {
    if (Platform.OS === "web" || !hasPermission) {
      return;
    }

    try {
      // Cancelar notificação anterior
      const oldId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
      if (oldId) {
        await Notifications.cancelScheduledNotificationAsync(oldId);
      }

      if (!config.enabled) {
        return;
      }

      // Gerar resumo
      const { title, body } = generateWeeklySummary();

      // Calcular próxima data
      const now = new Date();
      const nextNotification = new Date();
      
      // Definir dia da semana
      const currentDay = now.getDay();
      let daysUntilNext = config.dayOfWeek - currentDay;
      if (daysUntilNext <= 0) {
        daysUntilNext += 7; // Próxima semana
      }
      
      nextNotification.setDate(now.getDate() + daysUntilNext);
      nextNotification.setHours(config.hour, config.minute, 0, 0);

      // Se a data calculada já passou, adicionar uma semana
      if (nextNotification.getTime() <= now.getTime()) {
        nextNotification.setDate(nextNotification.getDate() + 7);
      }

      // Agendar notificação
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: "weekly_summary" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          weekday: config.dayOfWeek + 1, // expo-notifications usa 1-7 (Domingo = 1)
          hour: config.hour,
          minute: config.minute,
        } as Notifications.CalendarTriggerInput,
      });

      // Salvar ID da notificação
      await AsyncStorage.setItem(NOTIFICATION_ID_KEY, notificationId);

      console.log("Notificação semanal agendada:", {
        id: notificationId,
        nextDate: nextNotification.toISOString(),
      });
    } catch (error) {
      console.error("Erro ao agendar notificação:", error);
    }
  };

  const testNotification = async () => {
    if (Platform.OS === "web" || !hasPermission) {
      alert("Notificações não disponíveis na web ou sem permissão");
      return;
    }

    try {
      const { title, body } = generateWeeklySummary();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🧪 TESTE - ${title}`,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: "test" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        } as Notifications.TimeIntervalTriggerInput,
      });

      alert("Notificação de teste enviada! Aguarde 2 segundos.");
    } catch (error) {
      console.error("Erro ao enviar notificação de teste:", error);
      alert("Erro ao enviar notificação de teste");
    }
  };

  const updateConfig = async (newConfig: Partial<WeeklyNotificationConfig>) => {
    const updated = { ...config, ...newConfig };
    await saveConfig(updated);
  };

  const toggleEnabled = async () => {
    await updateConfig({ enabled: !config.enabled });
  };

  const setDayOfWeek = async (day: number) => {
    await updateConfig({ dayOfWeek: day });
  };

  const setTime = async (hour: number, minute: number) => {
    await updateConfig({ hour, minute });
  };

  const getDayName = (day: number): string => {
    const days = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];
    return days[day];
  };

  const getNextNotificationDate = (): Date | null => {
    if (!config.enabled) return null;

    const now = new Date();
    const next = new Date();
    
    const currentDay = now.getDay();
    let daysUntilNext = config.dayOfWeek - currentDay;
    if (daysUntilNext <= 0) {
      daysUntilNext += 7;
    }
    
    next.setDate(now.getDate() + daysUntilNext);
    next.setHours(config.hour, config.minute, 0, 0);

    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 7);
    }

    return next;
  };

  return {
    config,
    isLoading,
    hasPermission,
    toggleEnabled,
    setDayOfWeek,
    setTime,
    updateConfig,
    testNotification,
    getDayName,
    getNextNotificationDate,
    requestPermissions,
  };
}
