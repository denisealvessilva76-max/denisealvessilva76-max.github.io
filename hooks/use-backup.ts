import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

interface BackupData {
  version: string;
  timestamp: number;
  data: {
    profile?: any;
    checkIns?: any;
    bloodPressure?: any;
    hydration?: any;
    gamification?: any;
    complaints?: any;
    challenges?: any;
    preferences?: any;
  };
}

export function useBackup() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const BACKUP_KEYS = [
    "user_profile",
    "health_check_ins",
    "blood_pressure_history",
    "hydration_data",
    "gamification_data",
    "health_complaints",
    "challenge_progress",
    "user_preferences",
  ];

  /**
   * Cria um backup completo de todos os dados do app
   */
  const createBackup = async (): Promise<boolean> => {
    setIsBackingUp(true);
    try {
      const backupData: BackupData = {
        version: "1.0.0",
        timestamp: Date.now(),
        data: {},
      };

      // Coletar todos os dados do AsyncStorage
      for (const key of BACKUP_KEYS) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            backupData.data[key as keyof typeof backupData.data] = JSON.parse(value);
          }
        } catch (error) {
          console.warn(`Erro ao ler chave ${key}:`, error);
        }
      }

      // Converter para JSON
      const jsonString = JSON.stringify(backupData, null, 2);
      const fileName = `canteiro_saudavel_backup_${new Date().toISOString().split("T")[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Salvar arquivo
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Compartilhar arquivo
      if (Platform.OS !== "web") {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "application/json",
            dialogTitle: "Salvar Backup",
            UTI: "public.json",
          });
        } else {
          Alert.alert(
            "Backup Criado",
            `Arquivo salvo em: ${fileUri}\n\nCopie este arquivo para um local seguro.`
          );
        }
      } else {
        // Web: baixar arquivo
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }

      return true;
    } catch (error) {
      console.error("Erro ao criar backup:", error);
      Alert.alert("Erro", "Não foi possível criar o backup");
      return false;
    } finally {
      setIsBackingUp(false);
    }
  };

  /**
   * Restaura dados de um arquivo de backup
   */
  const restoreBackup = async (backupJson: string): Promise<boolean> => {
    setIsRestoring(true);
    try {
      const backupData: BackupData = JSON.parse(backupJson);

      // Validar estrutura do backup
      if (!backupData.version || !backupData.timestamp || !backupData.data) {
        throw new Error("Arquivo de backup inválido");
      }

      // Restaurar cada chave
      let restoredCount = 0;
      for (const [key, value] of Object.entries(backupData.data)) {
        if (value) {
          try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
            restoredCount++;
          } catch (error) {
            console.warn(`Erro ao restaurar chave ${key}:`, error);
          }
        }
      }

      Alert.alert(
        "Backup Restaurado",
        `${restoredCount} itens foram restaurados com sucesso.\n\nReinicie o app para ver as mudanças.`,
        [
          {
            text: "OK",
            onPress: () => {
              // Recarregar o app (forçar refresh)
              if (Platform.OS === "web") {
                window.location.reload();
              }
            },
          },
        ]
      );

      return true;
    } catch (error) {
      console.error("Erro ao restaurar backup:", error);
      Alert.alert("Erro", "Não foi possível restaurar o backup. Verifique se o arquivo é válido.");
      return false;
    } finally {
      setIsRestoring(false);
    }
  };

  /**
   * Limpa todos os dados do app (factory reset)
   */
  const clearAllData = async (): Promise<boolean> => {
    try {
      await AsyncStorage.multiRemove(BACKUP_KEYS);
      Alert.alert(
        "Dados Limpos",
        "Todos os dados foram removidos.\n\nReinicie o app para começar do zero.",
        [
          {
            text: "OK",
            onPress: () => {
              if (Platform.OS === "web") {
                window.location.reload();
              }
            },
          },
        ]
      );
      return true;
    } catch (error) {
      console.error("Erro ao limpar dados:", error);
      Alert.alert("Erro", "Não foi possível limpar os dados");
      return false;
    }
  };

  /**
   * Retorna o tamanho aproximado dos dados armazenados
   */
  const getDataSize = async (): Promise<number> => {
    try {
      let totalSize = 0;
      for (const key of BACKUP_KEYS) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
      return totalSize;
    } catch (error) {
      console.error("Erro ao calcular tamanho dos dados:", error);
      return 0;
    }
  };

  /**
   * Formata bytes para formato legível
   */
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return {
    createBackup,
    restoreBackup,
    clearAllData,
    getDataSize,
    formatBytes,
    isBackingUp,
    isRestoring,
  };
}
