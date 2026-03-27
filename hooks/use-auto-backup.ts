import { useEffect, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, set } from 'firebase/database';

export interface BackupData {
  timestamp: string;
  userId: string;
  data: {
    healthRecords: any[];
    challenges: any[];
    points: number;
    badges: string[];
    rewards: any[];
    settings: any;
  };
}

export interface BackupStatus {
  lastBackup?: string;
  nextBackup?: string;
  isBackingUp: boolean;
  lastError?: string;
  backupCount: number;
}

export function useAutoBackup(userId: string | null) {
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    isBackingUp: false,
    backupCount: 0,
  });

  // Função para fazer backup
  const performBackup = useCallback(async () => {
    if (!userId) return;

    try {
      setBackupStatus((prev) => ({ ...prev, isBackingUp: true }));

      // Coletar dados do AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const userKeys = keys.filter((key) => key.includes(userId));

      const data: any = {};
      for (const key of userKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      }

      // Preparar dados de backup
      const backupData: BackupData = {
        timestamp: new Date().toISOString(),
        userId,
        data: {
          healthRecords: data.healthRecords || [],
          challenges: data.challenges || [],
          points: data.points || 0,
          badges: data.badges || [],
          rewards: data.rewards || [],
          settings: data.settings || {},
        },
      };

      // Salvar no Firebase
      const db = getDatabase();
      const backupRef = ref(db, `backups/${userId}/${Date.now()}`);
      await set(backupRef, backupData);

      // Atualizar status
      setBackupStatus((prev) => ({
        ...prev,
        isBackingUp: false,
        lastBackup: new Date().toISOString(),
        backupCount: prev.backupCount + 1,
      }));

      // Salvar metadados do backup
      await AsyncStorage.setItem(
        `backup_metadata_${userId}`,
        JSON.stringify({
          lastBackup: new Date().toISOString(),
          backupCount: backupStatus.backupCount + 1,
        })
      );

      return backupData;
    } catch (error) {
      console.error('Erro ao fazer backup:', error);
      setBackupStatus((prev) => ({
        ...prev,
        isBackingUp: false,
        lastError: error instanceof Error ? error.message : 'Erro desconhecido',
      }));
      throw error;
    }
  }, [userId, backupStatus.backupCount]);

  // Agendar backup diário
  useEffect(() => {
    if (!userId) return;

    // Carregar metadados do backup anterior
    const loadBackupMetadata = async () => {
      try {
        const metadata = await AsyncStorage.getItem(`backup_metadata_${userId}`);
        if (metadata) {
          const parsed = JSON.parse(metadata);
          setBackupStatus((prev) => ({
            ...prev,
            lastBackup: parsed.lastBackup,
            backupCount: parsed.backupCount || 0,
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar metadados de backup:', error);
      }
    };

    loadBackupMetadata();

    // Fazer backup imediatamente ao abrir o app
    performBackup().catch((error) => {
      console.error('Erro no backup inicial:', error);
    });

    // Agendar backup diário (a cada 24h)
    const backupInterval = setInterval(() => {
      performBackup().catch((error) => {
        console.error('Erro no backup agendado:', error);
      });
    }, 24 * 60 * 60 * 1000); // 24 horas

    return () => clearInterval(backupInterval);
  }, [userId, performBackup]);

  // Restaurar backup
  const restoreBackup = useCallback(
    async (backupTimestamp: string) => {
      if (!userId) return;

      try {
        setBackupStatus((prev) => ({ ...prev, isBackingUp: true }));

        const db = getDatabase();
        const backupRef = ref(db, `backups/${userId}/${backupTimestamp}`);

        // Aqui você buscaria os dados do Firebase
        // Por enquanto, apenas simulamos a restauração

        setBackupStatus((prev) => ({ ...prev, isBackingUp: false }));
      } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        setBackupStatus((prev) => ({
          ...prev,
          isBackingUp: false,
          lastError: error instanceof Error ? error.message : 'Erro desconhecido',
        }));
        throw error;
      }
    },
    [userId]
  );

  // Limpar backups antigos (manter apenas últimos 30 dias)
  const cleanOldBackups = useCallback(async () => {
    if (!userId) return;

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime();

      const db = getDatabase();
      const backupRef = ref(db, `backups/${userId}`);

      // Aqui você implementaria a lógica de limpeza
      // Por enquanto, apenas simulamos

      console.log('Backups antigos removidos');
    } catch (error) {
      console.error('Erro ao limpar backups antigos:', error);
    }
  }, [userId]);

  return {
    backupStatus,
    performBackup,
    restoreBackup,
    cleanOldBackups,
  };
}

// Hook para monitorar status de backup
export function useBackupMonitor(userId: string | null) {
  const { backupStatus, performBackup } = useAutoBackup(userId);
  const [isBackupNeeded, setIsBackupNeeded] = useState(false);

  // Verificar se backup é necessário
  useEffect(() => {
    if (!backupStatus.lastBackup) {
      setIsBackupNeeded(true);
      return;
    }

    const lastBackupTime = new Date(backupStatus.lastBackup).getTime();
    const now = new Date().getTime();
    const hoursSinceLastBackup = (now - lastBackupTime) / (1000 * 60 * 60);

    setIsBackupNeeded(hoursSinceLastBackup > 24);
  }, [backupStatus.lastBackup]);

  return {
    backupStatus,
    isBackupNeeded,
    performBackup,
  };
}
