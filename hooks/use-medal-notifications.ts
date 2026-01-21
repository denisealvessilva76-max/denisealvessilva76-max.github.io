import { useEffect, useState, useCallback } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Medal } from "@/lib/gamification";

const MEDAL_NOTIFICATIONS_KEY = "medal_notifications_history";

interface MedalNotificationRecord {
  medalId: string;
  medalName: string;
  timestamp: number;
  notificationId: string;
}

export function useMedalNotifications() {
  const [notificationHistory, setNotificationHistory] = useState<MedalNotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar histórico de notificações ao iniciar
  useEffect(() => {
    loadNotificationHistory();
  }, []);

  const loadNotificationHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(MEDAL_NOTIFICATIONS_KEY);
      if (stored) {
        setNotificationHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Erro ao carregar histórico de notificações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotificationHistory = async (history: MedalNotificationRecord[]) => {
    try {
      await AsyncStorage.setItem(MEDAL_NOTIFICATIONS_KEY, JSON.stringify(history));
      setNotificationHistory(history);
    } catch (error) {
      console.error("Erro ao salvar histórico de notificações:", error);
    }
  };

  /**
   * Verificar se uma medalha já teve notificação enviada
   */
  const hasNotificationBeenSent = (medalId: string): boolean => {
    return notificationHistory.some((record) => record.medalId === medalId);
  };

  /**
   * Enviar notificação ao desbloquear medalha
   */
  const sendMedalNotification = async (medal: Medal): Promise<void> => {
    try {
      // Verificar se já foi enviada notificação para esta medalha
      if (hasNotificationBeenSent(medal.id)) {
        console.log(`Notificação para medalha ${medal.id} já foi enviada`);
        return;
      }

      // Mensagens personalizadas por tipo de medalha
      const messages: Record<string, { title: string; body: string }> = {
        starter: {
          title: "🎉 Parabéns!",
          body: "Você desbloqueou a medalha 'Iniciante'! Seu primeiro passo para a saúde!",
        },
        consistent: {
          title: "🥉 Medalha de Bronze!",
          body: "Você desbloqueou 'Consistente'! 3 check-ins na semana. Continue assim!",
        },
        dedicated: {
          title: "🥈 Medalha de Prata!",
          body: "Você desbloqueou 'Dedicado'! 5 check-ins na semana. Você é incrível!",
        },
        perfect_week: {
          title: "🥇 Medalha de Ouro!",
          body: "Você desbloqueou 'Semana Perfeita'! 7 check-ins! Semana impecável!",
        },
        health_champion: {
          title: "👑 Campeão da Saúde!",
          body: "Você desbloqueou 'Campeão da Saúde'! 4 semanas perfeitas! Você é uma inspiração!",
        },
      };

      const message = messages[medal.id] || {
        title: `🏆 ${medal.name}`,
        body: medal.description,
      };

      // Enviar notificação local
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          sound: "default",
          badge: 1,
          data: {
            type: "medal",
            medalId: medal.id,
            medalName: medal.name,
          },
        },
        trigger: {
          type: "time-interval" as any,
          seconds: 1, // Enviar imediatamente
          repeats: false,
        },
      });

      // Registrar no histórico
      const newRecord: MedalNotificationRecord = {
        medalId: medal.id,
        medalName: medal.name,
        timestamp: Date.now(),
        notificationId,
      };

      const updatedHistory = [...notificationHistory, newRecord];
      await saveNotificationHistory(updatedHistory);

      console.log(`Notificação enviada para medalha: ${medal.name}`);
    } catch (error) {
      console.error("Erro ao enviar notificação de medalha:", error);
    }
  };

  /**
   * Enviar notificação de parabéns genérica
   */
  const sendCongratulationNotification = async (medalName: string): Promise<void> => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎉 Parabéns!",
          body: `Você desbloqueou a medalha "${medalName}"!`,
          sound: "default",
          badge: 1,
          data: {
            type: "medal_generic",
          },
        },
        trigger: {
          type: "time-interval" as any,
          seconds: 1,
          repeats: false,
        },
      });
    } catch (error) {
      console.error("Erro ao enviar notificação de parabéns:", error);
    }
  };

  /**
   * Limpar histórico de notificações
   */
  const clearNotificationHistory = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(MEDAL_NOTIFICATIONS_KEY);
      setNotificationHistory([]);
    } catch (error) {
      console.error("Erro ao limpar histórico de notificações:", error);
    }
  };

  return {
    notificationHistory,
    isLoading,
    sendMedalNotification,
    sendCongratulationNotification,
    hasNotificationBeenSent,
    clearNotificationHistory,
  };
}
