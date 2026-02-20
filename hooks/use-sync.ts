import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SYNC_KEYS = {
  CHECK_INS: "health:check-ins",
  HYDRATION: "hydration:data",
  PRESSURE: "health:pressure-readings",
  COMPLAINTS: "health:symptom-reports",
};

/**
 * Hook para sincronizar dados locais com backend PostgreSQL
 * Monitora mudanças no AsyncStorage e envia automaticamente para o servidor
 */
export function useSync() {
  const { user } = useAuth();
  const syncCheckIn = trpc.sync.checkIns.useMutation();
  const syncHydration = trpc.sync.hydration.useMutation();
  const syncPressure = trpc.sync.bloodPressure.useMutation();
  const syncComplaint = trpc.sync.complaints.useMutation();
  
  const lastSyncRef = useRef<Record<string, string>>({});

  // Sincronizar check-ins
  const syncCheckIns = async () => {
    try {
      const data = await AsyncStorage.getItem(SYNC_KEYS.CHECK_INS);
      if (!data || !user) return;

      const checkIns = JSON.parse(data);
      const lastCheckIn = checkIns[checkIns.length - 1];
      
      if (!lastCheckIn) return;
      
      // Verificar se já foi sincronizado
      const syncKey = `checkin-${lastCheckIn.id}`;
      if (lastSyncRef.current[syncKey] === lastCheckIn.timestamp.toString()) {
        return;
      }

      // Sincronizar com backend
      await syncCheckIn.mutateAsync({
        date: lastCheckIn.date,
        mood: lastCheckIn.status,
        symptoms: [],
        notes: "",
      });

      // Marcar como sincronizado
      lastSyncRef.current[syncKey] = lastCheckIn.timestamp.toString();
      console.log("[SYNC] Check-in sincronizado:", lastCheckIn.id);
    } catch (error) {
      console.error("[SYNC] Erro ao sincronizar check-in:", error);
    }
  };

  // Sincronizar hidratação
  const syncHydrationData = async () => {
    try {
      const data = await AsyncStorage.getItem(SYNC_KEYS.HYDRATION);
      if (!data || !user) return;

      const hydrationData = JSON.parse(data);
      const today = new Date().toISOString().split("T")[0];
      const todayData = hydrationData[today];
      
      if (!todayData) return;

      // Verificar se já foi sincronizado
      const syncKey = `hydration-${today}`;
      const currentValue = JSON.stringify(todayData);
      if (lastSyncRef.current[syncKey] === currentValue) {
        return;
      }

      // Sincronizar com backend
      await syncHydration.mutateAsync({
        date: today,
        cupsConsumed: todayData.cupsConsumed || 0,
        totalMl: todayData.totalMl || 0,
        goalMl: todayData.goalMl || 2000,
        weight: todayData.weight,
        height: todayData.height,
        workType: todayData.workType,
      });

      // Marcar como sincronizado
      lastSyncRef.current[syncKey] = currentValue;
      console.log("[SYNC] Hidratação sincronizada:", today);
    } catch (error) {
      console.error("[SYNC] Erro ao sincronizar hidratação:", error);
    }
  };

  // Sincronizar pressão arterial
  const syncPressureData = async () => {
    try {
      const data = await AsyncStorage.getItem(SYNC_KEYS.PRESSURE);
      if (!data || !user) return;

      const readings = JSON.parse(data);
      const lastReading = readings[readings.length - 1];
      
      if (!lastReading) return;

      // Verificar se já foi sincronizado
      const syncKey = `pressure-${lastReading.id}`;
      if (lastSyncRef.current[syncKey] === lastReading.timestamp.toString()) {
        return;
      }

      // Sincronizar com backend
      await syncPressure.mutateAsync({
        date: lastReading.date,
        systolic: lastReading.systolic,
        diastolic: lastReading.diastolic,
        notes: lastReading.notes || "",
      });

      // Marcar como sincronizado
      lastSyncRef.current[syncKey] = lastReading.timestamp.toString();
      console.log("[SYNC] Pressão sincronizada:", lastReading.id);
    } catch (error) {
      console.error("[SYNC] Erro ao sincronizar pressão:", error);
    }
  };

  // Sincronizar queixas
  const syncComplaints = async () => {
    try {
      const data = await AsyncStorage.getItem(SYNC_KEYS.COMPLAINTS);
      if (!data || !user) return;

      const complaints = JSON.parse(data);
      const lastComplaint = complaints[complaints.length - 1];
      
      if (!lastComplaint) return;

      // Verificar se já foi sincronizado
      const syncKey = `complaint-${lastComplaint.id}`;
      if (lastSyncRef.current[syncKey] === lastComplaint.timestamp.toString()) {
        return;
      }

      // Sincronizar com backend
      await syncComplaint.mutateAsync({
        date: lastComplaint.date,
        complaint: `${lastComplaint.type}: ${lastComplaint.description}`,
        severity: lastComplaint.severity,
        notes: lastComplaint.bodyPart || "",
      });

      // Marcar como sincronizado
      lastSyncRef.current[syncKey] = lastComplaint.timestamp.toString();
      console.log("[SYNC] Queixa sincronizada:", lastComplaint.id);
    } catch (error) {
      console.error("[SYNC] Erro ao sincronizar queixa:", error);
    }
  };

  // Sincronizar tudo periodicamente
  useEffect(() => {
    if (!user) return;

    // Sincronização inicial
    syncCheckIns();
    syncHydrationData();
    syncPressureData();
    syncComplaints();

    // Sincronizar a cada 30 segundos
    const interval = setInterval(() => {
      syncCheckIns();
      syncHydrationData();
      syncPressureData();
      syncComplaints();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  return {
    syncCheckIns,
    syncHydrationData,
    syncPressureData,
    syncComplaints,
    isSyncing: 
      syncCheckIn.isPending || 
      syncHydration.isPending || 
      syncPressure.isPending || 
      syncComplaint.isPending,
  };
}
