import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as SecureStore from "expo-secure-store";

const SYNC_QUEUE_KEY = "offline_sync_queue";
const LAST_SYNC_KEY = "last_sync_timestamp";

export interface SyncQueueItem {
  id: string;
  type: "checkin" | "hydration" | "challenge" | "blood_pressure" | "complaint";
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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingItems: 0,
    lastSync: null,
    lastError: null,
  });

  useEffect(() => {
    // Monitorar conectividade
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !syncStatus.isOnline;
      const isNowOnline = state.isConnected === true;

      setSyncStatus((prev) => ({ ...prev, isOnline: isNowOnline }));

      // Se voltou online, sincronizar automaticamente
      if (wasOffline && isNowOnline) {
        syncPendingItems();
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

      const queue: SyncQueueItem[] = queueData ? JSON.parse(queueData) : [];
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
  const addToSyncQueue = async (
    type: SyncQueueItem["type"],
    data: any
  ): Promise<boolean> => {
    try {
      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: SyncQueueItem[] = queueData ? JSON.parse(queueData) : [];

      const newItem: SyncQueueItem = {
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
        await syncPendingItems();
      }

      return true;
    } catch (error) {
      console.error("Erro ao adicionar à fila de sincronização:", error);
      return false;
    }
  };

  /**
   * Sincronizar itens pendentes
   */
  const syncPendingItems = async (): Promise<boolean> => {
    if (syncStatus.isSyncing) {
      console.log("Sincronização já em andamento");
      return false;
    }

    try {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true, lastError: null }));

      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: SyncQueueItem[] = queueData ? JSON.parse(queueData) : [];

      if (queue.length === 0) {
        setSyncStatus((prev) => ({ ...prev, isSyncing: false }));
        return true;
      }

      const token = await SecureStore.getItemAsync("auth_token");
      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }

      const failedItems: SyncQueueItem[] = [];
      let successCount = 0;

      // Processar cada item da fila
      for (const item of queue) {
        try {
          const success = await syncItem(item, token);
          if (success) {
            successCount++;
          } else {
            // Incrementar contador de tentativas
            item.retryCount++;
            // Se falhou menos de 3 vezes, manter na fila
            if (item.retryCount < 3) {
              failedItems.push(item);
            } else {
              console.error(`Item ${item.id} excedeu limite de tentativas`);
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
      console.error("Erro ao sincronizar itens pendentes:", error);
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastError: error instanceof Error ? error.message : "Erro desconhecido",
      }));
      return false;
    }
  };

  /**
   * Sincronizar um item específico
   */
  const syncItem = async (item: SyncQueueItem, token: string): Promise<boolean> => {
    try {
      const endpoint = getEndpointForType(item.type);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(item.data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error(`Erro ao sincronizar item ${item.id}:`, error);
      return false;
    }
  };

  /**
   * Obter endpoint da API para cada tipo de item
   */
  const getEndpointForType = (type: SyncQueueItem["type"]): string => {
    const endpoints = {
      checkin: "/api/checkins/sync",
      hydration: "/api/hydration/sync",
      challenge: "/api/challenges/sync",
      blood_pressure: "/api/blood-pressure/sync",
      complaint: "/api/complaints/sync",
    };
    return endpoints[type];
  };

  /**
   * Limpar fila de sincronização (usar com cuidado)
   */
  const clearSyncQueue = async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
      setSyncStatus((prev) => ({ ...prev, pendingItems: 0 }));
      return true;
    } catch (error) {
      console.error("Erro ao limpar fila de sincronização:", error);
      return false;
    }
  };

  /**
   * Forçar sincronização manual
   */
  const forceSyncNow = async (): Promise<boolean> => {
    if (!syncStatus.isOnline) {
      setSyncStatus((prev) => ({
        ...prev,
        lastError: "Sem conexão com a internet",
      }));
      return false;
    }
    return await syncPendingItems();
  };

  return {
    syncStatus,
    addToSyncQueue,
    syncPendingItems,
    clearSyncQueue,
    forceSyncNow,
  };
}
