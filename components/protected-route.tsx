import { useEffect, useState } from "react";
import { router, useSegments } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { View, Text, ActivityIndicator } from "react-native";
import * as Auth from "@/lib/_core/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const [localUser, setLocalUser] = useState<Auth.User | null>(null);
  const [checkingLocal, setCheckingLocal] = useState(true);

  // Verificar localStorage diretamente para evitar race condition
  useEffect(() => {
    Auth.getUserInfo().then((cachedUser) => {
      console.log("[ProtectedRoute] Cached user from localStorage:", cachedUser);
      setLocalUser(cachedUser);
      setCheckingLocal(false);
    });
  }, []);

  useEffect(() => {
    if (loading || checkingLocal) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const isLoginPage = segments[0] === "login";
    const isOnboardingPage = segments[0] === "onboarding";
    const isAdminPage = segments[0]?.startsWith("admin");

    // Usar localUser (localStorage) como fallback para user (contexto)
    const hasUser = user || localUser;

    console.log("[ProtectedRoute] user:", !!user, "localUser:", !!localUser, "hasUser:", !!hasUser, "segments:", segments, "loading:", loading);

    // Se não há usuário e não está em páginas públicas, redirecionar para login
    if (!hasUser && !isLoginPage && !isOnboardingPage && !isAdminPage) {
      console.log("[ProtectedRoute] No user, redirecting to login");
      router.replace("/login");
    }
    // Se há usuário mas está na página de login, redirecionar para home
    else if (hasUser && isLoginPage) {
      console.log("[ProtectedRoute] User exists and on login page, redirecting to home");
      router.replace("/(tabs)");
    }
  }, [user, localUser, loading, checkingLocal, segments]);

  if (loading || checkingLocal) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text className="text-muted mt-4">Carregando...</Text>
      </View>
    );
  }

  // Usar localUser (localStorage) como fallback para user (contexto)
  const hasUser = user || localUser;
  const isLoginPage = segments[0] === "login";
  const isOnboardingPage = segments[0] === "onboarding";
  const isAdminPage = segments[0]?.startsWith("admin");

  // Se não há usuário e não está em páginas públicas, não renderizar nada (forçar redirecionamento)
  if (!hasUser && !isLoginPage && !isOnboardingPage && !isAdminPage) {
    return null;
  }

  return <>{children}</>;
}
