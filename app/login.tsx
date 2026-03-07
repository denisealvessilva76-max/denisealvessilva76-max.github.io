import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveToFirebase } from "@/lib/firebase";

type Turno = "diurno" | "noturno";

export default function LoginScreen() {
  const { login } = useAuth();
  const [matricula, setMatricula] = useState("");
  const [nome, setNome] = useState("");
  const [turno, setTurno] = useState<Turno>("diurno");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!matricula.trim() || !nome.trim()) {
      setError("Por favor, preencha todos os campos");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

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
      await login(matricula, nome);
      console.log("[LOGIN] Login completed successfully");

      // Salvar matrícula e turno nas chaves usadas pelos hooks de sincronização Firebase
      await AsyncStorage.setItem("employee:matricula", matricula.trim());
      await AsyncStorage.setItem("employee:turno", turno);

      // Salvar perfil básico com turno
      const existingProfileRaw = await AsyncStorage.getItem("employee:profile");
      const existingProfile = existingProfileRaw ? JSON.parse(existingProfileRaw) : null;
      const basicProfile = {
        ...(existingProfile || {}),
        matricula: matricula.trim(),
        name: nome.trim(),
        turno,
        position: existingProfile?.position || "",
        cpf: existingProfile?.cpf || "",
      };
      await AsyncStorage.setItem("employee:profile", JSON.stringify(basicProfile));

      // Sincronizar perfil com Firebase (inclui turno)
      try {
        await saveToFirebase(matricula.trim(), "profile", {
          name: nome.trim(),
          matricula: matricula.trim(),
          turno,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("[LOGIN] Firebase sync failed:", e);
      }

      // Sincronizar cadastro com banco PostgreSQL (imediato)
      try {
        const profileRaw = await AsyncStorage.getItem("employee:profile");
        const profile = profileRaw ? JSON.parse(profileRaw) : {};
        const apiUrl = typeof window !== "undefined" && window.location?.hostname
          ? `${window.location.protocol}//${window.location.hostname.replace(/^\d{4}-/, "3000-")}/api/painel/register-employee`
          : "/api/painel/register-employee";
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matricula: matricula.trim(),
            name: nome.trim(),
            turno,
            weight: profile.weight ? parseInt(profile.weight) : null,
            height: profile.height ? parseInt(profile.height) : null,
            workType: profile.workType || "moderado",
            position: profile.position || "",
            department: profile.department || "",
          }),
        });
        const result = await response.json();
        console.log("[LOGIN] PostgreSQL sync:", result.action, result.message);
      } catch (e) {
        console.warn("[LOGIN] PostgreSQL sync failed (offline?):", e);
        // Não bloquear login se API estiver offline
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const onboardingCompleted = await AsyncStorage.getItem("onboarding:completed");
      if (!onboardingCompleted) {
        router.replace("/onboarding");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err) {
      console.error("[LOGIN] Login failed:", err);
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
            <View className="items-center mb-10">
              <Text
                className="text-3xl font-bold text-primary mb-2 text-center px-4"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
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

              {/* Seleção de Turno */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Turno de Trabalho
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setTurno("diurno");
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    disabled={loading}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: turno === "diurno" ? "#0a7ea4" : "#E5E7EB",
                      backgroundColor: turno === "diurno" ? "#E6F4FE" : "#F5F5F5",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 22, marginBottom: 4 }}>☀️</Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: turno === "diurno" ? "#0a7ea4" : "#687076",
                      }}
                    >
                      Diurno
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: turno === "diurno" ? "#0a7ea4" : "#9BA1A6",
                        marginTop: 2,
                      }}
                    >
                      7h30 – 17h30
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setTurno("noturno");
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    disabled={loading}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: turno === "noturno" ? "#0a7ea4" : "#E5E7EB",
                      backgroundColor: turno === "noturno" ? "#E6F4FE" : "#F5F5F5",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 22, marginBottom: 4 }}>🌙</Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: turno === "noturno" ? "#0a7ea4" : "#687076",
                      }}
                    >
                      Noturno
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: turno === "noturno" ? "#0a7ea4" : "#9BA1A6",
                        marginTop: 2,
                      }}
                    >
                      17h30 – 3h30
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mensagem de Erro */}
              {error ? (
                <View className="bg-error/10 border border-error rounded-xl px-4 py-3">
                  <Text className="text-error text-sm text-center">{error}</Text>
                </View>
              ) : null}

              {/* Botão Entrar */}
              <TouchableOpacity
                className="bg-primary rounded-xl py-4 mt-2"
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
                Seus dados serão salvos com segurança{"\n"}e você não precisará
                fazer login novamente
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
