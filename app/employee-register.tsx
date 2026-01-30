import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";

type WorkType = "leve" | "moderado" | "pesado";

export default function EmployeeRegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [matricula, setMatricula] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [setor, setSetor] = useState("");
  const [cargo, setCargo] = useState("");
  const [workType, setWorkType] = useState<WorkType>("moderado");

  const registerMutation = trpc.employeeAuth.register.useMutation();

  const validateCPF = (cpf: string): boolean => {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, "");
    
    // CPF deve ter 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // CPFs inválidos conhecidos
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    return true;
  };

  const formatCPF = (value: string): string => {
    const clean = value.replace(/\D/g, "");
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(9, 11)}`;
  };

  const handleRegister = async () => {
    // Validações
    if (!name.trim()) {
      Alert.alert("Erro", "Por favor, insira seu nome completo");
      return;
    }

    if (!validateCPF(cpf)) {
      Alert.alert("Erro", "CPF inválido. Insira um CPF válido com 11 dígitos");
      return;
    }

    if (!matricula.trim() || matricula.length < 3) {
      Alert.alert("Erro", "Por favor, insira uma matrícula válida (mínimo 3 caracteres)");
      return;
    }

    const weightNum = parseFloat(weight);
    if (!weightNum || weightNum < 40 || weightNum > 200) {
      Alert.alert("Erro", "Por favor, insira um peso válido (40-200 kg)");
      return;
    }

    const heightNum = parseFloat(height);
    if (!heightNum || heightNum < 140 || heightNum > 220) {
      Alert.alert("Erro", "Por favor, insira uma altura válida (140-220 cm)");
      return;
    }

    if (!setor.trim()) {
      Alert.alert("Erro", "Por favor, insira seu setor");
      return;
    }

    if (!cargo.trim()) {
      Alert.alert("Erro", "Por favor, insira seu cargo");
      return;
    }

    setIsLoading(true);

    try {
      const cleanCPF = cpf.replace(/\D/g, "");
      
      const result = await registerMutation.mutateAsync({
        name: name.trim(),
        cpf: cleanCPF,
        matricula: matricula.trim(),
        weight: weightNum,
        height: heightNum,
        setor: setor.trim(),
        cargo: cargo.trim(),
        workType,
      });

      if (result.success && result.employee) {
        // Fazer login automático
        await login({
          id: String(result.employee.id),
          name: result.employee.name,
          cpf: result.employee.cpf,
          matricula: result.employee.matricula,
          setor: result.employee.setor,
          cargo: result.employee.cargo,
        });

        Alert.alert(
          "Cadastro Concluído!",
          `Bem-vindo(a), ${result.employee.name}! Seu cadastro foi realizado com sucesso.`,
          [
            {
              text: "Começar",
              onPress: () => router.replace("/(tabs)"),
            },
          ]
        );
      } else {
        Alert.alert("Erro", result.message || "Não foi possível completar o cadastro");
      }
    } catch (error: any) {
      console.error("Erro ao cadastrar:", error);
      Alert.alert("Erro", error.message || "Não foi possível completar o cadastro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const getWorkTypeLabel = (type: WorkType) => {
    const labels = {
      leve: "Leve (Escritório)",
      moderado: "Moderado",
      pesado: "Pesado (Canteiro)",
    };
    return labels[type];
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">👷 Bem-vindo!</Text>
            <Text className="text-base text-muted">
              Complete seu cadastro para começar a usar o Canteiro Saudável
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            {/* Nome Completo */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Nome Completo *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ex: João da Silva"
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.foreground,
                }}
              />
            </View>

            {/* CPF */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">CPF *</Text>
              <TextInput
                value={cpf}
                onChangeText={(text) => setCpf(formatCPF(text))}
                placeholder="000.000.000-00"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                maxLength={14}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.foreground,
                }}
              />
            </View>

            {/* Matrícula */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Matrícula *</Text>
              <TextInput
                value={matricula}
                onChangeText={setMatricula}
                placeholder="Ex: 12345"
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.foreground,
                }}
              />
            </View>

            {/* Peso e Altura */}
            <View className="flex-row gap-4">
              <View className="flex-1 gap-2">
                <Text className="text-sm font-semibold text-foreground">Peso (kg) *</Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Ex: 75"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                />
              </View>
              <View className="flex-1 gap-2">
                <Text className="text-sm font-semibold text-foreground">Altura (cm) *</Text>
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  placeholder="Ex: 175"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                />
              </View>
            </View>

            {/* Setor */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Setor *</Text>
              <TextInput
                value={setor}
                onChangeText={setSetor}
                placeholder="Ex: Construção Civil"
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.foreground,
                }}
              />
            </View>

            {/* Cargo */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Cargo *</Text>
              <TextInput
                value={cargo}
                onChangeText={setCargo}
                placeholder="Ex: Pedreiro"
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.foreground,
                }}
              />
            </View>

            {/* Tipo de Trabalho */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Tipo de Trabalho *</Text>
              <View className="gap-2">
                {(["leve", "moderado", "pesado"] as WorkType[]).map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setWorkType(type)}
                    style={{
                      backgroundColor: workType === type ? colors.primary : colors.surface,
                      borderColor: workType === type ? colors.primary : colors.border,
                      borderWidth: 2,
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: workType === type ? "#FFFFFF" : colors.foreground,
                        fontWeight: "600",
                      }}
                    >
                      {getWorkTypeLabel(type)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Botão de Cadastro */}
          <Pressable
            onPress={handleRegister}
            disabled={isLoading}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                opacity: pressed || isLoading ? 0.7 : 1,
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-background font-bold text-lg">Completar Cadastro</Text>
            )}
          </Pressable>

          {/* Link para Login */}
          <Pressable onPress={() => router.push("/employee-login")}>
            <Text className="text-center text-sm text-muted">
              Já tem cadastro?{" "}
              <Text style={{ color: colors.primary, fontWeight: "600" }}>Fazer Login</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
