import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_SETTINGS_KEY = "smart_notifications_settings";

export type NotificationSettings = {
  enabled: boolean;
  hydrationReminders: boolean;
  morningCheckIn: boolean;
  activeBreaks: boolean;
  workStartTime: string; // "08:00"
  workEndTime: string; // "17:00"
  hydrationInterval: number; // em minutos
};

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  hydrationReminders: true,
  morningCheckIn: true,
  activeBreaks: true,
  workStartTime: "08:00",
  workEndTime: "17:00",
  hydrationInterval: 120, // 2 horas
};

// Configurar handler de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useSmartNotifications() {
  useEffect(() => {
    requestPermissions();
    loadSettings();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.log("Permissão de notificações negada");
    }
  };

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (saved) {
        const settings: NotificationSettings = JSON.parse(saved);
        if (settings.enabled) {
          await scheduleAllNotifications(settings);
        }
      } else {
        // Primeira vez, usar configurações padrão
        await saveSettings(DEFAULT_SETTINGS);
        await scheduleAllNotifications(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações de notificações:", error);
    }
  };

  const saveSettings = async (settings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Erro ao salvar configurações de notificações:", error);
    }
  };

  const scheduleAllNotifications = async (settings: NotificationSettings) => {
    // Cancelar todas as notificações agendadas
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!settings.enabled) return;

    // 1. Check-in matinal (7:30)
    if (settings.morningCheckIn) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "☀️ Bom dia!",
          body: "Faça seu check-in de saúde antes de começar o trabalho",
          data: { type: "morning_checkin" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: 7,
          minute: 30,
          repeats: true,
        },
      });
    }

    // 2. Lembretes de hidratação (a cada 2h durante expediente)
    if (settings.hydrationReminders) {
      const [startHour] = settings.workStartTime.split(":").map(Number);
      const [endHour] = settings.workEndTime.split(":").map(Number);
      const intervalHours = settings.hydrationInterval / 60;

      for (let hour = startHour; hour < endHour; hour += intervalHours) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "💧 Hora de se hidratar!",
            body: "Beba um copo de água para manter-se saudável",
            data: { type: "hydration" },
          },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: Math.floor(hour),
            minute: 0,
            repeats: true,
          },
        });
      }
    }

    // 3. Pausas ativas (10h e 15h)
    if (settings.activeBreaks) {
      // Pausa da manhã (10h)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧘 Pausa Ativa!",
          body: "Faça um alongamento rápido de 2 minutos",
          data: { type: "active_break" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: 10,
          minute: 0,
          repeats: true,
        },
      });

      // Pausa da tarde (15h)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧘 Pausa Ativa!",
          body: "Hora de alongar e relaxar por 2 minutos",
          data: { type: "active_break" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: 15,
          minute: 0,
          repeats: true,
        },
      });
    }
  };

  const updateSettings = async (newSettings: NotificationSettings) => {
    await saveSettings(newSettings);
    await scheduleAllNotifications(newSettings);
  };

  const getSettings = async (): Promise<NotificationSettings> => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error("Erro ao obter configurações:", error);
      return DEFAULT_SETTINGS;
    }
  };

  const disableAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const settings = await getSettings();
    await saveSettings({ ...settings, enabled: false });
  };

  const enableAllNotifications = async () => {
    const settings = await getSettings();
    const newSettings = { ...settings, enabled: true };
    await saveSettings(newSettings);
    await scheduleAllNotifications(newSettings);
  };

  return {
    updateSettings,
    getSettings,
    disableAllNotifications,
    enableAllNotifications,
    scheduleAllNotifications,
  };
}
