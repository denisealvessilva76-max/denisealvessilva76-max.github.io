import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const SYNC_QUEUE_KEY = "sync_queue_v2";
const LAST_SYNC_KEY = "last_sync_v2";

export interface SyncItem {
  id: string;
  type: "checkIn" | "hydration" | "bloodPressure" | "challenge" | "complaint" | "gamification";
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItems: number;
  lastSync: number | null;
  lastError: string | null;
}

/**
 * Hook para gerenciar sincronização de dados com o backend usando tRPC
 */
export function useSyncManager() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingItems: 0,
    lastSync: null,
    lastError: null,
  });

  // Mutations tRPC
  const checkInMutation = trpc.sync.checkIns.useMutation();
  const hydrationMutation = trpc.sync.hydration.useMutation();
  const bloodPressureMutation = trpc.sync.bloodPressure.useMutation();
  const challengeMutation = trpc.sync.challengeProgress.useMutation();
  const complaintMutation = trpc.sync.complaints.useMutation();
  const gamificationMutation = trpc.sync.gamification.useMutation();

  useEffect(() => {
    // Monitorar conectividade
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !syncStatus.isOnline;
      const isNowOnline = state.isConnected === true;

      setSyncStatus((prev) => ({ ...prev, isOnline: isNowOnline }));

      // Se voltou online, sincronizar automaticamente
      if (wasOffline && isNowOnline) {
        syncAll();
      }
    });

    // Carregar estado inicial
    loadSyncStatus();

    return () => unsubscribe();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const lastSyncData = await AsyncStorage.getItem(LAST_SYNC_KEY);

      const queue: SyncItem[] = queueData ? JSON.parse(queueData) : [];
      const lastSync = lastSyncData ? parseInt(lastSyncData) : null;

      setSyncStatus((prev) => ({
        ...prev,
        pendingItems: queue.length,
        lastSync,
      }));
    } catch (error) {
      console.error("Erro ao carregar status de sincronização:", error);
    }
  };

  /**
   * Adicionar item à fila de sincronização
   */
  const addToQueue = async (type: SyncItem["type"], data: any): Promise<boolean> => {
    try {
      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: SyncItem[] = queueData ? JSON.parse(queueData) : [];

      const newItem: SyncItem = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      };

      queue.push(newItem);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

      setSyncStatus((prev) => ({
        ...prev,
        pendingItems: queue.length,
      }));

      // Se estiver online, tentar sincronizar imediatamente
      if (syncStatus.isOnline) {
        await syncAll();
      }

      return true;
    } catch (error) {
      console.error("Erro ao adicionar à fila:", error);
      return false;
    }
  };

  /**
   * Sincronizar todos os itens pendentes
   */
  const syncAll = async (): Promise<boolean> => {
    if (syncStatus.isSyncing) {
      console.log("Sincronização já em andamento");
      return false;
    }

    try {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true, lastError: null }));

      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: SyncItem[] = queueData ? JSON.parse(queueData) : [];

      if (queue.length === 0) {
        setSyncStatus((prev) => ({ ...prev, isSyncing: false }));
        return true;
      }

      const failedItems: SyncItem[] = [];
      let successCount = 0;

      // Processar cada item da fila
      for (const item of queue) {
        try {
          const success = await syncItem(item);
          if (success) {
            successCount++;
          } else {
            item.retryCount++;
            if (item.retryCount < 3) {
              failedItems.push(item);
            }
          }
        } catch (error) {
          console.error(`Erro ao sincronizar item ${item.id}:`, error);
          item.retryCount++;
          if (item.retryCount < 3) {
            failedItems.push(item);
          }
        }
      }

      // Atualizar fila com itens que falharam
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failedItems));

      // Atualizar timestamp da última sincronização
      const now = Date.now();
      await AsyncStorage.setItem(LAST_SYNC_KEY, now.toString());

      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        pendingItems: failedItems.length,
        lastSync: now,
        lastError: failedItems.length > 0 ? `${failedItems.length} itens falharam` : null,
      }));

      return failedItems.length === 0;
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastError: error instanceof Error ? error.message : "Erro desconhecido",
      }));
      return false;
    }
  };

  /**
   * Sincronizar um item específico usando tRPC
   */
  const syncItem = async (item: SyncItem): Promise<boolean> => {
    try {
      let result;

      switch (item.type) {
        case "checkIn":
          result = await checkInMutation.mutateAsync(item.data);
          break;
        case "hydration":
          result = await hydrationMutation.mutateAsync(item.data);
          break;
        case "bloodPressure":
          result = await bloodPressureMutation.mutateAsync(item.data);
          break;
        case "challenge":
          result = await challengeMutation.mutateAsync(item.data);
          break;
        case "complaint":
          result = await complaintMutation.mutateAsync(item.data);
          break;
        case "gamification":
          result = await gamificationMutation.mutateAsync(item.data);
          break;
        default:
          console.error(`Tipo de item desconhecido: ${item.type}`);
          return false;
      }

      return result?.success === true;
    } catch (error) {
      console.error(`Erro ao sincronizar item ${item.id}:`, error);
      return false;
    }
  };

  /**
   * Limpar fila de sincronização
   */
  const clearQueue = async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
      setSyncStatus((prev) => ({ ...prev, pendingItems: 0 }));
      return true;
    } catch (error) {
      console.error("Erro ao limpar fila:", error);
      return false;
    }
  };

  /**
   * Forçar sincronização manual
   */
  const forceSync = async (): Promise<boolean> => {
    if (!syncStatus.isOnline) {
      setSyncStatus((prev) => ({
        ...prev,
        lastError: "Sem conexão com a internet",
      }));
      return false;
    }
    return await syncAll();
  };

  return {
    syncStatus,
    addToQueue,
    syncAll,
    clearQueue,
    forceSync,
  };
}
