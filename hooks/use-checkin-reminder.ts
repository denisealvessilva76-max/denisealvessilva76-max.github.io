/**
 * Hook: useCheckinReminder
 *
 * Agenda um lembrete de check-in às 10h para trabalhadores que ainda não
 * fizeram check-in no dia. O lembrete é cancelado automaticamente se o
 * trabalhador fizer check-in antes das 10h.
 *
 * Lógica:
 * 1. Ao montar, verifica se o check-in do dia já foi feito.
 * 2. Se não foi feito, agenda uma notificação local para às 10h do dia atual.
 * 3. Se o check-in for feito (via `markCheckinDone`), cancela o lembrete.
 * 4. Ao desmontar, não cancela (para que o lembrete persista mesmo com app fechado).
 */

import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const CHECKIN_REMINDER_ID_KEY = "checkin_reminder_notification_id";
const CHECKIN_REMINDER_DATE_KEY = "checkin_reminder_last_date";

/** Retorna a data de hoje no formato YYYY-MM-DD */
function today(): string {
  return new Date().toISOString().split("T")[0];
}

/** Verifica se o trabalhador já fez check-in hoje */
async function hasCheckinToday(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem("health:checkins");
    if (!raw) return false;
    const checkins: Record<string, unknown> = JSON.parse(raw);
    return Object.values(checkins).some((c: any) => c?.date === today());
  } catch {
    return false;
  }
}

/** Agenda a notificação de lembrete para as 10h do dia atual */
async function scheduleCheckinReminder(): Promise<string | null> {
  try {
    const now = new Date();
    const target = new Date();
    target.setHours(10, 0, 0, 0);

    // Se já passou das 10h, não agenda para hoje
    if (now >= target) return null;

    // Cancela qualquer lembrete anterior do mesmo dia
    await cancelCheckinReminder();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📋 Lembrete de Check-in",
        body: "Você ainda não fez seu check-in de saúde hoje. Leva menos de 1 minuto! 💪",
        data: { type: "checkin_reminder", date: today() },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: target,
      },
    });

    // Persiste o ID e a data para poder cancelar depois
    await AsyncStorage.setItem(CHECKIN_REMINDER_ID_KEY, id);
    await AsyncStorage.setItem(CHECKIN_REMINDER_DATE_KEY, today());

    console.log(`[CheckinReminder] Lembrete agendado para 10h, id=${id}`);
    return id;
  } catch (error) {
    console.error("[CheckinReminder] Erro ao agendar:", error);
    return null;
  }
}

/** Cancela o lembrete de check-in agendado */
async function cancelCheckinReminder(): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(CHECKIN_REMINDER_ID_KEY);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(CHECKIN_REMINDER_ID_KEY);
      console.log(`[CheckinReminder] Lembrete cancelado, id=${id}`);
    }
  } catch (error) {
    console.error("[CheckinReminder] Erro ao cancelar:", error);
  }
}

export function useCheckinReminder() {
  const scheduledRef = useRef(false);

  useEffect(() => {
    // Só agenda em dispositivos físicos (notificações locais não funcionam no simulador web)
    if (Platform.OS === "web") return;

    const setup = async () => {
      if (scheduledRef.current) return;
      scheduledRef.current = true;

      // Verifica se já foi agendado hoje
      const lastDate = await AsyncStorage.getItem(CHECKIN_REMINDER_DATE_KEY);
      if (lastDate === today()) {
        // Já agendado hoje — verifica se check-in foi feito e cancela se sim
        const done = await hasCheckinToday();
        if (done) {
          await cancelCheckinReminder();
        }
        return;
      }

      // Novo dia: verifica se check-in já foi feito
      const done = await hasCheckinToday();
      if (!done) {
        await scheduleCheckinReminder();
      }
    };

    setup();
  }, []);

  /**
   * Deve ser chamado logo após o trabalhador completar o check-in.
   * Cancela o lembrete das 10h para não incomodar quem já fez.
   */
  const markCheckinDone = async () => {
    await cancelCheckinReminder();
  };

  return { markCheckinDone };
}
