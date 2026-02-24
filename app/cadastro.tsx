import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function CadastroScreen() {
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [turno, setTurno] = useState<"diurno" | "noturno" | "">("");
  const [altura, setAltura] = useState("");
  const [peso, setPeso] = useState("");
  const [tipoTrabalho, setTipoTrabalho] = useState<
    "leve" | "moderado" | "pesado" | ""
  >("");
  const [funcao, setFuncao] = useState("");
  const [loading, setLoading] = useState(false);

  const cadastrarMutation = trpc.employeeProfile.saveProfile.useMutation();

  const handleCadastro = async () => {
    // Validação
    if (
      !nome ||
      !matricula ||
      !turno ||
      !altura ||
      !peso ||
      !tipoTrabalho ||
      !funcao
    ) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      // Salvar no PostgreSQL
      const result = await cadastrarMutation.mutateAsync({
        matricula,
        name: nome,
        position: funcao,
        cpf: "", // CPF não é obrigatório
      });

      if (result.success) {
        // Salvar dados adicionais no AsyncStorage
        await AsyncStorage.setItem("employee:matricula", matricula);
        await AsyncStorage.setItem("employee:name", nome);
        await AsyncStorage.setItem("employee:turno", turno);
        await AsyncStorage.setItem("employee:altura", altura);
        await AsyncStorage.setItem("employee:peso", peso);
        await AsyncStorage.setItem("employee:tipoTrabalho", tipoTrabalho);
        await AsyncStorage.setItem("employee:funcao", funcao);
        await AsyncStorage.setItem("registration:completed", "true");

        Alert.alert(
          "Sucesso!",
          "Cadastro realizado com sucesso! Agora faça login.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/login"),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      Alert.alert(
        "Erro",
        error instanceof Error ? error.message : "Erro ao cadastrar"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 p-6">
          {/* Header */}
          <View className="items-center mb-8 mt-4">
            <Text className="text-3xl font-bold text-foreground mb-2">
              Cadastre-se
            </Text>
            <Text className="text-lg text-foreground">Canteiro Saudável</Text>
            <Text className="text-sm text-muted mt-2 text-center">
              Preencha seus dados para começar a usar o app
            </Text>
          </View>

          {/* Formulário */}
          <View className="gap-4">
            {/* Nome */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Nome Completo *
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholder="Digite seu nome completo"
                placeholderTextColor="#9BA1A6"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
              />
            </View>

            {/* Matrícula */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Matrícula *
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholder="Digite sua matrícula"
                placeholderTextColor="#9BA1A6"
                value={matricula}
                onChangeText={setMatricula}
                keyboardType="numeric"
              />
            </View>

            {/* Turno */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Turno *
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className={`flex-1 border rounded-lg px-4 py-3 ${
                    turno === "diurno"
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setTurno("diurno")}
                >
                  <Text
                    className={`text-center font-medium ${
                      turno === "diurno" ? "text-white" : "text-foreground"
                    }`}
                  >
                    Diurno
                  </Text>
                  <Text
                    className={`text-xs text-center mt-1 ${
                      turno === "diurno" ? "text-white" : "text-muted"
                    }`}
                  >
                    7:30 - 17:30
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 border rounded-lg px-4 py-3 ${
                    turno === "noturno"
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setTurno("noturno")}
                >
                  <Text
                    className={`text-center font-medium ${
                      turno === "noturno" ? "text-white" : "text-foreground"
                    }`}
                  >
                    Noturno
                  </Text>
                  <Text
                    className={`text-xs text-center mt-1 ${
                      turno === "noturno" ? "text-white" : "text-muted"
                    }`}
                  >
                    17:30 - 3:30
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Altura e Peso */}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Altura (cm) *
                </Text>
                <TextInput
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                  placeholder="Ex: 175"
                  placeholderTextColor="#9BA1A6"
                  value={altura}
                  onChangeText={setAltura}
                  keyboardType="numeric"
                />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Peso (kg) *
                </Text>
                <TextInput
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                  placeholder="Ex: 70"
                  placeholderTextColor="#9BA1A6"
                  value={peso}
                  onChangeText={setPeso}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Tipo de Trabalho */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Tipo de Trabalho *
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className={`flex-1 border rounded-lg px-4 py-3 ${
                    tipoTrabalho === "leve"
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setTipoTrabalho("leve")}
                >
                  <Text
                    className={`text-center font-medium ${
                      tipoTrabalho === "leve" ? "text-white" : "text-foreground"
                    }`}
                  >
                    Leve
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 border rounded-lg px-4 py-3 ${
                    tipoTrabalho === "moderado"
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setTipoTrabalho("moderado")}
                >
                  <Text
                    className={`text-center font-medium ${
                      tipoTrabalho === "moderado"
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    Moderado
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 border rounded-lg px-4 py-3 ${
                    tipoTrabalho === "pesado"
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setTipoTrabalho("pesado")}
                >
                  <Text
                    className={`text-center font-medium ${
                      tipoTrabalho === "pesado"
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    Pesado
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Função */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Função/Cargo *
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholder="Ex: Pedreiro, Eletricista, etc."
                placeholderTextColor="#9BA1A6"
                value={funcao}
                onChangeText={setFuncao}
                autoCapitalize="words"
              />
            </View>

            {/* Botão Cadastrar */}
            <TouchableOpacity
              className="bg-primary rounded-lg px-6 py-4 mt-4"
              onPress={handleCadastro}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Cadastrar
                </Text>
              )}
            </TouchableOpacity>

            {/* Link para Login */}
            <TouchableOpacity
              className="mt-4"
              onPress={() => router.push("/login")}
            >
              <Text className="text-primary text-center">
                Já tem cadastro? Faça login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
