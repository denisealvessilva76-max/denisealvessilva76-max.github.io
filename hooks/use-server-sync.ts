import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckIn, PressureReading, SymptomReport } from "@/lib/types";
import { HealthDataSync, SyncStatus } from "@/lib/server-types";
import * as SecureStore from "expo-secure-store";

const SYNC_STATUS_KEY = "sync_status";
const WORKER_ID_KEY = "worker_id";
const LAST_SYNC_KEY = "last_sync_timestamp";
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutos

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export function useServerSync(
  checkIns: CheckIn[],
  pressureReadings: PressureReading[],
  symptomReports: SymptomReport[]
) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: 0,
    nextSync: 0,
    isSyncing: false,
  });

  // Inicializar ID do trabalhador (anônimo)
  useEffect(() => {
    initializeWorkerId();
  }, []);

  // Sincronizar periodicamente
  useEffect(() => {
    const syncInterval = setInterval(() => {
      performSync();
    }, SYNC_INTERVAL);

    // Sincronizar na primeira vez
    performSync();

    return () => clearInterval(syncInterval);
  }, [checkIns, pressureReadings, symptomReports]);

  const initializeWorkerId = async () => {
    try {
      let workerId = await SecureStore.getItemAsync(WORKER_ID_KEY);
      if (!workerId) {
        // Gerar ID anônimo (UUID v4)
        workerId = generateUUID();
        await SecureStore.setItemAsync(WORKER_ID_KEY, workerId);
      }
    } catch (error) {
      console.error("Erro ao inicializar ID do trabalhador:", error);
    }
  };

  const generateUUID = (): string => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const performSync = useCallback(async () => {
    try {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true }));

      const workerId = await SecureStore.getItemAsync(WORKER_ID_KEY);
      if (!workerId) {
        throw new Error("Worker ID não inicializado");
      }

      // Preparar dados para sincronização
      const dataToSync: HealthDataSync[] = [];

      // Adicionar check-ins
      checkIns.forEach((checkIn) => {
        dataToSync.push({
          workerId,
          timestamp: new Date(checkIn.date).getTime(),
          checkIn: {
            status: checkIn.status as "bem" | "dor-leve" | "dor-forte",
            date: checkIn.date,
          },
        });
      });

      // Adicionar leituras de pressão
      pressureReadings.forEach((reading) => {
        dataToSync.push({
          workerId,
          timestamp: new Date(reading.date).getTime(),
          pressure: {
            systolic: reading.systolic,
            diastolic: reading.diastolic,
            date: reading.date,
          },
        });
      });

      // Adicionar relatórios de sintomas
      symptomReports.forEach((report) => {
        dataToSync.push({
          workerId,
          timestamp: new Date(report.date).getTime(),
          symptoms: {
            symptoms: report.symptoms,
            date: report.date,
          },
        });
      });

      // Enviar para servidor
      if (dataToSync.length > 0) {
        const response = await fetch(`${API_BASE_URL}/api/health-data/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workerId,
            data: dataToSync,
          }),
        });

        if (!response.ok) {
          throw new Error(`Erro na sincronização: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Sincronização bem-sucedida:", result);

        // Atualizar último sync
        const now = Date.now();
        await AsyncStorage.setItem(LAST_SYNC_KEY, now.toString());

        setSyncStatus({
          lastSync: now,
          nextSync: now + SYNC_INTERVAL,
          isSyncing: false,
        });
      } else {
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
        }));
      }
    } catch (error) {
      console.error("Erro ao sincronizar dados:", error);
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : "Erro desconhecido",
      }));
    }
  }, [checkIns, pressureReadings, symptomReports]);

  const manualSync = useCallback(async () => {
    await performSync();
  }, [performSync]);

  return {
    syncStatus,
    manualSync,
    isSyncing: syncStatus.isSyncing,
    lastSync: syncStatus.lastSync,
    syncError: syncStatus.syncError,
  };
}
