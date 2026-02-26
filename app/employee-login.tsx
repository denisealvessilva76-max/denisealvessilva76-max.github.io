import { View, Text, TextInput, Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

export default function EmployeeLoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { login } = useAuth();
  const [cpf, setCpf] = useState("");
  const [matricula, setMatricula] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatCPF = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return cpf;
  };

  const loginMutation = trpc.employeeAuth.login.useMutation();

  const handleLogin = async () => {
    if (!cpf || !matricula) {
      Alert.alert("Erro", "Por favor, preencha CPF e matrícula");
      return;
    }

    setIsLoading(true);

    try {
      const cleanCPF = cpf.replace(/\D/g, "");
      
      const result = await loginMutation.mutateAsync({
        cpf: cleanCPF,
        matricula: matricula.trim(),
      });

      if (result.success && result.employee) {
        await login({
          id: String(result.employee.id),
          name: result.employee.nome,
          cpf: result.employee.cpf || '',
          matricula: result.employee.matricula,
          setor: result.employee.setor || undefined,
          cargo: result.employee.cargo || undefined,
        });

        router.replace("/(tabs)");
      } else {
        Alert.alert("Erro", result.error || "CPF ou matrícula inválidos");
      }
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      Alert.alert("Erro", error.message || "Não foi possível fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="flex-1 justify-center p-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center"
      >
        <View className="bg-surface p-6 rounded-2xl">
          <Text className="text-foreground text-3xl font-bold mb-2 text-center">Canteiro Saudável</Text>
          <Text className="text-muted text-center mb-8">Entre com seu CPF e matrícula</Text>

          <View className="gap-4">
            <View>
              <Text className="text-foreground font-semibold mb-2">CPF</Text>
              <TextInput
                value={cpf}
                onChangeText={(text) => setCpf(formatCPF(text))}
                placeholder="000.000.000-00"
                keyboardType="numeric"
                maxLength={14}
                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View>
              <Text className="text-foreground font-semibold mb-2">Matrícula</Text>
              <TextInput
                value={matricula}
                onChangeText={setMatricula}
                placeholder="Digite sua matrícula"
                autoCapitalize="characters"
                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor={colors.muted}
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`bg-primary py-4 rounded-lg mt-4 ${isLoading ? "opacity-50" : ""}`}
            >
              <Text className="text-background text-center font-bold text-lg">
                {isLoading ? "Entrando..." : "Entrar"}
              </Text>
            </TouchableOpacity>

            <Text className="text-muted text-xs text-center mt-4">
              Seu login ficará salvo automaticamente
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
