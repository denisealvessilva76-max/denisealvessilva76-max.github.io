import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export interface NotificationSettings {
  checkInReminders: boolean;
  checkInTimes: string[]; // HH:mm format
  pauseActiveReminders: boolean;
  pauseActiveTimes: string[]; // HH:mm format
}

const DEFAULT_SETTINGS: NotificationSettings = {
  checkInReminders: true,
  checkInTimes: ["08:00", "12:00", "16:00"],
  pauseActiveReminders: true,
  pauseActiveTimes: ["10:00", "14:00", "17:00"],
};

const STORAGE_KEY = "notification_settings";

// Configurar o comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // Listener para notificações recebidas
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const { type } = response.notification.request.content.data as any;
      console.log("Notificação respondida:", type);
    });

    return () => subscription.remove();
  }, []);

  // Carregar configurações ao iniciar
  useEffect(() => {
    loadSettings();
    registerForPushNotifications();
  }, []);

  // Agendar notificações quando as configurações mudam
  useEffect(() => {
    if (!isLoading) {
      scheduleNotifications();
    }
  }, [settings, isLoading]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações de notificação:", error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Erro ao salvar configurações de notificação:", error);
    }
  };

  const registerForPushNotifications = async () => {
    try {
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

      // Obter token (opcional, para push notifications do servidor)
      if (Platform.OS !== "web") {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        setExpoPushToken(token);
      }
    } catch (error) {
      console.error("Erro ao registrar para notificações:", error);
    }
  };

  const scheduleNotifications = async () => {
    try {
      // Cancelar todas as notificações anteriores
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Agendar lembretes de check-in
      if (settings.checkInReminders) {
        for (const time of settings.checkInTimes) {
          const [hours, minutes] = time.split(":").map(Number);
          await scheduleNotificationAtTime(
            hours,
            minutes,
            "✅ Hora do Check-in",
            "Como você está se sentindo hoje?",
            "checkin"
          );
        }
      }

      // Agendar lembretes de pausa ativa
      if (settings.pauseActiveReminders) {
        for (const time of settings.pauseActiveTimes) {
          const [hours, minutes] = time.split(":").map(Number);
          await scheduleNotificationAtTime(
            hours,
            minutes,
            "💪 Hora da Pausa Ativa",
            "Faça alongamentos para aliviar a tensão",
            "pause"
          );
        }
      }
    } catch (error) {
      console.error("Erro ao agendar notificações:", error);
    }
  };

  const scheduleNotificationAtTime = async (
    hours: number,
    minutes: number,
    title: string,
    body: string,
    type: "checkin" | "pause"
  ) => {
    try {
      // Usar trigger diário para melhor funcionamento em background
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          badge: 1,
          data: { type },
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
          repeats: true,
        } as any,
      });
      
      console.log(`Notificação agendada para ${hours}:${minutes} (${title})`);
    } catch (error) {
      console.error(`Erro ao agendar notificação para ${hours}:${minutes}:`, error);
    }
  };

  const updateCheckInTimes = async (times: string[]) => {
    const newSettings = { ...settings, checkInTimes: times };
    await saveSettings(newSettings);
  };

  const updatePauseActiveTimes = async (times: string[]) => {
    const newSettings = { ...settings, pauseActiveTimes: times };
    await saveSettings(newSettings);
  };

  const toggleCheckInReminders = async (enabled: boolean) => {
    const newSettings = { ...settings, checkInReminders: enabled };
    await saveSettings(newSettings);
  };

  const togglePauseActiveReminders = async (enabled: boolean) => {
    const newSettings = { ...settings, pauseActiveReminders: enabled };
    await saveSettings(newSettings);
  };

  const resetToDefaults = async () => {
    await saveSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    isLoading,
    expoPushToken,
    updateCheckInTimes,
    updatePauseActiveTimes,
    toggleCheckInReminders,
    togglePauseActiveReminders,
    resetToDefaults,
  };
}
