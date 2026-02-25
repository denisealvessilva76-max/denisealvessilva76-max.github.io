import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "@/constants/oauth";

const PROFILE_STORAGE_KEY = "employee:profile";

export interface EmployeeProfile {
  id?: number;
  cpf: string;
  matricula: string;
  name: string;
  email?: string;
  department?: string;
  position?: string; // cargo
  weight?: number;
  height?: number;
  workType?: "leve" | "moderado" | "pesado";
  workerId?: string;
}

/**
 * Hook para gerenciar perfil do empregado
 * 
 * Salva dados no PostgreSQL via API e mantém cache local no AsyncStorage
 */
export function useEmployeeProfile() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const saveProfileMutation = trpc.employeeProfile.saveProfile.useMutation();

  // Carregar perfil do AsyncStorage ao iniciar
  useEffect(() => {
    loadProfileFromStorage();
  }, []);

  const loadProfileFromStorage = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const parsedProfile = JSON.parse(stored);
        setProfile(parsedProfile);
        console.log("[EmployeeProfile] Loaded from storage:", parsedProfile);
      }
    } catch (err) {
      console.error("[EmployeeProfile] Error loading from storage:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Salvar perfil no PostgreSQL e AsyncStorage
   */
  const saveProfile = async (data: EmployeeProfile): Promise<boolean> => {
    try {
      setError(null);
      
      // Tentar salvar via tRPC primeiro
      try {
        const result = await saveProfileMutation.mutateAsync(data);
        
        if (result.success) {
          const savedProfile = result.employee as EmployeeProfile;
          
          // Atualizar estado local
          setProfile(savedProfile);
          
          // Salvar no AsyncStorage
          await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(savedProfile));
          
          console.log("[EmployeeProfile] Saved via tRPC:", savedProfile);
          return true;
        }
      } catch (trpcError) {
        console.warn("[EmployeeProfile] tRPC failed, trying REST fallback:", trpcError);
        
        // Fallback: usar endpoint REST
        const apiUrl = getApiBaseUrl();
        const response = await fetch(`${apiUrl}/api/employee/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error(`REST API failed: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          const savedProfile = result.employee as EmployeeProfile;
          
          // Atualizar estado local
          setProfile(savedProfile);
          
          // Salvar no AsyncStorage
          await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(savedProfile));
          
          console.log("[EmployeeProfile] Saved via REST:", savedProfile);
          return true;
        }
      }
      
      setError("Falha ao salvar perfil");
      return false;
    } catch (err) {
      console.error("[EmployeeProfile] Error saving profile:", err);
      setError("Erro ao salvar perfil");
      return false;
    }
  };

  /**
   * Carregar perfil do servidor por matrícula
   */
  const loadProfileFromServer = async (matricula: string): Promise<EmployeeProfile | null> => {
    try {
      setError(null);
      
      // Usar trpc client diretamente para fazer a query
      const utils = trpc.useContext();
      const result = await utils.employeeProfile.getProfile.fetch({ matricula });
      
      if (result) {
        const serverProfile = result as EmployeeProfile;
        
        // Atualizar estado local
        setProfile(serverProfile);
        
        // Salvar no AsyncStorage
        await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(serverProfile));
        
        console.log("[EmployeeProfile] Loaded from server:", serverProfile);
        return serverProfile;
      }
      
      return null;
    } catch (err) {
      console.error("[EmployeeProfile] Error loading from server:", err);
      setError("Erro ao carregar perfil");
      return null;
    }
  };

  /**
   * Limpar perfil (logout)
   */
  const clearProfile = async () => {
    try {
      setProfile(null);
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
      console.log("[EmployeeProfile] Profile cleared");
    } catch (err) {
      console.error("[EmployeeProfile] Error clearing profile:", err);
    }
  };

  /**
   * Verificar se há perfil salvo
   */
  const hasProfile = (): boolean => {
    return profile !== null && !!profile.matricula && !!profile.name;
  };

  return {
    profile,
    loading,
    error,
    saveProfile,
    loadProfileFromServer,
    clearProfile,
    hasProfile,
  };
}
