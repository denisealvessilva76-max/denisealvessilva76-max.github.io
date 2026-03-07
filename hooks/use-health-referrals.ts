import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { pushToFirebase } from "@/lib/firebase";

const REFERRALS_KEY = "health_referrals";

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
      const workerId = await AsyncStorage.getItem("employee:matricula") || `worker_${Date.now()}`;

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

      // Sincronizar com Firebase
      await syncReferralToFirebase(newReferral);

      return newReferral;
    } catch (error) {
      console.error("Erro ao criar encaminhamento:", error);
      return null;
    }
  };

  /**
   * Sincronizar encaminhamento com Firebase
   * Salva em: canteiro-saudavel/employees/{matricula}/symptoms/{pushId}
   */
  const syncReferralToFirebase = async (referral: HealthReferral) => {
    try {
      const matricula = await AsyncStorage.getItem("employee:matricula");
      if (!matricula) return;

      await pushToFirebase(matricula, 'symptoms', {
        id: referral.id,
        complaintType: referral.complaintType,
        description: referral.description,
        severity: referral.severity,
        status: referral.status,
        date: referral.createdAt.split('T')[0],
        createdAt: referral.createdAt,
      });
      console.log('[Firebase] Queixa sincronizada para', matricula);
    } catch (error) {
      console.error('Erro ao sincronizar queixa com Firebase:', error);
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
