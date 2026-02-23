import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";

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

      // Web platform: check for local auth first, then try OAuth API
      if (Platform.OS === "web") {
        console.log("[useAuth] Web platform: checking for local user first...");
        
        // Check if there's a cached local user
        const cachedUser = await Auth.getUserInfo();
        if (cachedUser && cachedUser.loginMethod === "local") {
          console.log("[useAuth] Web: using cached local user, skipping API call");
          setUser(cachedUser);
          return;
        }
        
        // No local user, try OAuth API
        console.log("[useAuth] Web platform: fetching user from OAuth API...");
        const apiUser = await Api.getMe();
        console.log("[useAuth] API user response:", apiUser);

        if (apiUser) {
          const userInfo: Auth.User = {
            id: apiUser.id,
            openId: apiUser.openId,
            name: apiUser.name,
            email: apiUser.email,
            loginMethod: apiUser.loginMethod,
            lastSignedIn: new Date(apiUser.lastSignedIn),
          };
          setUser(userInfo);
          // Cache user info in localStorage for faster subsequent loads
          await Auth.setUserInfo(userInfo);
          console.log("[useAuth] Web user set from API:", userInfo);
        } else {
          console.log("[useAuth] Web: No authenticated user from API");
          setUser(null);
          await Auth.clearUserInfo();
        }
        return;
      }

      // Native platform: use token-based auth
      console.log("[useAuth] Native platform: checking for session token...");
      const sessionToken = await Auth.getSessionToken();
      console.log(
        "[useAuth] Session token:",
        sessionToken ? `present (${sessionToken.substring(0, 20)}...)` : "missing",
      );
      if (!sessionToken) {
        console.log("[useAuth] No session token, setting user to null");
        setUser(null);
        return;
      }

      // Use cached user info for native (token validates the session)
      const cachedUser = await Auth.getUserInfo();
      console.log("[useAuth] Cached user:", cachedUser);
      if (cachedUser) {
        console.log("[useAuth] Using cached user info");
        setUser(cachedUser);
      } else {
        console.log("[useAuth] No cached user, setting user to null");
        setUser(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch user");
      console.error("[useAuth] fetchUser error:", error);
      setError(error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log("[useAuth] fetchUser completed, loading:", false);
    }
  }, []);

  const login = useCallback(async (matricula: string, nome: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log("[useAuth] Registering user in backend...", { matricula, nome });

      // Gerar CPF fake baseado na matrícula (11 dígitos)
      const cpfFake = matricula.padStart(11, "0");

      // Get API base URL
      const apiBaseUrl = getApiBaseUrl();
      console.log("[useAuth] API Base URL:", apiBaseUrl);

      const apiUrl = `${apiBaseUrl}/api/trpc/employeeAuth.register?batch=1`;
      console.log("[useAuth] Full API URL:", apiUrl);

      // CRITICAL: Register user in PostgreSQL backend first via direct API call
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          "0": {
            "json": {
              name: nome,
              cpf: cpfFake,
              matricula: matricula,
              weight: 70,
              height: 170,
              setor: "Geral",
              cargo: "Funcionário",
              workType: "moderado",
            }
          }
        }),
      });

      console.log("[useAuth] Response status:", response.status);
      console.log("[useAuth] Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[useAuth] Error response:", errorText);
        throw new Error(`Falha ao cadastrar usuário no backend: ${response.status} ${errorText}`);
      }

      const registerResult = await response.json();
      console.log("[useAuth] Backend registration result:", registerResult);

      // tRPC batch response format: [{ result: { data: { json: { ... } } } }]
      const resultData = registerResult[0]?.result?.data?.json;
      console.log("[useAuth] Parsed result data:", resultData);
      
      // Se CPF já cadastrado, ainda assim fazer login local
      const isCpfAlreadyRegistered = resultData?.error?.includes("CPF já cadastrado");
      
      if (!resultData) {
        throw new Error("Resposta inválida do servidor");
      }
      
      if (!resultData.success && !isCpfAlreadyRegistered) {
        throw new Error(resultData?.error || "Falha ao cadastrar usuário");
      }

      // Create user object
      const userInfo: Auth.User = {
        id: resultData.employee?.id || parseInt(matricula, 10),
        openId: matricula,
        name: nome,
        email: `${matricula}@empresa.com`,
        loginMethod: "local",
        lastSignedIn: new Date(),
      };
      
      console.log("[useAuth] User info created:", userInfo);

      // Save user info locally
      await Auth.setUserInfo(userInfo);
      
      // Set session token (using matricula as token for local auth)
      await Auth.setSessionToken(matricula);
      
      setUser(userInfo);
      console.log("[useAuth] User logged in and registered:", userInfo);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to login");
      console.error("[useAuth] login error:", error);
      setError(error);
      // Não lançar erro - o login.tsx verificará se o usuário foi salvo
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Api.logout();
    } catch (err) {
      console.error("[Auth] Logout API call failed:", err);
      // Continue with logout even if API call fails
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      setUser(null);
      setError(null);
    }
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  useEffect(() => {
    console.log("[useAuth] useEffect triggered, autoFetch:", autoFetch, "platform:", Platform.OS);
    if (autoFetch) {
      if (Platform.OS === "web") {
        // Web: check for cached user first (for local auth)
        Auth.getUserInfo().then((cachedUser) => {
          console.log("[useAuth] Web cached user check:", cachedUser);
          if (cachedUser) {
            console.log("[useAuth] Web: using cached user (local auth)");
            setUser(cachedUser);
            setLoading(false);
          } else {
            // No cached user, try API (for OAuth)
            console.log("[useAuth] Web: no cached user, fetching from API...");
            fetchUser();
          }
        });
      } else {
        // Native: check for cached user info first for faster initial load
        Auth.getUserInfo().then((cachedUser) => {
          console.log("[useAuth] Native cached user check:", cachedUser);
          if (cachedUser) {
            console.log("[useAuth] Native: setting cached user immediately");
            setUser(cachedUser);
            setLoading(false);
          } else {
            // No cached user, check session token
            fetchUser();
          }
        });
      }
    } else {
      console.log("[useAuth] autoFetch disabled, setting loading to false");
      setLoading(false);
    }
  }, [autoFetch, fetchUser]);

  useEffect(() => {
    console.log("[useAuth] State updated:", {
      hasUser: !!user,
      loading,
      isAuthenticated,
      error: error?.message,
    });
  }, [user, loading, isAuthenticated, error]);

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
