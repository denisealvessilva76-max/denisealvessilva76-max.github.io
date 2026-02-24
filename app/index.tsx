import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Tela inicial que redireciona o usuário para:
 * - /cadastro: se nunca fez cadastro
 * - /login: se já fez cadastro mas não está logado
 * - /(tabs): se já está logado
 */
export default function IndexScreen() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Verificar se já fez cadastro
      const registrationCompleted = await AsyncStorage.getItem(
        "registration:completed"
      );

      // Verificar se está logado
      const matricula = await AsyncStorage.getItem("employee:matricula");

      if (!registrationCompleted) {
        // Nunca fez cadastro → ir para tela de cadastro
        router.replace("/cadastro");
      } else if (!matricula) {
        // Já fez cadastro mas não está logado → ir para login
        router.replace("/login");
      } else {
        // Já está logado → ir para home
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Erro ao verificar status de autenticação:", error);
      // Em caso de erro, ir para cadastro (seguro)
      router.replace("/cadastro");
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text className="text-muted mt-4">Carregando...</Text>
      </View>
    );
  }

  return null;
}
