import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface HydrationSyncData {
  id?: number;
  cupsConsumed: number;
  totalMl: number;
  goalMl: number;
  weight?: number;
  height?: number;
  workType?: "leve" | "moderado" | "pesado";
  date?: Date;
}

/**
 * Hook para sincronizar hidratação com PostgreSQL
 * Complementa o useHydration existente adicionando persistência no banco
 */
export function useHydrationSync() {
  const [matricula, setMatricula] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar matrícula do AsyncStorage
  useEffect(() => {
    const loadMatricula = async () => {
      try {
        const stored = await AsyncStorage.getItem("employee:matricula");
        if (stored) {
          setMatricula(stored);
        }
      } catch (err) {
        console.error("Erro ao carregar matrícula:", err);
      }
    };
    loadMatricula();
  }, []);

  // Mutation para salvar hidratação
  const saveHydrationMutation = trpc.hydration.saveHydration.useMutation();

  // Função para sincronizar hidratação com PostgreSQL
  const syncHydration = async (hydrationData: HydrationSyncData) => {
    if (!matricula) {
      setError("Matrícula não encontrada");
      return { success: false, error: "Matrícula não encontrada" };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await saveHydrationMutation.mutateAsync({
        matricula,
        cupsConsumed: hydrationData.cupsConsumed,
        totalMl: hydrationData.totalMl,
        goalMl: hydrationData.goalMl,
        weight: hydrationData.weight,
        height: hydrationData.height,
        workType: hydrationData.workType,
      });

      setLoading(false);
      return { success: true, hydration: result.hydration };
    } catch (err) {
      setLoading(false);
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao sincronizar hidratação";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Carregar histórico de hidratação do PostgreSQL
  const { data: historyData, refetch: refetchHistory } =
    trpc.hydration.getHydration.useQuery(
      { matricula: matricula || "", limit: 30 },
      { enabled: !!matricula }
    );

  // Carregar hidratação de hoje do PostgreSQL
  const { data: todayData, refetch: refetchToday } =
    trpc.hydration.getTodayHydration.useQuery(
      { matricula: matricula || "" },
      { enabled: !!matricula }
    );

  return {
    todayHydration: todayData?.hydration || null,
    history: historyData?.hydration || [],
    loading,
    error,
    syncHydration,
    refetchToday,
    refetchHistory,
  };
}
