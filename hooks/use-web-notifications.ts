import { useEffect, useState } from "react";
import { Platform } from "react-native";

/**
 * Web-compatible notifications hook for PWA.
 * Uses Web Notifications API and Service Worker.
 */
export function useWebNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Notifications only work on web
    if (Platform.OS !== "web") {
      return;
    }

    // Check if browser supports notifications
    if ("Notification" in window && "serviceWorker" in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.log("[WebNotifications] Not supported on this platform");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        console.log("[WebNotifications] Permission granted");
        // Send test notification
        await sendTestNotification();
        // Schedule daily notifications
        await scheduleNotifications();
        return true;
      } else {
        console.log("[WebNotifications] Permission denied");
        return false;
      }
    } catch (error) {
      console.error("[WebNotifications] Error requesting permission:", error);
      return false;
    }
  };

  const scheduleNotifications = async () => {
    if (!isSupported || permission !== "granted") {
      return;
    }

    try {
      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.ready;

      // Schedule daily check-in reminder (8 AM)
      scheduleDailyNotification(registration, {
        title: "🌅 Bom dia! Hora do Check-in",
        body: "Não esqueça de fazer seu check-in diário de saúde!",
        tag: "checkin-8am",
        hour: 8,
        minute: 0,
      });

      // Schedule lunch check-in (12 PM)
      scheduleDailyNotification(registration, {
        title: "🍽️ Hora do Almoço!",
        body: "Faça seu check-in do meio-dia!",
        tag: "checkin-12pm",
        hour: 12,
        minute: 0,
      });

      // Schedule afternoon check-in (4 PM)
      scheduleDailyNotification(registration, {
        title: "☕ Boa tarde!",
        body: "Como você está se sentindo agora?",
        tag: "checkin-4pm",
        hour: 16,
        minute: 0,
      });

      // Schedule hydration reminders (every 2 hours from 8 AM to 6 PM)
      const hydrationHours = [8, 10, 12, 14, 16, 18];
      for (const hour of hydrationHours) {
        scheduleDailyNotification(registration, {
          title: "💧 Hora de se hidratar!",
          body: "Beba um copo de água para manter-se saudável!",
          tag: `hydration-${hour}h`,
          hour,
          minute: 0,
        });
      }

      console.log("[WebNotifications] All notifications scheduled successfully");
    } catch (error) {
      console.error("[WebNotifications] Error scheduling notifications:", error);
    }
  };

  const scheduleDailyNotification = (
    registration: ServiceWorkerRegistration,
    options: {
      title: string;
      body: string;
      tag: string;
      hour: number;
      minute: number;
    }
  ) => {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(options.hour, options.minute, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    // Schedule notification
    setTimeout(async () => {
      try {
        await registration.showNotification(options.title, {
          body: options.body,
          tag: options.tag,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          requireInteraction: false,
          silent: false,
        });

        console.log(`[WebNotifications] Notification shown: ${options.tag}`);

        // Reschedule for next day (24 hours later)
        setTimeout(() => {
          scheduleDailyNotification(registration, options);
        }, 24 * 60 * 60 * 1000);
      } catch (error) {
        console.error(`[WebNotifications] Error showing notification ${options.tag}:`, error);
      }
    }, delay);

    console.log(`[WebNotifications] Scheduled ${options.tag} for ${scheduledTime.toLocaleString()}`);
  };

  const sendTestNotification = async () => {
    if (!isSupported || permission !== "granted") {
      console.log("[WebNotifications] Cannot send test notification - permission not granted");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("🎉 Notificações Ativadas!", {
        body: "Você receberá lembretes diários de check-in e hidratação!",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "test-notification",
        requireInteraction: false,
      });
      console.log("[WebNotifications] Test notification sent");
    } catch (error) {
      console.error("[WebNotifications] Error sending test notification:", error);
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    sendTestNotification,
  };
}
