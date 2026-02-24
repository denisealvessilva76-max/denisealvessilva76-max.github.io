import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { RegisterModal } from "./register-modal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { trpc } from "@/lib/trpc";

const PROFILE_STORAGE_KEY = "employee:profile";

interface RegisterContextType {
  showRegisterModal: () => void;
  hideRegisterModal: () => void;
}

const RegisterContext = createContext<RegisterContextType | undefined>(undefined);

export function useRegister() {
  const context = useContext(RegisterContext);
  if (!context) {
    throw new Error("useRegister must be used within RegisterProvider");
  }
  return context;
}

interface RegisterProviderProps {
  children: ReactNode;
}

/**
 * Provider que gerencia o modal de cadastro
 * 
 * Exibe automaticamente no primeiro acesso (quando não há perfil salvo)
 * Permite exibir manualmente via hook useRegister()
 */
export function RegisterProvider({ children }: RegisterProviderProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  
  const saveProfileMutation = trpc.employeeProfile.saveProfile.useMutation();

  // Verificar se precisa exibir modal no primeiro acesso
  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    if (hasCheckedProfile) return;
    
    try {
      const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      
      if (!stored) {
        // Não há perfil salvo, exibir modal após 1.5 segundos
        setTimeout(() => {
          setModalVisible(true);
          console.log("[RegisterProvider] No profile found, showing modal");
        }, 1500);
      } else {
        console.log("[RegisterProvider] Profile found:", JSON.parse(stored));
      }
      
      setHasCheckedProfile(true);
    } catch (error) {
      console.error("[RegisterProvider] Error checking profile:", error);
      setHasCheckedProfile(true);
    }
  };

  const handleRegister = async (matricula: string, name: string): Promise<boolean> => {
    try {
      console.log("[RegisterProvider] Registering:", { matricula, name });
      
      const result = await saveProfileMutation.mutateAsync({
        matricula,
        name,
      });

      if (result.success) {
        const savedProfile = result.employee;
        
        // Salvar no AsyncStorage
        await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(savedProfile));
        
        console.log("[RegisterProvider] Profile saved:", savedProfile);
        
        Alert.alert(
          "Cadastro realizado! ✅",
          `Bem-vindo(a), ${name}! Seu perfil foi salvo com sucesso.`,
          [
            {
              text: "OK",
              onPress: () => setModalVisible(false),
            },
          ]
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error("[RegisterProvider] Error registering:", error);
      return false;
    }
  };

  const showRegisterModal = () => {
    console.log("[RegisterProvider] Showing modal manually");
    setModalVisible(true);
  };
  
  const hideRegisterModal = () => {
    console.log("[RegisterProvider] Hiding modal");
    setModalVisible(false);
  };

  return (
    <RegisterContext.Provider value={{ showRegisterModal, hideRegisterModal }}>
      {children}
      <RegisterModal
        visible={modalVisible}
        onRegister={handleRegister}
        onClose={hideRegisterModal}
      />
    </RegisterContext.Provider>
  );
}
