import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CheckInData {
  id?: number;
  mood: "bem" | "dor-leve" | "dor-forte";
  symptoms?: string[];
  notes?: string;
  date?: Date;
}

export function useCheckIn() {
  const [matricula, setMatricula] = useState<string | null>(null);
  const [todayCheckIn, setTodayCheckIn] = useState<CheckInData | null>(null);
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

  // Carregar check-in de hoje quando matrícula estiver disponível
  const { data: todayData, refetch: refetchToday } =
    trpc.checkin.getTodayCheckIn.useQuery(
      { matricula: matricula || "" },
      {
        enabled: !!matricula,
      }
    );

  // Atualizar todayCheckIn quando dados forem carregados
  useEffect(() => {
    if (todayData?.success && todayData.checkIn) {
      setTodayCheckIn(todayData.checkIn as CheckInData);
    }
  }, [todayData]);

  // Mutation para salvar check-in
  const saveCheckInMutation = trpc.checkin.saveCheckIn.useMutation({
    onSuccess: (data) => {
      if (data.success && data.checkIn) {
        setTodayCheckIn(data.checkIn as CheckInData);
        refetchToday();
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Função para salvar check-in
  const saveCheckIn = async (checkInData: CheckInData) => {
    if (!matricula) {
      setError("Matrícula não encontrada");
      return { success: false, error: "Matrícula não encontrada" };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await saveCheckInMutation.mutateAsync({
        matricula,
        mood: checkInData.mood,
        symptoms: checkInData.symptoms,
        notes: checkInData.notes,
      });

      setLoading(false);
      return { success: true, checkIn: result.checkIn };
    } catch (err) {
      setLoading(false);
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao salvar check-in";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Carregar histórico de check-ins
  const { data: historyData, refetch: refetchHistory } =
    trpc.checkin.getCheckIns.useQuery(
      { matricula: matricula || "", limit: 30 },
      { enabled: !!matricula }
    );

  return {
    todayCheckIn,
    history: historyData?.checkIns || [],
    loading,
    error,
    saveCheckIn,
    refetchToday,
    refetchHistory,
  };
}
