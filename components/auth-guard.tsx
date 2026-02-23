import { useEffect, useState } from "react";
import { router, useSegments, usePathname, Redirect } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { View, Text, ActivityIndicator } from "react-native";
import * as Auth from "@/lib/_core/auth";
import { useColors } from "@/hooks/use-colors";

/**
 * AuthGuard - Componente que protege rotas e força login obrigatório
 * 
 * Este componente deve envolver todo o conteúdo do app e garante que:
 * 1. Usuários sem autenticação sejam redirecionados para /login
 * 2. Usuários autenticados na página de login sejam redirecionados para /(tabs)
 * 3. O redirecionamento aconteça ANTES de renderizar qualquer conteúdo protegido
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const colors = useColors();
  const [localUser, setLocalUser] = useState<Auth.User | null>(null);
  const [checkingLocal, setCheckingLocal] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  // Verificar localStorage diretamente (síncrono na web)
  useEffect(() => {
    Auth.getUserInfo().then((cachedUser) => {
      console.log("[AuthGuard] Cached user from localStorage:", cachedUser);
      setLocalUser(cachedUser);
      setCheckingLocal(false);
    });
  }, []);

  // Determinar se deve redirecionar
  useEffect(() => {
    if (loading || checkingLocal) return;

    const isLoginPage = pathname === "/login" || segments[0] === "login";
    const isOnboardingPage = pathname === "/onboarding" || segments[0] === "onboarding";
    const isAdminPage = segments[0]?.startsWith("admin");
    const isPublicPage = isLoginPage || isOnboardingPage || isAdminPage;

    const hasUser = user || localUser;

    console.log("[AuthGuard] Check:", {
      hasUser: !!hasUser,
      pathname,
      segments,
      isPublicPage,
      loading,
      checkingLocal
    });

    // Se não há usuário e não está em página pública, redirecionar para login
    if (!hasUser && !isPublicPage) {
      console.log("[AuthGuard] No user, should redirect to login");
      setShouldRedirect("/login");
    }
    // Se há usuário mas está na página de login, redirecionar para home
    else if (hasUser && isLoginPage) {
      console.log("[AuthGuard] User exists and on login page, should redirect to home");
      setShouldRedirect("/(tabs)");
    }
    // Caso contrário, não redirecionar
    else {
      setShouldRedirect(null);
    }
  }, [user, localUser, loading, checkingLocal, segments, pathname]);

  // Mostrar loading enquanto verifica autenticação
  if (loading || checkingLocal) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={{ color: colors.muted, marginTop: 16 }}>Verificando autenticação...</Text>
      </View>
    );
  }

  // Se deve redirecionar, usar Redirect do Expo Router
  if (shouldRedirect) {
    console.log("[AuthGuard] Redirecting to:", shouldRedirect);
    return <Redirect href={shouldRedirect as any} />;
  }

  // Renderizar conteúdo protegido
  return <>{children}</>;
}
