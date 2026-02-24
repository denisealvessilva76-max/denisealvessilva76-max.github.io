import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

/**
 * Tela inicial que redireciona o usuário para:
 * - /cadastro: se não existe usuário no PostgreSQL
 * - /login: se existe usuário mas não está logado localmente
 * - /(tabs): se está logado
 * 
 * IMPORTANTE: Verifica no banco de dados, não apenas no AsyncStorage
 */
export default function IndexScreen() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // 1. Verificar se há matrícula salva localmente (usuário logado)
      const matricula = await AsyncStorage.getItem("employee:matricula");
      const nome = await AsyncStorage.getItem("employee:name");

      if (matricula && nome) {
        // Usuário está logado localmente, verificar se existe no banco
        try {
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"}/api/trpc/employeeProfile.checkMatricula?input=${encodeURIComponent(JSON.stringify({ matricula }))}`
          );
          const data = await response.json();
          
          if (data.result?.data?.exists) {
            // Usuário existe no banco E está logado → ir para home
            console.log("[Index] Usuário logado e existe no banco → redirecionando para home");
            router.replace("/(tabs)");
            return;
          } else {
            // Usuário logado localmente mas não existe no banco → limpar e ir para cadastro
            console.log("[Index] Usuário local não existe no banco → limpando e indo para cadastro");
            await AsyncStorage.clear();
            router.replace("/cadastro");
            return;
          }
        } catch (error) {
          console.error("[Index] Erro ao verificar usuário no banco:", error);
          // Em caso de erro de rede, confiar no login local
          router.replace("/(tabs)");
          return;
        }
      }

      // 2. Não está logado localmente, verificar se já fez cadastro alguma vez
      const registrationCompleted = await AsyncStorage.getItem("registration:completed");
      
      if (registrationCompleted) {
        // Já fez cadastro mas não está logado → ir para login
        console.log("[Index] Cadastro completado mas não logado → redirecionando para login");
        router.replace("/login");
      } else {
        // Nunca fez cadastro → ir para tela de cadastro
        console.log("[Index] Nenhum cadastro encontrado → redirecionando para cadastro");
        router.replace("/cadastro");
      }
    } catch (error) {
      console.error("[Index] Erro ao verificar status de autenticação:", error);
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
