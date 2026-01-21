import { ScrollView, Text, View, Pressable, ActivityIndicator, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useCallback } from "react";
import { useColors } from "@/hooks/use-colors";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";

interface DashboardData {
  totalEmployees: number;
  totalCheckIns: number;
  averagePressure: {
    systolic: number;
    diastolic: number;
  };
  wellnessDistribution: {
    good: number;
    mild: number;
    severe: number;
  };
  atRiskEmployees: number;
  referralsThisWeek: number;
  medalsBadges: number;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const token = await SecureStore.getItemAsync("admin_token");
      const storedEmail = await SecureStore.getItemAsync("admin_email");

      if (!token || !storedEmail) {
        router.push("/admin-login");
        return;
      }

      setEmail(storedEmail);

      const response = await fetch("http://127.0.0.1:3000/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/admin-login");
          return;
        }
        throw new Error("Erro ao carregar dados");
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Erro ao carregar dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja realmente sair?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Sair",
        onPress: async () => {
          await SecureStore.deleteItemAsync("admin_token");
          await SecureStore.deleteItemAsync("admin_email");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.push("/admin-login");
        },
        style: "destructive",
      },
    ]);
  };

  if (isLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-foreground mt-4">Carregando dados...</Text>
      </ScreenContainer>
    );
  }

  if (!data) {
    return (
      <ScreenContainer className="p-4 justify-center items-center gap-4">
        <Text className="text-foreground text-lg">Erro ao carregar dados</Text>
        <Pressable
          onPress={loadDashboardData}
          style={({ pressed }) => [
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.7 : 1,
              padding: 12,
              borderRadius: 8,
            },
          ]}
        >
          <Text className="text-background font-semibold">Tentar Novamente</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-6">
          {/* Header */}
          <View className="gap-2">
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-3xl font-bold text-foreground">📊 Dashboard SESMT</Text>
                <Text className="text-sm text-muted">{email}</Text>
              </View>
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.7 : 1,
                    padding: 8,
                  },
                ]}
              >
                <Text className="text-2xl">🚪</Text>
              </Pressable>
            </View>
          </View>

          {/* Métricas Principais */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Visão Geral</Text>

            {/* Grid de Métricas */}
            <View className="gap-3">
              {/* Total de Empregados */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text className="text-sm text-muted">Total de Empregados</Text>
                  <Text className="text-3xl font-bold text-foreground">
                    {data.totalEmployees}
                  </Text>
                </View>
                <Text className="text-4xl">👥</Text>
              </View>

              {/* Check-ins */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text className="text-sm text-muted">Check-ins Realizados</Text>
                  <Text className="text-3xl font-bold text-foreground">
                    {data.totalCheckIns}
                  </Text>
                </View>
                <Text className="text-4xl">✅</Text>
              </View>

              {/* Empregados em Risco */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text className="text-sm text-muted">Empregados em Risco</Text>
                  <Text className="text-3xl font-bold text-error">
                    {data.atRiskEmployees}
                  </Text>
                </View>
                <Text className="text-4xl">⚠️</Text>
              </View>

              {/* Encaminhamentos */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text className="text-sm text-muted">Encaminhamentos (Esta Semana)</Text>
                  <Text className="text-3xl font-bold text-warning">
                    {data.referralsThisWeek}
                  </Text>
                </View>
                <Text className="text-4xl">📋</Text>
              </View>
            </View>
          </View>

          {/* Pressão Arterial */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Pressão Arterial Média</Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-sm text-muted">Sistólica</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {Math.round(data.averagePressure.systolic)} mmHg
                  </Text>
                </View>
                <Text className="text-3xl">/</Text>
                <View className="flex-1 items-flex-end">
                  <Text className="text-sm text-muted">Diastólica</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {Math.round(data.averagePressure.diastolic)} mmHg
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Distribuição de Bem-estar */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Distribuição de Bem-estar</Text>

            {/* Tudo Bem */}
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-foreground">😊 Tudo Bem</Text>
                <Text className="text-sm font-semibold text-success">
                  {data.wellnessDistribution.good}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.border,
                  borderRadius: 8,
                  height: 8,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.success,
                    width: `${
                      (data.wellnessDistribution.good /
                        (data.wellnessDistribution.good +
                          data.wellnessDistribution.mild +
                          data.wellnessDistribution.severe)) *
                      100
                    }%`,
                    height: "100%",
                  }}
                />
              </View>
            </View>

            {/* Dor Leve */}
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-foreground">😐 Dor Leve</Text>
                <Text className="text-sm font-semibold text-warning">
                  {data.wellnessDistribution.mild}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.border,
                  borderRadius: 8,
                  height: 8,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.warning,
                    width: `${
                      (data.wellnessDistribution.mild /
                        (data.wellnessDistribution.good +
                          data.wellnessDistribution.mild +
                          data.wellnessDistribution.severe)) *
                      100
                    }%`,
                    height: "100%",
                  }}
                />
              </View>
            </View>

            {/* Dor Forte */}
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-foreground">😢 Dor Forte</Text>
                <Text className="text-sm font-semibold text-error">
                  {data.wellnessDistribution.severe}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.border,
                  borderRadius: 8,
                  height: 8,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.error,
                    width: `${
                      (data.wellnessDistribution.severe /
                        (data.wellnessDistribution.good +
                          data.wellnessDistribution.mild +
                          data.wellnessDistribution.severe)) *
                      100
                    }%`,
                    height: "100%",
                  }}
                />
              </View>
            </View>
          </View>

          {/* Botões de Ação */}
          <View className="gap-3">
            <Pressable
              onPress={() =>
                Alert.alert("Em Breve", "Tela de encaminhamentos em desenvolvimento")
              }
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.7 : 1,
                  padding: 14,
                  borderRadius: 8,
                },
              ]}
            >
              <Text className="text-center text-background font-semibold">
                📋 Ver Encaminhamentos
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Alert.alert("Em Breve", "Tela de empregados em risco em desenvolvimento")
              }
              style={({ pressed }) => [
                {
                  backgroundColor: colors.error,
                  opacity: pressed ? 0.7 : 1,
                  padding: 14,
                  borderRadius: 8,
                },
              ]}
            >
              <Text className="text-center text-background font-semibold">
                ⚠️ Empregados em Risco
              </Text>
            </Pressable>

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  opacity: pressed ? 0.7 : 1,
                  padding: 14,
                  borderRadius: 8,
                },
              ]}
            >
              <Text className="text-center text-foreground font-semibold">🚪 Sair</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
