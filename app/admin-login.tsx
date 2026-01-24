import { ScrollView, Text, View, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";

export default function AdminLoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha email e senha");
      return;
    }

    setIsLoading(true);
    try {
      // Autenticação LOCAL (offline) - Credenciais de admin fixas
      const ADMIN_EMAIL = "admin";
      const ADMIN_PASSWORD = "1234";

      console.log("[LOGIN] Tentativa de login:", { email, password });
      console.log("[LOGIN] Credenciais esperadas:", { ADMIN_EMAIL, ADMIN_PASSWORD });

      // Verificar credenciais localmente (case-insensitive para email)
      if (email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
        console.log("[LOGIN] Credenciais corretas!");
        // Gerar token local simples
        const localToken = `local_${Date.now()}_${Math.random().toString(36)}`;

        // Salvar token e email no SecureStore
        await SecureStore.setItemAsync("admin_token", localToken);
        await SecureStore.setItemAsync("admin_email", email);
        await SecureStore.setItemAsync("admin_authenticated", "true");

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Navegar para dashboard
        router.replace("/admin-dashboard");
      } else {
        throw new Error("Email ou senha incorretos");
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Erro de Autenticação",
        error instanceof Error ? error.message : "Email ou senha incorretos"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 justify-center gap-6">
            {/* Logo e Título */}
            <View className="items-center gap-4">
              <Text className="text-6xl">🔐</Text>
              <Text className="text-3xl font-bold text-foreground text-center">
                Acesso SESMT
              </Text>
              <Text className="text-base text-muted text-center">
                Visualize dados de saúde dos empregados
              </Text>
              <Text className="text-sm text-muted text-center mt-2">
                🔑 Login: admin | Senha: 1234
              </Text>
            </View>

            {/* Formulário */}
            <View className="gap-4">
              {/* Email */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Email</Text>
                <TextInput
                  placeholder="seu.email@obra.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    color: colors.foreground,
                    fontSize: 16,
                  }}
                />
              </View>

              {/* Senha */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Senha</Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                  }}
                >
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    value={password}
                    onChangeText={setPassword}
                    editable={!isLoading}
                    secureTextEntry={!showPassword}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      color: colors.foreground,
                      fontSize: 16,
                    }}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ padding: 8 }}
                  >
                    <Text className="text-xl">{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Botão Login */}
            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={({ pressed }) => [
                {
                  backgroundColor: isLoading ? colors.muted : colors.primary,
                  opacity: pressed && !isLoading ? 0.7 : 1,
                  padding: 14,
                  borderRadius: 8,
                },
              ]}
            >
              <Text className="text-center text-background font-semibold text-base">
                {isLoading ? "Conectando..." : "Entrar"}
              </Text>
            </Pressable>

            {/* Informações */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text className="text-xs text-muted leading-relaxed">
                ℹ️ Este é um acesso restrito para profissionais de saúde ocupacional. Os dados
                são agregados e anônimos para proteger a privacidade dos empregados.
              </Text>
            </View>

            {/* Voltar */}
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.7 : 1,
                  padding: 12,
                },
              ]}
            >
              <Text className="text-center text-primary font-semibold">← Voltar</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
