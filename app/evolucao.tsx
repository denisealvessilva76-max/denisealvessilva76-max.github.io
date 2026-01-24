import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { Card } from "@/components/ui/card";
import { useEvolutionStats, type PeriodType } from "@/hooks/use-evolution-stats";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const { width } = Dimensions.get("window");
const GRAPH_WIDTH = width - 80; // padding lateral

export default function EvolucaoScreen() {
  const colors = useColors();
  const [period, setPeriod] = useState<PeriodType>("30");
  const { stats, isLoading, reload } = useEvolutionStats(period);

  const handlePeriodChange = (newPeriod: PeriodType) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPeriod(newPeriod);
  };

  const getStatusColor = (status: "bem" | "dor-leve" | "dor-forte") => {
    switch (status) {
      case "bem":
        return "#22C55E";
      case "dor-leve":
        return "#F59E0B";
      case "dor-forte":
        return "#EF4444";
    }
  };

  const getTrendIcon = (trend: "improving" | "stable" | "worsening") => {
    switch (trend) {
      case "improving":
        return "📈";
      case "stable":
        return "➡️";
      case "worsening":
        return "📉";
    }
  };

  const getTrendColor = (trend: "improving" | "stable" | "worsening") => {
    switch (trend) {
      case "improving":
        return "#22C55E";
      case "stable":
        return "#F59E0B";
      case "worsening":
        return "#EF4444";
    }
  };

  if (isLoading || !stats) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Carregando estatísticas...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4"
            style={{ opacity: 0.8 }}
          >
            <Text className="text-primary text-base">← Voltar</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground mb-2">
            📊 Sua Evolução
          </Text>
          <Text className="text-muted text-base">
            Acompanhe seu progresso ao longo do tempo
          </Text>
        </View>

        {/* Seletor de Período */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg ${
              period === "30" ? "bg-primary" : "bg-surface border border-border"
            }`}
            onPress={() => handlePeriodChange("30")}
          >
            <Text
              className={`text-center font-semibold ${
                period === "30" ? "text-white" : "text-foreground"
              }`}
            >
              Últimos 30 Dias
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg ${
              period === "90" ? "bg-primary" : "bg-surface border border-border"
            }`}
            onPress={() => handlePeriodChange("90")}
          >
            <Text
              className={`text-center font-semibold ${
                period === "90" ? "text-white" : "text-foreground"
              }`}
            >
              Últimos 90 Dias
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pontuação Geral */}
        <Card className="mb-6 bg-primary/10 border border-primary">
          <View className="items-center">
            <Text className="text-sm text-muted mb-2">Pontuação de Saúde</Text>
            <Text className="text-6xl font-bold text-primary mb-2">
              {stats.overall.healthScore}
            </Text>
            <Text className="text-xs text-muted mb-4">de 100 pontos</Text>
            
            {stats.overall.improvement !== 0 && (
              <View className="flex-row items-center gap-2">
                <Text
                  className={`text-sm font-semibold ${
                    stats.overall.improvement > 0 ? "text-success" : "text-error"
                  }`}
                >
                  {stats.overall.improvement > 0 ? "+" : ""}
                  {stats.overall.improvement}% vs período anterior
                </Text>
              </View>
            )}
            
            <View className="mt-4 bg-success/20 rounded-lg p-3 w-full">
              <Text className="text-sm font-semibold text-success text-center">
                🏆 {stats.overall.topAchievement}
              </Text>
            </View>
          </View>
        </Card>

        {/* Check-ins Diários */}
        <Card className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">
            ✅ Check-ins Diários
          </Text>
          
          <View className="flex-row justify-between mb-4">
            <View>
              <Text className="text-2xl font-bold text-foreground">
                {stats.checkIns.total}
              </Text>
              <Text className="text-xs text-muted">Total de check-ins</Text>
            </View>
            <View>
              <Text className="text-2xl font-bold text-success">
                {stats.checkIns.consistency}
              </Text>
              <Text className="text-xs text-muted">Dias consecutivos</Text>
            </View>
          </View>

          {/* Gráfico de Check-ins (últimos 14 dias) */}
          <View className="mb-4">
            <Text className="text-xs text-muted mb-2">Últimos 14 dias</Text>
            <View className="flex-row items-end justify-between" style={{ height: 80 }}>
              {stats.checkIns.dailyData.slice(-14).map((day, index) => (
                <View key={index} className="items-center flex-1">
                  <View
                    style={{
                      width: 8,
                      height: 60,
                      backgroundColor: getStatusColor(day.status),
                      borderRadius: 4,
                      opacity: 0.8,
                    }}
                  />
                  <Text className="text-[8px] text-muted mt-1">
                    {new Date(day.date).getDate()}
                  </Text>
                </View>
              ))}
            </View>
            <View className="flex-row gap-3 mt-3">
              <View className="flex-row items-center gap-1">
                <View className="w-3 h-3 rounded-full bg-success" />
                <Text className="text-xs text-muted">Bem ({stats.checkIns.good})</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-3 h-3 rounded-full bg-warning" />
                <Text className="text-xs text-muted">Leve ({stats.checkIns.mild})</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-3 h-3 rounded-full bg-error" />
                <Text className="text-xs text-muted">Forte ({stats.checkIns.severe})</Text>
              </View>
            </View>
          </View>

          {stats.checkIns.comparisonPrevious !== 0 && (
            <View className="bg-surface rounded-lg p-3">
              <Text
                className={`text-sm ${
                  stats.checkIns.comparisonPrevious > 0
                    ? "text-success"
                    : "text-error"
                }`}
              >
                {stats.checkIns.comparisonPrevious > 0 ? "📈" : "📉"}{" "}
                {Math.abs(stats.checkIns.comparisonPrevious)}% de check-ins "Bem"
                comparado ao período anterior
              </Text>
            </View>
          )}
        </Card>

        {/* Hidratação */}
        <Card className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">
            💧 Hidratação
          </Text>
          
          <View className="flex-row justify-between mb-4">
            <View>
              <Text className="text-2xl font-bold text-foreground">
                {(stats.hydration.averageDaily / 1000).toFixed(1)}L
              </Text>
              <Text className="text-xs text-muted">Média diária</Text>
            </View>
            <View>
              <Text className="text-2xl font-bold text-primary">
                {stats.hydration.goalAchieved}
              </Text>
              <Text className="text-xs text-muted">Dias com meta atingida</Text>
            </View>
          </View>

          {/* Gráfico de Hidratação (últimos 14 dias) */}
          <View className="mb-4">
            <Text className="text-xs text-muted mb-2">Últimos 14 dias (ml)</Text>
            <View className="flex-row items-end justify-between" style={{ height: 80 }}>
              {stats.hydration.dailyData.slice(-14).map((day, index) => {
                const maxMl = Math.max(...stats.hydration.dailyData.map(d => d.ml), 2000);
                const heightPercent = (day.ml / maxMl) * 100;
                return (
                  <View key={index} className="items-center flex-1">
                    <View
                      style={{
                        width: 8,
                        height: (heightPercent / 100) * 60,
                        backgroundColor: colors.primary,
                        borderRadius: 4,
                        opacity: 0.8,
                      }}
                    />
                    <Text className="text-[8px] text-muted mt-1">
                      {new Date(day.date).getDate()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {stats.hydration.comparisonPrevious !== 0 && (
            <View className="bg-surface rounded-lg p-3">
              <Text
                className={`text-sm ${
                  stats.hydration.comparisonPrevious > 0
                    ? "text-success"
                    : "text-error"
                }`}
              >
                {stats.hydration.comparisonPrevious > 0 ? "📈" : "📉"}{" "}
                {Math.abs(stats.hydration.comparisonPrevious)}% na média diária
                comparado ao período anterior
              </Text>
            </View>
          )}
        </Card>

        {/* Pressão Arterial */}
        {stats.bloodPressure.readings > 0 && (
          <Card className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              ❤️ Pressão Arterial
            </Text>
            
            <View className="flex-row justify-between mb-4">
              <View>
                <Text className="text-2xl font-bold text-foreground">
                  {stats.bloodPressure.averageSystolic}/
                  {stats.bloodPressure.averageDiastolic}
                </Text>
                <Text className="text-xs text-muted">Média (mmHg)</Text>
              </View>
              <View>
                <Text
                  className="text-2xl font-bold"
                  style={{ color: getTrendColor(stats.bloodPressure.trend) }}
                >
                  {getTrendIcon(stats.bloodPressure.trend)}
                </Text>
                <Text className="text-xs text-muted">Tendência</Text>
              </View>
            </View>

            {/* Gráfico de Pressão (últimos 7 dias) */}
            <View className="mb-4">
              <Text className="text-xs text-muted mb-2">Últimos 7 dias</Text>
              <View className="flex-row items-end justify-between" style={{ height: 100 }}>
                {stats.bloodPressure.dailyData.slice(-7).map((day, index) => (
                  <View key={index} className="items-center flex-1">
                    <View className="items-center gap-1">
                      {/* Sistólica */}
                      <View
                        style={{
                          width: 6,
                          height: (day.systolic / 200) * 80,
                          backgroundColor: "#EF4444",
                          borderRadius: 3,
                        }}
                      />
                      {/* Diastólica */}
                      <View
                        style={{
                          width: 6,
                          height: (day.diastolic / 200) * 80,
                          backgroundColor: "#3B82F6",
                          borderRadius: 3,
                        }}
                      />
                    </View>
                    <Text className="text-[8px] text-muted mt-1">
                      {new Date(day.date).getDate()}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="flex-row gap-3 mt-3">
                <View className="flex-row items-center gap-1">
                  <View className="w-3 h-3 rounded-full bg-error" />
                  <Text className="text-xs text-muted">Sistólica</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <View className="w-3 h-3 rounded-full bg-blue-500" />
                  <Text className="text-xs text-muted">Diastólica</Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-2 mb-3">
              <View className="flex-1 bg-success/20 rounded-lg p-2">
                <Text className="text-xs text-success font-semibold">
                  Normal: {stats.bloodPressure.normalCount}
                </Text>
              </View>
              <View className="flex-1 bg-warning/20 rounded-lg p-2">
                <Text className="text-xs text-warning font-semibold">
                  Pré-HT: {stats.bloodPressure.preHypertensionCount}
                </Text>
              </View>
              <View className="flex-1 bg-error/20 rounded-lg p-2">
                <Text className="text-xs text-error font-semibold">
                  HT: {stats.bloodPressure.hypertensionCount}
                </Text>
              </View>
            </View>

            <View className="bg-surface rounded-lg p-3">
              <Text
                className="text-sm"
                style={{ color: getTrendColor(stats.bloodPressure.trend) }}
              >
                {getTrendIcon(stats.bloodPressure.trend)}{" "}
                {stats.bloodPressure.trend === "improving"
                  ? "Sua pressão está melhorando!"
                  : stats.bloodPressure.trend === "stable"
                  ? "Sua pressão está estável"
                  : "Atenção: pressão em alta"}
              </Text>
            </View>
          </Card>
        )}

        {/* Desafios */}
        {(stats.challenges.completed > 0 || stats.challenges.inProgress > 0) && (
          <Card className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              🏆 Desafios
            </Text>
            
            <View className="flex-row justify-between mb-4">
              <View>
                <Text className="text-2xl font-bold text-success">
                  {stats.challenges.completed}
                </Text>
                <Text className="text-xs text-muted">Completados</Text>
              </View>
              <View>
                <Text className="text-2xl font-bold text-warning">
                  {stats.challenges.inProgress}
                </Text>
                <Text className="text-xs text-muted">Em progresso</Text>
              </View>
              <View>
                <Text className="text-2xl font-bold text-primary">
                  {stats.challenges.totalPoints}
                </Text>
                <Text className="text-xs text-muted">Pontos ganhos</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Botão de Atualizar */}
        <TouchableOpacity
          className="bg-surface border border-border rounded-lg py-3 mb-6"
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            reload();
          }}
        >
          <Text className="text-center font-semibold text-foreground">
            🔄 Atualizar Estatísticas
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
