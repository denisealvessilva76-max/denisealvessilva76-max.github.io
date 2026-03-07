import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveToFirebase } from "@/lib/firebase";

export default function LoginScreen() {
  const { login } = useAuth();
  const [matricula, setMatricula] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    // Validação
    if (!matricula.trim() || !nome.trim()) {
      setError("Por favor, preencha todos os campos");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    // Validar formato da matrícula (apenas números)
    if (!/^\d+$/.test(matricula)) {
      setError("Matrícula deve conter apenas números");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("[LOGIN] Starting login process...");
      // Fazer login (salva no localStorage/SecureStore)
      await login(matricula, nome);
      console.log("[LOGIN] Login completed successfully");
      
      // Salvar matrícula na chave usada pelos hooks de sincronização Firebase
      await AsyncStorage.setItem("employee:matricula", matricula.trim());
      
      // Salvar perfil básico para que a tela de perfil exiba os dados
      const existingProfile = await AsyncStorage.getItem("employee:profile");
      if (!existingProfile) {
        const basicProfile = { matricula: matricula.trim(), name: nome.trim(), position: '', cpf: '' };
        await AsyncStorage.setItem("employee:profile", JSON.stringify(basicProfile));
      }
      
      // Sincronizar perfil básico com Firebase
      try {
        await saveToFirebase(matricula.trim(), 'profile', {
          name: nome.trim(),
          matricula: matricula.trim(),
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('[LOGIN] Firebase sync failed:', e);
      }
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Verificar se é o primeiro login (onboarding não completado)
      const onboardingCompleted = await AsyncStorage.getItem("onboarding:completed");
      
      if (!onboardingCompleted) {
        // Primeiro login → mostrar onboarding
        console.log("[LOGIN] First login, showing onboarding...");
        router.replace("/onboarding");
      } else {
        // Login subsequente → ir direto para home
        console.log("[LOGIN] Redirecting to home...");
        router.replace("/(tabs)");
      }
      console.log("[LOGIN] Redirect called");
    } catch (err) {
      console.error("[LOGIN] Login failed:", err);
      setError("Erro ao fazer login. Tente novamente.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
      console.log("[LOGIN] Login process finished, loading:", false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6">
            {/* Logo/Título */}
            <View className="items-center mb-12">
              <Text className="text-3xl font-bold text-primary mb-2 text-center px-4" numberOfLines={1} adjustsFontSizeToFit>
                Canteiro Saudável
              </Text>
              <Text className="text-base text-muted text-center">
                Bem-vindo! Faça login para continuar
              </Text>
            </View>

            {/* Formulário */}
            <View className="gap-4">
              {/* Campo Matrícula */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Matrícula
                </Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="Digite sua matrícula"
                  placeholderTextColor="#9BA1A6"
                  value={matricula}
                  defaultValue={matricula}
                  onChangeText={(text) => {
                    setMatricula(text);
                    setError("");
                  }}
                  keyboardType="numeric"
                  returnKeyType="next"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Campo Nome */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Nome Completo
                </Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="Digite seu nome completo"
                  placeholderTextColor="#9BA1A6"
                  value={nome}
                  defaultValue={nome}
                  onChangeText={(text) => {
                    setNome(text);
                    setError("");
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Mensagem de Erro */}
              {error ? (
                <View className="bg-error/10 border border-error rounded-xl px-4 py-3">
                  <Text className="text-error text-sm text-center">
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Botão Entrar */}
              <TouchableOpacity
                className="bg-primary rounded-xl py-4 mt-4"
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <View className="flex-row items-center justify-center gap-2">
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text className="text-background text-center font-semibold text-base">
                      Entrando...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-background text-center font-semibold text-base">
                    Entrar
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Informação */}
            <View className="mt-8">
              <Text className="text-sm text-muted text-center">
                Seus dados serão salvos com segurança{"\n"}
                e você não precisará fazer login novamente
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
