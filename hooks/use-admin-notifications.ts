import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AdminNotification {
  id?: number;
  employeeId: string;
  type: "pain-report" | "referral-created" | "critical-alert";
  severity: "low" | "normal" | "high" | "critical";
  message: string;
  data?: any;
  isRead?: boolean;
  createdAt?: Date;
}

/**
 * Hook para gerenciar notificações do admin
 * Envia notificações quando empregados registram dores
 */
export function useAdminNotifications() {
  const sendPainNotification = useCallback(
    async (
      workerId: string,
      painLevel: "dor-leve" | "dor-forte",
      description?: string
    ) => {
      try {
        // Determinar severidade
        let severity: "low" | "high" | "critical" = "low";
        let message = "";

        if (painLevel === "dor-leve") {
          severity = "low";
          message = `Empregado ${workerId} reportou dor leve`;
        } else if (painLevel === "dor-forte") {
          severity = "high";
          message = `ALERTA: Empregado ${workerId} reportou dor forte`;
        }

        // Criar notificação
        const notification: AdminNotification = {
          employeeId: workerId,
          type: "pain-report",
          severity,
          message,
          data: {
            painLevel,
            description,
            timestamp: new Date().toISOString(),
          },
        };

        // Enviar para servidor
        const response = await fetch("http://127.0.0.1:3000/api/admin/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(notification),
        });

        if (response.ok) {
          console.log("Notificação enviada ao admin");
        }

        // Salvar localmente também
        const existingNotifications = await AsyncStorage.getItem(
          "admin_notifications_local"
        );
        const notifications = existingNotifications
          ? JSON.parse(existingNotifications)
          : [];
        notifications.push({
          ...notification,
          id: Date.now(),
          createdAt: new Date().toISOString(),
        });

        await AsyncStorage.setItem(
          "admin_notifications_local",
          JSON.stringify(notifications)
        );
      } catch (error) {
        console.error("Erro ao enviar notificação:", error);
      }
    },
    []
  );

  const sendReferralNotification = useCallback(
    async (workerId: string, referralType: string, severity: "low" | "high" | "critical") => {
      try {
        const notification: AdminNotification = {
          employeeId: workerId,
          type: "referral-created",
          severity,
          message: `Novo encaminhamento criado para ${workerId}: ${referralType}`,
          data: {
            referralType,
            timestamp: new Date().toISOString(),
          },
        };

        // Enviar para servidor
        const response = await fetch("http://127.0.0.1:3000/api/admin/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(notification),
        });

        if (response.ok) {
          console.log("Notificação de encaminhamento enviada");
        }
      } catch (error) {
        console.error("Erro ao enviar notificação de encaminhamento:", error);
      }
    },
    []
  );

  const getLocalNotifications = useCallback(async () => {
    try {
      const notifications = await AsyncStorage.getItem(
        "admin_notifications_local"
      );
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error("Erro ao obter notificações locais:", error);
      return [];
    }
  }, []);

  return {
    sendPainNotification,
    sendReferralNotification,
    getLocalNotifications,
  };
}
