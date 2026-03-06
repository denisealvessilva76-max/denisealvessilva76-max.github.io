import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveToFirebase } from "@/lib/firebase";
import * as Haptics from "expo-haptics";

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

  const handleCadastro = async () => {
    console.log("[Cadastro] Iniciando cadastro...");

    // Validação
    if (!nome || !matricula || !turno || !altura || !peso || !tipoTrabalho || !funcao) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    const alturaNum = parseFloat(altura);
    const pesoNum = parseFloat(peso);

    if (isNaN(alturaNum) || isNaN(pesoNum)) {
      Alert.alert("Erro", "Altura e peso devem ser números válidos");
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        matricula,
        name: nome,
        position: funcao,
        turno: turno as "diurno" | "noturno",
        height: alturaNum,
        weight: pesoNum,
        workType: tipoTrabalho as "leve" | "moderado" | "pesado",
        createdAt: new Date().toISOString(),
      };

      console.log("[Cadastro] Salvando perfil localmente...", profileData);

      // 1. Salvar perfil completo no AsyncStorage
      await AsyncStorage.setItem(
        `employee:profile:${matricula}`,
        JSON.stringify(profileData)
      );
      await AsyncStorage.setItem("employee:matricula", matricula);
      await AsyncStorage.setItem("employee:name", nome);
      await AsyncStorage.setItem("employee:turno", turno);
      await AsyncStorage.setItem("employee:altura", altura);
      await AsyncStorage.setItem("employee:peso", peso);
      await AsyncStorage.setItem("employee:tipoTrabalho", tipoTrabalho);
      await AsyncStorage.setItem("employee:funcao", funcao);
      await AsyncStorage.setItem("registration:completed", "true");

      console.log("[Cadastro] Perfil salvo localmente com sucesso");

      // 2. Sincronizar com Firebase em background (não bloqueia o cadastro)
      saveToFirebase(matricula, "profile", profileData)
        .then(() => console.log("[Cadastro] Perfil sincronizado com Firebase"))
        .catch((err) => console.warn("[Cadastro] Firebase sync falhou (não crítico):", err));

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // No web, Alert.alert não funciona bem — redirecionar diretamente
      if (Platform.OS === "web") {
        router.replace("/login");
      } else {
        Alert.alert(
          "Cadastro Realizado!",
          `Bem-vindo(a), ${nome}! Agora faça login para continuar.`,
          [
            {
              text: "Fazer Login",
              onPress: () => router.replace("/login"),
            },
          ]
        );
      }
    } catch (error) {
      console.error("[Cadastro] ERRO ao cadastrar:", error);
      Alert.alert(
        "Erro ao Cadastrar",
        error instanceof Error
          ? error.message
          : "Erro desconhecido. Tente novamente."
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
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
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: turno === "diurno" ? "#0a7ea4" : "#f5f5f5",
                    borderColor: turno === "diurno" ? "#0a7ea4" : "#E5E7EB",
                  }}
                  onPress={() => setTurno("diurno")}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      fontWeight: "600",
                      color: turno === "diurno" ? "#fff" : "#11181C",
                    }}
                  >
                    Diurno
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      textAlign: "center",
                      marginTop: 4,
                      color: turno === "diurno" ? "#fff" : "#687076",
                    }}
                  >
                    7:30 - 17:30
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: turno === "noturno" ? "#0a7ea4" : "#f5f5f5",
                    borderColor: turno === "noturno" ? "#0a7ea4" : "#E5E7EB",
                  }}
                  onPress={() => setTurno("noturno")}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      fontWeight: "600",
                      color: turno === "noturno" ? "#fff" : "#11181C",
                    }}
                  >
                    Noturno
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      textAlign: "center",
                      marginTop: 4,
                      color: turno === "noturno" ? "#fff" : "#687076",
                    }}
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
                {(["leve", "moderado", "pesado"] as const).map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 12,
                      backgroundColor: tipoTrabalho === tipo ? "#0a7ea4" : "#f5f5f5",
                      borderColor: tipoTrabalho === tipo ? "#0a7ea4" : "#E5E7EB",
                    }}
                    onPress={() => setTipoTrabalho(tipo)}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontWeight: "600",
                        textTransform: "capitalize",
                        color: tipoTrabalho === tipo ? "#fff" : "#11181C",
                      }}
                    >
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
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
              style={{
                backgroundColor: loading ? "#9BA1A6" : "#0a7ea4",
                borderRadius: 8,
                paddingHorizontal: 24,
                paddingVertical: 16,
                marginTop: 16,
              }}
              onPress={handleCadastro}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "600",
                    fontSize: 18,
                  }}
                >
                  Cadastrar
                </Text>
              )}
            </TouchableOpacity>

            {/* Link para Login */}
            <TouchableOpacity
              style={{ marginTop: 16 }}
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
