import { useEffect, useState } from "react";
import { router, useSegments, usePathname } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { View, Text, ActivityIndicator } from "react-native";
import * as Auth from "@/lib/_core/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const [localUser, setLocalUser] = useState<Auth.User | null>(null);
  const [checkingLocal, setCheckingLocal] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Verificar localStorage diretamente para evitar race condition
  useEffect(() => {
    Auth.getUserInfo().then((cachedUser) => {
      console.log("[ProtectedRoute] Cached user from localStorage:", cachedUser);
      setLocalUser(cachedUser);
      setCheckingLocal(false);
    });
  }, []);

  useEffect(() => {
    if (loading || checkingLocal || hasRedirected) return;

    const isLoginPage = pathname === "/login" || segments[0] === "login";
    const isOnboardingPage = pathname === "/onboarding" || segments[0] === "onboarding";
    const isAdminPage = segments[0]?.startsWith("admin");
    const isPublicPage = isLoginPage || isOnboardingPage || isAdminPage;

    // Usar localUser (localStorage) como fallback para user (contexto)
    const hasUser = user || localUser;

    console.log("[ProtectedRoute] Check:", {
      hasUser: !!hasUser,
      pathname,
      segments,
      isPublicPage,
      loading,
      checkingLocal
    });

    // Se não há usuário e não está em páginas públicas, redirecionar para login
    if (!hasUser && !isPublicPage) {
      console.log("[ProtectedRoute] No user, redirecting to login");
      setHasRedirected(true);
      setTimeout(() => {
        router.replace("/login");
      }, 100);
    }
    // Se há usuário mas está na página de login, redirecionar para home
    else if (hasUser && isLoginPage) {
      console.log("[ProtectedRoute] User exists and on login page, redirecting to home");
      setHasRedirected(true);
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 100);
    }
  }, [user, localUser, loading, checkingLocal, segments, pathname, hasRedirected]);

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
  const isLoginPage = pathname === "/login" || segments[0] === "login";
  const isOnboardingPage = pathname === "/onboarding" || segments[0] === "onboarding";
  const isAdminPage = segments[0]?.startsWith("admin");
  const isPublicPage = isLoginPage || isOnboardingPage || isAdminPage;

  // Se não há usuário e não está em páginas públicas, mostrar tela de carregamento
  if (!hasUser && !isPublicPage) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text className="text-muted mt-4">Redirecionando...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
