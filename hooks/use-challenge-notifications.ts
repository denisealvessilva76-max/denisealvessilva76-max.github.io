import { useEffect, useState, useCallback } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { trpc } from "@/lib/trpc";

export interface ChallengeNotificationSettings {
  enabled: boolean;
  dailyReminderTime: string; // HH:mm format
  progressReminders: boolean;
  completionAlerts: boolean;
}

const DEFAULT_SETTINGS: ChallengeNotificationSettings = {
  enabled: true,
  dailyReminderTime: "09:00",
  progressReminders: true,
  completionAlerts: true,
};

const STORAGE_KEY = "challenge_notification_settings";
const PUSH_TOKEN_KEY = "expo_push_token";

export function useChallengeNotifications() {
  const [settings, setSettings] = useState<ChallengeNotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // tRPC mutations
  const registerTokenMutation = trpc.notifications.registerToken.useMutation();

  // Carregar configurações ao iniciar
  useEffect(() => {
    loadSettings();
    registerForPushNotifications();
  }, []);

  // Agendar notificações quando as configurações mudam
  useEffect(() => {
    if (!isLoading && settings.enabled) {
      scheduleDailyReminder();
    }
  }, [settings, isLoading]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: ChallengeNotificationSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
  };

  const registerForPushNotifications = async () => {
    try {
      // Verificar se já temos token salvo
      const savedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (savedToken) {
        setExpoPushToken(savedToken);
        setIsRegistered(true);
        return;
      }

      // Solicitar permissão
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Permissão de notificação não concedida");
        return;
      }

      // Obter token
      if (Platform.OS !== "web") {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: undefined, // Usa o projectId do app.json automaticamente
        });
        const token = tokenData.data;
        setExpoPushToken(token);

        // Salvar localmente
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

        // Registrar no backend
        try {
          await registerTokenMutation.mutateAsync({
            token,
            platform: Platform.OS,
          });
          setIsRegistered(true);
          console.log("Push token registrado no servidor");
        } catch (error) {
          console.warn("Erro ao registrar token no servidor:", error);
          // Continua funcionando localmente mesmo se falhar no servidor
        }
      }
    } catch (error) {
      console.error("Erro ao registrar para notificações:", error);
    }
  };

  const scheduleDailyReminder = async () => {
    try {
      // Cancelar lembretes de desafio anteriores
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduled) {
        if (notification.content.data?.type === "challenge_reminder") {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }

      if (!settings.enabled) return;

      const [hours, minutes] = settings.dailyReminderTime.split(":").map(Number);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🏆 Hora do seu Desafio!",
          body: "Não esqueça de registrar seu progresso no desafio de hoje!",
          sound: true,
          badge: 1,
          data: { type: "challenge_reminder" },
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
          repeats: true,
        } as any,
      });

      console.log(`Lembrete de desafio agendado para ${hours}:${minutes}`);
    } catch (error) {
      console.error("Erro ao agendar lembrete de desafio:", error);
    }
  };

  const scheduleProgressReminder = async (challengeId: string, challengeName: string, daysRemaining: number) => {
    if (!settings.progressReminders) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📊 Progresso: ${challengeName}`,
          body: `Faltam ${daysRemaining} dias para completar seu desafio. Continue assim!`,
          sound: true,
          data: { type: "challenge_progress", challengeId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5, // Notificação imediata para teste
          repeats: false,
        } as any,
      });
    } catch (error) {
      console.error("Erro ao agendar lembrete de progresso:", error);
    }
  };

  const sendCompletionNotification = async (challengeName: string, pointsEarned: number) => {
    if (!settings.completionAlerts) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎉 Parabéns! Desafio Concluído!",
          body: `Você completou "${challengeName}" e ganhou ${pointsEarned} pontos!`,
          sound: true,
          data: { type: "challenge_completed" },
        },
        trigger: null, // Notificação imediata
      });
    } catch (error) {
      console.error("Erro ao enviar notificação de conclusão:", error);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<ChallengeNotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    await saveSettings(updated);
  }, [settings]);

  const toggleEnabled = useCallback(async (enabled: boolean) => {
    await updateSettings({ enabled });
    if (!enabled) {
      // Cancelar todos os lembretes de desafio
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduled) {
        const dataType = notification.content.data?.type as string | undefined;
        if (dataType?.startsWith("challenge")) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    }
  }, [updateSettings]);

  const setDailyReminderTime = useCallback(async (time: string) => {
    await updateSettings({ dailyReminderTime: time });
  }, [updateSettings]);

  return {
    settings,
    isLoading,
    expoPushToken,
    isRegistered,
    toggleEnabled,
    setDailyReminderTime,
    updateSettings,
    scheduleProgressReminder,
    sendCompletionNotification,
    registerForPushNotifications,
  };
}
