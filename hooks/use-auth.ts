import * as Auth from "@/lib/_core/auth";
import { saveToFirebase } from "@/lib/firebase";
import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UseAuthOptions = {
  autoFetch?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    console.log("[useAuth] fetchUser called");
    try {
      setLoading(true);
      setError(null);

      // Verificar usuário em cache local (funciona sem servidor)
      const cachedUser = await Auth.getUserInfo();
      console.log("[useAuth] Cached user:", cachedUser);

      if (cachedUser) {
        setUser(cachedUser);
        console.log("[useAuth] Using cached user:", cachedUser);
      } else {
        setUser(null);
        console.log("[useAuth] No cached user found");
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch user");
      console.error("[useAuth] fetchUser error:", error);
      setError(error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log("[useAuth] fetchUser completed");
    }
  }, []);

  /**
   * Login local — verifica se o usuário existe no AsyncStorage
   * Se não existir, cria um novo perfil básico
   */
  const login = useCallback(async (matricula: string, nome: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log("[useAuth] Starting local login...", { matricula, nome });

      // Verificar se o usuário já existe no AsyncStorage
      const existingProfile = await AsyncStorage.getItem(`employee:profile:${matricula}`);
      
      let userInfo: Auth.User;

      if (existingProfile) {
        // Usuário já cadastrado — fazer login com dados existentes
        const profile = JSON.parse(existingProfile);
        console.log("[useAuth] Found existing profile:", profile);
        
        userInfo = {
          id: parseInt(matricula, 10),
          openId: matricula,
          name: profile.name || nome,
          email: `${matricula}@canteiro.com`,
          loginMethod: "local",
          lastSignedIn: new Date(),
        };
      } else {
        // Usuário não encontrado — criar perfil básico para login rápido
        console.log("[useAuth] No existing profile, creating basic profile...");
        
        const basicProfile = {
          matricula,
          name: nome,
          createdAt: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem(`employee:profile:${matricula}`, JSON.stringify(basicProfile));
        await AsyncStorage.setItem("employee:matricula", matricula);
        await AsyncStorage.setItem("employee:name", nome);
        
        userInfo = {
          id: parseInt(matricula, 10),
          openId: matricula,
          name: nome,
          email: `${matricula}@canteiro.com`,
          loginMethod: "local",
          lastSignedIn: new Date(),
          firstLogin: true,
        };

        // Sincronizar com Firebase em background
        try {
          await saveToFirebase(matricula, "profile", {
            matricula,
            name: nome,
            createdAt: new Date().toISOString(),
            loginMethod: "local",
          });
          console.log("[useAuth] Basic profile synced to Firebase");
        } catch (fbError) {
          console.warn("[useAuth] Firebase sync failed (non-critical):", fbError);
        }
      }

      // Salvar sessão localmente
      await Auth.setUserInfo(userInfo);
      await Auth.setSessionToken(matricula);
      
      setUser(userInfo);
      console.log("[useAuth] Login successful:", userInfo);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to login");
      console.error("[useAuth] login error:", error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      setUser(null);
      setError(null);
      console.log("[useAuth] Logged out");
    } catch (err) {
      console.error("[Auth] Logout failed:", err);
    }
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  useEffect(() => {
    console.log("[useAuth] useEffect triggered, autoFetch:", autoFetch);
    if (autoFetch) {
      // Verificar cache local primeiro para carregamento rápido
      Auth.getUserInfo().then((cachedUser) => {
        console.log("[useAuth] Initial cache check:", cachedUser);
        if (cachedUser) {
          setUser(cachedUser);
          setLoading(false);
        } else {
          fetchUser();
        }
      });
    } else {
      setLoading(false);
    }
  }, [autoFetch, fetchUser]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    refresh: fetchUser,
    logout,
  };
}
