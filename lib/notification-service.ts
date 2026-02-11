import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export interface NotificationConfig {
  checkInEnabled: boolean;
  checkInTime: string; // "08:00"
  hydrationEnabled: boolean;
  hydrationTimes: string[]; // ["10:00", "14:00", "16:00"]
}

const DEFAULT_CONFIG: NotificationConfig = {
  checkInEnabled: true,
  checkInTime: "08:00",
  hydrationEnabled: true,
  hydrationTimes: ["10:00", "14:00", "16:00"],
};

const STORAGE_KEY = "notification_config";
const TOKEN_KEY = "notification_token";

/**
 * Solicita permissão para enviar notificações
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn("Notificações não funcionam em emulador");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Permissão de notificações negada");
    return false;
  }

  // Configurar canal de notificações no Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  // Obter token de notificação
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await AsyncStorage.setItem(TOKEN_KEY, token);
  console.log("Token de notificação:", token);

  return true;
}

/**
 * Obter configuração de notificações
 */
export async function getNotificationConfig(): Promise<NotificationConfig> {
  try {
    const config = await AsyncStorage.getItem(STORAGE_KEY);
    return config ? JSON.parse(config) : DEFAULT_CONFIG;
  } catch (error) {
    console.error("Erro ao carregar configuração de notificações:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Salvar configuração de notificações
 */
export async function saveNotificationConfig(config: NotificationConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Reagendar notificações com nova configuração
    await scheduleAllNotifications();
  } catch (error) {
    console.error("Erro ao salvar configuração de notificações:", error);
  }
}

/**
 * Agendar lembrete de check-in
 */
export async function scheduleCheckInReminder(): Promise<void> {
  const config = await getNotificationConfig();
  
  if (!config.checkInEnabled) {
    return;
  }

  // Cancelar notificações anteriores de check-in
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === "check-in") {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  // Agendar nova notificação
  const [hour, minute] = config.checkInTime.split(":").map(Number);
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🏗️ Hora do Check-in!",
      body: "Bom dia! Como você está se sentindo hoje?",
      data: { type: "check-in" },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  console.log(`Lembrete de check-in agendado para ${config.checkInTime}`);
}

/**
 * Agendar lembretes de hidratação
 */
export async function scheduleHydrationReminders(): Promise<void> {
  const config = await getNotificationConfig();
  
  if (!config.hydrationEnabled) {
    return;
  }

  // Cancelar notificações anteriores de hidratação
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === "hydration") {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  // Agendar novas notificações
  for (const time of config.hydrationTimes) {
    const [hour, minute] = time.split(":").map(Number);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "💧 Hora de se Hidratar!",
        body: "Lembre-se de beber água para manter sua saúde em dia.",
        data: { type: "hydration" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    console.log(`Lembrete de hidratação agendado para ${time}`);
  }
}

/**
 * Cancelar lembrete de check-in (quando já fez check-in)
 */
export async function cancelCheckInReminder(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === "check-in") {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      console.log("Lembrete de check-in cancelado (já realizado)");
    }
  }
}

/**
 * Cancelar lembretes de hidratação (quando atingiu meta)
 */
export async function cancelHydrationReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === "hydration") {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
  console.log("Lembretes de hidratação cancelados (meta atingida)");
}

/**
 * Agendar todas as notificações
 */
export async function scheduleAllNotifications(): Promise<void> {
  await scheduleCheckInReminder();
  await scheduleHydrationReminders();
}

/**
 * Cancelar todas as notificações
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log("Todas as notificações canceladas");
}

/**
 * Enviar notificação imediata (para testes)
 */
export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🧪 Notificação de Teste",
      body: "As notificações estão funcionando corretamente!",
      data: { type: "test" },
      sound: true,
    },
    trigger: null, // Enviar imediatamente
  });
}

/**
 * Enviar notificação de queixa resolvida
 */
export async function sendComplaintResolvedNotification(complaintType: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "✅ Queixa Resolvida",
      body: `Sua queixa sobre "${complaintType}" foi resolvida pelo SESMT.`,
      data: { type: "complaint-resolved" },
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Enviar notificação de pressão arterial elevada
 */
export async function sendHighPressureAlert(systolic: number, diastolic: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⚠️ Alerta de Pressão Arterial",
      body: `Sua pressão está elevada (${systolic}/${diastolic}). Procure o SESMT.`,
      data: { type: "high-pressure" },
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Listar notificações agendadas (para debug)
 */
export async function listScheduledNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log("Notificações agendadas:", scheduled.length);
  for (const notification of scheduled) {
    console.log(`- ${notification.content.title} (${notification.content.data?.type})`);
  }
}
