import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import * as Haptics from "expo-haptics";

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
      // Fazer login (salva no localStorage/SecureStore)
      await login(matricula, nome);
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Redirecionar para home
      router.replace("/(tabs)");
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
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
              >
                <Text className="text-background text-center font-semibold text-base">
                  {loading ? "Entrando..." : "Entrar"}
                </Text>
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
