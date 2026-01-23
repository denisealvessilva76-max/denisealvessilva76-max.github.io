import { ScrollView, Text, View, Pressable, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface WorkerHydrationStats {
  workerId: string;
  totalDays: number;
  totalWater: number;
  avgWater: number;
  avgGoal: number;
  compliance: number;
  weight?: number;
  height?: number;
  workType?: string;
}

interface HydrationReport {
  month: string;
  year: string;
  startDate: string;
  endDate: string;
  summary: {
    totalWorkers: number;
    avgCompliance: number;
    workersAtRisk: number;
  };
  workers: WorkerHydrationStats[];
}

export default function AdminHydrationReportScreen() {
  const router = useRouter();
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<HydrationReport | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadReport();
  }, [selectedMonth, selectedYear]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      if (!token) {
        Alert.alert("Erro", "Você precisa estar autenticado");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/hydration/monthly-report?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar relatório");
      }

      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error("Erro ao carregar relatório:", error);
      Alert.alert("Erro", "Não foi possível carregar o relatório");
    } finally {
      setLoading(false);
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 80) return colors.success;
    if (compliance >= 50) return colors.warning;
    return colors.error;
  };

  const getWorkTypeLabel = (type?: string) => {
    if (!type) return "N/A";
    const labels: Record<string, string> = {
      leve: "Leve",
      moderado: "Moderado",
      pesado: "Pesado",
    };
    return labels[type] || type;
  };

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">💧 Relatório de Hidratação</Text>
            <Text className="text-base text-muted">Análise mensal de consumo de água dos trabalhadores</Text>
          </View>

          {/* Seletor de Mês/Ano */}
          <View className="bg-surface rounded-2xl p-4 gap-3">
            <Text className="text-base font-semibold text-foreground">Período</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => {
                  if (selectedMonth === 1) {
                    setSelectedMonth(12);
                    setSelectedYear(selectedYear - 1);
                  } else {
                    setSelectedMonth(selectedMonth - 1);
                  }
                }}
                style={{
                  backgroundColor: colors.primary,
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                }}
              >
                <Text className="text-center text-background font-semibold">← Mês Anterior</Text>
              </Pressable>
              <View
                style={{
                  backgroundColor: colors.background,
                  padding: 12,
                  borderRadius: 8,
                  flex: 2,
                  justifyContent: "center",
                }}
              >
                <Text className="text-center text-foreground font-bold">
                  {monthNames[selectedMonth - 1]} {selectedYear}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (selectedMonth === 12) {
                    setSelectedMonth(1);
                    setSelectedYear(selectedYear + 1);
                  } else {
                    setSelectedMonth(selectedMonth + 1);
                  }
                }}
                style={{
                  backgroundColor: colors.primary,
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                }}
                disabled={selectedMonth === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear()}
              >
                <Text className="text-center text-background font-semibold">Próximo Mês →</Text>
              </Pressable>
            </View>
          </View>

          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted mt-4">Carregando relatório...</Text>
            </View>
          ) : report ? (
            <>
              {/* Resumo Geral */}
              <View className="bg-surface rounded-2xl p-6 gap-4">
                <Text className="text-lg font-semibold text-foreground">Resumo Geral</Text>
                <View className="flex-row gap-4">
                  <View className="flex-1 bg-background rounded-lg p-3 items-center">
                    <Text className="text-2xl font-bold text-primary">{report.summary.totalWorkers}</Text>
                    <Text className="text-xs text-muted mt-1 text-center">Trabalhadores</Text>
                  </View>
                  <View className="flex-1 bg-background rounded-lg p-3 items-center">
                    <Text className="text-2xl font-bold text-success">{report.summary.avgCompliance}%</Text>
                    <Text className="text-xs text-muted mt-1 text-center">Compliance Médio</Text>
                  </View>
                  <View className="flex-1 bg-background rounded-lg p-3 items-center">
                    <Text className="text-2xl font-bold text-error">{report.summary.workersAtRisk}</Text>
                    <Text className="text-xs text-muted mt-1 text-center">Em Risco</Text>
                  </View>
                </View>
              </View>

              {/* Gráfico de Compliance */}
              <View className="bg-surface rounded-2xl p-6 gap-4">
                <Text className="text-lg font-semibold text-foreground">Distribuição de Compliance</Text>
                <View className="gap-2">
                  {[
                    { label: "Excelente (≥80%)", min: 80, color: colors.success },
                    { label: "Bom (50-79%)", min: 50, max: 79, color: colors.warning },
                    { label: "Risco (<50%)", max: 49, color: colors.error },
                  ].map((range) => {
                    const count = report.workers.filter((w) => {
                      if (range.min && range.max) return w.compliance >= range.min && w.compliance <= range.max;
                      if (range.min) return w.compliance >= range.min;
                      return w.compliance <= range.max!;
                    }).length;
                    const percentage = Math.round((count / report.summary.totalWorkers) * 100);

                    return (
                      <View key={range.label} className="gap-1">
                        <View className="flex-row justify-between">
                          <Text className="text-sm text-foreground">{range.label}</Text>
                          <Text className="text-sm font-semibold text-foreground">
                            {count} ({percentage}%)
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: colors.border,
                            borderRadius: 4,
                            height: 20,
                            overflow: "hidden",
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: range.color,
                              width: `${percentage}%`,
                              height: "100%",
                              borderRadius: 4,
                            }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Lista de Trabalhadores */}
              <View className="bg-surface rounded-2xl p-6 gap-4">
                <Text className="text-lg font-semibold text-foreground">
                  Trabalhadores ({report.workers.length})
                </Text>
                <Text className="text-xs text-muted">Ordenados por compliance (pior primeiro)</Text>
                <View className="gap-3">
                  {report.workers.map((worker, index) => (
                    <View
                      key={worker.workerId}
                      style={{
                        backgroundColor: colors.background,
                        borderLeftColor: getComplianceColor(worker.compliance),
                        borderLeftWidth: 4,
                      }}
                      className="p-4 rounded-lg gap-2"
                    >
                      <View className="flex-row justify-between items-center">
                        <Text className="text-base font-semibold text-foreground">
                          Trabalhador #{index + 1}
                        </Text>
                        <View
                          style={{
                            backgroundColor: getComplianceColor(worker.compliance) + "20",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: getComplianceColor(worker.compliance),
                              fontWeight: "600",
                              fontSize: 12,
                            }}
                          >
                            {worker.compliance}% compliance
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row gap-4">
                        <View className="flex-1">
                          <Text className="text-xs text-muted">Média Diária</Text>
                          <Text className="text-sm font-semibold text-foreground">{worker.avgWater}ml</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs text-muted">Meta</Text>
                          <Text className="text-sm font-semibold text-foreground">{worker.avgGoal}ml</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs text-muted">Dias Registrados</Text>
                          <Text className="text-sm font-semibold text-foreground">{worker.totalDays}</Text>
                        </View>
                      </View>

                      {worker.weight && worker.height && (
                        <View className="flex-row gap-4 mt-2 pt-2 border-t border-border">
                          <View className="flex-1">
                            <Text className="text-xs text-muted">Peso</Text>
                            <Text className="text-sm font-semibold text-foreground">{worker.weight} kg</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs text-muted">Altura</Text>
                            <Text className="text-sm font-semibold text-foreground">{worker.height} cm</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs text-muted">Trabalho</Text>
                            <Text className="text-sm font-semibold text-foreground">
                              {getWorkTypeLabel(worker.workType)}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <View className="items-center py-12">
              <Text className="text-muted">Nenhum dado disponível para este período</Text>
            </View>
          )}

          {/* Botão de Voltar */}
          <Pressable
            onPress={() => router.back()}
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
            <Text className="text-center text-foreground font-semibold text-base">Voltar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
