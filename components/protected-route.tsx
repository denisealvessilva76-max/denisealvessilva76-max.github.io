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

    const inOnboarding = segments[0] === "onboarding";
    
    if (!user && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/login");
    } else if (user && !inAuthGroup && segments[0] !== "login" && !inOnboarding) {
      // Redirect to tabs if authenticated and trying to access non-protected routes
      // Allow onboarding even if authenticated
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
