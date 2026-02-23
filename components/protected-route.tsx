import { useEffect } from "react";
import { router, useSegments } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { View, Text, ActivityIndicator } from "react-native";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const isLoginPage = segments[0] === "login";
    const isOnboardingPage = segments[0] === "onboarding";

    // Se não há usuário e está tentando acessar área protegida, redirecionar para login
    if (!user && inAuthGroup) {
      console.log("[ProtectedRoute] No user, redirecting to login");
      router.replace("/login");
    }
    // Se há usuário mas está na página de login (e não é primeiro acesso), redirecionar para home
    // Permitir acesso ao onboarding sempre
    else if (user && isLoginPage && !isOnboardingPage) {
      console.log("[ProtectedRoute] User exists and on login page, redirecting to home");
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text className="text-muted mt-4">Carregando...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
