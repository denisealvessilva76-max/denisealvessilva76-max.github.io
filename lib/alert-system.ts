import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

export interface Alert {
  id: string;
  type: "complaint_cluster" | "high_pressure" | "low_hydration" | "ergonomics_low";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  affectedEmployees: string[];
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

interface ComplaintData {
  date: string;
  symptoms: string[];
  details: string;
  severity: string;
}

/**
 * Verifica se há 3+ funcionários com a mesma queixa na última semana
 * e gera alerta automático para o SESMT
 */
export async function checkComplaintClusters(): Promise<Alert[]> {
  try {
    const complaintsData = await AsyncStorage.getItem("health:symptom-reports");
    if (!complaintsData) return [];

    const complaints: ComplaintData[] = JSON.parse(complaintsData);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const recentComplaints = complaints.filter((c) => c.date >= weekAgo);

    // Agrupar por tipo de sintoma
    const symptomGroups: Record<string, ComplaintData[]> = {};
    recentComplaints.forEach((complaint) => {
      complaint.symptoms.forEach((symptom) => {
        if (!symptomGroups[symptom]) {
          symptomGroups[symptom] = [];
        }
        symptomGroups[symptom].push(complaint);
      });
    });

    // Gerar alertas para sintomas com 3+ ocorrências
    const alerts: Alert[] = [];
    for (const [symptom, group] of Object.entries(symptomGroups)) {
      if (group.length >= 3) {
        const alert: Alert = {
          id: `alert_${Date.now()}_${symptom.replace(/\s+/g, "_")}`,
          type: "complaint_cluster",
          title: `${group.length} funcionários com ${symptom}`,
          description: `${group.length} funcionários reportaram "${symptom}" na última semana. Atenção necessária do SESMT.`,
          severity: group.length >= 5 ? "critical" : group.length >= 4 ? "high" : "medium",
          affectedEmployees: group.map((_, idx) => `Funcionário ${idx + 1}`),
          createdAt: new Date().toISOString(),
          resolved: false,
        };
        alerts.push(alert);
      }
    }

    // Salvar alertas gerados
    if (alerts.length > 0) {
      await saveAlerts(alerts);
      await sendAdminNotification(alerts);
    }

    return alerts;
  } catch (error) {
    console.error("Erro ao verificar clusters de queixas:", error);
    return [];
  }
}

/**
 * Verifica outros indicadores de saúde críticos
 */
export async function checkHealthIndicators(): Promise<Alert[]> {
  try {
    const alerts: Alert[] = [];

    // Verificar hidratação baixa
    const hydrationData = await AsyncStorage.getItem("hydration_data");
    if (hydrationData) {
      const hydration = JSON.parse(hydrationData);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const recentHydration = hydration.filter((h: any) => h.date >= weekAgo);
      const avgHydration = recentHydration.length > 0 
        ? recentHydration.reduce((sum: number, h: any) => sum + (h.amount || 250), 0) / recentHydration.length
        : 0;

      if (avgHydration < 1500 && recentHydration.length >= 5) {
        alerts.push({
          id: `alert_${Date.now()}_low_hydration`,
          type: "low_hydration",
          title: "Hidratação abaixo do recomendado",
          description: `Média semanal de ${Math.round(avgHydration)}ml está abaixo dos 2000ml recomendados.`,
          severity: avgHydration < 1000 ? "high" : "medium",
          affectedEmployees: ["Equipe geral"],
          createdAt: new Date().toISOString(),
          resolved: false,
        });
      }
    }

    // Verificar pressão arterial elevada
    const pressureData = await AsyncStorage.getItem("health:pressure-readings");
    if (pressureData) {
      const pressure = JSON.parse(pressureData);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const recentPressure = pressure.filter((p: any) => p.date >= weekAgo);
      const highPressureCount = recentPressure.filter(
        (p: any) => p.systolic >= 140 || p.diastolic >= 90
      ).length;

      if (highPressureCount >= 3) {
        alerts.push({
          id: `alert_${Date.now()}_high_pressure`,
          type: "high_pressure",
          title: "Múltiplas leituras de pressão elevada",
          description: `${highPressureCount} leituras com pressão arterial elevada (≥140/90) na última semana.`,
          severity: "high",
          affectedEmployees: ["Funcionários com pressão elevada"],
          createdAt: new Date().toISOString(),
          resolved: false,
        });
      }
    }

    if (alerts.length > 0) {
      await saveAlerts(alerts);
      await sendAdminNotification(alerts);
    }

    return alerts;
  } catch (error) {
    console.error("Erro ao verificar indicadores de saúde:", error);
    return [];
  }
}

/**
 * Salva alertas no AsyncStorage
 */
async function saveAlerts(newAlerts: Alert[]): Promise<void> {
  try {
    const existingData = await AsyncStorage.getItem("admin:alerts");
    const existing: Alert[] = existingData ? JSON.parse(existingData) : [];
    
    // Evitar duplicatas (mesmo tipo e data)
    const today = new Date().toISOString().split("T")[0];
    const filtered = newAlerts.filter(
      (newAlert) => !existing.some(
        (ex) => ex.type === newAlert.type && ex.createdAt.startsWith(today)
      )
    );

    if (filtered.length > 0) {
      await AsyncStorage.setItem("admin:alerts", JSON.stringify([...existing, ...filtered]));
    }
  } catch (error) {
    console.error("Erro ao salvar alertas:", error);
  }
}

/**
 * Envia notificação push para o admin
 */
async function sendAdminNotification(alerts: Alert[]): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    for (const alert of alerts) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ ${alert.title}`,
          body: alert.description,
          data: { alertId: alert.id, type: "admin_alert" },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Imediato
      });
    }
  } catch (error) {
    console.error("Erro ao enviar notificação para admin:", error);
  }
}

/**
 * Busca todos os alertas salvos
 */
export async function getAllAlerts(): Promise<Alert[]> {
  try {
    const data = await AsyncStorage.getItem("admin:alerts");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Erro ao buscar alertas:", error);
    return [];
  }
}

/**
 * Marca alerta como resolvido
 */
export async function resolveAlert(alertId: string, resolvedBy: string, notes?: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem("admin:alerts");
    if (!data) return;

    const alerts: Alert[] = JSON.parse(data);
    const updated = alerts.map((alert) => {
      if (alert.id === alertId) {
        return {
          ...alert,
          resolved: true,
          resolvedAt: new Date().toISOString(),
          resolvedBy,
          notes,
        };
      }
      return alert;
    });

    await AsyncStorage.setItem("admin:alerts", JSON.stringify(updated));
  } catch (error) {
    console.error("Erro ao resolver alerta:", error);
  }
}

/**
 * Executa verificação completa de alertas
 */
export async function runAlertCheck(): Promise<Alert[]> {
  const complaintAlerts = await checkComplaintClusters();
  const healthAlerts = await checkHealthIndicators();
  return [...complaintAlerts, ...healthAlerts];
}
