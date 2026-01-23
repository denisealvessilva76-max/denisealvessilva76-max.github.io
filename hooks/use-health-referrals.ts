import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const REFERRALS_KEY = "health_referrals";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface HealthReferral {
  id?: string;
  workerId: string;
  complaintType: "dor-leve" | "dor-forte" | "outro";
  description: string;
  severity: "leve" | "moderada" | "grave";
  status: "pendente" | "em-atendimento" | "resolvido";
  referredTo?: string;
  notes?: string;
  createdAt: string;
}

export function useHealthReferrals() {
  const [referrals, setReferrals] = useState<HealthReferral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar encaminhamentos ao iniciar
  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      const stored = await AsyncStorage.getItem(REFERRALS_KEY);
      if (stored) {
        setReferrals(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Erro ao carregar encaminhamentos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReferrals = async (newReferrals: HealthReferral[]) => {
    try {
      await AsyncStorage.setItem(REFERRALS_KEY, JSON.stringify(newReferrals));
      setReferrals(newReferrals);
    } catch (error) {
      console.error("Erro ao salvar encaminhamentos:", error);
    }
  };

  /**
   * Criar novo encaminhamento de dor
   */
  const createReferral = async (
    complaintType: "dor-leve" | "dor-forte" | "outro",
    description: string,
    severity: "leve" | "moderada" | "grave"
  ): Promise<HealthReferral | null> => {
    try {
      let workerId = await SecureStore.getItemAsync("worker_id");
      if (!workerId) {
        // Gerar novo Worker ID se não existir
        workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await SecureStore.setItemAsync("worker_id", workerId);
      }

      const newReferral: HealthReferral = {
        id: Date.now().toString(),
        workerId,
        complaintType,
        description,
        severity,
        status: "pendente",
        createdAt: new Date().toISOString(),
      };

      const updatedReferrals = [...referrals, newReferral];
      await saveReferrals(updatedReferrals);

      // Sincronizar com servidor
      await syncReferralToServer(newReferral);

      return newReferral;
    } catch (error) {
      console.error("Erro ao criar encaminhamento:", error);
      return null;
    }
  };

  /**
   * Sincronizar encaminhamento com servidor
   */
  const syncReferralToServer = async (referral: HealthReferral) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health-referrals/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(referral),
      });

      if (!response.ok) {
        throw new Error(`Erro ao sincronizar: ${response.statusText}`);
      }

      console.log("Encaminhamento sincronizado com servidor");
    } catch (error) {
      console.error("Erro ao sincronizar encaminhamento:", error);
      // Não falhar se o servidor não estiver disponível
    }
  };

  /**
   * Obter encaminhamentos pendentes
   */
  const getPendingReferrals = (): HealthReferral[] => {
    return referrals.filter((r) => r.status === "pendente");
  };

  /**
   * Obter encaminhamentos por status
   */
  const getReferralsByStatus = (status: string): HealthReferral[] => {
    return referrals.filter((r) => r.status === status);
  };

  /**
   * Obter histórico de encaminhamentos
   */
  const getReferralHistory = (): HealthReferral[] => {
    return referrals.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  return {
    referrals,
    isLoading,
    createReferral,
    getPendingReferrals,
    getReferralsByStatus,
    getReferralHistory,
  };
}
