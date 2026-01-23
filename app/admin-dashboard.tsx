import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useCallback } from "react";
import { useColors } from "@/hooks/use-colors";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";

interface AnalyticsData {
  period: string;
  summary: {
    totalReferrals: number;
    resolvedReferrals: number;
    pendingReferrals: number;
    uniqueWorkers: number;
    absenteeismRate: number;
  };
  charts: {
    topComplaints: { x: number; y: number; label: string }[];
    emotionalDistribution: { x: number; y: number; label: string }[];
    checkInTimeSeries: { x: number; y: number; label: string }[];
    ergonomicRiskData: { x: number; y: number; label: string }[];
  };
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");
  const [email, setEmail] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadAnalyticsData();
    }, [period])
  );

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);

      const token = await SecureStore.getItemAsync("admin_token");
      const storedEmail = await SecureStore.getItemAsync("admin_email");

      if (!token || !storedEmail) {
        router.push("/admin-login");
        return;
      }

      setEmail(storedEmail);

      const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://3000-i84jlsmq8t12oldkdpl95-0fe92ffe.us2.manus.computer";
      const response = await fetch(`${API_URL}/api/admin/analytics?period=${period}`, {
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

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Erro ao carregar analytics");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalyticsData();
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("admin_token");
    await SecureStore.deleteItemAsync("admin_email");
    router.push("/admin-login");
  };

  if (isLoading && !data) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Carregando analytics...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View className="p-4 bg-primary">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-2xl font-bold text-white">Painel SESMT</Text>
              <Text className="text-sm text-white/80 mt-1">{email}</Text>
            </View>
            <TouchableOpacity
              className="bg-white/20 px-4 py-2 rounded-lg"
              onPress={handleLogout}
            >
              <Text className="text-white font-semibold">Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtros de Período */}
        <View className="p-4 bg-surface border-b border-border">
          <Text className="text-sm font-semibold text-foreground mb-2">Período</Text>
          <View className="flex-row gap-2">
            {[
              { key: "week", label: "Última Semana" },
              { key: "month", label: "Último Mês" },
              { key: "quarter", label: "Últimos 3 Meses" },
            ].map((p) => (
              <TouchableOpacity
                key={p.key}
                className={`flex-1 py-2 px-3 rounded-lg border ${
                  period === p.key
                    ? "bg-primary border-primary"
                    : "bg-background border-border"
                }`}
                onPress={() => setPeriod(p.key as any)}
              >
                <Text
                  className={`text-center text-sm font-semibold ${
                    period === p.key ? "text-white" : "text-foreground"
                  }`}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {data && (
          <View className="p-4 gap-4">
            {/* Indicadores Resumo */}
            <View className="gap-3">
              <Text className="text-xl font-bold text-foreground">Indicadores Gerais</Text>
              
              <View className="flex-row gap-3">
                <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-3xl font-bold text-primary">
                    {data.summary.absenteeismRate}%
                  </Text>
                  <Text className="text-sm text-muted mt-1">Taxa de Absenteísmo</Text>
                </View>
                
                <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-3xl font-bold text-foreground">
                    {data.summary.uniqueWorkers}
                  </Text>
                  <Text className="text-sm text-muted mt-1">Trabalhadores</Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-3xl font-bold text-success">
                    {data.summary.resolvedReferrals}
                  </Text>
                  <Text className="text-sm text-muted mt-1">Resolvidos</Text>
                </View>
                
                <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-3xl font-bold text-warning">
                    {data.summary.pendingReferrals}
                  </Text>
                  <Text className="text-sm text-muted mt-1">Pendentes</Text>
                </View>
              </View>
            </View>

            {/* Gráficos */}
            <View className="gap-4 mt-4">
              <Text className="text-xl font-bold text-foreground">Análises Detalhadas</Text>

              {/* Tendência de Check-ins */}
              {data.charts.checkInTimeSeries.length > 0 && (
                <LineChart
                  data={data.charts.checkInTimeSeries}
                  title="Tendência de Check-ins"
                  yLabel="Número de check-ins por dia"
                  color={colors.primary}
                />
              )}

              {/* Queixas Mais Comuns */}
              {data.charts.topComplaints.length > 0 && (
                <BarChart
                  data={data.charts.topComplaints}
                  title="Queixas Mais Comuns"
                  yLabel="Número de ocorrências"
                  color="#F59E0B"
                />
              )}

              {/* Estados Emocionais */}
              {data.charts.emotionalDistribution.length > 0 && (
                <BarChart
                  data={data.charts.emotionalDistribution}
                  title="Estados Emocionais"
                  yLabel="Número de relatos"
                  color="#8B5CF6"
                />
              )}

              {/* Riscos Ergonômicos */}
              {data.charts.ergonomicRiskData.length > 0 && (
                <BarChart
                  data={data.charts.ergonomicRiskData}
                  title="Riscos Ergonômicos Relatados"
                  yLabel="Número de relatos"
                  color="#EF4444"
                />
              )}
            </View>

            {/* Ações */}
            <View className="gap-3 mt-4">
              <Text className="text-xl font-bold text-foreground">Ações</Text>
              
              <TouchableOpacity
                className="bg-green-500 rounded-xl p-4"
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (data) {
                    try {
                      const { generateHealthReport } = await import("@/lib/generate-health-report");
                      await generateHealthReport(data, email);
                    } catch (error) {
                      console.error("Erro ao exportar:", error);
                      Alert.alert("Erro", "Falha ao gerar relatório PDF");
                    }
                  }
                }}
              >
                <Text className="text-center font-semibold text-white">
                  📊 Exportar Relatório PDF
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-blue-500 rounded-xl p-4"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert(
                    "Enviar por Email",
                    "Relatório será enviado para denise.silva@mip.com.br"
                  );
                }}
              >
                <Text className="text-center font-semibold text-white">
                  📧 Enviar Relatório por Email
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-purple-500 rounded-xl p-4"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/admin-feedbacks");
                }}
              >
                <Text className="text-center font-semibold text-white">
                  💬 Ver Feedbacks dos Usuários
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
