import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BLOOD_PRESSURE_KEY = "blood_pressure_history";

export interface BloodPressureReading {
  id: string;
  systolic: number; // Pressão sistólica (máxima)
  diastolic: number; // Pressão diastólica (mínima)
  heartRate?: number; // Batimentos por minuto (opcional)
  timestamp: number; // Data/hora da medição
  notes?: string; // Observações opcionais
  classification: "normal" | "pre-hypertension" | "hypertension-stage1" | "hypertension-stage2" | "hypertensive-crisis";
}

export interface BloodPressureStats {
  totalReadings: number;
  averageSystolic: number;
  averageDiastolic: number;
  lastReading: BloodPressureReading | null;
  trend: "improving" | "stable" | "worsening" | "insufficient-data";
  highReadingsCount: number; // Leituras acima do normal
}

export function useBloodPressure() {
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReadings();
  }, []);

  const loadReadings = async () => {
    try {
      const stored = await AsyncStorage.getItem(BLOOD_PRESSURE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setReadings(data);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico de pressão:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReadings = async (newReadings: BloodPressureReading[]) => {
    try {
      await AsyncStorage.setItem(BLOOD_PRESSURE_KEY, JSON.stringify(newReadings));
      setReadings(newReadings);
    } catch (error) {
      console.error("Erro ao salvar histórico de pressão:", error);
    }
  };

  /**
   * Classificar pressão arterial segundo diretrizes da AHA (American Heart Association)
   */
  const classifyBloodPressure = (
    systolic: number,
    diastolic: number
  ): BloodPressureReading["classification"] => {
    if (systolic < 120 && diastolic < 80) {
      return "normal";
    } else if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
      return "pre-hypertension";
    } else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
      return "hypertension-stage1";
    } else if (systolic >= 140 || diastolic >= 90) {
      return "hypertension-stage2";
    } else if (systolic > 180 || diastolic > 120) {
      return "hypertensive-crisis";
    }
    return "normal";
  };

  /**
   * Adicionar nova leitura de pressão
   */
  const addReading = async (
    systolic: number,
    diastolic: number,
    heartRate?: number,
    notes?: string
  ): Promise<boolean> => {
    try {
      const newReading: BloodPressureReading = {
        id: Date.now().toString(),
        systolic,
        diastolic,
        heartRate,
        timestamp: Date.now(),
        notes,
        classification: classifyBloodPressure(systolic, diastolic),
      };

      const updatedReadings = [newReading, ...readings];
      await saveReadings(updatedReadings);
      return true;
    } catch (error) {
      console.error("Erro ao adicionar leitura:", error);
      return false;
    }
  };

  /**
   * Obter leituras dos últimos N dias
   */
  const getReadingsLastDays = (days: number): BloodPressureReading[] => {
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
    return readings.filter((r) => r.timestamp >= cutoffDate);
  };

  /**
   * Calcular estatísticas
   */
  const getStats = (): BloodPressureStats => {
    if (readings.length === 0) {
      return {
        totalReadings: 0,
        averageSystolic: 0,
        averageDiastolic: 0,
        lastReading: null,
        trend: "insufficient-data",
        highReadingsCount: 0,
      };
    }

    const totalSystolic = readings.reduce((sum, r) => sum + r.systolic, 0);
    const totalDiastolic = readings.reduce((sum, r) => sum + r.diastolic, 0);
    const averageSystolic = Math.round(totalSystolic / readings.length);
    const averageDiastolic = Math.round(totalDiastolic / readings.length);

    const highReadingsCount = readings.filter(
      (r) =>
        r.classification === "hypertension-stage1" ||
        r.classification === "hypertension-stage2" ||
        r.classification === "hypertensive-crisis"
    ).length;

    // Calcular tendência (últimos 7 dias vs 7 dias anteriores)
    let trend: BloodPressureStats["trend"] = "stable";
    if (readings.length >= 4) {
      const recentReadings = readings.slice(0, Math.floor(readings.length / 2));
      const olderReadings = readings.slice(Math.floor(readings.length / 2));

      const recentAvg =
        recentReadings.reduce((sum, r) => sum + r.systolic, 0) / recentReadings.length;
      const olderAvg =
        olderReadings.reduce((sum, r) => sum + r.systolic, 0) / olderReadings.length;

      const difference = recentAvg - olderAvg;
      if (difference < -5) {
        trend = "improving";
      } else if (difference > 5) {
        trend = "worsening";
      } else {
        trend = "stable";
      }
    } else {
      trend = "insufficient-data";
    }

    return {
      totalReadings: readings.length,
      averageSystolic,
      averageDiastolic,
      lastReading: readings[0] || null,
      trend,
      highReadingsCount,
    };
  };

  /**
   * Obter label de classificação em português
   */
  const getClassificationLabel = (classification: BloodPressureReading["classification"]): string => {
    const labels = {
      normal: "Normal",
      "pre-hypertension": "Pré-Hipertensão",
      "hypertension-stage1": "Hipertensão Estágio 1",
      "hypertension-stage2": "Hipertensão Estágio 2",
      "hypertensive-crisis": "Crise Hipertensiva",
    };
    return labels[classification];
  };

  /**
   * Obter cor da classificação
   */
  const getClassificationColor = (classification: BloodPressureReading["classification"]): string => {
    const colors = {
      normal: "#22C55E", // Verde
      "pre-hypertension": "#F59E0B", // Amarelo
      "hypertension-stage1": "#F97316", // Laranja
      "hypertension-stage2": "#EF4444", // Vermelho
      "hypertensive-crisis": "#991B1B", // Vermelho escuro
    };
    return colors[classification];
  };

  /**
   * Deletar leitura
   */
  const deleteReading = async (id: string): Promise<boolean> => {
    try {
      const updatedReadings = readings.filter((r) => r.id !== id);
      await saveReadings(updatedReadings);
      return true;
    } catch (error) {
      console.error("Erro ao deletar leitura:", error);
      return false;
    }
  };

  /**
   * Limpar todo o histórico
   */
  const clearHistory = async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(BLOOD_PRESSURE_KEY);
      setReadings([]);
      return true;
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      return false;
    }
  };

  return {
    readings,
    isLoading,
    addReading,
    getReadingsLastDays,
    getStats,
    classifyBloodPressure,
    getClassificationLabel,
    getClassificationColor,
    deleteReading,
    clearHistory,
  };
}
