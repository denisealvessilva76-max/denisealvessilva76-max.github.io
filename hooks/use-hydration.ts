import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";

const HYDRATION_KEY = "hydration_tracking";
const HYDRATION_REMINDER_KEY = "hydration_reminder_settings";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface HydrationEntry {
  date: string;
  waterIntake: number; // em ml
  glassesConsumed: number;
  lastReminderTime?: string;
}

export function useHydration() {
  const [hydrationData, setHydrationData] = useState<Record<string, HydrationEntry>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [reminderSettings, setReminderSettings] = useState({
    enabled: true,
    interval: 2 * 60 * 60 * 1000, // 2 horas em ms
    dailyGoal: 2000, // ml
  });

  // Carregar dados de hidratação ao iniciar
  useEffect(() => {
    loadHydrationData();
    loadReminderSettings();
    setupReminderInterval();
  }, []);

  const loadHydrationData = async () => {
    try {
      const stored = await AsyncStorage.getItem(HYDRATION_KEY);
      if (stored) {
        setHydrationData(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Erro ao carregar dados de hidratação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReminderSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(HYDRATION_REMINDER_KEY);
      if (stored) {
        setReminderSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Erro ao carregar configurações de lembretes:", error);
    }
  };

  const saveHydrationData = async (data: Record<string, HydrationEntry>) => {
    try {
      await AsyncStorage.setItem(HYDRATION_KEY, JSON.stringify(data));
      setHydrationData(data);
    } catch (error) {
      console.error("Erro ao salvar dados de hidratação:", error);
    }
  };

  const saveReminderSettings = async (settings: typeof reminderSettings) => {
    try {
      await AsyncStorage.setItem(HYDRATION_REMINDER_KEY, JSON.stringify(settings));
      setReminderSettings(settings);
    } catch (error) {
      console.error("Erro ao salvar configurações de lembretes:", error);
    }
  };

  /**
   * Registrar consumo de água
   */
  const logWaterIntake = async (glassesConsumed: number = 1): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const glassSize = 250; // ml por copo
      const waterIntake = glassesConsumed * glassSize;

      const currentEntry = hydrationData[today] || {
        date: today,
        waterIntake: 0,
        glassesConsumed: 0,
      };

      const updatedEntry: HydrationEntry = {
        ...currentEntry,
        waterIntake: currentEntry.waterIntake + waterIntake,
        glassesConsumed: currentEntry.glassesConsumed + glassesConsumed,
        lastReminderTime: new Date().toISOString(),
      };

      const updatedData = {
        ...hydrationData,
        [today]: updatedEntry,
      };

      await saveHydrationData(updatedData);

      // Sincronizar com servidor
      await syncHydrationToServer(updatedEntry);

      // Verificar se atingiu a meta diária
      if (updatedEntry.waterIntake >= reminderSettings.dailyGoal) {
        await sendDailyGoalNotification(updatedEntry.waterIntake);
      }

      return true;
    } catch (error) {
      console.error("Erro ao registrar consumo de água:", error);
      return false;
    }
  };

  /**
   * Sincronizar dados de hidratação com servidor
   */
  const syncHydrationToServer = async (entry: HydrationEntry) => {
    try {
      const workerId = await SecureStore.getItemAsync("worker_id");
      if (!workerId) return;

      const response = await fetch(`${API_BASE_URL}/api/hydration/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workerId,
          ...entry,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao sincronizar: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Erro ao sincronizar hidratação:", error);
    }
  };

  /**
   * Enviar lembrete de hidratação
   */
  const sendHydrationReminder = async () => {
    try {
      if (!reminderSettings.enabled) return;

      const today = new Date().toISOString().split("T")[0];
      const currentEntry = hydrationData[today];

      const waterRemaining = reminderSettings.dailyGoal - (currentEntry?.waterIntake || 0);
      const glassesRemaining = Math.ceil(waterRemaining / 250);

      const messages = [
        `💧 Hora de beber água! Você ainda precisa de ${glassesRemaining} copo(s) para atingir a meta diária.`,
        `💧 Não esqueça de se hidratar! Beba um copo de água agora.`,
        `💧 Sua saúde é importante! Beba água regularmente ao longo do dia.`,
        `💧 Pausa para hidratação! Você já bebeu ${currentEntry?.glassesConsumed || 0} copos hoje.`,
      ];

      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚰 Lembrete de Hidratação",
          body: randomMessage,
          sound: "default",
          badge: 1,
          data: {
            type: "hydration_reminder",
          },
        },
        trigger: {
          type: "time-interval" as any,
          seconds: 1,
          repeats: false,
        },
      });
    } catch (error) {
      console.error("Erro ao enviar lembrete de hidratação:", error);
    }
  };

  /**
   * Enviar notificação de meta diária atingida
   */
  const sendDailyGoalNotification = async (totalIntake: number) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎉 Meta de Hidratação Atingida!",
          body: `Parabéns! Você bebeu ${totalIntake}ml de água hoje. Continue hidratado!`,
          sound: "default",
          badge: 1,
          data: {
            type: "hydration_goal_reached",
          },
        },
        trigger: {
          type: "time-interval" as any,
          seconds: 1,
          repeats: false,
        },
      });
    } catch (error) {
      console.error("Erro ao enviar notificação de meta:", error);
    }
  };

  /**
   * Configurar intervalo de lembretes
   */
  const setupReminderInterval = () => {
    if (!reminderSettings.enabled) return;

    const interval = setInterval(() => {
      sendHydrationReminder();
    }, reminderSettings.interval);

    return () => clearInterval(interval);
  };

  /**
   * Obter dados de hidratação do dia
   */
  const getTodayHydration = (): HydrationEntry | null => {
    const today = new Date().toISOString().split("T")[0];
    return hydrationData[today] || null;
  };

  /**
   * Obter histórico de hidratação (últimos 7 dias)
   */
  const getHydrationHistory = (): HydrationEntry[] => {
    const history: HydrationEntry[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      history.push(hydrationData[dateStr] || { date: dateStr, waterIntake: 0, glassesConsumed: 0 });
    }
    return history;
  };

  /**
   * Calcular progresso da meta diária
   */
  const getDailyProgress = (): number => {
    const today = getTodayHydration();
    if (!today) return 0;
    return Math.min(100, (today.waterIntake / reminderSettings.dailyGoal) * 100);
  };

  /**
   * Atualizar configurações de lembretes
   */
  const updateReminderSettings = async (newSettings: Partial<typeof reminderSettings>) => {
    const updated = { ...reminderSettings, ...newSettings };
    await saveReminderSettings(updated);
  };

  return {
    hydrationData,
    isLoading,
    reminderSettings,
    logWaterIntake,
    sendHydrationReminder,
    getTodayHydration,
    getHydrationHistory,
    getDailyProgress,
    updateReminderSettings,
  };
}
