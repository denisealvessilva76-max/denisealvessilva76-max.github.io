import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  name: string;
  cpf: string;
  matricula: string;
  email?: string;
  setor?: string;
  cargo?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (cpf: string, matricula: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar sessão salva ao iniciar o app
    loadSavedSession();
  }, []);

  const loadSavedSession = async () => {
    try {
      const savedUser = await AsyncStorage.getItem("user_session");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("[Auth] Erro ao carregar sessão:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (cpf: string, matricula: string): Promise<boolean> => {
    try {
      // Validação simples (futuramente será API)
      const cleanCPF = cpf.replace(/\D/g, "");
      const cleanMatricula = matricula.trim();

      if (cleanCPF.length !== 11) {
        return false;
      }

      if (cleanMatricula.length < 3) {
        return false;
      }

      // Criar usuário (futuramente virá do backend)
      const userData: User = {
        id: `user_${cleanCPF}`,
        name: `Funcionário ${cleanMatricula}`,
        cpf: cleanCPF,
        matricula: cleanMatricula,
        setor: "Geral",
        cargo: "Funcionário",
      };

      // Salvar sessão
      await AsyncStorage.setItem("user_session", JSON.stringify(userData));
      setUser(userData);

      return true;
    } catch (error) {
      console.error("[Auth] Erro ao fazer login:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("user_session");
      setUser(null);
    } catch (error) {
      console.error("[Auth] Erro ao fazer logout:", error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!user) return;

      const updatedUser = { ...user, ...userData };
      await AsyncStorage.setItem("user_session", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error("[Auth] Erro ao atualizar usuário:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
