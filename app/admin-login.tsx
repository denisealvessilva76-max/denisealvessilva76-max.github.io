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
      // Chamar API de login
      const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:3000";
      console.log("Tentando login em:", `${API_URL}/api/admin/login`);
      console.log("Credenciais:", { email, password });
      
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro da API:", errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText };
        }
        throw new Error(error.message || "Erro ao fazer login");
      }

      const data = await response.json();
      console.log("Login bem-sucedido:", data);

      // Salvar token seguro
      await SecureStore.setItemAsync("admin_token", data.token);
      await SecureStore.setItemAsync("admin_email", email);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navegar para dashboard
      router.push("/admin-dashboard");
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
